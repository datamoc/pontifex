import test from 'node:test';
import assert from 'node:assert/strict';
import { build, run, LEVELS } from './helpers.ts';
import { reference } from './refs.ts';
import { BridgeSim, structureCost, FRAME_DT } from '../src/physics.ts';
import { ropeHit, splitBeam, prune } from '../src/structure.ts';

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
  test(`niveau ${lv.id} : le pont de référence n'utilise que les matériaux autorisés`, () => {
    for (const b of reference(i).beams) assert.ok(lv.materials.includes(b.mat), `${b.mat} interdit au niveau ${lv.id}`);
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

test('progression : un nouveau matériau n\'apparaît qu\'en élargissant la liste précédente', () => {
  for (let i = 1; i < LEVELS.length; i++) for (const m of LEVELS[i - 1].materials) {
    // un niveau ne retire jamais un matériau déjà appris, sauf pour mieux cadrer le scénario (4-5 sans câbles)
    if (!LEVELS[i].materials.includes(m)) assert.fail(`niveau ${LEVELS[i].id} retire ${m}`);
  }
});

test('câble porteur : accrocher une suspente coupe le câble en deux sans changer la longueur ni le coût', () => {
  const lv = LEVELS[6];
  const s = JSON.parse(JSON.stringify(reference(6)));
  const before = structureCost(s);
  const rope = s.beams.findIndex((b: { mat: string }) => b.mat === 'rope');
  const a = s.nodes[s.beams[rope].a], b = s.nodes[s.beams[rope].b];
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const hit = ropeHit(s, { x: mid.x + 3, y: mid.y + 2 });
  assert.ok(hit, 'le câble doit être touché');
  const n = splitBeam(s, hit!.beam, hit!.pos);
  assert.equal(s.beams.filter((x: { a: number; b: number }) => x.a === n || x.b === n).length, 2);
  assert.ok(Math.abs(structureCost(s) - before) < 1e-6);
  assert.equal(run(lv, prune(s)).status, 'won');
});

test('câble porteur : pas d\'accrochage près d\'un nœud existant ni sur autre chose qu\'un câble porteur', () => {
  const s = reference(6);
  const rope = s.beams.find((b) => b.mat === 'rope')!;
  const a = s.nodes[rope.a];
  assert.equal(ropeHit(s, { x: a.x + 2, y: a.y + 2 }), null);
  assert.equal(ropeHit(reference(1), { x: 400, y: 340 }), null);
});

test('niveau 7 : sans le câble porteur, le tablier suspendu ne tient pas', () => {
  const s = reference(6);
  const noRope = { nodes: s.nodes, beams: s.beams.filter((b) => b.mat !== 'rope') };
  assert.notEqual(run(LEVELS[6], noRope).status, 'won');
});
