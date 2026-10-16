import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { MATERIALS, CARS } from '../src/data.ts';
import { parseSpec } from '../src/level.ts';
import { BUILTIN_SPECS } from '../src/levels.ts';

test('MWL préserve le catalogue et les niveaux après recalage des rives sur 12 m', () => {
  const before = JSON.parse(readFileSync(new URL('./fixtures/content-before-mwl.json', import.meta.url), 'utf8'));
  // La consigne du premier niveau a depuis été adaptée à la construction tactile.
  before.levels.find((level: { id: number }) => level.id === 1).hint = 'Relie les deux points orange : touche le départ, puis l’arrivée, ou glisse de l’un à l’autre.';
  const spans: Record<number, number> = { 8: 240, 2: 480, 3: 480, 4: 480, 6: 480, 7: 480 };
  for (const level of before.levels) {
    const span = spans[level.id];
    if (!span) continue;
    const x0 = (level.x0 + level.x1 - span) / 2;
    const x1 = x0 + span;
    for (const anchor of level.anchors) {
      if (anchor.x === level.x0) anchor.x = x0;
      else if (anchor.x === level.x1) anchor.x = x1;
    }
    level.x0 = x0;
    level.x1 = x1;
  }
  // Le catalogue a pu s’enrichir (béton, hydraulique, train…) : on ne compare que les entrées d’origine.
  const original = <T extends object>(all: T, ids: object) => Object.fromEntries(Object.entries(all).filter(([id]) => id in ids));
  assert.deepEqual({ materials: original(MATERIALS, before.materials), vehicles: original(CARS, before.vehicles), levels: BUILTIN_SPECS.filter(level => before.levels.some((original: { id: number }) => original.id === level.id)) }, before);
});

test('niveaux intégrés : chaussée plate réalisable en tronçons complets de 12 m', () => {
  for (const spec of BUILTIN_SPECS) {
    assert.equal((spec.x1 - spec.x0) % MATERIALS.road.maxLen, 0, spec.name);
    assert.ok(spec.anchors.some((a) => a.x === spec.x0 && a.y === spec.deckY), spec.name);
    assert.ok(spec.anchors.some((a) => a.x === spec.x1 && a.y === spec.deckY), spec.name);
  }
});

test('MWL translation catalog includes level names, hints, materials and vehicles', () => {
  const catalog = JSON.parse(readFileSync(new URL('../content/i18n.fr.json', import.meta.url), 'utf8'));
  for (const text of [
    ...BUILTIN_SPECS.flatMap(level => [level.name, level.hint]),
    ...Object.values(MATERIALS).map(material => material.name),
    ...Object.values(CARS).map(vehicle => vehicle.name),
  ]) assert.equal(catalog.messages[text], text);
});

const builder = fileURLToPath(new URL('../tools/build-content.ts', import.meta.url));
const tsx = new URL('../node_modules/tsx/dist/loader.mjs', import.meta.url).href;

