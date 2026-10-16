// Moteur de pont : XPBD (position-based dynamics étendu), pas fixe, déterministe.
// Aucune dépendance au rendu ni au navigateur : testable avec `node --test`.
import { XpbdWorld, type XpbdNode, type XpbdLink } from '@datamoc/mwg/physics/xpbd';
import { MATERIALS, SHIPS, SHIP_DRAFT, type LevelDef, type MaterialId, type ShipType, type VehicleDef } from './data.ts';

export interface StructNode { x: number; y: number; fixed: boolean }
export interface StructBeam { a: number; b: number; mat: MaterialId }
/** Ce que le joueur édite : données pures, sérialisables (annuler/rétablir, sauvegarde). */
export interface Structure { nodes: StructNode[]; beams: StructBeam[] }

export type SimStatus = 'running' | 'won' | 'failed';
export type SimEvent =
  | { type: 'break'; beam: number; x: number; y: number }
  | { type: 'crash'; x: number; y: number }
  | { type: 'splash'; x: number }
  | { type: 'ship'; ship: ShipType; x: number }
  | { type: 'win' };

type Link = XpbdLink & { mat: MaterialId; src: number };

/** Un navire de passage : `x` est le centre de la coque, `sailing` vrai de son entrée dans le canal à sa sortie. */
export interface ShipState { type: ShipType; x: number; sailing: boolean; done: boolean }

/**
 * Longueur (0..1) du segment p→q à l'intérieur du rectangle, par découpage de Liang-Barsky ;
 * renvoie le milieu de la partie commune, ou null si le segment est hors du rectangle.
 */
function segmentInBox(p: { x: number; y: number }, q: { x: number; y: number }, x0: number, y0: number, x1: number, y1: number): { x: number; y: number } | null {
  let t0 = 0, t1 = 1;
  const dx = q.x - p.x, dy = q.y - p.y;
  for (const [pk, qk] of [[-dx, p.x - x0], [dx, x1 - p.x], [-dy, p.y - y0], [dy, y1 - p.y]]) {
    if (pk === 0) { if (qk < 0) return null; continue; }
    const r = qk / pk;
    if (pk < 0) { if (r > t1) return null; t0 = Math.max(t0, r); } else { if (r < t0) return null; t1 = Math.min(t1, r); }
  }
  const m = (t0 + t1) / 2;
  return { x: p.x + m * dx, y: p.y + m * dy };
}

export const GRAVITY = 520;
export const FRAME_DT = 1 / 60;
export const WHEEL_R = 5;
/** échelle du monde : 1 m = 10 px */
export const PIXELS_PER_METRE = 10;
export const MAX_SPEED_KMH = 50;
/** accélération maximale que permet l'adhérence, à l'arrêt ou à très basse vitesse (km/h par seconde) */
export const TRACTION_ACCELERATION_KMH_S = 20;
const MAX_SPEED = MAX_SPEED_KMH / 3.6 * PIXELS_PER_METRE;
/** gravité du véhicule (px/s²), distincte de celle de la structure */
const VEHICLE_GRAVITY = 9.81 * PIXELS_PER_METRE;

/**
 * Accélération du moteur (km/h par seconde) : puissance constante calée sur le 0 à 100 km/h
 * (a = 5000 / (t100 · v)), plafonnée par l'adhérence.
 */
export function vehicleAccelerationKmhS(vehicle: VehicleDef, speedKmh: number): number {
  const v = Math.abs(speedKmh);
  if (v < 1e-9) return TRACTION_ACCELERATION_KMH_S;
  return Math.min(TRACTION_ACCELERATION_KMH_S, 5000 / (vehicle.zeroTo100 * v));
}
/** durée pendant laquelle la structure s'installe sous son propre poids, avant que le véhicule parte */
export const SETTLE = 1.2;

export function beamLength(s: Structure, b: StructBeam): number {
  const p = s.nodes[b.a], q = s.nodes[b.b];
  return Math.hypot(p.x - q.x, p.y - q.y);
}

export function structureCost(s: Structure): number {
  let c = 0;
  for (const b of s.beams) c += (beamLength(s, b) / 10) * MATERIALS[b.mat].cost;
  return c;
}

