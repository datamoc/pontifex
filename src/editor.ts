// Opérations d'édition d'un niveau (LevelSpec) : pures, sans rendu, testées avec `npm test`.
// Chaque opération renvoie une nouvelle spécification, ou `null` si elle est refusée (le message est dans `lastError`).
import { GRID, MATERIALS, MATERIAL_ORDER, WORLD_W, WORLD_H, type MaterialId, type Pt } from './data.ts';
import { deriveLevel, isSolid, ISLAND_HALF, type CarId, type LevelSpec } from './level.ts';

export const MIN_GAP = 6 * GRID;
export const MAX_GAP = 30 * GRID;
export const CAR_ORDER: CarId[] = ['citadine', 'jeep1', 'jeep2'];

export let lastError = '';
const refuse = (msg: string): null => { lastError = msg; return null; };
const same = (a: Pt, b: Pt, r = 12): boolean => Math.hypot(a.x - b.x, a.y - b.y) < r;
const copy = (s: LevelSpec): LevelSpec => JSON.parse(JSON.stringify(s));
/** Toute modification de la géométrie invalide la solution de référence. */
const invalidate = (s: LevelSpec): LevelSpec => { delete s.solution; return s; };

export function newSpec(): LevelSpec {
  return {
    id: 0, label: '', name: 'Nouveau niveau', hint: 'Relie les deux rives.', budget: 400,
    materials: ['road', 'wood'], car: 'citadine', x0: 280, x1: 520, deckY: 340, waterY: 470,
    anchors: [{ x: 280, y: 340 }, { x: 520, y: 340 }], towers: [], islands: [],
  };
}

/** Écart par tronçons de chaussée complets ; les appuis sur les rives suivent. */
export function widen(spec: LevelSpec, steps: number): LevelSpec | null {
  const span = MATERIALS.road.maxLen;
  const panels = (spec.x1 - spec.x0) / span;
  const count = steps > 0 ? Math.floor(panels) + steps : Math.ceil(panels) + steps;
  const d = (count * span - (spec.x1 - spec.x0)) / 2;
  const x0 = spec.x0 - d, x1 = spec.x1 + d;
  if (x1 - x0 < MIN_GAP) return refuse('Écart minimum : 6 cases');
  if (x1 - x0 > MAX_GAP || x0 < 60 || x1 > WORLD_W - 60) return refuse('Écart maximum atteint (30 cases)');
  const s = copy(spec);
  const mv = (x: number): number => (x <= spec.x0 ? x - d : x >= spec.x1 ? x + d : x);
  s.x0 = x0; s.x1 = x1;
  s.anchors = s.anchors.map((a) => ({ x: mv(a.x), y: a.y }));
  s.towers = s.towers.map((t) => ({ x: mv(t.x), top: t.top }));
  // un îlot qui sortirait du canyon disparaît avec son ancrage
  const gone = s.islands.filter((i) => i.x < x0 + 60 || i.x > x1 - 60);
  s.islands = s.islands.filter((i) => !gone.includes(i));
  s.anchors = s.anchors.filter((a) => !gone.some((i) => i.x === a.x && i.top === a.y));
  s.towers = s.towers.filter((t) => !gone.some((i) => Math.abs(i.x - t.x) <= ISLAND_HALF));
  return invalidate(s);
}

export function moveDeck(spec: LevelSpec, cells: number): LevelSpec | null {
  const y = spec.deckY + cells * GRID;
  if (y < 200 || y > 440) return refuse('Hauteur de route hors limites');
  if (spec.waterY < y + 40) return refuse('L’eau est trop haute pour cette route');
  const s = copy(spec);
  s.deckY = y;
  // les ancrages posés sur la route d'une rive suivent
  s.anchors = s.anchors.map((a) => (a.y === spec.deckY && (a.x === spec.x0 || a.x === spec.x1) ? { x: a.x, y } : a));
  return invalidate(s);
}

export function moveWater(spec: LevelSpec, cells: number): LevelSpec | null {
  const y = spec.waterY + cells * GRID;
  if (y < spec.deckY + 60) return refuse('L’eau doit rester sous la route');
  if (y > WORLD_H - 10) return refuse('Niveau de l’eau maximum atteint');
  return invalidate({ ...copy(spec), waterY: y });
}

export function adjustBudget(spec: LevelSpec, steps: number): LevelSpec | null {
  const b = spec.budget + steps * 50;
  if (b < 50 || b > 9999) return refuse('Budget hors limites');
  return { ...copy(spec), budget: b };
}

export function cycleCar(spec: LevelSpec): LevelSpec {
  const s = copy(spec);
  s.car = CAR_ORDER[(CAR_ORDER.indexOf(spec.car) + 1) % CAR_ORDER.length];
  return invalidate(s);
}

