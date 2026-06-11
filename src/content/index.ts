/**
 * Content script: on trigger, read the target text (a focused editable, or a
 * selection — including selections in read-only page text), ask the background
 * for a corrected version, and show a Track-Changes review panel anchored to
 * it. The original text is never touched until the user applies.
 *
 * Triggers:
 *  - Alt+G command         → selection if any, else the whole focused field
 *  - context-menu item     → current selection
 *  - floating ✎ icon shown next to a fresh selection (Google-Translate style)
 */
import { diffText, applyDecisions, changeIndices, type Hunk } from '../core/diff';

type FieldEl = HTMLTextAreaElement | HTMLInputElement;

type Target =
  | { kind: 'field'; el: FieldEl; start: number; end: number }
  | { kind: 'rich'; el: HTMLElement; range: Range }
  | { kind: 'page'; range: Range };

let panel: HTMLElement | null = null;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'inline-scribe:trigger') void run(selectionTarget() ?? wholeFieldTarget());
  if (msg?.type === 'inline-scribe:trigger-selection') void run(selectionTarget());
});

/* ---------- targets ---------- */

function isField(el: unknown): el is FieldEl {
  return (
    el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && el.type === 'text')
  );
}

function selectionTarget(): Target | null {
  const ae = document.activeElement;
  if (isField(ae) && ae.selectionStart != null && ae.selectionEnd != null) {
    if (ae.selectionStart !== ae.selectionEnd) {
      return { kind: 'field', el: ae, start: ae.selectionStart, end: ae.selectionEnd };
    }
  }
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0).cloneRange();
  if (range.toString().trim() === '') return null;
  const node = range.commonAncestorContainer;
  const el = node instanceof HTMLElement ? node : node.parentElement;
  if (el?.isContentEditable) return { kind: 'rich', el, range };
  return { kind: 'page', range };
}

function wholeFieldTarget(): Target | null {
  const el = document.activeElement as HTMLElement | null;
  if (isField(el)) return { kind: 'field', el, start: 0, end: el.value.length };
  if (el?.isContentEditable) {
    const range = document.createRange();
    range.selectNodeContents(el);
    return { kind: 'rich', el, range };
  }
  return null;
}

function targetText(t: Target): string {
  return t.kind === 'field' ? t.el.value.slice(t.start, t.end) : t.range.toString();
}

function applyResult(t: Target, text: string): void {
  if (t.kind === 'field') {
    const v = t.el.value;
    t.el.value = v.slice(0, t.start) + text + v.slice(t.end);
    t.el.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (t.kind === 'rich') {
    t.range.deleteContents();
    t.range.insertNode(document.createTextNode(text));
    t.el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }
  // 'page' targets are read-only — handled by the copy path in renderReview.
}

function anchorRect(t: Target): DOMRect {
  if (t.kind === 'field') return t.el.getBoundingClientRect();
  const r = t.range.getBoundingClientRect();
  if (r.width || r.height) return r;
  return t.kind === 'rich' ? t.el.getBoundingClientRect() : r;
}

/* ---------- selection icon (Google-Translate style) ---------- */

let icon: HTMLElement | null = null;
let iconTarget: Target | null = null;
let selectionIconEnabled = true;

void chrome.storage.sync.get('config').then((stored) => {
  selectionIconEnabled =
    (stored.config as { selectionIcon?: boolean } | undefined)?.selectionIcon ?? true;
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync' || !changes.config) return;
  selectionIconEnabled =
    (changes.config.newValue as { selectionIcon?: boolean } | undefined)?.selectionIcon ?? true;
  if (!selectionIconEnabled) hideIcon();
});

document.addEventListener('mouseup', (e) => {
  if (!selectionIconEnabled || panel) return;
  if (icon && e.composedPath().includes(icon)) return;
  // Let the browser finalize the selection before reading it.
  setTimeout(() => {
    const t = selectionTarget();
    if (!t || targetText(t).trim().length < 2) {
      hideIcon();
      return;
    }
    showIcon(e.clientX, e.clientY, t);
  }, 0);
});

document.addEventListener('mousedown', (e) => {
  if (icon && !e.composedPath().includes(icon)) hideIcon();
});

function showIcon(clientX: number, clientY: number, target: Target): void {
  hideIcon();
  const host = document.createElement('div');
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = ICON_CSS;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'scribe-icon';
  btn.textContent = '✎';
  btn.title = 'Proofread with inline-scribe';
  // mousedown (not click): act before the page clears the selection, and
  // preventDefault so the field keeps focus and its selection offsets.
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const t = iconTarget;
    hideIcon();
    void run(t);
  });
  shadow.append(style, btn);
  document.body.appendChild(host);
  btn.style.left = `${clientX + window.scrollX + 8}px`;
  btn.style.top = `${clientY + window.scrollY + 12}px`;
  icon = host;
  iconTarget = target;
}

