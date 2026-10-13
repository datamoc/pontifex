import { defineConfig } from 'vite';
import { mwgPage } from '@datamoc/mw_games/tools/vite';
export default defineConfig({ plugins: [mwgPage({ assets: 'assets', singleFile: { compress: true }, compress: false })] });
