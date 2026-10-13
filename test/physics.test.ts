import test from 'node:test';
import assert from 'node:assert/strict';
import { build, run, LEVELS } from './helpers.ts';
import { reference } from './refs.ts';
import { BridgeSim, structureCost, FRAME_DT } from '../src/physics.ts';

for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  test(`niveau ${lv.id} : le pont de référence est franchissable, sous le budget`, () => {
    const s = reference(i);
    assert.ok(structureCost(s) <= lv.budget, `coût ${structureCost(s)} > budget ${lv.budget}`);
    const r = run(lv, s);
    assert.equal(r.status, 'won');
    assert.equal(r.breaks, 0);
    assert.ok(r.maxRatio < 0.95, `contrainte max ${r.maxRatio}`);
  });
  test(`niveau ${lv.id} : sans pont, le véhicule tombe`, () => {
    assert.equal(run(lv, build(lv, [], [])).status, 'failed');
  });
  test(`niveau ${lv.id} : un pont sans la moitié de ses poutres ne tient pas`, () => {
    const s = reference(i);
    const half = { nodes: s.nodes, beams: s.beams.filter((_, j) => j % 2 === 0) };
    assert.notEqual(run(lv, half).status, 'won');
  });
}

test('déterminisme : deux simulations identiques donnent exactement le même état', () => {
  const lv = LEVELS[0];
  const a = new BridgeSim(lv, reference(0)), b = new BridgeSim(lv, reference(0));
  for (let i = 0; i < 400; i++) { a.step(); b.step(); }
  assert.deepEqual(a.bodies.map((p) => [p.x, p.y]), b.bodies.map((p) => [p.x, p.y]));
  assert.equal(a.carX, b.carX);
});

test('la structure d’édition n’est pas modifiée par la simulation', () => {
  const s = reference(0);
  const before = JSON.stringify(s);
  const sim = new BridgeSim(LEVELS[0], JSON.parse(JSON.stringify(s)));
  for (let i = 0; i < 300; i++) sim.step();
  assert.equal(JSON.stringify(s), before);
});

test('la vitesse du véhicule ne dépend pas de la boucle de rendu (pas fixe)', () => {
  const lv = LEVELS[0];
  const sim = new BridgeSim(lv, reference(0));
  const t0 = sim.carX;
  for (let i = 0; i < 180; i++) sim.step(); // SETTLE (1,2 s) puis du roulage
  assert.ok(Math.abs(sim.carX - t0 - lv.vehicle.speed * (180 * FRAME_DT - 1.2)) < lv.vehicle.speed * FRAME_DT * 1.01);
});

test('un câble ne résiste pas en compression', () => {
  const lv = LEVELS[0];
  // tablier + câble parallèle sous le tablier : le câble ne doit pas porter de compression
  const s = build(lv, [[280, 340], [400, 340], [520, 340], [340, 440], [460, 440]],
    [[0, 2, 'road'], [2, 3, 'road'], [3, 4, 'road'], [4, 1, 'road'], [0, 5, 'cable'], [5, 2, 'cable']]);
  const sim = new BridgeSim(lv, s);
  for (let i = 0; i < 200; i++) sim.step();
  for (const l of sim.links) if (l.mat === 'cable') assert.ok(l.force >= -1e-6 || l.broken);
});

// Chaque étoile doit être atteignable : en retirant glouton des poutres d'un pont de référence qui
// tient encore (contrainte < 75 %), on doit descendre sous 80 % du budget (donc ≥ 20 % restant).
for (let i = 0; i < LEVELS.length; i++) {
  test(`niveau ${LEVELS[i].id} : les 3 étoiles sont atteignables`, () => {
    const lv = LEVELS[i];
    let s = reference(i);
    for (;;) {
      let best: typeof s | null = null;
      s.beams.forEach((_, j) => {
        const cand = { nodes: s.nodes, beams: s.beams.filter((_, k) => k !== j) };
        const r = run(lv, cand);
        if (r.status === 'won' && r.maxRatio < 0.75 && (!best || structureCost(cand) < structureCost(best))) best = cand;
      });
      if (!best) break;
      s = best;
    }
    assert.ok(structureCost(s) <= lv.budget * 0.8, `coût minimal trouvé ${Math.round(structureCost(s))} > ${lv.budget * 0.8}`);
  });
}
