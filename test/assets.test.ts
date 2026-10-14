import { RESIDENT_FILES, populationLayout, residentPosition } from '../src/population.ts';
import { BIOMES, BIOME_FILES } from '../src/biomes.ts';
import { decorLayout } from '../src/art.ts';
import { LEVELS } from './helpers.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

// Contrat runtime de src/art.ts : ces ids et fichiers doivent exister ensemble dans
// assets/manifest.json et sur disque. Une réorganisation de assets/ (ex. biomes)
// doit mettre à jour src/art.ts ET le manifeste, sinon la page standalone refuse
// de charger : asset "…" is not in this build.
const VEHICLES = ['car', 'jeep', 'truck'];
const SCENERY = [
  'tree_round', 'tree_fir', 'bush', 'rock1', 'rock2', 'rock3',
  'cloud1', 'cloud2', 'explosion', 'flame',
];
const DIR = 'common';

const manifest = JSON.parse(readFileSync(new URL('../assets/manifest.json', import.meta.url), 'utf8'));

test('assets : chaque asset runtime a une entrée manifeste dont le fichier existe', () => {
  for (const name of [...VEHICLES, ...SCENERY]) {
    const entry = manifest[name];
    assert.ok(entry, `entrée "${name}" absente de assets/manifest.json`);
    assert.equal(entry.file, `${DIR}/${name}.svg`);
    assert.ok(
      existsSync(new URL(`../assets/${entry.file}`, import.meta.url)),
      `${entry.file} introuvable sur disque`,
    );
  }
});

test('assets : les véhicules ont pivot, empattement, rayon et positions de roues', () => {
  for (const name of VEHICLES) {
    const v = manifest[name];
    assert.ok(Array.isArray(v.pivot) && v.pivot.length === 2, `${name} : pivot manquant`);
    assert.ok(typeof v.wheelbase === 'number' && v.wheelbase > 0, `${name} : empattement manquant`);
    assert.ok(typeof v.wheelRadius === 'number' && v.wheelRadius > 0, `${name} : rayon de roue manquant`);
    assert.ok(Array.isArray(v.wheels) && v.wheels.length >= 2, `${name} : roues manquantes`);
    for (const w of v.wheels) {
      assert.ok(typeof w.group === 'string' && w.group.length > 0, `${name} : roue sans groupe`);
      assert.ok(Array.isArray(w.at) && w.at.length === 2, `${name} : roue "${w.group}" sans position`);
    }
    // capot optionnel (le camion n'en a pas) : s'il est là, son pivot est requis
    if (v.hood !== undefined && v.hood !== null) {
      assert.ok(Array.isArray(v.hood.pivot) && v.hood.pivot.length === 2, `${name} : capot sans pivot`);
    }
  }
});


test('biomes : chaque décor existe et reste sur les rives pour tous les scénarios', () => {
  for (const biome of BIOMES) {
    for (const name of biome.scenery) {
      const entry = manifest[`${biome.id}/${name}`];
      assert.ok(entry, `${biome.id}/${name} absent du manifeste`);
      assert.ok(existsSync(new URL(`../assets/${entry.file}`, import.meta.url)));
    }
    for (const level of LEVELS) {
      const items = decorLayout(level, biome);
      assert.ok(items.length > 0);
      assert.deepEqual(items, decorLayout(level, biome));
      for (const item of items) {
        assert.ok(biome.scenery.includes(item.name));
        assert.ok(item.y >= level.deckY - 5);
        assert.ok(item.x <= level.x0 - 95 || item.x >= level.x1 + 95);
      }
    }
  }
});


test('population : assets complets et promenades limitées à chaque rive', () => {
  for (const file of [...RESIDENT_FILES, ...BIOME_FILES]) {
    assert.ok(manifest[file.replace('.svg', '')], file);
    assert.ok(existsSync(new URL(`../assets/${file}`, import.meta.url)), file);
  }
  for (const biome of BIOMES) for (const level of LEVELS) {
    const residents = populationLayout(level, biome);
    assert.equal(residents.filter((resident) => resident.kind === 'pedestrian' || resident.kind === 'cyclist').length, 6);
    assert.equal(residents.filter((resident) => resident.kind === 'animal').length, biome.animals.length ? 4 : 0);
    for (const resident of residents) {
      if (resident.kind === 'bird') {
        assert.ok(biome.flyingBirds.includes(resident.name));
        assert.ok(resident.y <= level.deckY - 100);
        const source = readFileSync(new URL(`../assets/${resident.name}.svg`, import.meta.url), 'utf8');
        assert.ok(source.includes('id="wing"'), `${resident.name} doit être dessiné en vol`);
      } else {
        assert.ok(resident.right < level.x0 || resident.left > level.x1);
      }
      if (resident.kind === 'animal') {
        assert.deepEqual(residentPosition(resident, 0), residentPosition(resident, 10000));
        assert.equal(resident.speed, 0);
      }
      for (const time of [0, 10, 100, 10000]) {
        const { x } = residentPosition(resident, time);
        assert.ok(x >= resident.left && x <= resident.right);
      }
    }
  }
});
