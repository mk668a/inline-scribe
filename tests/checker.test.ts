import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  OllamaChecker,
  PromptApiChecker,
  CheckerError,
  mergeConfig,
  DEFAULT_CONFIG,
  type CheckerConfig,
} from '../src/core/checker';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('mergeConfig', () => {
  it('defaults a fresh install to the zero-install Prompt API', () => {
    expect(mergeConfig(undefined).backend).toBe('prompt-api');
    expect(mergeConfig({}).backend).toBe('prompt-api');
  });

  it('migrates a v0.2 config (endpoint, no backend) to ollama', () => {
    const v02 = { endpoint: 'http://127.0.0.1:11434/v1', model: 'llama3.2' };
    expect(mergeConfig(v02).backend).toBe('ollama');
  });

  it('respects an explicit backend choice', () => {
    expect(mergeConfig({ backend: 'ollama', endpoint: 'x' } as Partial<CheckerConfig>).backend).toBe(
      'ollama',
    );
    expect(mergeConfig({ backend: 'prompt-api' } as Partial<CheckerConfig>).backend).toBe(
      'prompt-api',
    );
  });
});

describe('OllamaChecker', () => {
  const cfg: CheckerConfig = { ...DEFAULT_CONFIG, backend: 'ollama' };

  it('returns the model content, wrapper-stripped', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '```\nfixed text\n```' } }] }),
      })),
    );
    expect(await new OllamaChecker(cfg).check('orig')).toBe('fixed text');
  });

  it('throws CheckerError on a non-ok HTTP status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, statusText: 'Server Error' })),
    );
    await expect(new OllamaChecker(cfg).check('x')).rejects.toBeInstanceOf(CheckerError);
  });

  it('throws CheckerError when the endpoint is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );
    await expect(new OllamaChecker(cfg).check('x')).rejects.toBeInstanceOf(CheckerError);
  });

  it('throws CheckerError on an empty completion', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '   ' } }] }),
      })),
    );
    await expect(new OllamaChecker(cfg).check('x')).rejects.toBeInstanceOf(CheckerError);
  });
});

describe('PromptApiChecker', () => {
  const cfg: CheckerConfig = { ...DEFAULT_CONFIG, backend: 'prompt-api' };

  function fakeLm(reply: string, availability = 'available') {
    const destroy = vi.fn();
    const create = vi.fn(async () => ({ prompt: async () => reply, destroy }));
    return {
      lm: { availability: async () => availability, create } as unknown as LanguageModelStatic,
      destroy,
      create,
    };
  }

  it('errors clearly when the API is missing', async () => {
    await expect(new PromptApiChecker(cfg, undefined).check('x')).rejects.toBeInstanceOf(
      CheckerError,
    );
  });

  it('errors when the model is unavailable on the device', async () => {
    const { lm } = fakeLm('', 'unavailable');
    await expect(new PromptApiChecker(cfg, lm).check('x')).rejects.toBeInstanceOf(CheckerError);
  });

  it('returns the corrected text, wrapper-stripped, and destroys the session', async () => {
    const { lm, destroy } = fakeLm('"corrected."');
    expect(await new PromptApiChecker(cfg, lm).check('corected.')).toBe('corrected.');
    expect(destroy).toHaveBeenCalledOnce();
  });

  it('throws CheckerError on an empty reply', async () => {
    const { lm } = fakeLm('   ');
    await expect(new PromptApiChecker(cfg, lm).check('x')).rejects.toBeInstanceOf(CheckerError);
  });
});
