// Opérations d'édition sur une Structure, sans rendu : accrochage sur câble porteur, nettoyage.
import { GRID, type Pt } from './data.ts';
import type { Structure } from './physics.ts';

export interface RopeHit { beam: number; pos: Pt }

/** Point d'un câble porteur le plus proche de `p` (à `tol` px près), hors voisinage immédiat d'un nœud. */
export function ropeHit(s: Structure, p: Pt, tol = 10, nodeTol = 14): RopeHit | null {
  let best: RopeHit | null = null, bd = tol;
  s.beams.forEach((b, i) => {
    if (b.mat !== 'rope') return;
    const v = s.nodes[b.a], w = s.nodes[b.b];
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return;
    const t = Math.max(0, Math.min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
    const pos = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    const d = Math.hypot(p.x - pos.x, p.y - pos.y);
    if (d < bd && Math.hypot(pos.x - v.x, pos.y - v.y) > nodeTol && Math.hypot(pos.x - w.x, pos.y - w.y) > nodeTol) { bd = d; best = { beam: i, pos }; }
  });
  return best;
}

/** Distance de `p` au segment [from, to]. */
export function distToSegment(p: Pt, from: Pt, to: Pt): number {
  const lengthSquared = (from.x - to.x) ** 2 + (from.y - to.y) ** 2;
  if (lengthSquared === 0) return Math.hypot(p.x - from.x, p.y - from.y);
  const t = Math.max(0, Math.min(1, ((p.x - from.x) * (to.x - from.x) + (p.y - from.y) * (to.y - from.y)) / lengthSquared));
  return Math.hypot(p.x - (from.x + t * (to.x - from.x)), p.y - (from.y + t * (to.y - from.y)));
}

/** Index de la poutre la plus proche de `p` (strictement à moins de `tolerance` px), ou -1. */
export function beamNear(s: Structure, p: Pt, tolerance = 9): number {
  let best = -1, bestDistance = tolerance;
  s.beams.forEach((beam, index) => {
    const distance = distToSegment(p, s.nodes[beam.a], s.nodes[beam.b]);
    if (distance < bestDistance) { bestDistance = distance; best = index; }
  });
  return best;
}

/** Vrai si une poutre relie déjà ces deux nœuds, quel que soit le sens. */
export function beamExists(s: Structure, a: number, b: number): boolean {
  return s.beams.some((beam) => (beam.a === a && beam.b === b) || (beam.a === b && beam.b === a));
}

/** Point de grille le plus proche, ou simple arrondi à l'entier quand l'aimantation est coupée. */
export function snapPoint(p: Pt, gridOn: boolean): Pt {
  if (!gridOn) return { x: Math.round(p.x), y: Math.round(p.y) };
  return { x: Math.round(p.x / GRID) * GRID, y: Math.round(p.y / GRID) * GRID };
}

/** Index du nœud le plus proche de `p` (à `r` px près, strictement), ou -1. */
export function nearestNode(nodes: readonly { x: number; y: number }[], p: Pt, r: number): number {
  let best = -1, bd = r;
  nodes.forEach((n, i) => { const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = i; } });
  return best;
}

/** Chaînage : un clic à portée (`maxLen`) du dernier point repart de celui-ci, sinon il recommence ailleurs. */
export function chainStart(chain: Pt | null, click: Pt, maxLen: number): Pt | null {
  if (!chain) return null;
  return Math.hypot(click.x - chain.x, click.y - chain.y) <= maxLen ? chain : null;
}

/** Coupe une poutre en deux au point `pos` (nouveau nœud libre) ; renvoie l'index du nœud. */
export function splitBeam(s: Structure, beam: number, pos: Pt): number {
  const b = s.beams[beam];
  s.nodes.push({ x: pos.x, y: pos.y, fixed: false });
  const n = s.nodes.length - 1;
  s.beams[beam] = { a: b.a, b: n, mat: b.mat };
  s.beams.push({ a: n, b: b.b, mat: b.mat });
  return n;
}

/** Retire les nœuds libres sans poutre et renumérote. */
export function prune(s: Structure): Structure {
  const used = new Set<number>();
  for (const b of s.beams) { used.add(b.a); used.add(b.b); }
  const map = new Map<number, number>();
  const nodes = s.nodes.filter((n, i) => { const keep = n.fixed || used.has(i); if (keep) map.set(i, map.size); return keep; });
  return { nodes, beams: s.beams.map((b) => ({ ...b, a: map.get(b.a)!, b: map.get(b.b)! })) };
}

export const allowed = (level: { materials: readonly string[] }, mat: string): boolean => level.materials.includes(mat);
