// Les morceaux sortis de scene.ts : progression, niveaux du joueur, géométrie de construction.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ProgressStore, rateAttempt, type SettingsStore } from '../src/progress.ts';
import { CustomLevels, parseLevelFile } from '../src/custom-levels.ts';
import { beamExists, beamNear, distToSegment, snapPoint } from '../src/structure.ts';
import { isInsideWorld, type LevelSpec } from '../src/level.ts';
import { BUILTIN_SPECS } from '../src/levels.ts';
import { accessibleIndexes, isLevelUnlocked, navigationTargets } from '../src/level-navigation.ts';
import { LEVELS } from './helpers.ts';

function memoryStore(initial: Record<string, string> = {}): SettingsStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getCustom: (key, fallback) => data[key] ?? fallback,
    setCustom: (key, value) => { data[key] = String(value); },
  };
}

// ---------------------------------------------------------------- progression
test('étoiles : 1 pour la traversée, +1 sous 80 % du budget, +1 sous 75 % de contrainte', () => {
  assert.equal(rateAttempt({ won: false, cost: 10, budget: 500, maxRatio: 0.1 }).stars, 0);
  assert.equal(rateAttempt({ won: true, cost: 450, budget: 500, maxRatio: 0.9 }).stars, 1);
  assert.equal(rateAttempt({ won: true, cost: 400, budget: 500, maxRatio: 0.9 }).stars, 2, 'exactement 20 % restant compte');
  assert.equal(rateAttempt({ won: true, cost: 450, budget: 500, maxRatio: 0.74 }).stars, 2);
  const best = rateAttempt({ won: true, cost: 100, budget: 500, maxRatio: 0.5 });
  assert.deepEqual(best, { stars: 3, budgetLeft: 400, budgetOk: true, stressOk: true });
  assert.equal(rateAttempt({ won: true, cost: 100, budget: 500, maxRatio: 0.75 }).stressOk, false, '75 % pile ne suffit pas');
});

test('progression : on ne garde que le meilleur score, et il survit à un rechargement', () => {
  const store = memoryStore();
  const progress = new ProgressStore(store);
  progress.load();
  assert.equal(progress.starsOf(7), 0);
  assert.equal(progress.record(7, 2), true);
  assert.equal(progress.record(7, 1), false, 'un score plus faible est ignoré');
  assert.equal(progress.record(7, 2), false, 'un score égal aussi');
  assert.equal(progress.record(7, 3), true);
  const reloaded = new ProgressStore(store);
  reloaded.load();
  assert.equal(reloaded.starsOf(7), 3);
  assert.equal(reloaded.starsOf(8), 0);
});

test('progression : une sauvegarde de la version déployée (ids 1, 8, 2…) est relue telle quelle', () => {
  const store = memoryStore({ progress2: JSON.stringify({ stars: { 1: 3, 8: 2, 2: 1 } }) });
  const progress = new ProgressStore(store);
  progress.load();
  for (const [id, stars] of [[1, 3], [8, 2], [2, 1]]) assert.equal(progress.starsOf(id), stars);
  for (const level of BUILTIN_SPECS) assert.ok(level.id < 100);
});

test('progression : stockage illisible ou mal formé → repart sans étoile, sans lever d’erreur', () => {
  for (const content of ['{pas du json', 'null', '{"stars":null}', '42', '{}']) {
    const progress = new ProgressStore(memoryStore({ progress2: content }));
    progress.load();
    assert.equal(progress.starsOf(1), 0, content);
  }
});

// ---------------------------------------------------------------- niveaux du joueur
const sample = (): LevelSpec => JSON.parse(JSON.stringify({ ...BUILTIN_SPECS[0], id: 0, label: '' }));

test('niveaux du joueur : identifiants à partir de 101, jamais réutilisés tant qu’il reste un niveau plus haut', () => {
  const customs = new CustomLevels(memoryStore());
  customs.load();
  assert.equal(customs.nextId(), 101);
  assert.equal(customs.add(sample()), 101);
  assert.equal(customs.add(sample()), 102);
  customs.remove(0);
  assert.equal(customs.nextId(), 103, 'on repart du plus grand id restant');
  assert.deepEqual(customs.levels().map((level) => level.label), ['P1']);
});

test('niveaux du joueur : enregistrer le brouillon remplace le niveau édité, sinon en crée un', () => {
  const customs = new CustomLevels(memoryStore());
  customs.load();
  const created = customs.saveDraft({ ...sample(), name: 'Premier' }, 0);
  assert.equal(created, 101);
  const updated = customs.saveDraft({ ...sample(), name: 'Renommé' }, created);
  assert.equal(updated, created);
  assert.equal(customs.all.length, 1);
  assert.equal(customs.all[0].name, 'Renommé');
  assert.equal(customs.saveDraft({ ...sample(), name: 'Autre' }, 999), 102, 'id d’édition inconnu : nouveau niveau');
});

