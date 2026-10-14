import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as Skeleton from '@datamoc/mw_games/skeleton';
import { WALKERS, WALK_CLIP, WALK_PARTS, createWalkerSkeleton, walkerPivot, type WalkerArt } from '../src/walker-rig.ts';

const manifest = JSON.parse(readFileSync(new URL('../assets/manifest.json', import.meta.url), 'utf8'));
const artOf = (name: string): WalkerArt => manifest[name];
const groupsOf = (name: string): string[] => {
  const source = readFileSync(new URL(`../assets/${name}.svg`, import.meta.url), 'utf8');
  return [...source.matchAll(/<g[^>]*id="([^"]+)"/g)].map((m) => m[1]);
};

test('marche : les cuisses oscillent, les genoux ne fléchissent que vers l’arrière', () => {
  for (let step = 0; step < 64; step++) {
    const pose = Skeleton.samplePose(WALK_CLIP, step / 64);
    for (const side of ['near', 'far']) {
      const thigh = pose[`leg-${side}`];
      const shin = pose[`shin-${side}`];
      assert.ok(thigh >= -30 && thigh <= 30, `cuisse ${side} hors amplitude : ${thigh}`);
      assert.ok(shin >= 0 && shin <= 60, `genou ${side} inversé ou excessif : ${shin}`);
    }
  }
  assert.deepEqual(Skeleton.samplePose(WALK_CLIP, 0), Skeleton.samplePose(WALK_CLIP, 1));
});

test('marche : le pied revient derrière le genou pendant la flexion', () => {
  for (const name of WALKERS) {
    const skeleton = createWalkerSkeleton(artOf(name));
    for (const [side, time] of [['near', 0.25], ['far', 0.75]] as const) {
      const pose = Skeleton.samplePose(WALK_CLIP, time);
      const bones = new Map(Skeleton.resolve(skeleton, pose).map((bone) => [bone.name, bone]));
      const shin = bones.get(`shin-${side}`)!;
      assert.ok(shin.tipX < shin.x, `${name} : le pied ${side} doit être derrière le genou`);
      assert.ok(shin.tipY > shin.y, `${name} : le pied ${side} doit rester sous le genou`);
    }
  }
});

test('squelette : genou au bout de la cuisse au repos, pour les 4 presets', () => {
  for (const name of WALKERS) {
    const art = artOf(name);
    const skeleton = createWalkerSkeleton(art);
    const rest = new Map(Skeleton.resolve(skeleton).map((bone) => [bone.name, bone]));
    for (const side of ['near', 'far']) {
      const thigh = rest.get(`leg-${side}`)!;
      const shin = rest.get(`shin-${side}`)!;
      assert.deepEqual([thigh.tipX, thigh.tipY], art.pivots[`shin-${side}`]);
      assert.deepEqual([shin.x, shin.y], [thigh.tipX, thigh.tipY]);
      const straight = art.pivots[`leg-${side}`][1] + art.rig.walk.thigh + art.rig.walk.shin;
      assert.ok(Math.abs(shin.tipY - straight) < 1e-9, `${name} : cheville ${shin.tipY}, attendu ${straight}`);
    }
  }
});

test('personnages : groupes articulés présents et pivotés dans chaque preset', () => {
  const limbs = ['leg-near', 'shin-near', 'leg-far', 'shin-far', 'arm-near', 'forearm-near', 'arm-far', 'forearm-far'];
  for (const name of WALKERS) {
    const art = artOf(name);
    const groups = groupsOf(name);
    for (const part of [...limbs, 'torso', 'head']) {
      // Le chargeur reconstitue la cuisse proche d'un SVG dégroupé lors d'une retouche.
      if (part === 'leg-near' && !groups.includes(part)) {
        assert.ok(groups.includes('shin-near'), `${name} : jambe proche absente du SVG`);
        continue;
      }
      assert.ok(groups.includes(part), `${name} : groupe ${part} absent du SVG`);
    }
    for (const part of WALK_PARTS) {
      if (!groups.includes(part)) continue;
      const [x, y] = walkerPivot(art, part);
      assert.ok(Number.isFinite(x) && Number.isFinite(y), `${name} : pivot manquant pour ${part}`);
      assert.ok(x >= 0 && x <= art.width && y >= 0 && y <= art.height, `${name} : pivot ${part} hors cadre`);
    }
  }
});
