# Chrome Web Store listing kit

Everything to paste into the [developer dashboard](https://chrome.google.com/webstore/devconsole).
The upload artifact is `npm run zip` → `inline-scribe.zip`.

## Basics

- **Name**: inline-scribe
- **Category**: Workflow & Planning (alt: Tools)
- **Language**: English (add Japanese as second locale later)
- **Privacy policy URL**: https://github.com/mk668a/inline-scribe/blob/main/PRIVACY.md
- **Homepage URL**: https://github.com/mk668a/inline-scribe

## Short description (132 chars max)

> Proofread what you write with a local AI (Ollama). Accept or reject each fix one by one. Nothing leaves your machine.

(118 chars — same string as `manifest.json` description.)

## Detailed description

```
Proofread anything you write in the browser — emails, GitHub comments, forms — using an
AI that runs on YOUR computer. Your text never leaves your machine.

HOW IT WORKS
• Press Alt+G in any text field (or select text and click the ✎ icon, or right-click →
  "Proofread selection")
• Suggestions appear like Word's Track Changes: deletions struck through in red,
  insertions in green
• Accept ✓ or reject ✕ each fix individually, then Apply — only what you approved is
  written back. Esc leaves your text untouched.

WHY LOCAL
Grammarly-style tools upload every keystroke to their cloud and charge monthly for the
good parts. inline-scribe gives you the same review-each-change experience on top of a
free model you run yourself with Ollama (two commands, ~2GB, runs fine on 8GB RAM).
No account, no subscription, no telemetry, no server — this project cannot see your
text even if it wanted to.

SETUP (one time)
1. Install Ollama (https://ollama.com), then:  ollama pull llama3.2 && ollama serve
2. That's it. inline-scribe talks to it out of the box — it even handles the CORS
   config Ollama normally requires.

WORKS WITH
Any OpenAI-compatible endpoint: Ollama, llama.cpp, LM Studio, vLLM — or a cloud API
with your own key, if that's your choice. Rewrite the system prompt and it becomes a
translator or tone-softener with the same review UI.

Open source (MIT): https://github.com/mk668a/inline-scribe
```

## Screenshots (1280×800 or 640×400, 1-5 images)

1. Hero: typo'd email in a textarea + review panel with red/green hunks (re-crop `docs/screenshot.png` to 1280×800)
2. The ✎ selection icon next to selected text
3. Right-click menu showing "Proofread selection — inline-scribe"
4. Options page (endpoint/model/system prompt)

## Privacy tab answers

- **Single purpose**: Proofread user-selected text using an AI endpoint configured by the user (local by default), showing accept/reject suggestions.
- **Permission justifications**:
  - `storage` — persist user settings (endpoint, model, prompt, UI toggles)
  - `activeTab` — locate the text field the user triggered a check in
  - `contextMenus` — the "Proofread selection" right-click entry
  - `declarativeNetRequest` — remove the Origin header on requests to the user's own configured endpoint so stock Ollama accepts them; applied to that host only
  - host permissions (`127.0.0.1`, `localhost`) — reach the user's local model server
  - content script on `<all_urls>` — the proofreading UI must work on whatever site the user is writing on; it activates only on explicit user gestures (Alt+G / icon click / menu click)
- **Remote code**: none (all JS is bundled in the package)
- **Data usage**: does not collect or transmit user data; text is sent only to the user-configured endpoint at the user's explicit request

## Release flow

1. Bump `version` in `manifest.json` + `package.json`
2. `npm run check && npm run zip`
3. Dashboard → new version → upload `inline-scribe.zip` → submit for review
   (or let the GitHub release workflow attach the zip: `git tag vX.Y.Z && git push --tags`)
