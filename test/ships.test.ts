import test from 'node:test';
import assert from 'node:assert/strict';
import { build, run, LEVELS } from './helpers.ts';
import { reference } from './refs.ts';
import { BridgeSim, FRAME_DT, type SimEvent } from '../src/physics.ts';
import { SHIPS, type LevelDef, type ShipType } from '../src/data.ts';
import { parseSpec, deriveLevel, type LevelSpec } from '../src/level.ts';
import { BUILTIN_SPECS } from '../src/levels.ts';

const cargo = LEVELS.find((level) => level.events.length > 0)!;
const flat = (level: LevelDef, shipType: ShipType, time = 0): LevelDef => ({ ...level, events: [{ type: 'ship', time, shipType }] });

test('le Passage du Cargo existe : un navire moyen passe à 1 s', () => {
  assert.equal(cargo.name, 'Le Passage du Cargo');
  assert.deepEqual(cargo.events, [{ type: 'ship', time: 1, shipType: 'medium' }]);
});

test('un navire attend caché dans la rive gauche, puis traverse le canal à sa vitesse et sort à droite', () => {
  const level = flat(cargo, 'small', 0.5);
  const sim = new BridgeSim(level, { nodes: [], beams: [] });
  sim.carX = -5000; // véhicule très loin : la simulation reste en cours jusqu'à la sortie du navire
  const def = SHIPS.small;
  const [ship] = sim.ships;
  assert.equal(ship.x + def.width / 2, level.x0, 'étrave au bord du canal, caché dans la roche');
  const events: SimEvent[] = [];
  let steps = 0;
  while (!ship.done && steps++ < 40 / FRAME_DT) {
    const before = ship.x;
    sim.step();
    events.push(...sim.events.splice(0));
    if (ship.sailing) assert.ok(Math.abs(ship.x - before - def.speed * FRAME_DT) < 1e-9 || before === level.x0 - def.width / 2);
    if (sim.time < 0.5) assert.equal(ship.sailing, false, 'il attend l’heure de l’événement');
  }
  assert.ok(ship.done && !ship.sailing);
  assert.equal(events.filter((e) => e.type === 'ship').length, 1, 'une seule sirène par navire');
  assert.ok(ship.x - def.width / 2 > level.x1, 'sorti du canal');
});

test('le gabarit : ce qui descend sous 5 m au-dessus de l’eau casse, le reste est épargné', () => {
  const level = cargo; // eau à 440, navire moyen de 50 px : gabarit jusqu’à y = 390
  const above = build(level, [[400, 340], [400, 380]], [[0, 2, 'road'], [2, 1, 'road'], [0, 3, 'wood'], [3, 1, 'wood'], [2, 3, 'wood']]);
  const below = build(level, [[400, 340], [400, 420]], [[0, 2, 'road'], [2, 1, 'road'], [0, 3, 'wood'], [3, 1, 'wood'], [2, 3, 'wood']]);
  assert.equal(run(level, above).breaks, 0);
  const hit = run(level, below);
  assert.ok(hit.breaks > 0, 'les poutres basses sont brisées par la coque');
  assert.equal(run({ ...level, events: [] }, below).breaks, 0, 'sans navire, le même pont tient');
});

test('un petit navire passe sous un pont qu’un grand navire détruirait', () => {
  const level = flat(cargo, 'small', 0.5); // gabarit du petit : y ≥ 400
  const mid = build(level, [[400, 340], [400, 395]], [[0, 2, 'road'], [2, 1, 'road'], [0, 3, 'wood'], [3, 1, 'wood'], [2, 3, 'wood']]);
  assert.equal(run(level, mid).breaks, 0);
  assert.ok(run(flat(cargo, 'large', 0.5), mid).breaks > 0);
});

test('le navire brisé émet un événement de rupture à l’endroit du choc', () => {
  const level = cargo;
  const below = build(level, [[400, 340], [400, 420]], [[0, 2, 'road'], [2, 1, 'road'], [0, 3, 'wood'], [3, 1, 'wood'], [2, 3, 'wood']]);
  const sim = new BridgeSim(level, below);
  const breaks: SimEvent[] = [];
  for (let i = 0; i < 20 / FRAME_DT && sim.status === 'running'; i++) { sim.step(); breaks.push(...sim.events.splice(0).filter((e) => e.type === 'break')); }
  assert.ok(breaks.length > 0);
  const first = breaks[0];
  assert.ok(first.type === 'break' && first.y >= level.waterY - SHIPS.medium.height, 'la première rupture est dans le gabarit');
});

test('un navire est déterministe et ne modifie pas un niveau sans événement', () => {
  const a = new BridgeSim(cargo, reference(8)), b = new BridgeSim(cargo, reference(8));
  for (let i = 0; i < 400; i++) { a.step(); b.step(); }
  assert.deepEqual(a.ships, b.ships);
  assert.deepEqual(a.bodies.map((p) => [p.x, p.y]), b.bodies.map((p) => [p.x, p.y]));
  const quiet = new BridgeSim(LEVELS[0], reference(0));
  assert.deepEqual(quiet.ships, []);
});

test('événements de niveau : validés à l’import, triés à la dérivation', () => {
  const base = JSON.parse(JSON.stringify(BUILTIN_SPECS.find((spec) => spec.events?.length)!)) as LevelSpec;
  const ok = parseSpec({ ...base, events: [{ type: 'ship', time: 9, shipType: 'large' }, { type: 'ship', time: 2, shipType: 'small' }] });
  assert.ok('spec' in ok);
  const derived = deriveLevel((ok as { spec: LevelSpec }).spec);
  assert.deepEqual(derived.events.map((e) => e.time), [2, 9]);
  for (const bad of [
    [{ type: 'ship', time: 2, shipType: 'yacht' }],
    [{ type: 'waterRise', time: 2, shipType: 'small' }],
    [{ type: 'ship', time: -1, shipType: 'small' }],
    [{ type: 'ship', time: 99, shipType: 'small' }],
    Array.from({ length: 11 }, () => ({ type: 'ship', time: 1, shipType: 'small' })),
    'ship',
  ]) assert.ok('error' in parseSpec({ ...base, events: bad }), JSON.stringify(bad).slice(0, 60));
  const none = parseSpec({ ...base, events: undefined });
  assert.ok('spec' in none && !(none.spec.events?.length));
});
