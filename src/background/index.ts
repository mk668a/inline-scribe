/**
 * MV3 service worker. Two jobs:
 *  1. Relay the Alt+G command to the content script in the active tab.
 *  2. Run checker requests (fetch happens here, not in the page, so the
 *     call to 127.0.0.1 needs no site CORS and never mixes with page CSP).
 */
import { OllamaChecker, DEFAULT_CONFIG, CheckerError, type CheckerConfig } from '../core/checker';

/**
 * Ollama rejects requests carrying a chrome-extension:// Origin with 403
 * unless the user exports OLLAMA_ORIGINS. Instead of documenting an env var,
 * strip the Origin header on requests to the configured endpoint so a stock
 * Ollama works out of the box.
 */
async function syncOriginRule(): Promise<void> {
  const stored = await chrome.storage.sync.get('config');
  const endpoint =
    (stored.config as Partial<CheckerConfig> | undefined)?.endpoint ?? DEFAULT_CONFIG.endpoint;
  let host: string;
  try {
    host = new URL(endpoint).host;
  } catch {
    return;
  }
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [
      {
        id: 1,
        priority: 1,
        condition: { urlFilter: `||${host}/`, resourceTypes: ['xmlhttprequest'] },
        action: {
          type: 'modifyHeaders',
          requestHeaders: [{ header: 'origin', operation: 'remove' }],
        },
      },
    ],
  });
}
void syncOriginRule();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.config) void syncOriginRule();
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'check-selection',
    title: 'Proofread selection — inline-scribe',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'check-selection' || tab?.id == null) return;
  chrome.tabs.sendMessage(tab.id, { type: 'inline-scribe:trigger-selection' }).catch(() => {
    // No content script on this page (chrome:// etc.) — nothing to do.
  });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'check-text') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: 'inline-scribe:trigger' }).catch(() => {
      // No content script on this page (chrome:// etc.) — nothing to do.
    });
  }
});

interface CheckRequest {
  type: 'inline-scribe:check';
  text: string;
}

chrome.runtime.onMessage.addListener((msg: CheckRequest, _sender, sendResponse) => {
  if (msg?.type !== 'inline-scribe:check') return undefined;
  (async () => {
    const stored = await chrome.storage.sync.get('config');
    const config: CheckerConfig = { ...DEFAULT_CONFIG, ...(stored.config ?? {}) };
    try {
      const corrected = await new OllamaChecker(config).check(msg.text);
      sendResponse({ ok: true, corrected, model: config.model });
    } catch (err) {
      sendResponse({
        ok: false,
        error: err instanceof CheckerError ? err.message : `unexpected error: ${String(err)}`,
      });
    }
  })();
  return true; // keep the message channel open for the async response
});
