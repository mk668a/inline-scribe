# inline-scribe — Privacy Policy

_Last updated: 2026-06-12_

inline-scribe is designed so that the maintainer **cannot** see your data, because the
project has no server.

## What the extension does with your text

- When you trigger a check (Alt+G, the ✎ selection icon, or the right-click menu), the
  text of the focused field or your selection is sent to **the endpoint you configured
  in the extension's options** — by default `http://127.0.0.1:11434/v1`, a local Ollama
  server running on your own machine.
- With the default configuration, your text **never leaves your computer**.
- If you configure a remote endpoint yourself (e.g. a cloud API with your own key),
  your text goes to that endpoint and nowhere else. That choice, and that relationship,
  is between you and your provider.

## What the extension stores

- Your settings only: endpoint URL, model name, optional API key, system prompt, and UI
  preferences. They are stored with `chrome.storage.sync` (synced by Chrome to your own
  Google account if you have sync enabled).
- No history of checked text is kept anywhere.

## What the extension collects

- Nothing. No analytics, no telemetry, no crash reporting, no accounts, no cookies.

## Permissions, and why each is needed

| permission | why |
|---|---|
| `storage` | save your settings |
| `activeTab` / content script | read the text field you trigger a check in, and show the review panel |
| `contextMenus` | the "Proofread selection" right-click item |
| `declarativeNetRequest` | strip the `Origin` header on requests to **your configured endpoint only**, so a stock Ollama accepts them without `OLLAMA_ORIGINS` |
| `host_permissions` (`127.0.0.1` / `localhost`) | talk to your local model server |

## Contact

Questions or concerns: open an issue at
<https://github.com/mk668a/inline-scribe/issues>.
