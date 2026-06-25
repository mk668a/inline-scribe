import { describe, it, expect } from 'vitest';
import {
  harperPrePass,
  SAFE_LINT_KINDS,
  type PrePassLint,
  type PrePassLinter,
} from '../src/core/harper';

/**
 * A fake that mirrors harper.js's real shape: lints carry a span into the
 * source text, a kind, and suggestions. `applySuggestion` splices the first
 * suggestion's replacement over the lint's span — exactly what the WASM engine
 * does, so right-to-left application can be verified without the binary.
 */
function lint(
  text: string,
  start: number,
  end: number,
  kind: string,
  replacements: string[],
): PrePassLint {
  return {
    span: () => ({ start, end }),
    lint_kind: () => kind,
    get_problem_text: () => text.slice(start, end),
    suggestions: () => replacements.map((r) => ({ get_replacement_text: () => r })),
  };
}

function fakeLinter(lints: PrePassLint[]): PrePassLinter {
  return {
    lint: async () => lints,
    applySuggestion: async (text, l, s) => {
      const { start, end } = l.span();
      return text.slice(0, start) + s.get_replacement_text() + text.slice(end);
    },
  };
}

describe('harperPrePass', () => {
  it('applies a single safe mechanical fix', async () => {
    const text = 'i think so';
    const out = await harperPrePass(text, fakeLinter([lint(text, 0, 1, 'Capitalization', ['I'])]));
    expect(out).toBe('I think so');
  });

  it('applies multiple fixes correctly regardless of order (right-to-left keeps spans valid)', async () => {
    const text = 'i has went';
    // Listed left-to-right; the pre-pass must apply them right-to-left.
    const out = await harperPrePass(
      text,
      fakeLinter([
        lint(text, 0, 1, 'Capitalization', ['I']),
        lint(text, 2, 5, 'Agreement', ['have']),
      ]),
    );
    expect(out).toBe('I have went'); // "went" (Grammar) is left for the model
  });

  it('skips lexical-guess kinds (Spelling/Typo/WordChoice/Grammar) — leaves them to the model', async () => {
    const text = 'an aple';
    const out = await harperPrePass(
      text,
      fakeLinter([lint(text, 3, 7, 'Spelling', ['able', 'ale', 'ample'])]),
    );
    expect(out).toBe('an aple'); // untouched — never silently corrupts to "able"
  });

  it('skips lints whose only suggestion would split a word (single Typo suggestion)', async () => {
    const text = 'the stor';
    // Real engine turns "stor" → "st or"; a single suggestion, but Typo is not safe.
    const out = await harperPrePass(text, fakeLinter([lint(text, 4, 8, 'Typo', ['st or'])]));
    expect(out).toBe('the stor');
  });

  it('skips safe-kind lints that are ambiguous (more than one suggestion)', async () => {
    const text = 'foo';
    const out = await harperPrePass(
      text,
      fakeLinter([lint(text, 0, 3, 'Punctuation', ['foo,', 'foo.'])]),
    );
    expect(out).toBe('foo');
  });

  it('returns the text unchanged when there are no lints', async () => {
    expect(await harperPrePass('all good', fakeLinter([]))).toBe('all good');
  });

  it('SAFE_LINT_KINDS excludes the lexical-guess kinds', () => {
    for (const guess of ['Spelling', 'Typo', 'WordChoice', 'Grammar', 'Eggcorn', 'Malapropism']) {
      expect(SAFE_LINT_KINDS.has(guess)).toBe(false);
    }
    for (const safe of ['Capitalization', 'Punctuation', 'Agreement']) {
      expect(SAFE_LINT_KINDS.has(safe)).toBe(true);
    }
  });
});
