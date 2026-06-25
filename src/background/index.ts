/**
 * MV3 service worker. Two jobs:
 *  1. Relay the Alt+G command to the content script in the active tab.
 *  2. Run checker requests (fetch happens here, not in the page, so the
 *     call to 127.0.0.1 needs no site CORS and never mixes with page CSP).
 */
import {
  OllamaChecker,
  DEFAULT_CONFIG,
  CheckerError,
  mergeConfig,
  type CheckerConfig,
} from '../core/checker';

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

/**
 * The Prompt API runs in the offscreen document (the service worker has no
 * document context). Create it on demand and reuse it across checks.
 */
let creatingOffscreen: Promise<void> | null = null;
async function ensureOffscreen(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) return;
  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen
      .createDocument({
        url: 'offscreen.html',
        reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
        justification:
          'Run the on-device Gemini Nano (Prompt API), which needs a document context the service worker lacks.',
      })
      .finally(() => {
        creatingOffscreen = null;
      });
  }
  await creatingOffscreen;
}

interface CheckReply {
  ok: boolean;
  corrected?: string;
  model?: string;
  error?: string;
}

/**
 * Optional Harper pre-pass: fix the deterministic, mechanical mistakes locally
 * (and instantly) before the model runs, so the model only handles the rest.
 * Harper's WASM lives in the offscreen document. Best-effort — if it can't run,
 * fall back to the original text rather than failing the whole check.
 */
async function harperPrePass(text: string): Promise<string> {
  await ensureOffscreen();
  const reply = (await chrome.runtime.sendMessage({
    type: 'inline-scribe:harper-prepass',
    target: 'offscreen',
    text,
  })) as { ok?: boolean; text?: string } | undefined;
  return reply?.ok && typeof reply.text === 'string' ? reply.text : text;
}

async function runCheck(config: CheckerConfig, text: string): Promise<CheckReply> {
  try {
    const input = config.harperPrePass ? await harperPrePass(text) : text;
    if (config.backend === 'prompt-api') {
      await ensureOffscreen();
      const reply = (await chrome.runtime.sendMessage({
        type: 'inline-scribe:promptapi-check',
        target: 'offscreen',
        text: input,
        config,
      })) as CheckReply;
      return reply?.ok
        ? { ok: true, corrected: reply.corrected, model: 'Chrome built-in AI (Gemini Nano)' }
        : { ok: false, error: reply?.error ?? 'no response from the on-device model' };
    }
    const corrected = await new OllamaChecker(config).check(input);
    return { ok: true, corrected, model: config.model };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof CheckerError ? err.message : `unexpected error: ${String(err)}`,
    };
  }
}

chrome.runtime.onMessage.addListener((msg: CheckRequest, _sender, sendResponse) => {
  if (msg?.type !== 'inline-scribe:check') return undefined;
  (async () => {
    const stored = await chrome.storage.sync.get('config');
    const config = mergeConfig(stored.config as Partial<CheckerConfig> | undefined);
    sendResponse(await runCheck(config, msg.text));
  })();
  return true; // keep the message channel open for the async response
});
