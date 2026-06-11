import { build } from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });

const common = { bundle: true, format: 'iife', target: 'chrome120', logLevel: 'info' };
await Promise.all([
  build({ ...common, entryPoints: ['src/content/index.ts'], outfile: 'dist/content.js' }),
  build({ ...common, entryPoints: ['src/background/index.ts'], outfile: 'dist/background.js' }),
  build({ ...common, entryPoints: ['src/options/index.ts'], outfile: 'dist/options.js' }),
]);
await cp('manifest.json', 'dist/manifest.json');
await cp('src/options/options.html', 'dist/options.html');
console.log('dist/ ready — load it via chrome://extensions → Load unpacked');
