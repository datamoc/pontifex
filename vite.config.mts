import { defineConfig } from 'vite';
import { mwgPage } from '@datamoc/mwg/tools/vite';
import { runtimeAssetFiles } from './tools/runtime-assets.ts';

export default defineConfig({
  plugins: [mwgPage({
    assets: 'assets', assetFiles: runtimeAssetFiles(),
    singleFile: { compress: true }, compress: false,
  })],
});
