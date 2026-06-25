# Changelog

All notable changes to inline-scribe are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-06-25

### Added
- **Optional Harper pre-pass** — turn it on in Options to fix mechanical mistakes
  with [Harper](https://writewithharper.com), a fast, rule-based, fully-local
  grammar engine, *before* the AI runs. Harper handles the deterministic stuff
  (capitalization, punctuation, spacing, subject-verb agreement, repeated words)
  instantly and offline; the AI then handles fluency and word choice. Only
  high-confidence, single-suggestion mechanical fixes are auto-applied — lexical
  guesses (spelling, typos, word choice) are deliberately left to the AI, which has
  the full context. Off by default. Stays on-device: Harper is WebAssembly that runs
  in the offscreen document, fetched from the extension's own files only when enabled,
  so the built-in-AI path never loads it.

## [1.0.0] - 2026-06-25

The zero-install release: inline-scribe now works the moment you install it, with
no server to run.

### Added
- **Chrome built-in AI backend (Gemini Nano via the Prompt API)** — the new default.
  Proofreading runs fully on-device with nothing to install and no server. Requires
  Chrome 138+; the model downloads once on first use. Runs in an offscreen document
  because the MV3 service worker has no document context.
- **Backend selector in Options** — switch between *Chrome built-in AI* and a
  *Local server* (Ollama / any OpenAI-compatible endpoint). The review UI is identical
  for both.
- On first-use model download, the panel shows live download progress instead of a
  frozen "Checking…" state.
- Unit tests for the checker layer (`mergeConfig`, `OllamaChecker` error paths,
  `PromptApiChecker`) — the suite grew from 18 to 29 tests.

### Changed
- **`contenteditable` write-back now preserves formatting and undo** by going through
  the editor's own insert command instead of replacing the node with plain text.
- Existing installs that had configured Ollama are kept on the Local-server backend on
  upgrade; only fresh installs default to the built-in AI.
- README (EN/JA) rewritten around the zero-install default.

## [0.2.0] - 2026-06-12

### Added
- Proofread a selection via a floating ✎ icon (Google-Translate style), the right-click
  menu, or Alt+G (selection takes priority over the whole field).
- Read-only page text: the corrected version is copied to the clipboard.
- Chrome Web Store packaging (icons, `npm run zip`, tag→Release zip workflow,
  PRIVACY.md, store listing assets).

## [0.1.0] - 2026-06-12

### Added
- MVP: Track-Changes inline diff for any `<textarea>` / text `<input>` /
  `contenteditable`, backed by a BYO local LLM (Ollama).
- Deterministic word-level diff core with per-hunk accept/reject.
- Zero-config Ollama support via `declarativeNetRequest` Origin-header stripping.

[1.1.0]: https://github.com/mk668a/inline-scribe/releases/tag/v1.1.0
[1.0.0]: https://github.com/mk668a/inline-scribe/releases/tag/v1.0.0
[0.2.0]: https://github.com/mk668a/inline-scribe/releases/tag/v0.2.0
[0.1.0]: https://github.com/mk668a/inline-scribe/releases/tag/v0.1.0
