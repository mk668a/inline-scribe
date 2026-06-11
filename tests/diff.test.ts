import { describe, it, expect } from 'vitest';
import { diffText, applyDecisions, changeIndices, tokenize } from '../src/core/diff';
import { stripWrapping } from '../src/core/checker';

describe('tokenize', () => {
  it('splits words, whitespace and punctuation, losslessly', () => {
    const t = 'Hello,  world!\nIt works.';
    expect(tokenize(t).join('')).toBe(t);
  });
});

describe('diffText', () => {
  it('returns a single equal hunk for identical text', () => {
    expect(diffText('same text', 'same text')).toEqual([
      { kind: 'equal', original: 'same text', corrected: 'same text' },
    ]);
  });

  it('returns [] for empty-to-empty', () => {
    expect(diffText('', '')).toEqual([]);
  });

  it('marks a single word replacement as one replace hunk', () => {
    const hunks = diffText('I has a dream', 'I have a dream');
    expect(hunks).toEqual([
      { kind: 'equal', original: 'I ', corrected: 'I ' },
      { kind: 'replace', original: 'has', corrected: 'have' },
      { kind: 'equal', original: ' a dream', corrected: ' a dream' },
    ]);
  });

  it('detects pure insertion', () => {
    const hunks = diffText('the cat sat', 'the black cat sat');
    const changes = hunks.filter((h) => h.kind !== 'equal');
    expect(changes).toEqual([{ kind: 'insert', original: '', corrected: 'black ' }]);
  });

  it('detects pure deletion', () => {
    const hunks = diffText('the very big dog', 'the big dog');
    const changes = hunks.filter((h) => h.kind !== 'equal');
    expect(changes).toEqual([{ kind: 'delete', original: 'very ', corrected: '' }]);
  });

  it('folds adjacent-word rewrites into one reviewable hunk', () => {
    const hunks = diffText('this are bad sentence', 'this is a bad sentence');
    const changes = hunks.filter((h) => h.kind !== 'equal');
    expect(changes).toHaveLength(1);
    expect(changes[0].kind).toBe('replace');
    expect(changes[0].original.trim()).toBe('are');
    expect(changes[0].corrected.trim()).toBe('is a');
  });

  it('keeps far-apart changes as separate hunks', () => {
    const hunks = diffText(
      'teh quick brown fox jumps over the lazy dgo',
      'the quick brown fox jumps over the lazy dog',
    );
    const changes = changeIndices(hunks);
    expect(changes).toHaveLength(2);
  });

  it('round-trips: rejecting everything returns the original', () => {
    const original = 'Their going to recieve there package tomorow.';
    const corrected = "They're going to receive their package tomorrow.";
    const hunks = diffText(original, corrected);
    expect(applyDecisions(hunks, hunks.map(() => false))).toBe(original);
  });

  it('round-trips: accepting everything returns the corrected text', () => {
    const original = 'Their going to recieve there package tomorow.';
    const corrected = "They're going to receive their package tomorrow.";
    const hunks = diffText(original, corrected);
    expect(applyDecisions(hunks, hunks.map(() => true))).toBe(corrected);
  });

  it('supports partial acceptance per hunk', () => {
    const hunks = diffText('I has a dream tomorow', 'I have a dream tomorrow');
    const accepted = hunks.map((h) => h.kind !== 'equal' && h.original === 'has');
    expect(applyDecisions(hunks, accepted)).toBe('I have a dream tomorow');
  });

  it('preserves multi-line structure', () => {
    const original = 'line one\nline too\nline three';
    const corrected = 'line one\nline two\nline three';
    const hunks = diffText(original, corrected);
    expect(applyDecisions(hunks, hunks.map(() => true))).toBe(corrected);
    const changes = hunks.filter((h) => h.kind !== 'equal');
    expect(changes).toEqual([{ kind: 'replace', original: 'too', corrected: 'two' }]);
  });

  it('handles unicode text', () => {
    const hunks = diffText('これはペン', 'これは鉛筆');
    expect(applyDecisions(hunks, hunks.map(() => true))).toBe('これは鉛筆');
    expect(applyDecisions(hunks, hunks.map(() => false))).toBe('これはペン');
  });

  it('falls back to one replace hunk for huge inputs', () => {
    const original = Array.from({ length: 5000 }, (_, i) => `w${i}`).join(' ');
    const corrected = original.replace('w42', 'fixed');
    const hunks = diffText(original, corrected);
    expect(hunks).toEqual([{ kind: 'replace', original, corrected }]);
  });
});

describe('stripWrapping', () => {
  it('removes code fences', () => {
    expect(stripWrapping('```\nfixed text\n```', 'orig')).toBe('fixed text');
  });
  it('removes whole-reply quotes', () => {
    expect(stripWrapping('"fixed text"', 'orig')).toBe('fixed text');
  });
  it('keeps quotes that belong to the content', () => {
    expect(stripWrapping('"quoted start" and more', 'x')).toBe('"quoted start" and more');
  });
  it('preserves trailing newline convention of the original', () => {
    expect(stripWrapping('fixed', 'orig\n')).toBe('fixed\n');
  });
});
