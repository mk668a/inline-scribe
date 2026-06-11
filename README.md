# inline-scribe

> **Track-Changes for any textarea. Powered by your own local LLM. Nothing leaves your machine.**

[日本語版 README](README.ja.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/screenshot.png" alt="A textarea with typos, and below it the inline-scribe review panel: deletions struck through in red, insertions in green, each with accept/reject buttons, checked by llama3.2 locally" width="100%">
</p>

## What is this?

inline-scribe is a Chrome extension that proofreads whatever you are writing in the
browser — an email, a GitHub comment, a form, a CMS editor — **using an AI model that
runs on your own computer**, and presents the corrections the way a human editor
would: as **Track Changes**.

Press **Alt+G** in any text field. A panel appears showing your text with every
suggested fix marked in place — deletions ~~struck through in red~~, insertions in
green — and you accept (✓) or reject (✕) each one individually. Click **Apply** and
only the fixes you approved are written back. Press **Esc** and your text is untouched,
byte for byte.

## Why does this need to exist?

Everyone who writes in a browser today picks one of three bad options:

1. **Grammarly** — excellent UX, but every keystroke is uploaded to a company's cloud,
   the good features are behind a subscription, and many workplaces ban it for exactly
   that reason (legal docs, unreleased code, patient data, anything confidential).
2. **Copy-paste into ChatGPT** — you get one big rewritten blob back. Which words did
   it change? Did it alter something you meant? You re-read everything, every time,
   and your text still went to someone else's server.
3. **Nothing** — and ship the typos.

Meanwhile, the missing ingredient is no longer the AI. Anyone can run a capable model
locally with [Ollama](https://ollama.com) in two commands, for free. What's missing is
the **interface**: the thing that made Grammarly worth paying for was never the grammar
engine — it was the *friendly diff* that lets you see and control each change.

That interface, on top of a model you own, is the whole product:

| | corrections | your text goes to | inline diff, per-fix accept/reject | price |
|---|---|---|---|---|
| **Grammarly** | cloud AI | their servers | ✅ (the reason people pay) | $12+/mo |
| **Harper** (10k★) | local, rule-based | nowhere ✅ | ❌ underlines typos only — can't rewrite a clumsy sentence | free |
| **scramble / Typollama** | local LLM ✅ | nowhere ✅ | ❌ whole-text replacement or popup | free |
| **inline-scribe** | local LLM ✅ | nowhere ✅ | ✅ | free |

## How it works

```
you press Alt+G in a text field
        │
        ▼
the extension sends your text to YOUR endpoint     ← default: Ollama on 127.0.0.1
(an OpenAI-compatible /chat/completions API)          model: llama3.2 (~2GB, free)
        │
        ▼
the model returns corrected prose — just text
        │
        ▼
inline-scribe computes a word-level diff           ← deterministic algorithm,
between your text and the correction                  NOT the LLM's opinion
        │
        ▼
review panel: accept ✓ / reject ✕ each change → Apply writes back only what you approved
```

Two design rules fall out of that diagram:

- **The LLM never produces the diff.** Small local models are great at fixing prose and
  terrible at producing structured output. So the model only returns corrected text,
  and the Track-Changes hunks are computed by a deterministic word-level diff in the
  extension. A chatty 3B model can't break the UI.
- **Your text is never modified until you accept.** Reject everything (or hit Esc) and
  the field is exactly as you left it.

And one practical detail that saves every new user 20 minutes: stock Ollama rejects
requests from browser extensions with `403 Forbidden` (CORS origin check). inline-scribe
strips the `Origin` header on requests to your endpoint via `declarativeNetRequest`,
so it works with a vanilla `ollama serve` — no `OLLAMA_ORIGINS` environment variable,
no config file.

## Quick start

**1. Get a local model running** (skip if you already use Ollama):

```sh
brew install ollama          # or https://ollama.com/download
ollama pull llama3.2         # ~2GB, runs fine on 8GB RAM
ollama serve
```

**2. Install the extension** (v0.1 is unpacked; Web Store submission is planned):

```sh
git clone https://github.com/mk668a/inline-scribe && cd inline-scribe
npm install && npm run build
```

Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, select
the `dist/` folder.

**3. Use it:** click into any text field, type something with a mistake, press **Alt+G**.

## Usage

| action | how |
|---|---|
| check the focused field | **Alt+G** (rebind at `chrome://extensions/shortcuts`) |
| accept one suggestion | **✓** button on the hunk |
| keep your original wording | **✕** button on the hunk |
| accept everything | **Accept all** |
| apply only what you accepted | **Apply accepted** (pending suggestions are discarded) |
| cancel, leave text untouched | **Esc** |

Works in `<textarea>`, text `<input>`, and `contenteditable` editors (Gmail, Notion-style
editors — written back as plain text in v0.1).

## Configuration

Right-click the extension icon → **Options**:

- **Endpoint** — any OpenAI-compatible server: Ollama, llama.cpp, LM Studio, vLLM, or a
  cloud endpoint with your own API key. Default `http://127.0.0.1:11434/v1`.
- **Model** — default `llama3.2`. Bigger model = better suggestions, same UI.
- **System prompt** — the editing instruction. Rewrite it and inline-scribe becomes a
  translator, a tone-softener, or a de-corporate-izer — same review workflow.

## Privacy model

- Your text goes to **the endpoint you configured and nowhere else**. With the default
  (localhost Ollama) it never leaves your machine.
- No analytics, no accounts, no telemetry, nothing stored except your settings
  (`chrome.storage.sync`).
- The maintainer pays for nothing and can see nothing — this project has no server.

## Roadmap

- **Chrome's built-in Proofreader API** (Gemini Nano) as a zero-install backend behind
  the same review UI — currently in origin trial, lands when stable
- Firefox port (MV3 differences)
- Rich-text write-back for `contenteditable`
- Chrome Web Store listing

## Development

```sh
npm test            # 18 unit tests for the diff core (no LLM needed)
npm run typecheck
npm run build       # esbuild → dist/
```

The diff engine and checker abstraction live in `src/core/` and import no browser APIs —
they are plain TypeScript, tested with Vitest. The Chrome-specific layers
(`src/content`, `src/background`, `src/options`) sit on top.

MIT.
