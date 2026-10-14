import { makeAnimatedResident } from './resident-animation.ts';
import { get, texture } from '@datamoc/mw_games/assets';
import { Node2D, Sprite2D } from '@datamoc/mw_games/two-d';
import { Random } from '@datamoc/mw_games/core';
import type { Biome } from './biomes.ts';
import type { LevelDef } from './data.ts';

const WALKERS = [
  'common/walker_man_short_hair_trousers',
  'common/walker_woman_ponytail_trousers',
  'common/walker_man_bald_shorts',
  'common/walker_woman_long_hair_midi_skirt',
];
const CYCLIST = 'common/cyclist';
const CYCLIST_CHANCE = 0.2;
const CYCLIST_HEIGHT = 36;
const WALK_FRAME_COUNT = 8;
const WALK_FRAMES_PER_SECOND = 8;
const PEDESTRIAN_HEIGHT = 32;
const ANIMAL_HEIGHT = 20;
const BIRD_HEIGHT = 14;
const FLIGHT_CLEARANCE = 100;
const BRIDGE_MARGIN = 45;

export const RESIDENT_FILES = [...WALKERS, CYCLIST].flatMap((name) =>
  Array.from({ length: WALK_FRAME_COUNT }, (_, frame) => `${name}_f${frame}.svg`));

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
    const names = isWildlife
      ? [resident.name]
      : Array.from({ length: WALK_FRAME_COUNT }, (_, frame) => `${resident.name}_f${frame}`);
    const frames = names.map((name) => texture(`${name}.svg`));
    const artwork = manifest[names[0]];
    const animated = resident.kind === 'cyclist' || resident.kind === 'bird'
      ? makeAnimatedResident(resident.name, resident.kind === 'cyclist')
      : null;
    const height = { pedestrian: PEDESTRIAN_HEIGHT, cyclist: CYCLIST_HEIGHT, animal: ANIMAL_HEIGHT, bird: BIRD_HEIGHT }[resident.kind];
    const scale = height / artwork.height;
    let sprite: Node2D;
    let updateFrame: (time: number) => void;
    if (animated) {
      sprite = animated.node;
      updateFrame = (time) => animated.update(time + resident.start, resident.speed, scale);
    } else {
      const body = new Sprite2D(frames[0]);
      body.anchor.set(...artwork.anchor);
      sprite = body;
      updateFrame = (time) => {
        body.texture = frames[Math.floor(time * WALK_FRAMES_PER_SECOND + resident.start) % frames.length];
      };
    }
    (isWildlife ? wildlife : node).addChild(sprite);
    return { resident, sprite, scale, updateFrame };
  });
  let time = 0;
  const population: Population = {
    update(dt) {
      time += dt;
      for (const { resident, sprite, scale, updateFrame } of residents) {
        const { x, direction } = residentPosition(resident, time);
        sprite.position.set(x, resident.y);
        sprite.scale.set(direction * scale, scale);
        updateFrame(time);
      }
    },
  };
  population.update(0);
  return population;
}
