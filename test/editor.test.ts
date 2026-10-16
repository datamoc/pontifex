import test from 'node:test';
import assert from 'node:assert/strict';
import { run, build } from './helpers.ts';
import { BUILTIN_SPECS, LEVELS } from '../src/levels.ts';
import { deriveLevel, parseSpec, type LevelSpec } from '../src/level.ts';
import * as ed from '../src/editor.ts';
import { reference } from './refs.ts';

const fresh = () => ed.newSpec();
const ok = <T>(v: T | null): T => { assert.ok(v, ed.lastError); return v as T; };

test('les niveaux du jeu sont tous des spécifications valides (aller-retour JSON)', () => {
  for (const spec of BUILTIN_SPECS) {
    const parsed = parseSpec(JSON.parse(JSON.stringify(spec)));
    assert.ok('spec' in parsed, `${spec.name}: ${'error' in parsed ? parsed.error : ''}`);
    if ('spec' in parsed) assert.deepEqual(deriveLevel({ ...parsed.spec, id: spec.id, label: spec.label }).anchors, deriveLevel(spec).anchors);
  }
});

test('nouveau niveau : valide et jouable avec un pont à poinçon', () => {
  const spec = fresh();
  assert.equal(ed.problems(spec), null);
  const lv = deriveLevel(spec);
  const s = build(lv, [[400, 340], [400, 380]], [[0, 2, 'road'], [2, 1, 'road'], [0, 3, 'wood'], [3, 1, 'wood'], [2, 3, 'wood']]);
  assert.equal(run(lv, s).status, 'won');
});

test('écart : les rives et leurs ancrages suivent, ', () => {
  const w = ok(ed.widen(fresh(), 1));
  assert.equal(w.x0, 220); assert.equal(w.x1, 580);
  assert.deepEqual(w.anchors.map((a) => a.x).sort(), [220, 580]);
});
test('écart : minimum 6 cases, maximum 30', () => {
  let s = fresh();
  s = ok(ed.widen(s, -1));                              // 12 → 6
  assert.equal((s.x1 - s.x0) / 20, 6);
  assert.equal(ed.widen(s, -1), null);
  let t = fresh();
  for (let i = 0; i < 20; i++) { const n = ed.widen(t, 1); if (!n) break; t = n; }
  assert.ok((t.x1 - t.x0) / 20 <= 30);
});

test('écart : pas de 12 m et recalage des anciens niveaux à écart irrégulier', () => {
  const irregular = { ...fresh(), x0: 180, x1: 620, anchors: [{ x: 180, y: 340 }, { x: 620, y: 340 }] };
  const wider = ok(ed.widen(irregular, 1));
  const narrower = ok(ed.widen(irregular, -1));
  assert.equal(wider.x1 - wider.x0, 480);
  assert.equal(narrower.x1 - narrower.x0, 360);
  assert.deepEqual(wider.anchors, [{ x: wider.x0, y: 340 }, { x: wider.x1, y: 340 }]);
  assert.deepEqual(ok(ed.widen(ok(ed.widen(fresh(), 1)), -1)), fresh());
});

test('route et eau : les ancrages de rive suivent la route ; l’eau reste sous la route', () => {
  const s = ok(ed.moveDeck(fresh(), -1));
  assert.equal(s.deckY, 320);
  assert.ok(s.anchors.every((a) => a.y === 320));
  assert.equal(ed.moveWater(s, -100), null);
});

test('ancre : ajout, retrait, refus dans la roche', () => {
  let s = fresh();
  s = ok(ed.toggleAnchor(s, { x: 300, y: 420 }));
  assert.equal(s.anchors.length, 3);
  s = ok(ed.toggleAnchor(s, { x: 300, y: 420 }));
  assert.equal(s.anchors.length, 2);
  assert.equal(ed.toggleAnchor(s, { x: 100, y: 450 }), null);   // dans la falaise
});

test('îlot : crée l’îlot et son ancrage ; le retirer retire aussi l’ancrage', () => {
  let s = fresh();
  s = ok(ed.widen(s, 1));                                      // 18 cases
  s = ok(ed.toggleIsland(s, { x: 400, y: 440 }));
  assert.equal(s.islands.length, 1);
  assert.ok(s.anchors.some((a) => a.x === 400 && a.y === 440));
  assert.equal(ed.toggleAnchor(s, { x: 400, y: 440 }), null);   // ancrage d'îlot protégé
  s = ok(ed.toggleIsland(s, { x: 400, y: 440 }));
  assert.equal(s.islands.length, 0);
  assert.ok(!s.anchors.some((a) => a.x === 400 && a.y === 440));
});

