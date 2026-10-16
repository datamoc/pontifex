import { loadCyclistSkeleton } from './skeletal-cyclist.ts';
import { loadWalkerSkeletons } from './skeletal-walkers.ts';
import { loadResidentAnimations } from './resident-animation.ts';
import { RESIDENT_FILES } from './population.ts';
// Graphismes 100 % SVG (voir assets/) : mwgPage compile les fichiers dans la page, et leur
// texte source passe par loadSvgParts (@datamoc/mwg/assets) pour
// fabriquer les textures — un véhicule est découpé en ses groupes <g> (roues, capot, moteur)
// et devient ainsi animable, sans planche de sprites ni image bitmap dans le dépôt.
import { get, load, loadSvgParts, texture } from '@datamoc/mwg/assets';
import type { Texture2D } from '@datamoc/mwg/two-d/render';
import { Node2D, Sprite2D } from '@datamoc/mwg/two-d';
import { Random } from '@datamoc/mwg/core';
import { SHIPS, type LevelDef, type VehicleDef } from './data.ts';
import type { BridgeSim } from './physics.ts';
import { BIOME_FILES, type Biome } from './biomes.ts';

/** rasterisation des SVG à 2× leur taille d'origine : la caméra cadre chaque niveau, le trait reste net */
const RES = 2;
/** dossier des assets runtime dans assets/ (les SVG ont déménagé sous common/ avec les biomes) */
const DIR = 'common';
const MAX_DECOR_HEIGHT = 130;
const MAX_DECOR_WIDTH = 140;
/** véhicules : découpés en groupes à l'import, pour animer roues et capot */
const VEHICLES = ['car.svg', 'jeep.svg', 'truck.svg'].map((f) => `${DIR}/${f}`);
/** décor et effets : chargés tels quels */
const SCENERY = [
  'tree_round.svg', 'tree_fir.svg', 'bush.svg', 'rock1.svg', 'rock2.svg', 'rock3.svg',
  'cloud1.svg', 'cloud2.svg', 'explosion.svg', 'flame.svg',
  'ship_small.svg', 'ship_medium.svg', 'ship_large.svg', // Nouveaux sprites pour les navires
].map((f) => `${DIR}/${f}`);

const UI_FILES = [
  'mat_road', 'mat_wood', 'mat_steel', 'mat_rope', 'mat_cable', 'icon_concrete', 'icon_hydraulics',
  'tool_delete', 'tool_undo', 'tool_redo', 'tool_clear', 'speed_slow', 'speed_real',
  'grid_on', 'grid_off', 'sound_on', 'sound_off', 'music', 'music_play', 'music_pause',
  'music_next', 'fullscreen_enter', 'fullscreen_exit', 'editor', 'sim_play', 'sim_stop',
].map((name) => `ui/${name}.svg`);

const vehicleParts = new Map<string, Readonly<Record<string, Texture2D>>>();

export interface WheelArt { group: string; at: [number, number] }
export interface ArtDef {
  file: string;
  width: number;
  height: number;
  /** ancrage décoratif (bas du dessin = sol) */
  anchor: [number, number];
  /** véhicules seulement : empattement dessiné, point d'attelage, rayon des roues */
  wheelbase?: number;
  pivot?: [number, number];
  wheelRadius?: number;
  wheels?: WheelArt[];
  hood?: { pivot: [number, number]; openAngle: number };
}

let art: Record<string, ArtDef> | null = null;
/** groupes de chaque véhicule, dans l'ordre du dessin (l'ordre donne la profondeur) */
const groupsOf = new Map<string, string[]>();

const artOf = (name: string): ArtDef => {
  const a = art?.[name];
  if (!a) throw new Error(`assets : "${name}" absent de assets/manifest.json`);
  return a;
};

