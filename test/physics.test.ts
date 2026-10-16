import test from 'node:test';
import assert from 'node:assert/strict';
import { build, run, LEVELS } from './helpers.ts';
import { reference } from './refs.ts';
import { BridgeSim, structureCost, FRAME_DT, SETTLE, PIXELS_PER_METRE, MAX_SPEED_KMH, TRACTION_ACCELERATION_KMH_S, vehicleAccelerationKmhS } from '../src/physics.ts';
import { ropeHit, splitBeam, prune } from '../src/structure.ts';
import { FixedStepper } from '@datamoc/mwg/core';

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
    const half = { nodes: s.nodes, beams: s.beams.length > 1 ? s.beams.filter((_, j) => j % 2 === 0) : [] };
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

function flatDrive(): BridgeSim {
  const sim = new BridgeSim({ ...LEVELS[0], x0: 10000, x1: 10120 }, { nodes: [], beams: [] });
  sim.carX = 0;
  sim.time = SETTLE + FRAME_DT;
  return sim;
}

test('temps réel : puissance constante, fort à basse vitesse puis plafonnement à 50', () => {
  const sim = flatDrive();
  const car = sim.level.vehicle;
  assert.equal(sim.carSpeed, 0);
  // À l'arrêt, l'adhérence plafonne ; ensuite a(v) = 5000 / (t100 · v) décroît.
  assert.equal(vehicleAccelerationKmhS(car, 0), TRACTION_ACCELERATION_KMH_S);
  assert.ok(vehicleAccelerationKmhS(car, 10) > vehicleAccelerationKmhS(car, 40));
  assert.ok(Math.abs(vehicleAccelerationKmhS(car, 50) - 5000 / (car.zeroTo100 * 50)) < 1e-9);
  let firstDelta = 0;
  let fastDelta = 0;
  let stepsTo50 = 0;
  for (let i = 0; i < 600 && sim.speedKmh < MAX_SPEED_KMH; i++) {
    const previous = sim.speedKmh;
    sim.step();
    const delta = sim.speedKmh - previous;
    assert.ok(delta <= TRACTION_ACCELERATION_KMH_S * FRAME_DT + 1e-9, 'jamais plus que l’adhérence');
    if (i === 0) firstDelta = delta;
    if (previous >= 40) fastDelta = delta;
    stepsTo50++;
  }
  assert.equal(sim.speedKmh, MAX_SPEED_KMH);
  assert.ok(fastDelta > 0 && fastDelta < firstDelta * 0.75, 'on accélère moins à haute vitesse');
  const secondsTo50 = stepsTo50 * FRAME_DT;
  assert.ok(secondsTo50 > 1 && secondsTo50 < 5, '0 à 50 km/h en ' + secondsTo50.toFixed(2) + ' s');
  for (let i = 0; i < 120; i++) sim.step();
  assert.ok(Math.abs(sim.speedKmh - 50) < 1e-8);
});

test('le véhicule reste arrêté pendant la mise en équilibre du pont', () => {
  const sim = new BridgeSim(LEVELS[0], reference(0));
  const start = sim.carX;
  for (let i = 0; i < Math.floor(SETTLE / FRAME_DT) - 1; i++) sim.step();
  assert.equal(sim.carX, start);
  assert.equal(sim.speedKmh, 0);
});

test('ralenti : la même trajectoire et la même vitesse, avec deux fois plus de temps de lecture', () => {
  const real = flatDrive(), slow = flatDrive();
  const realStepper = new FixedStepper(FRAME_DT, 12), slowStepper = new FixedStepper(FRAME_DT, 12);
  for (let i = 0; i < 180; i++) realStepper.advance(FRAME_DT, () => real.step());
  for (let i = 0; i < 360; i++) slowStepper.advance(FRAME_DT * 0.5, () => slow.step());
  assert.equal(slow.carX, real.carX);
  assert.equal(slow.carSpeed, real.carSpeed);
  assert.equal(slow.time, real.time);
});