test('pylône : sur une rive ou un îlot seulement, sommet au-dessus', () => {
  let s = ok(ed.widen(fresh(), 1));
  assert.equal(ed.toggleTower(s, { x: 400, y: 200 }), null);     // au-dessus du vide
  s = ok(ed.toggleTower(s, { x: 200, y: 160 }));
  assert.equal(s.towers.length, 1);
  const tower = deriveLevel(s).towers[0];
  assert.ok(tower);
  assert.equal(tower.base, s.deckY);
  assert.equal(ed.toggleTower(s, { x: 260, y: 330 }), null);     // sommet trop bas
  s = ok(ed.toggleTower(s, { x: 200, y: 160 }));
  assert.equal(s.towers.length, 0);
  assert.equal(s.anchors.length, 2);
});

test('l’élargissement emporte les pylônes de rive et supprime les îlots qui sortent du canyon', () => {
  let s = ok(ed.widen(fresh(), 1));
  s = ok(ed.toggleTower(s, { x: 200, y: 160 }));
  s = ok(ed.toggleIsland(s, { x: 400, y: 440 }));
  const n = ok(ed.widen(s, 1));
  assert.equal(n.towers[0]?.x, 140);
  let r = n;
  for (let i = 0; i < 3; i++) r = ed.widen(r, -1) ?? r;
  assert.ok(r.islands.every((i) => i.x >= r.x0 + 60 && i.x <= r.x1 - 60));
});

test('toute modification de géométrie invalide la solution, pas le budget ni le nom', () => {
  const spec: LevelSpec = { ...fresh(), solution: { nodes: [], beams: [] } };
  assert.ok(ed.adjustBudget(spec, 1)!.solution);
  assert.equal(ed.widen(spec, 1)!.solution, undefined);
  assert.equal(ed.cycleCar(spec).solution, undefined);
});

test('retirer un matériau utilisé par la solution invalide celle-ci', () => {
  const spec: LevelSpec = { ...fresh(), solution: { nodes: [{ x: 0, y: 0, fixed: true }, { x: 10, y: 0, fixed: true }], beams: [{ a: 0, b: 1, mat: 'wood' }] } };
  assert.equal(ed.toggleMaterial(spec, 'wood')!.solution, undefined);
  assert.equal(ed.toggleMaterial(spec, 'road'), null);
});

test('import : un fichier malveillant ou mal formé est refusé, jamais accepté tel quel', () => {
  const good = JSON.parse(JSON.stringify(fresh()));
  const bad = (patch: Record<string, unknown>) => parseSpec({ ...good, ...patch });
  for (const p of [{ name: '' }, { budget: -5 }, { budget: 1e9 }, { x1: 301 }, { car: 'tank' }, { materials: ['wood'] }, { materials: 'road' },
    { anchors: [{ x: 1, y: 1 }] }, { anchors: [{ x: NaN, y: 1 }, { x: 2, y: 2 }] }, { waterY: 100 }, { towers: [{ x: 'a', top: 1 }] },
    { solution: { nodes: [{ x: 0, y: 0 }], beams: [{ a: 0, b: 5, mat: 'road' }] } },
    { solution: { nodes: [{ x: 0, y: 0 }, { x: 1, y: 1 }], beams: [{ a: 0, b: 1, mat: 'rope' }] } }]) {
    assert.ok('error' in bad(p), JSON.stringify(p));
  }
  assert.ok('error' in parseSpec(null)); assert.ok('error' in parseSpec('x')); assert.ok('error' in parseSpec([]));
  const huge = parseSpec({ ...good, name: 'x'.repeat(5000), hint: '\u0000' + 'y'.repeat(5000) });
  assert.ok('spec' in huge && huge.spec.name.length <= 40 && huge.spec.hint.length <= 220 && !huge.spec.hint.includes('\u0000'));
  const proto = parseSpec(JSON.parse('{"__proto__":{"x":1},"name":"a","budget":100,"x0":300,"x1":500,"deckY":340,"waterY":470,"car":"citadine","materials":["road"],"anchors":[{"x":300,"y":340},{"x":500,"y":340}]}'));
  assert.ok('spec' in proto);
  assert.equal(({} as Record<string, unknown>).x, undefined);
});

test('la solution exportée d’un niveau se rejoue : même résultat après aller-retour JSON', () => {
  const lv = LEVELS[1];
  const spec: LevelSpec = { ...JSON.parse(JSON.stringify(BUILTIN_SPECS[1])), solution: reference(1) };
  const parsed = parseSpec(JSON.parse(JSON.stringify(spec)));
  assert.ok('spec' in parsed && parsed.spec.solution);
  if ('spec' in parsed && parsed.spec.solution) assert.equal(run(lv, parsed.spec.solution).status, 'won');
});
