import { readdirSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import { DEFAULT_MIME } from '@datamoc/mwg/tools/compile-resources';

/** Même sélection pour le HTML autonome et son rapport de poids. */
export function runtimeAssetFiles(): string[] {
  return readdirSync('assets', { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative('assets', join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
    .filter((file) => !file.startsWith('garbage/')
      && !file.startsWith('music/') // les MIDI sont embarqués en base64 via src/generated/music.ts
      && !/^(?:walker_.+|cyclist)_f\d+\.svg$/.test(basename(file))
      && (file === 'credits.json' || extname(file).toLowerCase() in DEFAULT_MIME))
    .sort();
}
