import { makeSkeletalCyclist } from './skeletal-cyclist.ts';
import { CYCLIST } from './cyclist-rig.ts';
import { WALKERS } from './walker-rig.ts';
import { makeSkeletalWalker } from './skeletal-walkers.ts';
import { makeFlyingBird } from './resident-animation.ts';
import { get, texture } from '@datamoc/mwg/assets';
import { Node2D, Sprite2D } from '@datamoc/mwg/two-d';
import { Random } from '@datamoc/mwg/core';
import type { Biome } from './biomes.ts';
import type { LevelDef } from './data.ts';

const CYCLIST_CHANCE = 0.2;
const CYCLIST_HEIGHT = 36;
const PEDESTRIAN_HEIGHT = 32;
const ANIMAL_HEIGHT = 20;
const BIRD_HEIGHT = 14;
const FLIGHT_CLEARANCE = 100;
const BRIDGE_MARGIN = 45;

export const RESIDENT_FILES = [
  ...WALKERS.map((name) => `${name}.svg`),
  `${CYCLIST}.svg`,
];

export interface Resident {
  name: string;
  kind: 'pedestrian' | 'cyclist' | 'animal' | 'bird';
  left: number;
  right: number;
  start: number;
  speed: number;
  y: number;
}

/** Promenades proches du pont : les habitants restent sur leur propre rive. */
export function populationLayout(level: LevelDef, biome: Biome): Resident[] {
  const random = new Random.Generator(level.id * 7919 + 97);
  const residents: Resident[] = [];
  const banks = [
    { left: level.x0 - 240, right: level.x0 - BRIDGE_MARGIN },
    { left: level.x1 + BRIDGE_MARGIN, right: level.x1 + 240 },
  ];
  for (const bank of banks) {
    for (let index = 0; index < 5; index++) {
      let kind: Resident['kind'] = 'animal';
      let names = biome.animals;
      let speed = 0;
      if (index < 3) {
        kind = 'pedestrian';
        names = WALKERS;
        speed = 9 + random.float() * 7;
        if (random.float() < CYCLIST_CHANCE) {
          kind = 'cyclist';
          names = [CYCLIST];
          speed = 22 + random.float() * 10;
        }
      }
      if (names.length === 0) continue;
      residents.push({
        name: names[random.int(names.length)], kind, ...bank,
        start: random.float() * (bank.right - bank.left) * 2,
        speed,
        y: level.deckY - 5,
      });
    }
  }
  for (let index = 0; index < biome.flyingBirds.length * 2; index++) {
    residents.push({
      name: biome.flyingBirds[index % biome.flyingBirds.length], kind: 'bird',
      left: -200, right: 1000, start: random.float() * 2400,
      speed: 12 + random.float() * 10,
      y: Math.max(30, level.deckY - FLIGHT_CLEARANCE - random.float() * 100),
    });
  }
  return residents;
}

export function residentPosition(resident: Resident, time: number): { x: number; direction: number } {
  const width = resident.right - resident.left;
  const distance = (resident.start + time * resident.speed) % (width * 2);
  if (distance < width) return { x: resident.left + distance, direction: 1 };
  return { x: resident.right - (distance - width), direction: -1 };
}

export interface Population { update(dt: number): void }

export function buildPopulation(level: LevelDef, biome: Biome, node: Node2D, wildlife: Node2D): Population {
  const manifest = get<Record<string, { height: number; anchor: [number, number] }>>('manifest.json');
  const residents = populationLayout(level, biome).map((resident) => {
    const isWildlife = resident.kind === 'animal' || resident.kind === 'bird';
    const artwork = manifest[resident.name];
    let animated = null;
    if (resident.kind === 'pedestrian') animated = makeSkeletalWalker(resident.name);
    if (resident.kind === 'cyclist') animated = makeSkeletalCyclist();
    if (resident.kind === 'bird') animated = makeFlyingBird(resident.name);
    const height = { pedestrian: PEDESTRIAN_HEIGHT, cyclist: CYCLIST_HEIGHT, animal: ANIMAL_HEIGHT, bird: BIRD_HEIGHT }[resident.kind];
    const scale = height / artwork.height;
    let sprite: Node2D;
    let updateAnimation: (time: number) => void;
    if (animated) {
      sprite = animated.node;
      updateAnimation = (time) => animated.update(time + resident.start, resident.speed, scale);
    } else {
      const body = new Sprite2D(texture(`${resident.name}.svg`));
      body.anchor.set(...artwork.anchor);
      sprite = body;
      updateAnimation = () => {};
    }
    (isWildlife ? wildlife : node).addChild(sprite);
    return { resident, sprite, scale, updateAnimation };
  });
  let time = 0;
  const population: Population = {
    update(dt) {
      time += dt;
      for (const { resident, sprite, scale, updateAnimation } of residents) {
        const { x, direction } = residentPosition(resident, time);
        sprite.position.set(x, resident.y);
        sprite.scale.set(direction * scale, scale);
        updateAnimation(time);
      }
    },
  };
  population.update(0);
  return population;
}
