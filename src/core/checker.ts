/**
 * Checker abstraction: any backend that can turn text into corrected text.
 * The diff is never the backend's job (see diff.ts). Implementations:
 *  - OllamaChecker: any OpenAI-compatible /chat/completions endpoint (BYO)
 *  - (v0.2) ProofreaderChecker: Chrome's built-in on-device Proofreader API
 */

export interface CheckerConfig {
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
  endpoint: 'http://127.0.0.1:11434/v1',
  model: 'llama3.2',
  systemPrompt:
    'You are a careful copy editor. Fix grammar, spelling and punctuation in the text. ' +
    'Keep the original meaning, tone, formatting and line breaks. ' +
    'Reply with ONLY the corrected text — no preamble, no quotes, no explanations.',
  timeoutMs: 60_000,
};

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