export type VehicleArt = ArtDef & Required<Pick<ArtDef, 'wheelbase' | 'pivot' | 'wheelRadius' | 'wheels'>>;
const vehicleArtOf = (name: string): VehicleArt => {
  const a = artOf(name);
  if (a.pivot === undefined || a.wheelbase === undefined || a.wheelRadius === undefined || !a.wheels)
    throw new Error(`assets/manifest.json : le véhicule "${name}" manque de pivot, d'empattement ou de roues`);
  return a as VehicleArt;
};

export async function loadArt(): Promise<void> {
  await load(['manifest.json', ...SCENERY, ...UI_FILES, ...BIOME_FILES, ...RESIDENT_FILES], { resolution: RES });
  art = get<Record<string, ArtDef>>('manifest.json');
  for (const file of VEHICLES) {
    const parts = await loadSvgParts(file, { resolution: RES });
    vehicleParts.set(file, parts);
    groupsOf.set(file, Object.keys(parts));
  }
  await loadResidentAnimations();
  await loadWalkerSkeletons();
  await loadCyclistSkeleton();
}

export type CarState = 'idle' | 'ride' | 'destroyed';

const SPRITE_OF: Record<VehicleDef['sprite'] | 'ship_small' | 'ship_medium' | 'ship_large', string> = {
  citadine: 'car',
  jeep1: 'jeep',
  jeep2: 'truck',
  train: 'train',
  bike: 'bicycle',
  bus: 'bus',
  boat: 'boat',
  ship_small: 'ship_small',
  ship_medium: 'ship_medium',
  ship_large: 'ship_large'
};

/**
 * Un véhicule recomposé depuis les groupes de son SVG : le point d'attelage (milieu de
 * l'empattement, hauteur des essieux) est à l'origine, donc `position = (sim.carX, sim.carY)`
 * et `rotation = sim.angle` suffent à le poser sur la chaussée.
 */
export class Vehicle extends Node2D {
  private readonly art: VehicleArt;
  /** échelle du dessin : l'empattement du SVG devient l'empattement de la physique */
  private readonly k: number;
  private readonly wheels: Sprite2D[] = [];
  private readonly hood: Sprite2D | null = null;
  private readonly flame: Sprite2D;
  private readonly flameScale: number;
  private readonly blast: Sprite2D;
  private readonly blastScale: number;
  private state: CarState = 'idle';
  private t = 0;
  private hoodT = 0;

  constructor(def: VehicleDef) {
    super();
    const a = vehicleArtOf(SPRITE_OF[def.sprite]);
    this.art = a;
    this.k = (0.6 * def.width) / a.wheelbase;

    const wheelGroups = new Set(a.wheels.map((w) => w.group));
    for (const w of a.wheels) {
      const sp = new Sprite2D(vehicleParts.get(a.file)![w.group]);
      // dessin à sa place dans le SVG, pivot au moyeu : la roue tourne sur elle-même
      sp.anchor.set(0);
      sp.pivot.set(w.at[0], w.at[1]);
      sp.position.set(w.at[0], w.at[1]);
      this.wheels.push(sp);
      this.addChild(sp);
    }
    for (const group of groupsOf.get(a.file) ?? []) {
      if (wheelGroups.has(group)) continue;
      const sp = new Sprite2D(vehicleParts.get(a.file)![group]);
      sp.anchor.set(0);
      if (group === 'hood' && a.hood) {
        sp.pivot.set(a.hood.pivot[0], a.hood.pivot[1]);
        sp.position.set(a.hood.pivot[0], a.hood.pivot[1]);
        this.hood = sp;
      }
      this.addChild(sp);
    }

    const at = a.hood?.pivot ?? [a.width * 0.5, a.height * 0.5];
    this.flameScale = (a.height * 0.5) / 70; // flame.svg fait 70 px de haut
    this.flame = new Sprite2D(texture(`${DIR}/flame.svg`));
    this.flame.anchor.set(0.5, 1);
    this.flame.position.set(at[0] + 3, at[1] - 1);
    this.flame.scale.set(this.flameScale);
    this.flame.visible = false;
    this.blastScale = (a.height * 1.5) / 140; // explosion.svg fait 140 px de côté
    this.blast = new Sprite2D(texture(`${DIR}/explosion.svg`));
    this.blast.anchor.set(0.5, 0.5);
    this.blast.position.set(at[0] + 6, at[1]);
    this.blast.scale.set(this.blastScale * 0.4);
    this.blast.visible = false;
    this.addChild(this.flame, this.blast);

    this.pivot.set(a.pivot[0], a.pivot[1]);
    this.scale.set(this.k);
  }

