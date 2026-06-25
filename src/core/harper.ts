/**
 * Optional Harper pre-pass. Harper (https://writewithharper.com) is a fast,
 * rule-based, fully-local grammar engine — no LLM, no network. inline-scribe
 * runs it *before* the language model so the boring, deterministic mistakes are
 * fixed instantly and offline, and the model only has to think about the rest
 * (fluency, word choice, restructuring). It is opt-in and never required.
 *
 * Everything here stays local: Harper is WebAssembly that runs on-device, so
 * the pre-pass keeps the "nothing leaves your machine" promise intact.
 *
 * This module is deliberately backend-agnostic and free of the harper.js WASM
 * import so it can be unit-tested with a fake linter. The real `LocalLinter` is
 * wired up in the offscreen document (see src/offscreen/index.ts).
 */

/** The subset of a harper.js `Lint` this pre-pass reads. */
export interface PrePassSuggestion {
  get_replacement_text(): string;
}
export interface PrePassLint {
  span(): { start: number; end: number };
  lint_kind(): string;
  get_problem_text(): string;
  suggestions(): PrePassSuggestion[];
}
/** The subset of a harper.js `Linter` this pre-pass uses. */
export interface PrePassLinter {
  lint(text: string): Promise<PrePassLint[]>;
  applySuggestion(
    text: string,
    lint: PrePassLint,
    suggestion: PrePassSuggestion,
  ): Promise<string>;
}

/**
 * Lint kinds safe to auto-apply before the model sees the text: mechanical,
 * unambiguous fixes that don't *guess* an intended word. Spelling, Typo,
 * WordChoice, Grammar, Eggcorn, Malapropism etc. are deliberately excluded —
 * those are lexical guesses (Harper turns "aple" into "able", "stor" into
 * "st or") and are left to the language model, which has the full context.
 * Verified against the real engine in tests/ and a manual smoke pass.
 */
export const SAFE_LINT_KINDS: ReadonlySet<string> = new Set([
  'Capitalization',
  'Punctuation',
  'Formatting',
  'Repetition',
  'Agreement',
  'BoundaryError',
  'Redundancy',
]);

/**
 * Apply Harper's high-confidence mechanical fixes to `text` and return the
 * result. Only lints with a single suggestion in {@link SAFE_LINT_KINDS} are
 * touched. Fixes are applied right-to-left so each lint's span (which points
 * into the original text) stays valid as earlier edits never shift text to
 * their left.
 */
export async function harperPrePass(text: string, linter: PrePassLinter): Promise<string> {
  const lints = await linter.lint(text);
  const entries = lints
    .map((lint) => ({
      lint,
      start: lint.span().start,
      kind: lint.lint_kind(),
      suggestions: lint.suggestions(),
    }))
    .filter((e) => e.suggestions.length === 1 && SAFE_LINT_KINDS.has(e.kind))
    .sort((a, b) => b.start - a.start);

  let out = text;
  for (const e of entries) {
    out = await linter.applySuggestion(out, e.lint, e.suggestions[0]);
  }
  return out;
}