export function toggleMaterial(spec: LevelSpec, m: MaterialId): LevelSpec | null {
  if (m === 'road') return refuse('La chaussée est obligatoire');
  const s = copy(spec);
  s.materials = MATERIAL_ORDER.filter((x) => (x === m ? !spec.materials.includes(m) : spec.materials.includes(x)));
  // la solution ne peut plus utiliser un matériau retiré
  if (s.solution?.beams.some((b) => !s.materials.includes(b.mat))) delete s.solution;
  return s;
}

export function toggleAnchor(spec: LevelSpec, p: Pt): LevelSpec | null {
  const hit = spec.anchors.findIndex((a) => same(a, p));
  const s = copy(spec);
  if (hit >= 0) {
    const a = spec.anchors[hit];
    if (spec.towers.some((t) => t.x === a.x && t.top === a.y)) return refuse('Ancrage de pylône : utilise l’outil Pylône pour le retirer');
    if (spec.islands.some((i) => i.x === a.x && i.top === a.y)) return refuse('Ancrage d’îlot : utilise l’outil Îlot pour le retirer');
    s.anchors.splice(hit, 1);
    return invalidate(s);
  }
  if (spec.anchors.length >= 24) return refuse('Trop de points d’ancrage');
  if (p.x < 0 || p.x > WORLD_W || p.y < 40 || p.y > spec.waterY + 30) return refuse('Hors du niveau');
  if (isSolid(deriveLevel(spec), p)) return refuse('Un ancrage ne peut pas être dans la roche');
  s.anchors.push({ x: p.x, y: p.y });
  return invalidate(s);
}

export function toggleTower(spec: LevelSpec, p: Pt): LevelSpec | null {
  const hit = spec.towers.findIndex((t) => Math.abs(t.x - p.x) < 14);
  const s = copy(spec);
  if (hit >= 0) {
    const t = spec.towers[hit];
    s.towers.splice(hit, 1);
    s.anchors = s.anchors.filter((a) => !(a.x === t.x && a.y === t.top));
    return invalidate(s);
  }
  if (spec.towers.length >= 4) return refuse('4 pylônes au maximum');
  const isl = spec.islands.find((i) => Math.abs(i.x - p.x) <= ISLAND_HALF);
  const x = isl ? isl.x : p.x;
  const onBank = p.x <= spec.x0 - GRID || p.x >= spec.x1 + GRID;
  if (!isl && !onBank) return refuse('Un pylône se pose sur une rive ou sur un îlot');
  const base = isl ? isl.top : spec.deckY;
  if (p.y < 60 || p.y > base - 80) return refuse('Sommet du pylône trop bas (clique plus haut)');
  s.towers.push({ x, top: p.y });
  s.anchors.push({ x, y: p.y });
  return invalidate(s);
}

export function toggleIsland(spec: LevelSpec, p: Pt): LevelSpec | null {
  const hit = spec.islands.findIndex((i) => Math.abs(i.x - p.x) <= ISLAND_HALF);
  const s = copy(spec);
  if (hit >= 0) {
    const i = spec.islands[hit];
    s.islands.splice(hit, 1);
    s.anchors = s.anchors.filter((a) => !(a.x === i.x && a.y === i.top));
    s.towers = s.towers.filter((t) => Math.abs(t.x - i.x) > ISLAND_HALF);
    s.anchors = s.anchors.filter((a) => !spec.towers.some((t) => Math.abs(t.x - i.x) <= ISLAND_HALF && a.x === t.x && a.y === t.top));
    return invalidate(s);
  }
  if (spec.islands.length >= 3) return refuse('3 îlots au maximum');
  if (p.x < spec.x0 + 60 || p.x > spec.x1 - 60) return refuse('Un îlot se pose au milieu du canyon');
  if (spec.islands.some((i) => Math.abs(i.x - p.x) < 4 * ISLAND_HALF)) return refuse('Îlots trop proches');
  if (p.y < spec.deckY + 40 || p.y > spec.waterY - 10) return refuse('La surface de l’îlot doit être entre la route et l’eau');
  s.islands.push({ x: p.x, top: p.y });
  s.anchors.push({ x: p.x, y: p.y });
  return invalidate(s);
}

/** Vérifie qu'un niveau est enregistrable : des appuis des deux côtés. */
export function problems(spec: LevelSpec): string | null {
  if (!spec.anchors.some((a) => a.x <= spec.x0)) return 'Il manque un ancrage sur la rive gauche';
  if (!spec.anchors.some((a) => a.x >= spec.x1)) return 'Il manque un ancrage sur la rive droite';
  if (!spec.name.trim()) return 'Le niveau n’a pas de nom';
  return null;
}
