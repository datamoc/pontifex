// analyze-midi.js
import { collectSoundFontUsage, parseMidi } from '@datamoc/mwg/audio';
import { readFileSync } from 'fs';
import { MUSIC_MIDI } from './src/generated/music.ts';

const programsUsed = new Set();

for (const track of Object.keys(MUSIC_MIDI)) {
  try {
    const raw = MUSIC_MIDI[track];
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    const midi = parseMidi(bytes.buffer);
    const usage = collectSoundFontUsage([midi]);
    usage.forEach(({ program }) => programsUsed.add(program));
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${track}:`, error);
  }
}

console.log('Programmes (instruments) utilisés dans les morceaux MIDI :', Array.from(programsUsed).sort((a, b) => a - b));
process.exit(0);