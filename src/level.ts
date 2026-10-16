// Niveaux = données. `LevelSpec` est le format compact (JSON) que l'éditeur produit, importe et exporte ;
// `deriveLevel` en tire tout ce que le jeu utilise (falaises, îlots, pylônes, cadrage).
import { CARS, GRID, MATERIALS, MATERIAL_ORDER, SHIPS, WORLD_H, WORLD_W, type LevelDef, type LevelEvent, type MaterialId, type Pt } from './data.ts';
import type { Structure } from './physics.ts';

export type CarId = keyof typeof CARS;

export interface LevelSpec {
  id: number;
  label: string;
  name: string;
  hint: string;
  budget: number;
  materials: MaterialId[];
  car: CarId;
  x0: number;
  x1: number;
  deckY: number;
  waterY: number;
  anchors: Pt[];
  /** pylônes : le point d'ancrage au sommet est dans `anchors` */
  towers: { x: number; top: number }[];
  /** îlots : `top` = surface ; le point d'ancrage est dans `anchors` */
  islands: { x: number; top: number }[];
  view?: { x: number; y: number; w: number; h: number };
  /** navires de passage (au plus 10) */
  events?: LevelEvent[];
  /** pont de référence validé par l'auteur (niveaux personnalisés) */
  solution?: Structure;
}

export const ISLAND_HALF = 30;
const BOTTOM = WORLD_H;

/** Cadrage serré pour un petit gouffre, sauf si quelque chose (pylône, ancrage haut) en sortirait. */
function autoView(spec: LevelSpec, gap: number): LevelDef['view'] {
  if (gap > 240) return undefined;
  const v = { x: (spec.x0 + spec.x1) / 2 - 210, y: spec.deckY - 150, w: 420, h: 290 };
  const inside = (p: Pt) => p.x >= v.x && p.x <= v.x + v.w && p.y >= v.y && p.y <= v.y + v.h;
  return spec.anchors.every(inside) && spec.towers.every((t) => inside({ x: t.x, y: t.top })) && spec.waterY <= v.y + v.h ? v : undefined;
}

export function deriveLevel(spec: LevelSpec): LevelDef {
  const { x0, x1, deckY } = spec;
  const islands = spec.islands.map((i) => [
    { x: i.x - ISLAND_HALF, y: i.top }, { x: i.x + ISLAND_HALF, y: i.top },
    { x: i.x + ISLAND_HALF / 2, y: BOTTOM }, { x: i.x - ISLAND_HALF / 2, y: BOTTOM },
  ]);
  const ground = (x: number): number => {
    const isl = spec.islands.find((i) => Math.abs(i.x - x) <= ISLAND_HALF);
    return isl ? isl.top : deckY;
  };
  const gap = x1 - x0;
  return {
    id: spec.id, label: spec.label, name: spec.name, hint: spec.hint, budget: spec.budget,
    materials: spec.materials, vehicle: CARS[spec.car], anchors: spec.anchors,
    deckY, x0, x1, waterY: spec.waterY,
    leftCliff: [{ x: 0, y: deckY }, { x: x0, y: deckY }, { x: x0, y: BOTTOM }, { x: 0, y: BOTTOM }],
    rightCliff: [{ x: x1, y: deckY }, { x: WORLD_W, y: deckY }, { x: WORLD_W, y: BOTTOM }, { x: x1, y: BOTTOM }],
    islands,
    towers: spec.towers.map((t) => ({ x: t.x, top: t.top, base: ground(t.x) })),
    view: spec.view ?? autoView(spec, gap),
    events: [...(spec.events ?? [])].sort((a, b) => a.time - b.time),
  };
}

// ---------------------------------------------------------------------------------------------
// Validation d'un niveau venu de l'extérieur (fichier, presse-papiers, stockage local) : jamais de confiance.

const num = (v: unknown, lo: number, hi: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v) : null;
const text = (v: unknown, max: number): string | null =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : null;

