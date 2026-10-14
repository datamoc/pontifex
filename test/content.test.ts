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

test('MWL preserves every authored level, vehicle and physics parameter', () => {
  const before = JSON.parse(readFileSync(new URL('./fixtures/content-before-mwl.json', import.meta.url), 'utf8'));
  assert.deepEqual({ materials: MATERIALS, vehicles: CARS, levels: BUILTIN_SPECS.filter(level => before.levels.some((original: { id: number }) => original.id === level.id)) }, before);
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
    const result = spawnSync(process.execPath, ['--import', tsx, converter, input, '--id', '9', '--label', '8', '-o', output], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(output, 'utf8'), /"name": _\(/);
    execFileSync(process.execPath, ['--import', tsx, builder], { cwd: dir });
    const generated = readFileSync(join(dir, 'src/generated/content.ts'), 'utf8');
    const levels = JSON.parse(generated.split('export const BUILTIN_SPECS: LevelSpec[] = ')[1].trim().slice(0, -1));
    const validated = parseSpec(source);
    assert.ok('spec' in validated);
    const parsed = validated.spec;
    assert.deepEqual(levels.at(-1), { ...parsed, id: 9, label: '8', view: source.view });
    const again = spawnSync(process.execPath, ['--import', tsx, converter, input, '--id', '9', '-o', output], { encoding: 'utf8' });
    assert.notEqual(again.status, 0);
    assert.match(again.stderr, /EEXIST/);
    for (const [json, id, error] of [
      [source, '1', /already in use/],
      [source, '0', /positive safe integer/],
      [{ ...source, budget: -1 }, '9', /Valeurs hors limites/],
      [{ ...source, solution: { nodes: [], beams: [{ a: 0, b: 1, mat: 'road' }] } }, '9', /Solution invalide/],
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
