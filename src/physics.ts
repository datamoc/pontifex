// Moteur de pont : XPBD (position-based dynamics étendu), pas fixe, déterministe.
// Aucune dépendance au rendu ni au navigateur : testable avec `node --test`.
import { XpbdWorld, type XpbdNode, type XpbdLink } from '@datamoc/mwg/physics/xpbd';
import { MATERIALS, type LevelDef, type MaterialId } from './data.ts';

export interface StructNode { x: number; y: number; fixed: boolean }
export interface StructBeam { a: number; b: number; mat: MaterialId }
/** Ce que le joueur édite : données pures, sérialisables (annuler/rétablir, sauvegarde). */
export interface Structure { nodes: StructNode[]; beams: StructBeam[] }

export type SimStatus = 'running' | 'won' | 'failed';
export type SimEvent =
  | { type: 'break'; beam: number; x: number; y: number }
  | { type: 'crash'; x: number; y: number }
  | { type: 'splash'; x: number }
  | { type: 'win' };

type Link = XpbdLink & { mat: MaterialId; src: number };

export const GRAVITY = 520;
export const FRAME_DT = 1 / 60;
export const WHEEL_R = 5;
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
  // véhicule
  carX = 0; carY = 0; angle = 0;
  crashed = false;
  private vvy = 0; private vspin = 0; private splashed = false;
  private unsupported = 0;
  private wheelY: [number, number] = [0, 0];
  private wheelSupported: [boolean, boolean] = [true, true];

  constructor(level: LevelDef, s: Structure) {
    this.level = level;
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
    const v = this.level.vehicle;
    return [this.carX - v.width * 0.3, this.carX + v.width * 0.3];
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
    if (this.time <= SETTLE) { /* mise en équilibre : le véhicule attend */ }
    else if (!this.crashed) this.driveVehicle();
    else this.fallVehicle();

    this.world.damping = this.time < SETTLE ? 14 : 2.5;
    this.world.breaking = this.time > SETTLE * 0.5;
    this.world.step();
    const cur = this.world.peakRatio;
    this.curRatio = cur;
    if (this.time > SETTLE && !this.crashed) this.maxRatio = Math.max(this.maxRatio, cur);

    if (!this.crashed && this.carX >= this.level.x1 + this.level.vehicle.width) {
      this.status = 'won';
      this.events.push({ type: 'win' });
    }
    if (this.crashed && this.carY > this.level.waterY + 60) this.status = 'failed';
    if (this.time > 40) this.status = 'failed';
  }

  private driveVehicle(): void {
    const v = this.level.vehicle;
    this.carX += v.speed * FRAME_DT;
    const xs = this.wheelXs();
    const ys: [number, number] = [0, 0];
    let ok = true;
    for (let i = 0; i < 2; i++) {
      const x = xs[i];
      let y: number;
      if (x <= this.level.x0 || x >= this.level.x1) {
        y = this.level.deckY;
        this.wheelSupported[i] = true;
      } else {
        const c = this.contact(x, this.wheelY[i] || this.level.deckY);
        if (c) {
          y = c.y;
          this.wheelSupported[i] = true;
          // la masse de la roue se répartit sur les deux nœuds de la poutre
          const f = (v.mass / 2) * GRAVITY;
          this.world.applyForce(c.link.a, 0, f * (1 - c.t));
          this.world.applyForce(c.link.b, 0, f * c.t);
        } else {
          y = this.wheelY[i] || this.level.deckY;
          this.wheelSupported[i] = false;
          ok = false;
        }
      }
      ys[i] = y;
      this.wheelY[i] = y;
    }
    this.unsupported = ok ? 0 : this.unsupported + FRAME_DT;
    this.angle = Math.atan2(ys[1] - ys[0], xs[1] - xs[0]);
    this.carY = (ys[0] + ys[1]) / 2 - WHEEL_R;
    if (this.unsupported > 0.12) {
      this.crashed = true;
      this.vvy = 0; this.vspin = this.angle >= 0 ? 1.2 : -1.2;
      this.events.push({ type: 'crash', x: this.carX, y: this.carY });
    }
  }

  private fallVehicle(): void {
    this.vvy += GRAVITY * FRAME_DT;
    this.carY += this.vvy * FRAME_DT;
    this.carX += this.level.vehicle.speed * 0.4 * FRAME_DT;
    this.angle += this.vspin * FRAME_DT;
    if (!this.splashed && this.carY > this.level.waterY) {
      this.splashed = true;
      this.events.push({ type: 'splash', x: this.carX });
    }
  }

}