  setState(state: CarState): void {
    if (this.state === state) return;
    this.state = state;
    this.t = 0;
    this.flame.visible = state === 'destroyed';
    this.blast.visible = state === 'destroyed';
    if (state === 'destroyed') { this.blast.alpha = 1; this.blast.scale.set(this.blastScale * 0.4); }
  }

  update(dt: number, distance = 0): void {
    this.t += dt;
    if (this.state === 'ride') {
      // roulement sans glissement : longueur d'arc parcourue / rayon de la roue
      const roll = distance / (this.art.wheelRadius * this.k);
      for (const w of this.wheels) w.rotation += roll;
    }
    const target = this.state === 'destroyed' ? 1 : 0;
    this.hoodT += (target - this.hoodT) * Math.min(1, dt * 12);
    if (this.hood && this.art.hood) this.hood.rotation = ((this.art.hood.openAngle * Math.PI) / 180) * this.hoodT;
    if (this.flame.visible) {
      this.flame.scale.set(this.flameScale * (1 + Math.sin(this.t * 17) * 0.08), this.flameScale * (1 + Math.sin(this.t * 24) * 0.15));
      this.flame.x = (this.art.hood?.pivot[0] ?? this.art.width / 2) + 3 + Math.sin(this.t * 9) * 0.8;
    }
    if (this.blast.visible) {
      const p = Math.min(1, this.t / 0.45);
      this.blast.scale.set(this.blastScale * (0.35 + p * 1.5));
      this.blast.alpha = 1 - p * p;
      if (p >= 1) this.blast.visible = false;
    }
  }
}

export function makeVehicle(def: VehicleDef): Vehicle {
  return new Vehicle(def);
}

export interface Fleet { update(sim: BridgeSim | null, time: number): void }

/**
 * Les navires du niveau (un sprite par événement `ship`), invisibles tant qu'ils n'ont pas
 * pris la mer. Ils sont posés sur la ligne d'eau, derrière les falaises : ils émergent de la roche.
 */
export function buildFleet(level: LevelDef, node: Node2D): Fleet {
  node.removeChildren().forEach((child) => child.destroy());
  const sprites = level.events.map((event) => {
    const def = SHIPS[event.shipType];
    const sprite = new Sprite2D(texture(`${DIR}/${def.sprite}.svg`));
    sprite.anchor.set(...artOf(`${DIR}/${def.sprite}`).anchor);
    // la texture est rastérisée à RES× : on dimensionne d'après sa largeur réelle, pour obtenir def.width en px monde
    sprite.scale.set(def.width / sprite.width);
    sprite.visible = false;
    node.addChild(sprite);
    return sprite;
  });
  return {
    update(sim, time) {
      sprites.forEach((sprite, i) => {
        const ship = sim?.ships[i];
        sprite.visible = !!ship?.sailing;
        if (!ship?.sailing) return;
        // houle : léger tangage et ballant, uniquement visuel (le gabarit physique reste fixe)
        sprite.position.set(ship.x, level.waterY + 4 + Math.sin(time * 1.7 + i * 2) * 1.5);
        sprite.rotation = Math.sin(time * 1.3 + i) * 0.015;
      });
    },
  };
}

const TREES = ['tree_round', 'tree_fir'];
const BUSHES = ['bush'];
const ROCKS = ['rock1', 'rock2', 'rock3'];
const CLOUDS = ['cloud1', 'cloud2'];

export interface DecorItem { name: string; x: number; y: number; scale: number; flip: boolean }

