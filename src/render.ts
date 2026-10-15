import { BIOMES, type Biome } from './biomes.ts';
import { Shape2D, Label, Gradient, type Node2D } from '@datamoc/mwg/two-d';
import { GRID, MATERIALS, WORLD_H, WORLD_W, type LevelDef, type MaterialId, type Pt } from './data.ts';
import type { BridgeSim, Structure } from './physics.ts';

export interface Layers { sky: Shape2D; clouds: Node2D; landscape: Node2D; back: Shape2D; wildlife: Node2D; decor: Node2D; grid: Shape2D; bridge: Shape2D; car: Node2D; front: Shape2D; fx: Node2D }

export interface DynamicArgs {
  level: LevelDef;
  structure: Structure;
  sim: BridgeSim | null;
  time: number;
  preview: { from: Pt; to: Pt } | null;
  tool: MaterialId | 'delete';
  hoverNode: number;
  pointer: Pt | null;
  /** point d'accrochage sur un câble porteur sous le pointeur */
  ropePoint: Pt | null;
  flash: number;
}

const X0 = -700, X1 = WORLD_W + 700, Y1 = WORLD_H + 500;

function ratioColor(r: number): number {
  r = Math.max(0, Math.min(1, r));
  const rgb = r < 0.5 ? [Math.round(r * 2 * 235), 220, 80] : [245, Math.round((1 - r) * 2 * 200), 60];
  return (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
}

let lenLabel: Label | null = null;

export const drawScene = {
  /** Décor fixe du niveau : ciel, montagnes, falaises, grille. Redessiné au changement de niveau. */
  static(layers: Layers, lv: LevelDef, grid: boolean, biome: Biome = BIOMES[0]): void {
    const sk = layers.sky.clear();
    const sky = new Gradient({
      type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 },
      colorStops: [{ offset: 0, color: biome.sky[0] }, { offset: 0.65, color: biome.sky[1] }, { offset: 1, color: biome.sky[2] }],
    });
    sk.rect(X0, -300, X1 - X0, Y1 + 300).fill(sky);
    const b = layers.back.clear();
    // falaises
    const rock = biome.rock, edge = 0x2f261d;
    const cliff = (pts: number[]) => { b.poly(pts).fill(rock).stroke({ width: 3, color: edge }); };
    cliff([X0, lv.deckY, lv.x0, lv.deckY, lv.x0, Y1, X0, Y1]);
    cliff([lv.x1, lv.deckY, X1, lv.deckY, X1, Y1, lv.x1, Y1]);
    for (const isl of lv.islands) cliff(isl.flatMap((p) => [p.x, p.y]).concat([isl[2].x + 100, Y1, isl[3].x - 100, Y1]));
    // strates
    for (let y = lv.deckY + 40; y < Y1; y += 46) {
      b.moveTo(X0, y).lineTo(lv.x0, y).moveTo(lv.x1, y).lineTo(X1, y).stroke({ width: 1, color: 0x4a3b2e, alpha: 0.6 });
    }
    // herbe + route
    b.rect(X0, lv.deckY, lv.x0 - X0, 5).fill(biome.ground).rect(lv.x1, lv.deckY, X1 - lv.x1, 5).fill(biome.ground);
    b.rect(X0, lv.deckY - 5, lv.x0 - X0, 5).fill(0x334155).rect(lv.x1, lv.deckY - 5, X1 - lv.x1, 5).fill(0x334155);
    for (let x = X0; x < lv.x0 - 20; x += 40) b.rect(x, lv.deckY - 3, 18, 1.5).fill(0xe2e8f0);
    for (let x = lv.x1 + 10; x < X1; x += 40) b.rect(x, lv.deckY - 3, 18, 1.5).fill(0xe2e8f0);
    // pylônes
    for (const t of lv.towers ?? []) {
      b.rect(t.x - 7, t.top, 14, t.base - t.top).fill(0x94a3b8).stroke({ width: 2, color: 0x334155 });
      for (let y = t.top + 20; y < t.base; y += 40) b.moveTo(t.x - 7, y).lineTo(t.x + 7, y - 14).stroke({ width: 1.5, color: 0x64748b });
      b.rect(t.x - 12, t.top - 6, 24, 8).fill(0x64748b);
    }
    // panneau de départ / arrivée
    b.rect(lv.x0 - 60, lv.deckY - 40, 3, 35).fill(0xe2e8f0).rect(lv.x0 - 70, lv.deckY - 48, 24, 12).fill(0x10b981);
    b.rect(lv.x1 + 60, lv.deckY - 40, 3, 35).fill(0xe2e8f0).rect(lv.x1 + 46, lv.deckY - 48, 24, 12).fill(0xf43f5e);

    const g = layers.grid.clear();
    g.visible = grid;
    for (let x = 0; x <= WORLD_W; x += GRID) for (let y = 0; y <= lv.waterY; y += GRID) g.circle(x, y, 1).fill({ color: 0x0f172a, alpha: 0.3 });
    // cadre du monde (zone jouable)
    g.rect(0, 0, WORLD_W, WORLD_H).stroke({ width: 1, color: 0x0f172a, alpha: 0.25 });
  },

  dynamic(layers: Layers, a: DynamicArgs): void {
    const { level: lv, sim, time } = a;
    const br = layers.bridge.clear();
    const fr = layers.front.clear();

    // --- poutres
    type B = { x1: number; y1: number; x2: number; y2: number; mat: MaterialId; ratio: number };
    const beams: B[] = [];
    if (sim) {
      for (const l of sim.links) {
        if (l.broken) continue;
        const p = sim.bodies[l.a], q = sim.bodies[l.b];
        beams.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, mat: l.mat, ratio: l.ratio });
      }
    } else {
      for (const m of a.structure.beams) {
        const p = a.structure.nodes[m.a], q = a.structure.nodes[m.b];
        beams.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, mat: m.mat, ratio: -1 });
      }
    }
    // chaussées au-dessus des autres
    beams.sort((u, v) => Number(MATERIALS[u.mat].isRoad) - Number(MATERIALS[v.mat].isRoad));
    for (const m of beams) {
      const def = MATERIALS[m.mat];
      const col = m.ratio >= 0 ? ratioColor(m.ratio) : def.color;
      const w = def.isRoad ? 9 : m.mat === 'cable' ? 2 : m.mat === 'rope' ? 5 : 5;
      br.moveTo(m.x1, m.y1).lineTo(m.x2, m.y2).stroke({ width: w, color: col, cap: 'round' });
      if (def.isRoad) br.moveTo(m.x1, m.y1).lineTo(m.x2, m.y2).stroke({ width: 2, color: 0x0f172a, alpha: 0.85, cap: 'butt' });
      else if (m.mat === 'rope') br.moveTo(m.x1, m.y1).lineTo(m.x2, m.y2).stroke({ width: 1.5, color: 0x1f2937, alpha: 0.7, cap: 'butt' });
      else if (m.mat === 'steel') br.moveTo(m.x1, m.y1).lineTo(m.x2, m.y2).stroke({ width: 1.5, color: 0xffffff, alpha: 0.5, cap: 'butt' });
    }
    // --- nœuds
    const nodes = sim ? sim.bodies.map((b, i) => ({ x: b.x, y: b.y, fixed: b.fixed })) : a.structure.nodes;
    nodes.forEach((n, i) => {
      br.circle(n.x, n.y, n.fixed ? 7 : 4.5).fill(n.fixed ? 0xf59e0b : 0xf8fafc).stroke({ width: 2, color: n.fixed ? 0x78350f : 0x334155 });
      if (i === a.hoverNode) br.circle(n.x, n.y, 11).stroke({ width: 2.5, color: 0x38bdf8 });
    });

    // --- aperçu de construction
    if (a.preview && a.tool !== 'delete') {
      const mat = MATERIALS[a.tool];
      const { from, to } = a.preview;
      const len = Math.hypot(to.x - from.x, to.y - from.y);
      const ok = len <= mat.maxLen;
      const col = ok ? 0x38bdf8 : 0xf43f5e;
      fr.dashedLine(from.x, from.y, to.x, to.y, 12, 12);
      fr.stroke({ width: mat.isRoad ? 8 : 4, color: col, alpha: 0.8, cap: 'round' });
      fr.circle(from.x, from.y, 11).stroke({ width: 2.5, color: 0x38bdf8 });
      fr.circle(to.x, to.y, 5).fill({ color: col, alpha: 0.9 });
      if (!lenLabel) { lenLabel = new Label({ text: '', size: 12, color: 0xffffff }); layers.fx.addChild(lenLabel); }
      lenLabel.visible = true;
      lenLabel.setText(`${(len / 10).toFixed(1)} m · ${Math.round((len / 10) * mat.cost)} €`);
      lenLabel.setColor(col);
      lenLabel.position.set((from.x + to.x) / 2 + 10, (from.y + to.y) / 2 - 20);
    } else if (lenLabel) lenLabel.visible = false;
    if (a.ropePoint) fr.circle(a.ropePoint.x, a.ropePoint.y, 8).stroke({ width: 2.5, color: 0xfacc15 }).circle(a.ropePoint.x, a.ropePoint.y, 3).fill(0xfacc15);
    if (a.pointer && !a.preview) fr.circle(a.pointer.x, a.pointer.y, 6).stroke({ width: 1.5, color: a.tool === 'delete' ? 0xf43f5e : 0x38bdf8, alpha: 0.7 });

    // --- eau (devant le pont et le véhicule, dans le canyon seulement)
    const wy = lv.waterY, wx0 = lv.x0 - 2, wx1 = lv.x1 + 2;
    const wave = (x: number) => wy + Math.sin(time * 2.2 + x * 0.03) * 3 + Math.sin(time * 1.3 + x * 0.011) * 3;
    fr.moveTo(wx0, Y1);
    for (let x = wx0; x <= wx1; x += 12) fr.lineTo(x, wave(x));
    fr.lineTo(wx1, Y1).closePath().fill({ color: 0x0e7490, alpha: 0.62 });
    fr.moveTo(wx0, wave(wx0) + 3);
    for (let x = wx0; x <= wx1; x += 12) fr.lineTo(x, wave(x) + 3);
    fr.stroke({ width: 1.5, color: 0xa5f3fc, alpha: 0.55 });

    if (a.flash > 0) fr.rect(0, 0, WORLD_W, WORLD_H).stroke({ width: 6, color: 0xf43f5e, alpha: a.flash * 0.6 });
  },
};
