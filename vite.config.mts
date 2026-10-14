import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { defineConfig } from 'vite';
import { mwgPage } from '@datamoc/mw_games/tools/vite';

// mwgPage embarque tout le dossier : on prépare une copie sans les brouillons et les
// anciens cycles d'images, remplacés au runtime par les squelettes.
const SKIPPED = resolve('assets/garbage');
const BUILD_ASSETS = 'node_modules/.cache/pontifex-assets';
const LEGACY_FRAME = /^(?:walker_.+|cyclist)_f\d+\.svg$/;

export default defineConfig(({ command }) => {
  let assets = 'assets';
  if (command === 'build') {
    rmSync(BUILD_ASSETS, { recursive: true, force: true });
    cpSync('assets', BUILD_ASSETS, {
      recursive: true,
      filter: (src) => resolve(src) !== SKIPPED && !LEGACY_FRAME.test(basename(src)),
    });
    const manifestPath = join(BUILD_ASSETS, 'manifest.json');
    const manifest: Record<string, { file: string }> = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const runtimeManifest = Object.fromEntries(Object.entries(manifest)
      .filter(([, artwork]) => !LEGACY_FRAME.test(basename(artwork.file))));
    writeFileSync(manifestPath, JSON.stringify(runtimeManifest));
    assets = BUILD_ASSETS;
  }
  return { plugins: [mwgPage({ assets, singleFile: { compress: true }, compress: false })] };
});