export function parseSpec(raw: unknown): { spec: LevelSpec } | { error: string } {
  if (typeof raw !== 'object' || raw === null) return { error: 'Fichier de niveau invalide' };
  const r = raw as Record<string, unknown>;
  const name = text(r.name, 40);
  if (!name) return { error: 'Nom manquant' };
  const hint = text(r.hint ?? '', 220) ?? '';
  const budget = num(r.budget, 50, 9999);
  const x0 = num(r.x0, 60, 740), x1 = num(r.x1, 60, 740);
  const deckY = num(r.deckY, 160, 460), waterY = num(r.waterY, 200, WORLD_H - 10);
  if (budget === null || x0 === null || x1 === null || deckY === null || waterY === null) return { error: 'Valeurs hors limites' };
  if (x1 - x0 < 6 * GRID || x1 - x0 > 30 * GRID) return { error: 'Écart entre les rives : 6 à 30 cases' };
  if (waterY < deckY + 40) return { error: 'L’eau doit être sous la route' };
  const car = typeof r.car === 'string' && r.car in CARS ? (r.car as CarId) : null;
  if (!car) return { error: 'Véhicule inconnu' };
  if (!Array.isArray(r.materials)) return { error: 'Matériaux manquants' };
  const materials = MATERIAL_ORDER.filter((m) => (r.materials as unknown[]).includes(m));
  if (!materials.includes('road')) return { error: 'La chaussée est obligatoire' };
  const pts = (v: unknown, max: number): Pt[] | null => {
    if (!Array.isArray(v) || v.length > max) return null;
    const out: Pt[] = [];
    for (const p of v) {
      const x = num((p as Pt)?.x, 0, WORLD_W), y = num((p as Pt)?.y, 0, WORLD_H);
      if (x === null || y === null) return null;
      out.push({ x, y });
    }
    return out;
  };
  const anchors = pts(r.anchors, 24);
  if (!anchors || anchors.length < 2) return { error: 'Il faut au moins 2 points d’ancrage' };
  const items = (v: unknown, max: number): { x: number; top: number }[] | null => {
    if (v === undefined) return [];
    if (!Array.isArray(v) || v.length > max) return null;
    const out: { x: number; top: number }[] = [];
    for (const t of v) {
      const x = num((t as { x: unknown })?.x, 0, WORLD_W), top = num((t as { top: unknown })?.top, 0, WORLD_H);
      if (x === null || top === null) return null;
      out.push({ x, top });
    }
    return out;
  };
  const towers = items(r.towers, 4), islands = items(r.islands, 3);
  if (!towers || !islands) return { error: 'Pylônes ou îlots invalides' };
  const events = parseEvents(r.events);
  if (!events) return { error: 'Événements invalides' };
  const spec: LevelSpec = { id: 0, label: '', name, hint, budget, materials, car, x0, x1, deckY, waterY, anchors, towers, islands, ...(events.length ? { events } : {}) };
  if (r.solution !== undefined) {
    const sol = parseStructure(r.solution, materials);
    if (!sol) return { error: 'Solution invalide' };
    spec.solution = sol;
  }
  return { spec };
}

function parseEvents(raw: unknown): LevelEvent[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > 10) return null;
  const out: LevelEvent[] = [];
  for (const e of raw) {
    const time = num((e as { time: unknown })?.time, 0, 40);
    const shipType = (e as { shipType: unknown })?.shipType;
    if ((e as { type: unknown })?.type !== 'ship' || time === null || typeof shipType !== 'string' || !(shipType in SHIPS)) return null;
    out.push({ type: 'ship', time, shipType: shipType as LevelEvent['shipType'] });
  }
  return out;
}

function parseStructure(raw: unknown, materials: MaterialId[]): Structure | null {
  const r = raw as { nodes?: unknown; beams?: unknown };
  if (!r || !Array.isArray(r.nodes) || !Array.isArray(r.beams) || r.nodes.length > 200 || r.beams.length > 400) return null;
  const nodes: Structure['nodes'] = [];
  for (const n of r.nodes) {
    const x = typeof n?.x === 'number' && Number.isFinite(n.x) ? n.x : null, y = typeof n?.y === 'number' && Number.isFinite(n.y) ? n.y : null;
    if (x === null || y === null || x < -50 || x > WORLD_W + 50 || y < -50 || y > WORLD_H + 50) return null;
    nodes.push({ x, y, fixed: n.fixed === true });
  }
  const beams: Structure['beams'] = [];
  for (const b of r.beams) {
    if (!Number.isInteger(b?.a) || !Number.isInteger(b?.b) || b.a < 0 || b.b < 0 || b.a >= nodes.length || b.b >= nodes.length || b.a === b.b) return null;
    if (!(b.mat in MATERIALS) || !materials.includes(b.mat)) return null;
    beams.push({ a: b.a, b: b.b, mat: b.mat });
  }
  return { nodes, beams };
}

export const slug = (name: string): string => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'niveau';

// ---------------------------------------------------------------------------------------------
// Géométrie partagée par le jeu et l'éditeur

export function pointInPoly(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Vrai si `p` est à l'intérieur de la roche (2 px de tolérance : un point posé sur le bord n'est pas dedans). */
export function isSolid(level: LevelDef, p: Pt): boolean {
  return [level.leftCliff, level.rightCliff, ...level.islands].some((poly) => pointInPoly(p, poly) &&
    [[2, 0], [-2, 0], [0, 2], [0, -2]].every(([dx, dy]) => pointInPoly({ x: p.x + dx, y: p.y + dy }, poly)));
}