test('niveaux du joueur : relus au rechargement ; les entrées invalides sont ignorées', () => {
  const store = memoryStore();
  const customs = new CustomLevels(store);
  customs.load();
  customs.add(sample());
  const broken = JSON.parse(store.data.customs);
  broken.push({ name: 'sans valeurs' }, { ...broken[0], id: 'x' });
  store.data.customs = JSON.stringify(broken);
  const reloaded = new CustomLevels(store);
  reloaded.load();
  assert.equal(reloaded.all.length, 1);
  store.data.customs = '{pas du json';
  reloaded.load();
  assert.equal(reloaded.all.length, 0);
});

test('import : texte illisible ou niveau invalide refusé avec un message', () => {
  assert.ok('error' in parseLevelFile('pas du json'));
  assert.ok('error' in parseLevelFile('{"name":"x"}'));
  const ok = parseLevelFile(JSON.stringify({ ...sample(), id: undefined, label: undefined }));
  assert.ok('spec' in ok);
});

// ---------------------------------------------------------------- géométrie de construction
test('distance point-segment : sur le segment, au-delà d’une extrémité, segment réduit à un point', () => {
  const a = { x: 0, y: 0 }, b = { x: 10, y: 0 };
  assert.equal(distToSegment({ x: 5, y: 3 }, a, b), 3);
  assert.equal(distToSegment({ x: 13, y: 4 }, a, b), 5, 'mesurée depuis l’extrémité');
  assert.equal(distToSegment({ x: 3, y: 4 }, a, a), 5);
});

test('poutre la plus proche : à moins de 9 px strictement, sinon -1', () => {
  const s = { nodes: [{ x: 0, y: 0, fixed: true }, { x: 100, y: 0, fixed: true }, { x: 100, y: 50, fixed: false }], beams: [{ a: 0, b: 1, mat: 'road' as const }, { a: 1, b: 2, mat: 'wood' as const }] };
  assert.equal(beamNear(s, { x: 50, y: 8 }), 0);
  assert.equal(beamNear(s, { x: 50, y: 9 }), -1);
  assert.equal(beamNear(s, { x: 104, y: 30 }), 1);
  assert.equal(beamNear({ nodes: [], beams: [] }, { x: 0, y: 0 }), -1);
});

test('poutre existante : dans les deux sens', () => {
  const s = { nodes: [], beams: [{ a: 2, b: 5, mat: 'road' as const }] };
  assert.equal(beamExists(s, 2, 5), true);
  assert.equal(beamExists(s, 5, 2), true);
  assert.equal(beamExists(s, 2, 4), false);
});

test('aimantation : grille de 20 px, ou arrondi à l’entier quand elle est coupée', () => {
  assert.deepEqual(snapPoint({ x: 29.9, y: 30.1 }, true), { x: 20, y: 40 });
  assert.deepEqual(snapPoint({ x: 29.6, y: 30.4 }, false), { x: 30, y: 30 });
});

test('zone constructible : dans le monde, sous la barre du haut, au plus 30 px sous l’eau', () => {
  const level = LEVELS[0];
  assert.equal(isInsideWorld(level, { x: 400, y: level.waterY + 30 }), true);
  assert.equal(isInsideWorld(level, { x: 400, y: level.waterY + 31 }), false);
  assert.equal(isInsideWorld(level, { x: -1, y: 300 }), false);
  assert.equal(isInsideWorld(level, { x: 400, y: 19 }), false);
});

// ---------------------------------------------------------------- navigation entre niveaux
test('niveaux ouvrables : le premier, ceux dont le précédent a une étoile, et tous ceux du joueur', () => {
  const stars: Record<number, number> = { 0: 2, 1: 1 };
  const unlocked = (index: number) => isLevelUnlocked(index, 5, (previous) => stars[previous] ?? 0);
  assert.deepEqual(accessibleIndexes(8, unlocked), [0, 1, 2, 5, 6, 7], '0 ouvert, 1 et 2 grâce aux étoiles, 3-4 verrouillés, 5-7 sont à la fin (niveaux du joueur)');
  assert.deepEqual(accessibleIndexes(3, (index) => isLevelUnlocked(index, 3, () => 0)), [0], 'sans étoile : seulement le premier');
});

test('navigation : premier, précédent, suivant, dernier ; null quand on y est ou qu’il n’y en a pas', () => {
  const accessible = [0, 1, 2, 5, 6];
  assert.deepEqual(navigationTargets(accessible, 0), { first: null, previous: null, next: 1, last: 6 });
  assert.deepEqual(navigationTargets(accessible, 2), { first: 0, previous: 1, next: 5, last: 6 }, 'saute les niveaux verrouillés');
  assert.deepEqual(navigationTargets(accessible, 6), { first: 0, previous: 5, next: null, last: null });
  assert.deepEqual(navigationTargets([0], 0), { first: null, previous: null, next: null, last: null });
  assert.deepEqual(navigationTargets([], 0), { first: null, previous: null, next: null, last: null });
});
