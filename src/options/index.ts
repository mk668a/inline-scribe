import { DEFAULT_CONFIG, mergeConfig, type Backend } from '../core/checker';

const $ = (id: string) =>
  document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const BACKEND_HINTS: Record<Backend, string> = {
  'prompt-api':
    'Uses Chrome’s on-device Gemini Nano. Nothing to install and nothing to run — ' +
    'Chrome downloads the model once on first use. Needs Chrome 138+ with ~22 GB free disk.',
  ollama:
    'Bring your own OpenAI-compatible server (Ollama, llama.cpp, LM Studio, vLLM…). ' +
    'The default talks to a local Ollama at 127.0.0.1:11434.',
};

function syncBackendUi(): void {
  const backend = ($('backend') as HTMLSelectElement).value as Backend;
  document.getElementById('backend-hint')!.textContent = BACKEND_HINTS[backend];
  (document.getElementById('ollama-fields') as HTMLElement).style.display =
    backend === 'ollama' ? '' : 'none';
}

async function load(): Promise<void> {
  const stored = await chrome.storage.sync.get('config');
  const cfg = mergeConfig(stored.config as Partial<typeof DEFAULT_CONFIG> | undefined);
  ($('backend') as HTMLSelectElement).value = cfg.backend;
  $('endpoint').value = cfg.endpoint;
  $('model').value = cfg.model;
  $('apiKey').value = cfg.apiKey ?? '';
  $('systemPrompt').value = cfg.systemPrompt;
  ($('selectionIcon') as HTMLInputElement).checked =
    (stored.config as { selectionIcon?: boolean } | undefined)?.selectionIcon ?? true;
  ($('harperPrePass') as HTMLInputElement).checked = cfg.harperPrePass ?? false;
  syncBackendUi();
}

$('backend').addEventListener('change', syncBackendUi);

document.getElementById('save')!.addEventListener('click', async () => {
  const config = {
    backend: ($('backend') as HTMLSelectElement).value as Backend,
    endpoint: $('endpoint').value.trim() || DEFAULT_CONFIG.endpoint,
    model: $('model').value.trim() || DEFAULT_CONFIG.model,
    apiKey: $('apiKey').value.trim() || undefined,
    systemPrompt: $('systemPrompt').value.trim() || DEFAULT_CONFIG.systemPrompt,
    selectionIcon: ($('selectionIcon') as HTMLInputElement).checked,
    harperPrePass: ($('harperPrePass') as HTMLInputElement).checked,
  };
  await chrome.storage.sync.set({ config });
  document.getElementById('saved')!.textContent = 'saved ✓';
  setTimeout(() => (document.getElementById('saved')!.textContent = ''), 1500);
});

void load();
