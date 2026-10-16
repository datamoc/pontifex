// reduce-soundfont.js
import { subsetSoundFont } from '@datamoc/mwg/audio';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const programs = programs.map(program => ({ bank: 0, program }));
const soundFontPath = join(dirname(fileURLToPath(import.meta.url)), 'node_modules/@datamoc/mw_games/data/microgm-opt.sf2');
const outputPath = join(dirname(fileURLToPath(import.meta.url)), 'assets/soundfonts/microgm-opt-reduced.sf2');

(async () => {
  try {
    const soundFontData = readFileSync(soundFontPath);
    const reducedSoundFont = await subsetSoundFont(soundFontData.buffer, { programs });
    writeFileSync(outputPath, Buffer.from(reducedSoundFont));
    console.log(`SoundFont réduit généré : ${outputPath}`);
  } catch (error) {
    console.error('Erreur lors de la réduction du SoundFont :', error);
  }
})();