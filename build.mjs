import { build } from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });

/**
 * harper.js's wasm-bindgen glue carries a Node-only branch that does
 * `import("fs")` to read the binary from a `file://` path. We feed it the
 * inlined data-URL binary instead, so that branch never runs — but esbuild
 * still tries to resolve `fs` for a browser target. Stub Node builtins to an
 * empty module so the (dead, in-browser) code bundles cleanly.
 */
const stubNodeBuiltins = {
  name: 'stub-node-builtins',
  setup(b) {
    const builtins = /^(fs|path|url|module|crypto|os|util|stream|buffer)$/;
    b.onResolve({ filter: builtins }, (args) => ({ path: args.path, namespace: 'node-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'node-stub' }, () => ({ contents: 'export default {}' }));
  },
};

const common = {
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  logLevel: 'info',
  plugins: [stubNodeBuiltins],
};
await Promise.all([
  build({ ...common, entryPoints: ['src/content/index.ts'], outfile: 'dist/content.js' }),
  build({ ...common, entryPoints: ['src/background/index.ts'], outfile: 'dist/background.js' }),
  build({ ...common, entryPoints: ['src/options/index.ts'], outfile: 'dist/options.js' }),
  build({ ...common, entryPoints: ['src/offscreen/index.ts'], outfile: 'dist/offscreen.js' }),
]);
await cp('manifest.json', 'dist/manifest.json');
await cp('src/options/options.html', 'dist/options.html');
await cp('src/offscreen/offscreen.html', 'dist/offscreen.html');
await cp('icons', 'dist/icons', { recursive: true });
// Harper's WASM engine, loaded from the extension's own URL by the offscreen
// document only when the (opt-in) pre-pass runs.
await cp('node_modules/harper.js/dist/harper_wasm_bg.wasm', 'dist/harper_wasm_bg.wasm');
console.log('dist/ ready — load it via chrome://extensions → Load unpacked');
