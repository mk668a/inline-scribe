import { DEFAULT_CONFIG } from '../core/checker';

const $ = (id: string) => document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;

async function load(): Promise<void> {
  const stored = await chrome.storage.sync.get('config');
  const cfg = { ...DEFAULT_CONFIG, ...(stored.config ?? {}) };
  $('endpoint').value = cfg.endpoint;
  $('model').value = cfg.model;
  $('apiKey').value = cfg.apiKey ?? '';
  $('systemPrompt').value = cfg.systemPrompt;
  ($('selectionIcon') as HTMLInputElement).checked =
    (stored.config as { selectionIcon?: boolean } | undefined)?.selectionIcon ?? true;
}

document.getElementById('save')!.addEventListener('click', async () => {
  const config = {
    endpoint: $('endpoint').value.trim() || DEFAULT_CONFIG.endpoint,
    model: $('model').value.trim() || DEFAULT_CONFIG.model,
    apiKey: $('apiKey').value.trim() || undefined,
    systemPrompt: $('systemPrompt').value.trim() || DEFAULT_CONFIG.systemPrompt,
    selectionIcon: ($('selectionIcon') as HTMLInputElement).checked,
  };
  await chrome.storage.sync.set({ config });
  document.getElementById('saved')!.textContent = 'saved ✓';
  setTimeout(() => (document.getElementById('saved')!.textContent = ''), 1500);
});

void load();
