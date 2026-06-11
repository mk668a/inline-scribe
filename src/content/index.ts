/**
 * Content script: on trigger, read the focused editable, ask the background
 * for a corrected version, and show a Track-Changes review panel anchored to
 * the field. The original text is never touched until the user applies.
 */
import { diffText, applyDecisions, changeIndices, type Hunk } from '../core/diff';

type Editable = HTMLTextAreaElement | HTMLInputElement | HTMLElement;

let panel: HTMLElement | null = null;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'inline-scribe:trigger') void run();
});

function focusedEditable(): Editable | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return null;
  if (el instanceof HTMLTextAreaElement) return el;
  if (el instanceof HTMLInputElement && el.type === 'text') return el;
  if (el.isContentEditable) return el;
  return null;
}

function readText(el: Editable): string {
  return el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement
    ? el.value
    : (el.innerText ?? '');
}

function writeText(el: Editable, text: string): void {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    el.innerText = text;
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }
}

async function run(): Promise<void> {
  const el = focusedEditable();
  if (!el) return;
  const original = readText(el);
  if (original.trim() === '') return;

  showPanel(el, renderStatus('Checking with your local model…'));
  const reply = (await chrome.runtime.sendMessage({
    type: 'inline-scribe:check',
    text: original,
  })) as { ok: boolean; corrected?: string; model?: string; error?: string };

  if (!reply?.ok || reply.corrected == null) {
    showPanel(el, renderStatus(`⚠ ${reply?.error ?? 'no response from the extension'}`, true));
    return;
  }
  const hunks = diffText(original, reply.corrected);
  const changes = changeIndices(hunks);
  if (changes.length === 0) {
    showPanel(el, renderStatus(`✓ Nothing to fix — checked by ${reply.model}, locally.`));
    setTimeout(closePanel, 2500);
    return;
  }
  showPanel(el, renderReview(el, original, hunks, changes, reply.model ?? 'local model'));
}

/* ---------- UI ---------- */

function renderStatus(text: string, isError = false): HTMLElement {
  const div = document.createElement('div');
  div.className = `scribe-status${isError ? ' scribe-error' : ''}`;
  div.textContent = text;
  return div;
}

function renderReview(
  el: Editable,
  original: string,
  hunks: Hunk[],
  changes: number[],
  model: string,
): HTMLElement {
  // null = pending (treated as reject on apply), true/false = decided.
  const decisions = new Map<number, boolean | null>(changes.map((i) => [i, null]));

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

  const bar = document.createElement('div');
  bar.className = 'scribe-bar';
  const note = document.createElement('span');
  note.className = 'scribe-note';
  note.textContent = `${changes.length} suggestion(s) · ${model} · nothing left your machine`;
  const apply = button('Apply accepted', 'scribe-apply', () => {
    const accepted = hunks.map((_, i) => decisions.get(i) === true);
    writeText(el, applyDecisions(hunks, accepted));
    closePanel();
  });
  const acceptAll = button('Accept all', 'scribe-apply scribe-all', () => {
    writeText(el, applyDecisions(hunks, hunks.map(() => true)));
    closePanel();
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

function showPanel(el: Editable, content: HTMLElement): void {
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

  const r = el.getBoundingClientRect();
  box.style.left = `${Math.max(8, r.left + window.scrollX)}px`;
  box.style.top = `${r.bottom + window.scrollY + 6}px`;
  box.style.minWidth = `${Math.min(Math.max(r.width, 280), 640)}px`;

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