/**
 * Placement déterministe du décor sur les deux rives (sans rendu).
 * `y` est la base de l'élément : plantée au niveau ou sous le haut de la chaussée
 * (`deckY - 5`), jamais en l'air. L'approche immédiate du pont reste libre.
 */
export function decorLayout(level: LevelDef, biome?: Biome): DecorItem[] {
  const ground = level.deckY - 5; // haut de la chaussée sur les rives
  // Les biomes ont une base au sol : les enfoncer masque notamment les blocs de glace.
  const vegetationY = ground + (biome ? 0 : 3);
  const rocksY = ground + (biome ? 0 : 4);
  const gen = new Random.Generator(level.id * 7919 + 13);
  const pick = <T>(a: readonly T[]): T => a[gen.int(a.length)];
  const items: DecorItem[] = [];
  const side = (from: number, to: number) => {
    // Plusieurs tailles et espacements évitent un alignement uniforme du décor.
    for (let x = from; x < to; x += 40 + gen.float() * 50) items.push({ name: pick(biome?.scenery ?? TREES), x, y: vegetationY, scale: 0.34 + gen.float() * 0.2, flip: gen.float() < 0.5 });
    for (let x = from + 30; x < to; x += 55 + gen.float() * 60) items.push({ name: pick(biome?.scenery ?? BUSHES), x, y: vegetationY, scale: 0.5 + gen.float() * 0.3, flip: gen.float() < 0.5 });
    for (let x = from + 50; x < to; x += 220 + gen.float() * 150) items.push({ name: pick(biome?.scenery ?? ROCKS), x, y: rocksY, scale: 0.4 + gen.float() * 0.3, flip: false });
  };
  side(-650, level.x0 - 95);
  side(level.x1 + 95, 1450);
  return items;
}

/** Décor du biome posé sur les rives, à distance de la zone de construction. */
export function buildDecor(level: LevelDef, node: Node2D, biome?: Biome): void {
  node.removeChildren().forEach((c) => c.destroy());
  for (const scenery of decorLayout(level, biome)) {
    const file = `${biome?.id ?? DIR}/${scenery.name}.svg`;
    const sp = new Sprite2D(texture(file));
    const artwork = biome ? artOf(`${biome.id}/${scenery.name}`) : artOf(scenery.name);
    const scale = biome ? scenery.scale * Math.min(1, MAX_DECOR_HEIGHT / artwork.height, MAX_DECOR_WIDTH / artwork.width) : scenery.scale;
    sp.anchor.set(...artwork.anchor);
    sp.position.set(scenery.x, scenery.y);
    sp.scale.set(scenery.flip ? -scale : scale, scale);
    node.addChild(sp);
  }
}

/** Fonds raccordables du biome, du relief lointain aux silhouettes proches. */
export function buildLandscape(level: LevelDef, node: Node2D, biome: Biome): void {
  node.removeChildren().forEach((child) => child.destroy());
  const planes = [
    { name: 'bg_far', offsetY: -30, alpha: 0.65 },
    { name: 'bg_mid', offsetY: -10, alpha: 0.8 },
    { name: 'bg_near', offsetY: 15, alpha: 1 },
  ];
  for (const plane of planes) {
    const name = `${biome.id}/${plane.name}`;
    const artwork = artOf(name);
    for (let x = -artwork.width; x < 1500; x += artwork.width) {
      const sprite = new Sprite2D(texture(`${name}.svg`));
      sprite.anchor.set(0, 1);
      sprite.position.set(x, level.deckY + plane.offsetY);
      sprite.alpha = plane.alpha;
      node.addChild(sprite);
    }
  }
}

export interface Clouds { update(dt: number): void }
export function buildClouds(node: Node2D, seed: number): Clouds {
  node.removeChildren().forEach((c) => c.destroy());
  const gen = new Random.Generator(seed);
  const items: { sp: Sprite2D; v: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const sp = new Sprite2D(texture(`${DIR}/${CLOUDS[i % CLOUDS.length]}.svg`));
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
