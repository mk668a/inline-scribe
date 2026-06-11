# inline-scribe

> **Track-Changes for any textarea. Powered by your own local LLM. Nothing leaves your machine.**

Press **Alt+G** in any text field and your writing comes back as a reviewable diff —
deletions struck through in red, insertions in green, each one accepted or rejected
individually — exactly the editing experience that makes Grammarly good, minus the
cloud, the account and the subscription.

- **Your model, your machine.** Talks to any OpenAI-compatible endpoint; the default
  is a local [Ollama](https://ollama.com) (`llama3.2`). Works with llama.cpp, LM Studio,
  vLLM, or your own API key. The maintainer pays for nothing and sees nothing.
- **The LLM never produces the diff.** It returns corrected prose; the Track-Changes
  hunks are computed deterministically by a word-level diff, so a chatty small model
  can't break the UI.
- **Your text is never touched until you accept.** Reject everything and the field is
  byte-for-byte unchanged.
- **Zero config with stock Ollama.** The extension strips the `Origin` header on
  requests to your endpoint (via `declarativeNetRequest`), so you don't need to set
  `OLLAMA_ORIGINS`.

## Install (v0.1 — unpacked)

```sh
git clone https://github.com/mk668a/inline-scribe && cd inline-scribe
npm install && npm run build
```

Then `chrome://extensions` → Developer mode → **Load unpacked** → select `dist/`.

Make sure something is serving a model:

```sh
ollama pull llama3.2 && ollama serve
```

## Use

1. Click into any `textarea`, text input or `contenteditable`.
2. Press **Alt+G** (configurable at `chrome://extensions/shortcuts`).
3. Review: **✓** accepts a suggestion, **✕** keeps your original. **Accept all** or
   **Apply accepted** writes the result back; **Esc** walks away.

Endpoint, model and the system prompt are configurable on the options page —
rewrite the prompt to make it a translator, a tone-softener, or a de-corporate-izer.

## Why not …

- **Grammarly** — your drafts are uploaded to someone else's cloud, and the good parts are paid.
- **Harper** — excellent and instant, but rule-based: it underlines mistakes, it can't rewrite a clumsy sentence.
- **scramble / Typollama** — local LLM, but whole-text replacement or popup output. The reviewable inline diff is the product.

## Roadmap

- Chrome built-in **Proofreader API** (Gemini Nano) as a zero-install backend behind the same diff UI
- Firefox (MV3 differences)
- Rich-text write-back for `contenteditable` (v0.1 writes plain text)

MIT.
