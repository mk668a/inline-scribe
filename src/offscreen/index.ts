/**
 * Offscreen document: a real document context for things the service worker
 * can't host. Two jobs:
 *  1. The Prompt API (`LanguageModel`) — runs Gemini Nano on-device and streams
 *     first-use download progress back to the page panel.
 *  2. The optional Harper pre-pass — runs Harper's WASM engine in-thread.
 * Both run fully on-device; nothing leaves the machine.
 */
import { PromptApiChecker, CheckerError, type CheckerConfig } from '../core/checker';
import { LocalLinter, createBinaryModuleFromUrl } from 'harper.js';
import { harperPrePass, type PrePassLinter } from '../core/harper';

interface PromptApiRequest {
  type: 'inline-scribe:promptapi-check';
  target: 'offscreen';
  text: string;
  config: CheckerConfig;
}

interface HarperPrePassRequest {
  type: 'inline-scribe:harper-prepass';
  target: 'offscreen';
  text: string;
}

/**
 * Build the Harper linter once and reuse it. `LocalLinter` runs the WASM engine
 * in this document's thread (no Worker — which a service worker couldn't spawn
 * anyway). The engine binary ships as a packaged file and is fetched from the
 * extension's own origin only on first use, so the (default) Prompt-API path
 * never pays for it and nothing leaves the machine.
 */
let linterPromise: Promise<PrePassLinter> | null = null;
function getLinter(): Promise<PrePassLinter> {
  if (!linterPromise) {
    const binary = createBinaryModuleFromUrl(
      chrome.runtime.getURL('harper_wasm_bg.wasm'),
      'full',
    );
    const linter = new LocalLinter({ binary });
    linterPromise = linter
      .setup()
      .then(() => linter as unknown as PrePassLinter)
      .catch((err) => {
        linterPromise = null; // let a later request retry the setup
        throw err;
      });
  }
  return linterPromise;
}

chrome.runtime.onMessage.addListener(
  (msg: HarperPrePassRequest, _sender, sendResponse) => {
    if (msg?.type !== 'inline-scribe:harper-prepass' || msg.target !== 'offscreen') return undefined;
    (async () => {
      try {
        const linter = await getLinter();
        sendResponse({ ok: true, text: await harperPrePass(msg.text, linter) });
      } catch (err) {
        sendResponse({ ok: false, error: `Harper pre-pass failed: ${String(err)}` });
      }
    })();
    return true; // async sendResponse
  },
);

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
