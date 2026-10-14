import { cpSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { mwgPage } from '@datamoc/mw_games/tools/vite';

// mwgPage compiles every file of its assets folder into the page and has no ignore option, so the build
// reads a copy of assets/ without the scratch folder assets/garbage (gitignored, never loaded by src/art.ts).
const SKIPPED = resolve('assets/garbage');
const BUILD_ASSETS = 'node_modules/.cache/pontifex-assets';

export default defineConfig(({ command }) => {
  let assets = 'assets';
  if (command === 'build') {
    rmSync(BUILD_ASSETS, { recursive: true, force: true });
    cpSync('assets', BUILD_ASSETS, { recursive: true, filter: (src) => resolve(src) !== SKIPPED });
    assets = BUILD_ASSETS;
  }
  return { plugins: [mwgPage({ assets, singleFile: { compress: true }, compress: false })] };
});