function hideIcon(): void {
  icon?.remove();
  icon = null;
  iconTarget = null;
}

/* ---------- check flow ---------- */

async function run(target: Target | null): Promise<void> {
  if (!target) return;
  hideIcon();
  const original = targetText(target);
  if (original.trim() === '') return;
  const rect = anchorRect(target);

  showPanel(rect, renderStatus('Checking with your local model…'));
  const reply = (await chrome.runtime.sendMessage({
    type: 'inline-scribe:check',
    text: original,
  })) as { ok: boolean; corrected?: string; model?: string; error?: string };

  if (!reply?.ok || reply.corrected == null) {
    showPanel(rect, renderStatus(`⚠ ${reply?.error ?? 'no response from the extension'}`, true));
    return;
  }
  const hunks = diffText(original, reply.corrected);
  const changes = changeIndices(hunks);
  if (changes.length === 0) {
    showPanel(rect, renderStatus(`✓ Nothing to fix — checked by ${reply.model}, locally.`));
    setTimeout(closePanel, 2500);
    return;
  }
  showPanel(rect, renderReview(target, rect, hunks, changes, reply.model ?? 'local model'));
}

/* ---------- UI ---------- */

function renderStatus(text: string, isError = false): HTMLElement {
  const div = document.createElement('div');
  div.className = `scribe-status${isError ? ' scribe-error' : ''}`;
  div.textContent = text;
  return div;
}

function renderReview(
  target: Target,
  rect: DOMRect,
  hunks: Hunk[],
  changes: number[],
  model: string,
): HTMLElement {
  // null = pending (treated as reject on apply), true/false = decided.
  const decisions = new Map<number, boolean | null>(changes.map((i) => [i, null]));
  const readOnly = target.kind === 'page';

  const root = document.createElement('div');
  const text = document.createElement('div');
  text.className = 'scribe-text';

  const refresh = () => {
    text.replaceChildren(
      ...hunks.map((h, i) => {
        if (h.kind === 'equal') {
          const span = document.createElement('span');
          span.textContent = h.original;
          return span;
        }
        const wrap = document.createElement('span');
        wrap.className = 'scribe-hunk';
        const state = decisions.get(i);
        if (state !== true && h.original) {
          const del = document.createElement('del');
          del.textContent = h.original;
          if (state === false) del.className = 'scribe-kept';
          wrap.appendChild(del);
        }
        if (state !== false && h.corrected) {
          const ins = document.createElement('ins');
          ins.textContent = h.corrected;
          if (state === true) ins.className = 'scribe-final';
          wrap.appendChild(ins);
        }
        if (state === null) {
          const ok = button('✓', 'scribe-ok', () => {
            decisions.set(i, true);
            refresh();
          });
          const no = button('✕', 'scribe-no', () => {
            decisions.set(i, false);
            refresh();
          });
          wrap.append(ok, no);
        }
        return wrap;
      }),
    );
  };
  refresh();

  // Editable targets: write back. Read-only page text: copy to clipboard.
  const finish = (result: string) => {
    if (readOnly) {
      navigator.clipboard.writeText(result).then(
        () => {
          showPanel(rect, renderStatus('✓ Corrected text copied to clipboard'));
          setTimeout(closePanel, 1800);
        },
        () => showPanel(rect, renderStatus('⚠ Could not write to the clipboard', true)),
      );
    } else {
      applyResult(target, result);
      closePanel();
    }
  };

  const bar = document.createElement('div');
  bar.className = 'scribe-bar';
  const note = document.createElement('span');
  note.className = 'scribe-note';
  note.textContent = `${changes.length} suggestion(s) · ${model} · nothing left your machine`;
  const apply = button(readOnly ? 'Copy accepted' : 'Apply accepted', 'scribe-apply', () => {
    const accepted = hunks.map((_, i) => decisions.get(i) === true);
    finish(applyDecisions(hunks, accepted));
  });
  const acceptAll = button(readOnly ? 'Copy all fixed' : 'Accept all', 'scribe-apply scribe-all', () => {
    finish(applyDecisions(hunks, hunks.map(() => true)));
  });
  const dismiss = button('Esc', 'scribe-dismiss', closePanel);
  bar.append(note, acceptAll, apply, dismiss);

  const frag = document.createElement('div');
  frag.append(text, bar);
  return frag;
}

