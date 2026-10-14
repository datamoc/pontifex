import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestNode, chainStart } from '../src/structure.ts';
import { decorLayout } from '../src/art.ts';
import { LEVELS } from './helpers.ts';

test('aimantation : le point le plus proche l’emporte, hors portée on rate', () => {
  const nodes = [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 0, y: 40 }];
  assert.equal(nearestNode(nodes, { x: 26, y: 2 }, 22), 1);
  assert.equal(nearestNode(nodes, { x: 2, y: 35 }, 22), 2);
  assert.equal(nearestNode(nodes, { x: 100, y: 100 }, 22), -1);
  assert.equal(nearestNode([], { x: 0, y: 0 }, 22), -1);
});

test('aimantation : à distance exactement égale au rayon, pas d’accroche', () => {
  assert.equal(nearestNode([{ x: 0, y: 0 }], { x: 22, y: 0 }, 22), -1);
  assert.equal(nearestNode([{ x: 0, y: 0 }], { x: 21.9, y: 0 }, 22), 0);
});

test('chaînage : on repart du dernier point sauf clic au-delà de la portée', () => {
  const end = { x: 400, y: 340 };
  assert.deepEqual(chainStart(end, { x: 450, y: 340 }, 120), end);
  assert.deepEqual(chainStart(end, { x: 400, y: 340 }, 120), end);
  assert.deepEqual(chainStart(end, { x: 520, y: 340 }, 120), end); // portée incluse
  assert.equal(chainStart(end, { x: 521, y: 340 }, 120), null); // trop loin : on recommence ailleurs
  assert.equal(chainStart(null, { x: 400, y: 340 }, 120), null);
});

test('décor : chaque élément est planté au niveau ou sous la chaussée, jamais en l’air', () => {
  for (const lv of LEVELS) {
    const items = decorLayout(lv);
    assert.ok(items.length > 0, `niveau ${lv.id} : décor vide`);
    for (const it of items) {
      assert.ok(it.y >= lv.deckY - 5, `${it.name} flotte à y=${it.y} (chaussée ${lv.deckY - 5})`);
      assert.ok(it.x <= lv.x0 - 95 || it.x >= lv.x1 + 95, `${it.name} empiète sur le pont à x=${it.x}`);
    }
  }
});

test('décor : placement déterministe', () => {
  assert.deepEqual(decorLayout(LEVELS[0]), decorLayout(LEVELS[0]));
});
