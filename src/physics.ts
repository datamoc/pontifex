// Moteur de pont : XPBD (position-based dynamics étendu), pas fixe, déterministe.
// Aucune dépendance au rendu ni au navigateur : testable avec `node --test`.
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

interface Body { x: number; y: number; x0: number; y0: number; vx: number; vy: number; w: number; fixed: boolean; fx: number; fy: number }
interface Link { a: number; b: number; mat: MaterialId; rest: number; broken: boolean; lambda: number; ratio: number; force: number; forceAcc: number; src: number }

export const GRAVITY = 520;
export const FRAME_DT = 1 / 60;
const SUBSTEPS = 16;
const ITER = 2;
const WHEEL_R = 5;
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
  bodies: Body[] = [];
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
    this.bodies = s.nodes.map((n) => ({ x: n.x, y: n.y, x0: n.x, y0: n.y, vx: 0, vy: 0, w: 0, fixed: n.fixed, fx: 0, fy: 0 }));
    const mass = new Array(s.nodes.length).fill(0.5);
    s.beams.forEach((b, i) => {
      const m = MATERIALS[b.mat];
      const rest = beamLength(s, b);
      this.links.push({ a: b.a, b: b.b, mat: b.mat, rest, broken: false, lambda: 0, ratio: 0, force: 0, forceAcc: 0, src: i });
      mass[b.a] += (rest * m.density) / 2;
      mass[b.b] += (rest * m.density) / 2;
    });
    this.bodies.forEach((p, i) => { p.w = p.fixed ? 0 : 1 / mass[i]; });
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
    const dt = FRAME_DT / SUBSTEPS;
    this.time += FRAME_DT;
    for (const p of this.bodies) { p.fx = 0; p.fy = 0; }
    for (const l of this.links) l.forceAcc = 0;
    if (this.time <= SETTLE) { /* mise en équilibre : le véhicule attend */ }
    else if (!this.crashed) this.driveVehicle();
    else this.fallVehicle();

    for (let s = 0; s < SUBSTEPS; s++) this.substep(dt);

    // efforts : moyenne sur les sous-pas, lissage, rupture
    for (const l of this.links) l.force = l.forceAcc / SUBSTEPS;
    const k = 1 - Math.exp(-FRAME_DT / 0.06);
    let cur = 0;
    for (const l of this.links) {
      if (l.broken) continue;
      const m = MATERIALS[l.mat];
      const inst = Math.abs(l.force) / m.strength;
      l.ratio += (inst - l.ratio) * k;
      cur = Math.max(cur, l.ratio);
      if (l.ratio > 1 && this.time > SETTLE * 0.5) {
        l.broken = true;
        const p = this.bodies[l.a], q = this.bodies[l.b];
        this.events.push({ type: 'break', beam: l.src, x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
      }
    }
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
          const p = this.bodies[c.link.a], q = this.bodies[c.link.b];
          p.fy += f * (1 - c.t);
          q.fy += f * c.t;
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

  private substep(dt: number): void {
    const damp = Math.exp(-(this.time < SETTLE ? 14 : 2.5) * dt);
    for (const p of this.bodies) {
      if (p.fixed) continue;
      p.vx = (p.vx + p.fx * p.w * dt) * damp;
      p.vy = (p.vy + (p.fy * p.w + GRAVITY) * dt) * damp;
      p.x0 = p.x; p.y0 = p.y;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (const l of this.links) l.lambda = 0;
    for (let it = 0; it < ITER; it++) {
      for (const l of this.links) {
        if (l.broken) continue;
        const p = this.bodies[l.a], q = this.bodies[l.b];
        const w = p.w + q.w;
        if (w === 0) continue;
        const dx = q.x - p.x, dy = q.y - p.y;
        const len = Math.hypot(dx, dy) || 1e-9;
        const m = MATERIALS[l.mat];
        const c = len - l.rest;
        if (m.tensionOnly && c < 0 && l.lambda >= 0) continue;
        const alpha = l.rest / m.stiffness / (dt * dt);
        const dl = (-c - alpha * l.lambda) / (w + alpha);
        l.lambda += dl;
        const nx = dx / len, ny = dy / len;
        p.x -= p.w * dl * nx; p.y -= p.w * dl * ny;
        q.x += q.w * dl * nx; q.y += q.w * dl * ny;
      }
    }
    for (const p of this.bodies) {
      if (p.fixed) continue;
      p.vx = (p.x - p.x0) / dt; p.vy = (p.y - p.y0) / dt;
    }
    for (const l of this.links) l.forceAcc += -l.lambda / (dt * dt);
  }
}
