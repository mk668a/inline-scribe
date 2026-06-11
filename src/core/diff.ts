/**
 * Deterministic word-level diff between the original text and the checker's
 * corrected text. The LLM never produces a diff — it returns corrected prose,
 * and this module turns (original, corrected) into Track-Changes hunks.
 */

export type HunkKind = 'equal' | 'replace' | 'insert' | 'delete';

export interface Hunk {
  kind: HunkKind;
  /** Text as it appears in the original (empty for pure insertions). */
  original: string;
  /** Text as it appears in the corrected version (empty for pure deletions). */
  corrected: string;
}

/** Tokenize into words and whitespace/punctuation runs, preserving everything. */
export function tokenize(text: string): string[] {
  return text.match(/\s+|[^\s\w]+|\w+/gu) ?? [];
}

/**
 * LCS-based token diff. Texts beyond MAX_TOKENS fall back to a single
 * replace hunk rather than risking a quadratic blow-up.
 */
const MAX_TOKENS = 4000;

export function diffText(original: string, corrected: string): Hunk[] {
  if (original === corrected) {
    return original === '' ? [] : [{ kind: 'equal', original, corrected }];
  }
  const a = tokenize(original);
  const b = tokenize(corrected);
  if (a.length > MAX_TOKENS || b.length > MAX_TOKENS) {
    return [{ kind: 'replace', original, corrected }];
  }

  // DP table of LCS lengths.
  const n = a.length;
  const m = b.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Walk the table emitting ops, merging adjacent ops of the same kind.
  const hunks: Hunk[] = [];
  const push = (kind: HunkKind, original: string, corrected: string) => {
    const last = hunks[hunks.length - 1];
    if (last && last.kind === kind) {
      last.original += original;
      last.corrected += corrected;
    } else {
      hunks.push({ kind, original, corrected });
    }
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('equal', a[i], b[j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('delete', a[i], '');
      i++;
    } else {
      push('insert', '', b[j]);
      j++;
    }
  }
  while (i < n) push('delete', a[i++], '');
  while (j < m) push('insert', '', b[j++]);

  return mergeReplacements(hunks);
}

/**
 * Collapse delete+insert neighbours into a single replace hunk, and absorb
 * pure-whitespace "equal" gaps between two changes so a phrase rewrite reads
 * as one reviewable hunk instead of three.
 */
function mergeReplacements(hunks: Hunk[]): Hunk[] {
  const out: Hunk[] = [];
  for (const h of hunks) {
    const last = out[out.length - 1];
    const lastIsChange = last && last.kind !== 'equal';
    if (lastIsChange && h.kind !== 'equal') {
      last.kind = 'replace';
      last.original += h.original;
      last.corrected += h.corrected;
      continue;
    }
    if (
      lastIsChange &&
      h.kind === 'equal' &&
      /^\s+$/.test(h.original) &&
      out.length >= 1
    ) {
      // Hold whitespace; only fold it into the change if another change follows.
      out.push({ ...h });
      continue;
    }
    out.push({ ...h });
  }

  // Second pass: change + ws-equal + change → one replace.
  const folded: Hunk[] = [];
  for (const h of out) {
    const prev = folded[folded.length - 1];
    const prev2 = folded[folded.length - 2];
    if (
      h.kind !== 'equal' &&
      prev &&
      prev.kind === 'equal' &&
      /^\s+$/.test(prev.original) &&
      prev2 &&
      prev2.kind !== 'equal'
    ) {
      folded.pop();
      prev2.kind = 'replace';
      prev2.original += prev.original + h.original;
      prev2.corrected += prev.corrected + h.corrected;
      continue;
    }
    folded.push(h);
  }
  // Normalize kinds: a "replace" with one empty side is really insert/delete.
  for (const h of folded) {
    if (h.kind === 'replace') {
      if (h.original === '') h.kind = 'insert';
      else if (h.corrected === '') h.kind = 'delete';
    }
  }
  return folded;
}

/** Apply accept/reject decisions: accepted changes take `corrected`, rejected keep `original`. */
export function applyDecisions(hunks: Hunk[], accepted: boolean[]): string {
  let result = '';
  hunks.forEach((h, idx) => {
    if (h.kind === 'equal') result += h.original;
    else result += accepted[idx] ? h.corrected : h.original;
  });
  return result;
}

/** Indices of hunks that represent a change (review targets). */
export function changeIndices(hunks: Hunk[]): number[] {
  return hunks.flatMap((h, i) => (h.kind === 'equal' ? [] : [i]));
}
