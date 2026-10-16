import { readdirSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import { DEFAULT_MIME } from '@datamoc/mwg/tools/compile-resources';

/**
 * Dossiers d'assets que le jeu ne charge nulle part : ils restent dans le dépôt mais n'alourdissent pas la page.
 * `ui/` attend la migration des icônes de boutons (elles doivent être embarquées au build, pas chargées par `fetch`).
 */
const UNUSED_DIRECTORIES = ['biomes/', 'svg/', 'levels/', 'ui/'];

/** Même sélection pour le HTML autonome et son rapport de poids. */
export function runtimeAssetFiles(): string[] {
  return readdirSync('assets', { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative('assets', join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
    .filter((file) => !file.startsWith('garbage/') && !UNUSED_DIRECTORIES.some((directory) => file.startsWith(directory))
      && !/^(?:walker_.+|cyclist)_f\d+\.svg$/.test(basename(file))
      && (file === 'credits.json' || extname(file).toLowerCase() in DEFAULT_MIME))
    .sort();
}
