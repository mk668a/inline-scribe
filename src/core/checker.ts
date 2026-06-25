/**
 * Checker abstraction: any backend that can turn text into corrected text.
 * The diff is never the backend's job (see diff.ts). Implementations:
 *  - PromptApiChecker: Chrome's built-in Gemini Nano via the Prompt API
 *    (`LanguageModel`) — zero install, no server, GA for extensions (Chrome 138+).
 *  - OllamaChecker: any OpenAI-compatible /chat/completions endpoint (BYO).
 */

/** Where inference runs. 'prompt-api' = on-device Gemini Nano, 'ollama' = BYO server. */
export type Backend = 'prompt-api' | 'ollama';

export interface CheckerConfig {
  backend: Backend;
  endpoint: string;
  model: string;
  systemPrompt: string;
  apiKey?: string;
  timeoutMs?: number;
}

export interface Checker {
  check(text: string): Promise<string>;
}

export const DEFAULT_CONFIG: CheckerConfig = {
  backend: 'prompt-api',
  endpoint: 'http://127.0.0.1:11434/v1',
  model: 'llama3.2',
  systemPrompt:
    'You are a careful copy editor. Fix grammar, spelling and punctuation in the text. ' +
    'Keep the original meaning, tone, formatting and line breaks. ' +
    'Reply with ONLY the corrected text — no preamble, no quotes, no explanations.',
  timeoutMs: 60_000,
};

/**
 * Merge a stored config onto the defaults. Migration: a config saved by v0.2
 * (which had no `backend` field) was always Ollama, so preserve that — only a
 * fresh install with no stored config gets the zero-install Prompt API default.
 */
export function mergeConfig(stored: Partial<CheckerConfig> | undefined): CheckerConfig {
  if (stored && stored.backend == null && stored.endpoint != null) {
    return { ...DEFAULT_CONFIG, ...stored, backend: 'ollama' };
  }
  return { ...DEFAULT_CONFIG, ...(stored ?? {}) };
}

export class CheckerError extends Error {}

export class OllamaChecker implements Checker {
  constructor(private cfg: CheckerConfig = DEFAULT_CONFIG) {}

  async check(text: string): Promise<string> {
    const { endpoint, model, systemPrompt, apiKey, timeoutMs } = { ...DEFAULT_CONFIG, ...this.cfg };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
        }),
        signal: controller.signal,
      });
    } catch (err) {
      throw new CheckerError(
        `could not reach ${endpoint} — is your local model server running? (${String(err)})`,
      );
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      throw new CheckerError(`${endpoint} answered ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim() === '') {
      throw new CheckerError('model returned an empty response');
    }
    return stripWrapping(content, text);
  }
}

/**
 * Chrome's built-in Gemini Nano via the Prompt API (`LanguageModel`). Runs
 * fully on-device: no server, nothing leaves the machine, no per-token cost.
 * GA for extensions since Chrome 138 — but only in a window/document context
 * (not a service worker), so this is instantiated from the offscreen document.
 */
export class PromptApiChecker implements Checker {
  constructor(
    private cfg: CheckerConfig = DEFAULT_CONFIG,
    /** Injectable for tests; defaults to the platform global. */
    private lm: LanguageModelStatic | undefined = typeof LanguageModel === 'undefined'
      ? undefined
      : LanguageModel,
    /** Called with 0..1 while the model downloads on first use. */
    private onDownload?: (progress: number) => void,
  ) {}

  async check(text: string): Promise<string> {
    if (!this.lm) {
      throw new CheckerError(
        'Chrome built-in AI is not available in this browser. Update Chrome, or switch the ' +
          'backend to a local server (Ollama) in the extension options.',
      );
    }
    const availability = await this.lm.availability();
    if (availability === 'unavailable') {
      throw new CheckerError(
        'Gemini Nano is unavailable on this device (it needs a recent Chrome and ~22 GB free ' +
          'disk). Switch the backend to a local server (Ollama) in the extension options.',
      );
    }
    const { systemPrompt } = { ...DEFAULT_CONFIG, ...this.cfg };
    const session = await this.lm.create({
      initialPrompts: [{ role: 'system', content: systemPrompt }],
      temperature: 0,
      topK: 1,
      monitor: (m) =>
        m.addEventListener('downloadprogress', (e) => this.onDownload?.(e.loaded)),
    });
    try {
      const reply = await session.prompt(text);
      if (typeof reply !== 'string' || reply.trim() === '') {
        throw new CheckerError('the on-device model returned an empty response');
      }
      return stripWrapping(reply, text);
    } finally {
      session.destroy();
    }
  }
}

/**
 * Small models love to wrap output in code fences or quotes despite
 * instructions. Strip the obvious wrappers without touching real content.
 */
export function stripWrapping(reply: string, original: string): string {
  let out = reply.replace(/\r\n/g, '\n');
  const fence = out.match(/^\s*```[a-z]*\n([\s\S]*?)\n```\s*$/);
  if (fence) out = fence[1];
  out = out.replace(/^\s+|\s+$/g, '');
  // Quoted whole-reply (but only if the original wasn't itself quoted).
  if (/^".*"$/s.test(out) && !/^"/.test(original.trim())) out = out.slice(1, -1);
  // Preserve the original's trailing newline convention.
  if (original.endsWith('\n') && !out.endsWith('\n')) out += '\n';
  return out;
}
