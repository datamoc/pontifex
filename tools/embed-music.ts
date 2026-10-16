import { readFileSync, writeFileSync } from 'node:fs';
import { MUSIC_TRACKS } from '../src/music-catalog.ts';

/** Nom du fichier source quand il diffère de `<id>.mid`. */
const ALIAS: Record<string, string> = { 'meditation-thais': 'Meditation.mid' };

/** MIDI embarqués en base64 : lus directement par le jeu, sans rendu Ogg volumineux. */
const lines = ['// Généré par `npm run music:embed` : ne pas modifier à la main.',
  'export const MUSIC_MIDI: Record<string, string> = {'];
for (const track of MUSIC_TRACKS) {
  const file = ALIAS[track.id] ?? `${track.id}.mid`;
  const bytes = readFileSync(new URL(`../assets/music/${file}`, import.meta.url));
  if (bytes.subarray(0, 4).toString() !== 'MThd') throw new Error(`${file} n'est pas un MIDI valide`);
  lines.push(`  '${track.id}': '${bytes.toString('base64')}',`);
}
lines.push('};', '');
writeFileSync(new URL('../src/generated/music.ts', import.meta.url), lines.join('\n'));
console.log(`${MUSIC_TRACKS.length} MIDI embarqués dans src/generated/music.ts`);
