// Graphismes CraftPix (voir README) : chargés par le pipeline d'assets de MWG, donc compilés dans le HTML.
import { load, texture } from '@datamoc/mw_games/assets';
import { SpriteSheet, AnimatedSprite, Sprite2D, type Node2D } from '@datamoc/mw_games/two-d';
import { Random } from '@datamoc/mw_games/core';
import type { LevelDef, VehicleDef } from './data.ts';

const CARS = ['citadine_ride', 'citadine_destroyed', 'jeep1_ride', 'jeep1_idle', 'jeep1_destroyed', 'jeep2_ride', 'jeep2_idle', 'jeep2_destroyed'];
const TREES = ['fir_tree_1', 'fir_tree_5', 'birch_1', 'birch_5', 'middle_lane_tree2', 'middle_lane_tree5'];
const BUSHES = ['bush1', 'bush4', 'bush8'];
const ROCKS = ['rock1', 'rock2', 'rock3'];
const CLOUDS = ['cloud1', 'cloud3', 'cloud5'];

const paths = [
  ...CARS.map((n) => `cars/${n}.png`),
  ...[...TREES, ...BUSHES, ...ROCKS].map((n) => `decor/${n}.png`),
  ...CLOUDS.map((n) => `clouds/${n}.png`),
];

export const loadArt = (): Promise<void> => load(paths);

/** Par voiture : taille d'une image de la planche, distance entre les roues et marge sous les roues (px d'origine). */
const SHEET = {
  citadine: { frame: 192, wheelbase: 83, foot: 3 },
  jeep1: { frame: 192, wheelbase: 81, foot: 3 },
  jeep2: { frame: 256, wheelbase: 123, foot: 9 },
} as const;

export type CarState = 'idle' | 'ride' | 'destroyed';

export function makeVehicle(def: VehicleDef): AnimatedSprite {
  const dim = SHEET[def.sprite];
  const sheet = (name: string) => SpriteSheet.grid(`cars/${name}.png`, dim.frame, dim.frame);
  const ride = sheet(`${def.sprite}_ride`);
  const s = new AnimatedSprite();
  s.add('ride', ride.range(0, ride.count - 1), { fps: 14, loop: true });
  // la citadine n'a pas de planche « idle » : on fige la première image de roulage
  if (def.sprite === 'citadine') s.add('idle', [ride.get(0)], { fps: 1 });
  else { const idle = sheet(`${def.sprite}_idle`); s.add('idle', idle.range(0, idle.count - 1), { fps: 6, loop: true }); }
  const dead = sheet(`${def.sprite}_destroyed`);
  s.add('destroyed', dead.range(0, dead.count - 1), { fps: 16, loop: false });
  s.anchor.set(0.5, 1 - dim.foot / dim.frame);
  const k = (0.6 * def.width) / dim.wheelbase;
  s.scale.set(k);
  s.play('idle');
  return s;
}

/** Arbres, buissons et rochers posés sur les deux rives (placement déterministe par niveau). */
export function buildDecor(level: LevelDef, node: Node2D): void {
  node.removeChildren().forEach((c) => c.destroy());
  const gen = new Random.Generator(level.id * 7919 + 13);
  const pick = <T>(a: readonly T[]): T => a[gen.int(a.length)];
  const put = (name: string, x: number, y: number, scale: number, flip = false) => {
    const sp = new Sprite2D(texture(`decor/${name}.png`));
    sp.anchor.set(0.5, 1);
    sp.position.set(x, y);
    sp.scale.set(flip ? -scale : scale, scale);
    node.addChild(sp);
  };
  const side = (from: number, to: number, y: number) => {
    // arrière-plan : arbres ; premier plan : buissons et rochers
    for (let x = from; x < to; x += 40 + gen.float() * 50) put(pick(TREES), x, y - 7, 0.26 + gen.float() * 0.2, gen.float() < 0.5);
    for (let x = from + 30; x < to; x += 55 + gen.float() * 60) put(pick(BUSHES), x, y - 4, 0.22 + gen.float() * 0.14, gen.float() < 0.5);
    for (let x = from + 50; x < to; x += 220 + gen.float() * 150) put(pick(ROCKS), x, y - 3, 0.14 + gen.float() * 0.1);
  };
  // on laisse libre l'approche immédiate du pont (panneaux, véhicule)
  side(-650, level.x0 - 95, level.deckY);
  side(level.x1 + 95, 1450, level.deckY);
}

export interface Clouds { update(dt: number): void }
export function buildClouds(node: Node2D, seed: number): Clouds {
  node.removeChildren().forEach((c) => c.destroy());
  const gen = new Random.Generator(seed);
  const items: { sp: Sprite2D; v: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const sp = new Sprite2D(texture(`clouds/${CLOUDS[i % CLOUDS.length]}.png`));
    const sc = 0.3 + gen.float() * 0.35;
    sp.scale.set(sc);
    sp.alpha = 0.55 + gen.float() * 0.4;
    sp.position.set(-500 + gen.float() * 1800, -60 + gen.float() * 190);
    node.addChild(sp);
    items.push({ sp, v: 4 + sc * 9 });
  }
  return {
    update(dt) {
      for (const c of items) { c.sp.x += c.v * dt; if (c.sp.x > 1350) c.sp.x = -600; }
    },
  };
}