test('MWL build rejects invalid schema, references and level rules before emitting', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pontifex-content-'));
  const catalog = readFileSync(new URL('../content/catalog.mwl', import.meta.url), 'utf8');
  const levels = readFileSync(new URL('../content/levels.mwl', import.meta.url), 'utf8');
  mkdirSync(join(dir, 'content'));
  try {
    for (const [source, pattern] of [
      [levels.replace('"budget": 150', '"budget": "oops"'), /budget/],
      [levels.replace('"car": "citadine"', '"car": "missing"'), /unknown vehicle/],
      [levels.replace('"materials": "road"', '"materials": "road,missing"'), /unknown vehicle or material/],
      [levels.replace('"budget": 150', '"budget": 1'), /Valeurs hors limites/],
      [levels.replace('"id": 8', '"id": 1'), /MWL_DUPLICATE_ID|Duplicate level id/],
    ] as const) {
      writeFileSync(join(dir, 'content/catalog.mwl'), catalog);
      writeFileSync(join(dir, 'content/levels.mwl'), source);
      const result = spawnSync(process.execPath, ['--import', tsx, builder], { cwd: dir, encoding: 'utf8' });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, pattern);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('MWL content generation is deterministic', () => {
  const output = new URL('../src/generated/content.ts', import.meta.url);
  const before = readFileSync(output, 'utf8');
  execFileSync(process.execPath, ['--import', tsx, builder], { cwd: fileURLToPath(new URL('../', import.meta.url)) });
  assert.equal(readFileSync(output, 'utf8'), before);
});


test('player JSON converts to buildable MWL, preserving geometry, text and solution', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pontifex-convert-'));
  const converter = fileURLToPath(new URL('../tools/convert-level.ts', import.meta.url));
  const source = { ...BUILTIN_SPECS[0], name: 'Pont « joueur » \\ "test"', hint: 'Une ligne\navec des guillemets " et _(texte)', solution: {
    nodes: [{ x: 340, y: 340, fixed: true }, { x: 460, y: 340, fixed: true }],
    beams: [{ a: 0, b: 1, mat: 'road' }],
  } };
  const input = join(dir, 'player.json');
  const output = join(dir, 'content/zz-player.mwl');
  mkdirSync(join(dir, 'content'));
  writeFileSync(input, JSON.stringify({ ...source, id: undefined, label: undefined }));
  writeFileSync(join(dir, 'content/catalog.mwl'), readFileSync(new URL('../content/catalog.mwl', import.meta.url)));
  writeFileSync(join(dir, 'content/levels.mwl'), readFileSync(new URL('../content/levels.mwl', import.meta.url)));
  try {
    const result = spawnSync(process.execPath, ['--import', tsx, converter, input, '--id', '90', '--label', '8', '-o', output], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(output, 'utf8'), /"name": _\(/);
    execFileSync(process.execPath, ['--import', tsx, builder], { cwd: dir });
    const generated = readFileSync(join(dir, 'src/generated/content.ts'), 'utf8');
    const levels = JSON.parse(generated.split('export const BUILTIN_SPECS: LevelSpec[] = ')[1].trim().slice(0, -1));
    const validated = parseSpec(source);
    assert.ok('spec' in validated);
    const parsed = validated.spec;
    assert.deepEqual(levels.at(-1), { ...parsed, id: 90, label: '8', view: source.view });
    const again = spawnSync(process.execPath, ['--import', tsx, converter, input, '--id', '90', '-o', output], { encoding: 'utf8' });
    assert.notEqual(again.status, 0);
    assert.match(again.stderr, /EEXIST/);
    for (const [json, id, error] of [
      [source, '1', /already in use/],
      [source, '0', /positive safe integer/],
      [{ ...source, budget: -1 }, '90', /Valeurs hors limites/],
      [{ ...source, solution: { nodes: [], beams: [{ a: 0, b: 1, mat: 'road' }] } }, '90', /Solution invalide/],
    ] as const) {
      writeFileSync(input, JSON.stringify(json));
      const bad = spawnSync(process.execPath, ['--import', tsx, converter, input, '--id', id], { encoding: 'utf8' });
      assert.notEqual(bad.status, 0);
      assert.equal(bad.stdout, '');
      assert.match(bad.stderr, error);
    }
  } finally {
    assert.equal(join(tmpdir(), dir.split(/[\\/]/).at(-1)!), dir);
    rmSync(dir, { recursive: true, force: true });
  }
});

test('identifiants de niveaux : stables (les étoiles sauvegardées y sont rattachées) et sous ceux des niveaux personnalisés', () => {
  // Ne jamais renuméroter : la progression des joueurs est stockée par identifiant. Ajouter à la fin, avec un nouvel id < 100.
  assert.deepEqual(BUILTIN_SPECS.map((level) => level.id), [1, 8, 2, 3, 4, 5, 6, 7, 9]);
  assert.ok(BUILTIN_SPECS.every((level) => level.id < 100), 'les niveaux personnalisés commencent à 101');
});
