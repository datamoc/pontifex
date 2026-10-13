// Opérations d'édition sur une Structure, sans rendu : accrochage sur câble porteur, nettoyage.
import type { Pt } from './data.ts';
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