function button(label: string, cls: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

const CSS = `
:host { all: initial; }
.scribe-panel {
  position: absolute; z-index: 2147483647; box-sizing: border-box;
  font: 13px/1.6 -apple-system, system-ui, sans-serif; color: #1a1a2e;
  background: #fff; border: 1px solid #d0d0e0; border-radius: 10px;
  box-shadow: 0 8px 30px rgba(20,20,60,.18); padding: 10px 12px; max-width: 640px;
}
.scribe-text { white-space: pre-wrap; max-height: 40vh; overflow: auto; }
.scribe-hunk del { background: #ffe5e5; color: #b3261e; text-decoration: line-through; border-radius: 3px; }
.scribe-hunk ins { background: #e2f5e6; color: #1b6e2a; text-decoration: none; border-radius: 3px; }
.scribe-hunk del.scribe-kept { background: #f1f1f4; color: #555; text-decoration: none; }
.scribe-hunk ins.scribe-final { background: #cdebd4; }
.scribe-hunk button { border: none; cursor: pointer; font-size: 11px; border-radius: 3px; margin-left: 2px; padding: 0 4px; vertical-align: text-top; }
.scribe-ok { background: #1b6e2a; color: #fff; }
.scribe-no { background: #b3261e; color: #fff; }
.scribe-bar { display: flex; gap: 8px; align-items: center; margin-top: 8px; border-top: 1px solid #ececf2; padding-top: 8px; }
.scribe-note { flex: 1; color: #6b6b80; font-size: 11px; }
.scribe-bar button { border: none; cursor: pointer; border-radius: 6px; padding: 4px 10px; font-size: 12px; }
.scribe-apply { background: #2741cc; color: #fff; }
.scribe-all { background: #1b6e2a; }
.scribe-dismiss { background: #ececf2; color: #444; }
.scribe-status { font-size: 12px; color: #444; }
.scribe-error { color: #b3261e; }
`;

const ICON_CSS = `
:host { all: initial; }
.scribe-icon {
  position: absolute; z-index: 2147483647; box-sizing: border-box;
  width: 26px; height: 26px; padding: 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font: 14px/1 -apple-system, system-ui, sans-serif; color: #2741cc;
  background: #fff; border: 1px solid #d0d0e0; cursor: pointer;
  box-shadow: 0 2px 10px rgba(20,20,60,.22);
}
.scribe-icon:hover { background: #f0f2ff; }
`;

function showPanel(rect: DOMRect, content: HTMLElement): void {
  closePanel();
  const host = document.createElement('div');
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = CSS;
  const box = document.createElement('div');
  box.className = 'scribe-panel';
  box.appendChild(content);
  shadow.append(style, box);
  document.body.appendChild(host);

  box.style.left = `${Math.max(8, rect.left + window.scrollX)}px`;
  box.style.top = `${rect.bottom + window.scrollY + 6}px`;
  box.style.minWidth = `${Math.min(Math.max(rect.width, 280), 640)}px`;

  panel = host;
  document.addEventListener('keydown', onEsc, true);
}

function onEsc(e: KeyboardEvent): void {
  if (e.key === 'Escape') closePanel();
}

function closePanel(): void {
  panel?.remove();
  panel = null;
  document.removeEventListener('keydown', onEsc, true);
}
