/**
 * Offscreen document: hosts the Prompt API (`LanguageModel`) on behalf of the
 * service worker, which cannot reach it. Receives a check request, runs Gemini
 * Nano on-device, and replies with the corrected text. Download progress on
 * first use is streamed back so the page panel can show it instead of freezing.
 */
import { PromptApiChecker, CheckerError, type CheckerConfig } from '../core/checker';

interface PromptApiRequest {
  type: 'inline-scribe:promptapi-check';
  target: 'offscreen';
  text: string;
  config: CheckerConfig;
}

chrome.runtime.onMessage.addListener((msg: PromptApiRequest, _sender, sendResponse) => {
  if (msg?.type !== 'inline-scribe:promptapi-check' || msg.target !== 'offscreen') return undefined;
  (async () => {
    try {
      const checker = new PromptApiChecker(msg.config, undefined, (progress) => {
        chrome.runtime
          .sendMessage({ type: 'inline-scribe:download-progress', progress })
          .catch(() => {
            // No listener (panel already closed) — progress is best-effort.
          });
      });
      const corrected = await checker.check(msg.text);
      sendResponse({ ok: true, corrected });
    } catch (err) {
      sendResponse({
        ok: false,
        error: err instanceof CheckerError ? err.message : `unexpected error: ${String(err)}`,
      });
    }
  })();
  return true; // async sendResponse
});
