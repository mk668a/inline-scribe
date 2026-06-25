/**
 * Ambient types for Chrome's built-in AI Prompt API (`LanguageModel`).
 * Generally available to Chrome Extensions since Chrome 138 — no origin-trial
 * token or special permission required. @types/chrome does not ship these yet,
 * so we declare the minimal surface we use.
 *
 * See https://developer.chrome.com/docs/ai/prompt-api
 */

type LanguageModelAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

interface LanguageModelMonitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: { loaded: number }) => void,
  ): void;
}

interface LanguageModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LanguageModelCreateOptions {
  initialPrompts?: LanguageModelMessage[];
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
  monitor?: (m: LanguageModelMonitor) => void;
}

interface LanguageModelSession {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  destroy(): void;
}

interface LanguageModelStatic {
  availability(options?: { expectedInputLanguages?: string[] }): Promise<LanguageModelAvailability>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
}

declare const LanguageModel: LanguageModelStatic | undefined;

interface Window {
  LanguageModel?: LanguageModelStatic;
}