test('pente : la montée réduit l’accélération, la vitesse est mesurée le long de la route', () => {
  const slope = (angle: number): BridgeSim => {
    const level = { ...LEVELS[0], x0: -1000, x1: 1000 };
    const sim = new BridgeSim(level, {
      nodes: [-1000, 1000].map((x) => ({ x, y: level.deckY + x * Math.tan(angle), fixed: true })),
      beams: [{ a: 0, b: 1, mat: 'road' }],
    });
    sim.carX = 0;
    sim.carY = level.deckY - 5;
    sim.angle = angle;
    sim.time = 2;
    return sim;
  };
  const flat = slope(0), uphill = slope(-0.1), downhill = slope(0.1);
  for (const sim of [flat, uphill, downhill]) sim.step();
  assert.ok(uphill.carSpeed < flat.carSpeed);
  assert.ok(downhill.carSpeed >= flat.carSpeed);
  assert.ok(downhill.speedKmh <= (vehicleAccelerationKmhS(LEVELS[0].vehicle, 0) + 9.81 * 3.6 * Math.sin(0.1)) * FRAME_DT + 1e-9);
  assert.ok(Math.abs(uphill.carX - uphill.distance * Math.cos(0.1)) < 1e-9);
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
  const lv = LEVELS[7];
  const s = JSON.parse(JSON.stringify(reference(7)));
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
  const s = reference(7);
  const rope = s.beams.find((b) => b.mat === 'rope')!;
  const a = s.nodes[rope.a];
  assert.equal(ropeHit(s, { x: a.x + 2, y: a.y + 2 }), null);
  assert.equal(ropeHit(reference(2), { x: 400, y: 340 }), null);
});

test('niveau 7 (indice 7) : sans le câble porteur, le tablier suspendu ne tient pas', () => {
  const s = reference(7);
  const noRope = { nodes: s.nodes, beams: s.beams.filter((b) => b.mat !== 'rope') };
  assert.notEqual(run(LEVELS[7], noRope).status, 'won');
});

test('niveau 1bis : la chaussée seule, tendue, ne suffit pas ; le triangle de bois oui', () => {
  const lv = LEVELS[1];
  const roadOnly = build(lv, [[400, 340]], [[0, 2, 'road'], [2, 1, 'road']]);
  assert.equal(run(lv, roadOnly).status, 'failed');
  assert.equal(run(lv, reference(1)).status, 'won');
});

test('niveau 1 : les deux points sont à 6 cases, 1bis à 12 cases', () => {
  const gap = (i: number) => (LEVELS[i].x1 - LEVELS[i].x0) / 20;
  assert.equal(gap(0), 6);
  assert.equal(gap(1), 12);
});

test('saut : la voiture descend sous gravité sans être collée à la route en dessous', () => {
  const lv = LEVELS[0];
  const sim = new BridgeSim(lv, {
    nodes: [{ x: lv.x0, y: lv.deckY, fixed: true }, { x: lv.x1, y: lv.deckY, fixed: true }],
    beams: [{ a: 0, b: 1, mat: 'road' }],
  });
  sim.time = 2;
  sim.carX = (lv.x0 + lv.x1) / 2 - 14;
  sim.carY -= 30;
  const startY = sim.carY;
  sim.step();
  assert.ok(sim.carY > startY, 'la gravité agit dès le premier pas');
  assert.ok(sim.carY < startY + 1, 'pas de téléportation sur le tablier');
  for (let i = 0; i < 50; i++) sim.step();
  assert.equal(sim.crashed, false, 'un saut et son atterrissage ne sont pas un accident');
  assert.ok(Math.abs(sim.carY - (lv.deckY - 5)) < 1, 'la voiture atterrit sur le tablier');
});

test('saut : hors du sol, seule la gravité change la vitesse, l’élan horizontal est conservé', () => {
  const sim = flatDrive();
  for (let i = 0; i < 120; i++) sim.step();
  sim.carY -= 40;
  const startX = sim.carX, startY = sim.carY, speed = sim.carSpeed;
  for (let i = 0; i < 10; i++) sim.step();
  assert.equal(sim.crashed, false);
  assert.equal(sim.carSpeed, speed, 'aucune accélération du moteur sans appui');
  assert.ok(Math.abs(sim.carX - startX - speed * 10 * FRAME_DT) < 1e-8);
  const fall = 9.81 * PIXELS_PER_METRE * FRAME_DT ** 2 * (10 * 11 / 2);
  assert.ok(Math.abs(sim.carY - startY - fall) < 1e-8, 'chute sous la seule gravité');
  assert.equal(sim.angle, 0, 'pas de rotation artificielle en vol');
});