export class BridgeSim {
  readonly level: LevelDef;
  private world = new XpbdWorld({ gravity: GRAVITY, step: FRAME_DT });
  bodies: XpbdNode[] = this.world.nodes;
  links: Link[] = [];
  status: SimStatus = 'running';
  time = 0;
  maxRatio = 0;
  /** ratio d'effort le plus élevé à l'instant (pour la jauge) */
  curRatio = 0;
  events: SimEvent[] = [];
  /** un navire par événement `ship` du niveau, dans l'ordre */
  readonly ships: ShipState[];
  // véhicule
  carX = 0; carY = 0; angle = 0;
  /** vitesse le long de la route (px/s) et distance parcourue le long de la route (px) */
  carSpeed = 0;
  distance = 0;
  get speedKmh(): number { return Math.abs(this.carSpeed) / PIXELS_PER_METRE * 3.6; }
  crashed = false;
  private vx = 0; private vvy = 0; private vspin = 0; private splashed = false;
  private grounded = true;

  constructor(level: LevelDef, s: Structure) {
    this.level = level;
    // chaque navire attend caché dans la roche de la rive gauche, étrave au bord du canal
    this.ships = level.events.map((e) => ({ type: e.shipType, x: level.x0 - SHIPS[e.shipType].width / 2, sailing: false, done: false }));
    for (const n of s.nodes) this.world.addNode({ ...n, mass: 0.5 });
    s.beams.forEach((b, i) => {
      const m = MATERIALS[b.mat];
      const rest = beamLength(s, b);
      const index = this.world.addLink({ a: b.a, b: b.b, rest, mass: rest * m.density,
        stiffness: m.stiffness, strength: m.strength, tensionStrength: m.tensionStrength, tensionOnly: m.tensionOnly });
      const link = Object.assign(this.world.links[index], { mat: b.mat, src: i });
      this.links.push(link);
    });
    this.world.onBreak.add(({ link, x, y }) => {
      this.events.push({ type: 'break', beam: this.links[link].src, x, y });
    });
    this.carX = level.x0 - level.vehicle.width;
    this.carY = level.deckY - WHEEL_R;
  }

  private wheelXs(): [number, number] {
    const halfBase = this.level.vehicle.width * 0.3 * Math.cos(this.angle);
    return [this.carX - halfBase, this.carX + halfBase];
  }

  /** Au moins une roue touche la route (berge ou chaussée) : le moteur peut agir. */
  private hasTraction(): boolean {
    return this.wheelXs().some((x, i) => {
      const offset = (i === 0 ? -1 : 1) * this.level.vehicle.width * 0.3;
      const y = this.carY + WHEEL_R + Math.sin(this.angle) * offset;
      const bank = x <= this.level.x0 || x >= this.level.x1;
      const roadY = bank ? this.level.deckY : this.contact(x, y)?.y;
      return roadY !== undefined && Math.abs(roadY - y) <= 0.5;
    });
  }

  /** Cherche la poutre de chaussée sous une roue ; renvoie son index, t et y de contact. */
  private contact(x: number, refY: number): { link: Link; t: number; y: number } | null {
    let best: { link: Link; t: number; y: number } | null = null;
    let bestD = Infinity;
    for (const l of this.links) {
      if (l.broken || !MATERIALS[l.mat].isRoad) continue;
      const p = this.bodies[l.a], q = this.bodies[l.b];
      const lo = Math.min(p.x, q.x), hi = Math.max(p.x, q.x);
      if (x < lo || x > hi || hi - lo < 1e-6) continue;
      const t = (x - p.x) / (q.x - p.x);
      const y = p.y + t * (q.y - p.y);
      const d = Math.abs(y - refY);
      if (d < bestD) { bestD = d; best = { link: l, t, y }; }
    }
    return best;
  }

  /** Avance d'un pas de FRAME_DT. */
  step(): void {
    if (this.status !== 'running') return;
    this.time += FRAME_DT;
    this.sailShips();
    if (this.time <= SETTLE) { /* mise en équilibre : le véhicule attend */ }
    else if (!this.crashed) this.driveVehicle();
    else this.fallVehicle();

    this.world.damping = this.time < SETTLE ? 14 : 2.5;
    this.world.breaking = this.time > SETTLE * 0.5;
    this.world.step();
    const cur = this.world.peakRatio;
    this.curRatio = cur;
    if (this.time > SETTLE && !this.crashed) this.maxRatio = Math.max(this.maxRatio, cur);

    if (!this.crashed && this.grounded && this.carX >= this.level.x1 + this.level.vehicle.width) {
      this.status = 'won';
      this.events.push({ type: 'win' });
    }
    if (this.crashed && this.carY > this.level.waterY + 60) this.status = 'failed';
    if (this.time > 40) this.status = 'failed';
  }

  /** Lance les navires à l'heure dite ; tout ce qui pénètre dans le gabarit d'un navire en marche casse. */
  private sailShips(): void {
    this.level.events.forEach((event, i) => {
      const ship = this.ships[i], def = SHIPS[ship.type];
      if (ship.done || this.time < event.time) return;
      if (!ship.sailing) {
        ship.sailing = true;
        this.events.push({ type: 'ship', ship: ship.type, x: ship.x });
      }
      ship.x += def.speed * FRAME_DT;
      const left = ship.x - def.width / 2, right = ship.x + def.width / 2;
      const top = this.level.waterY - def.height, bottom = this.level.waterY + SHIP_DRAFT;
      this.links.forEach((link, index) => {
        if (link.broken) return;
        const hit = segmentInBox(this.bodies[link.a], this.bodies[link.b], left, top, right, bottom);
        if (!hit) return;
        link.broken = true;
        this.world.onBreak.dispatch({ link: index, x: hit.x, y: hit.y });
      });
      if (left > this.level.x1) { ship.sailing = false; ship.done = true; }
    });
  }

  private driveVehicle(): void {
    const v = this.level.vehicle;
    this.grounded = this.hasTraction();
    if (this.grounded) {
      // moteur à puissance constante + composante de la pesanteur le long de la pente
      const motor = vehicleAccelerationKmhS(v, this.speedKmh) / 3.6 * PIXELS_PER_METRE;
      const acceleration = motor + VEHICLE_GRAVITY * Math.sin(this.angle);
      const previousSpeed = this.carSpeed;
      this.carSpeed = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, this.carSpeed + acceleration * FRAME_DT));
      const travel = (previousSpeed + this.carSpeed) * 0.5 * FRAME_DT;
      this.distance += travel;
      this.vx = this.carSpeed * Math.cos(this.angle);
      this.carX += travel * Math.cos(this.angle);
    } else {
      // en l'air : l'élan horizontal est conservé, aucune action du moteur
      this.carX += this.vx * FRAME_DT;
      this.distance += this.carSpeed * FRAME_DT;
    }
    const oldY = this.carY;
    const oldAngle = this.angle;
    const halfBase = v.width * 0.3;
    this.vvy += VEHICLE_GRAVITY * FRAME_DT;
    const predictedY = oldY + this.vvy * FRAME_DT;
    const predictedAngle = oldAngle + this.vspin * FRAME_DT;
    const xs = this.wheelXs();
    const ys: number[] = [];
    const contacts: ({ link: Link; t: number; y: number } | null)[] = [];
    let supported = 0;
    for (let i = 0; i < 2; i++) {
      const offset = i === 0 ? -halfBase : halfBase;
      const previous = oldY + WHEEL_R + Math.sin(oldAngle) * offset;
      const predicted = predictedY + WHEEL_R + Math.sin(predictedAngle) * offset;
      const x = xs[i];
      const bank = x <= this.level.x0 || x >= this.level.x1;
      const c = bank ? null : this.contact(x, previous);
      const roadY = bank ? this.level.deckY : c?.y;
      const reach = this.grounded ? 3 : 0.5;
      if (roadY !== undefined && previous <= roadY + reach && predicted >= roadY - reach) {
        ys[i] = roadY;
        contacts[i] = c;
        supported++;
      } else {
        ys[i] = predicted;
        contacts[i] = null;
      }
    }
    this.grounded = supported > 0;
    if (supported) {
      this.carY = (ys[0] + ys[1]) / 2 - WHEEL_R;
      this.angle = Math.asin(Math.max(-1, Math.min(1, (ys[1] - ys[0]) / (2 * halfBase))));
      this.vvy = (this.carY - oldY) / FRAME_DT;
      this.vspin = (this.angle - oldAngle) / FRAME_DT;
      for (const c of contacts) if (c) {
        // la masse du véhicule se répartit sur les roues portantes, puis sur les deux nœuds de la poutre
        const f = v.mass / supported * GRAVITY;
        this.world.applyForce(c.link.a, 0, f * (1 - c.t));
        this.world.applyForce(c.link.b, 0, f * c.t);
      }
    } else {
      this.carY = predictedY;
      this.angle = predictedAngle;
    }
    if (this.carY > this.level.deckY + v.width * 2 || Math.abs(this.angle) > 1.2) {
      this.crashed = true;
      this.events.push({ type: 'crash', x: this.carX, y: this.carY });
    }
  }

  private fallVehicle(): void {
    this.vvy += VEHICLE_GRAVITY * FRAME_DT;
    this.carY += this.vvy * FRAME_DT;
    this.carX += this.vx * FRAME_DT;
    this.angle += this.vspin * FRAME_DT;
    if (!this.splashed && this.carY > this.level.waterY) {
      this.splashed = true;
      this.events.push({ type: 'splash', x: this.carX });
    }
  }
}
