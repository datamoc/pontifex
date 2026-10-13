import {
  Game, Scene2D, Button, Label, Bar, Window, WindowStack, ScreenEffects, ParticleEmitter, Shape2D, Node2D,
} from '@datamoc/mw_games/two-d';
import { Camera } from '@datamoc/mw_games/two-d/render';
import { Settings, UndoHistory, Input } from '@datamoc/mw_games/core';
import { Texture, FederatedPointerEvent, Rectangle, type Container } from 'pixi.js';
import {
  GRID, LEVELS, MATERIALS, MATERIAL_ORDER, WORLD_H, WORLD_W, type LevelDef, type MaterialId, type Pt,
} from './data.ts';
import { BridgeSim, FRAME_DT, SETTLE, structureCost, type Structure } from './physics.ts';
import { Sfx } from './audio.ts';
import { ropeHit, splitBeam, prune, type RopeHit } from './structure.ts';
import { drawScene, type Layers } from './render.ts';
import { buildClouds, buildDecor, makeVehicle, type CarState, type Clouds } from './art.ts';
import type { AnimatedSprite } from '@datamoc/mw_games/two-d';

type Tool = MaterialId | 'delete';
const SNAP_R = 14;

const clone = (s: Structure): Structure => JSON.parse(JSON.stringify(s));

function pointInPoly(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
function distToSegment(p: Pt, v: Pt, w: Pt): number {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  const t = Math.max(0, Math.min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

interface Progress { stars: Record<string, number> }

export class PontifexScene extends Scene2D {
  private settings = new Settings({ namespace: 'pontifex' });
  private sfx = new Sfx();
  private progress: Progress = { stars: {} };

  // --- état de jeu
  private levelIdx = 0;
  private level!: LevelDef;
  private structure!: Structure;
  private history = new UndoHistory<string>({ limit: 100 });
  private tool: Tool = 'road';
  private snapOn = true;
  private sim: BridgeSim | null = null;
  private acc = 0;
  private speed = 1;
  private overBudgetFlash = 0;

  // --- interaction
  private drag: { from: Pt; fromIdx: number; fromRope: RopeHit | null } | null = null;
  private pointer: Pt = { x: 0, y: 0 };
  private pointerIn = false;

  // --- scène
  private camera = new Camera();
  private world!: Container;
  private layers!: Layers;
  private clouds: Clouds | null = null;
  private car: AnimatedSprite | null = null;
  private carState: CarState | '' = '';
  private debris!: ParticleEmitter;
  private spray!: ParticleEmitter;
  private effects = new ScreenEffects();
  private windows = new WindowStack();
  private time = 0;

  // --- interface
  private topBar = new Shape2D();
  private botBar = new Shape2D();
  private lblTitle = new Label({ text: 'PONTIFEX', size: 18, bold: true, color: 0xfbbf24 });
  private btnLevel!: Button;
  private lblBudget = new Label({ text: '', size: 13 });
  private barBudget = new Bar({ width: 150, height: 10, color: 0x10b981, background: 0x1e293b, max: 1 });
  private lblStress = new Label({ text: '', size: 13 });
  private barStress = new Bar({ width: 120, height: 10, color: 0x10b981, background: 0x1e293b, max: 1 });
  private lblHint = new Label({ text: '', size: 13, bold: true, color: 0x0b1220 });
  private lblToast = new Label({ text: '', size: 15, bold: true, color: 0xfda4af });
  private matButtons = new Map<Tool, Button>();
  private btnDelete!: Button;
  private btnUndo!: Button;
  private btnRedo!: Button;
  private btnClear!: Button;
  private btnSpeed!: Button;
  private btnGrid!: Button;
  private btnSound!: Button;
  private btnTest!: Button;
  private flow: Array<{ items: Container[]; bar: 'top' | 'bot' }> = [];
  private vw = 0;
  private vh = 0;
  private keyHandler = (e: KeyboardEvent) => this.onKey(e);
  private actionHandler = (a: string) => { if (!this.windows.isEmpty) return this.windows.handleAction(a); };

  create(): void {
    this.loadProgress();
    const saved = this.settings.getCustom('level2', 0);
    this.sfx.enabled = this.settings.getCustom('sound', true) !== false;
    this.snapOn = this.settings.getCustom('grid', true) !== false;

    this.world = this.camera.world;
    this.stage.addChild(this.world);
    const L = (n: string) => { const s = new Shape2D(); s.label = n; return s; };
    this.layers = { sky: L('sky'), clouds: new Node2D(), back: L('back'), decor: new Node2D(), grid: L('grid'), bridge: L('bridge'), car: new Node2D(), front: L('front'), fx: new Node2D() };
    this.world.addChild(this.layers.sky, this.layers.clouds, this.layers.back, this.layers.decor, this.layers.grid, this.layers.bridge, this.layers.car, this.layers.front, this.layers.fx);
    this.clouds = buildClouds(this.layers.clouds, 4242);

    const mk = (tint: [number, number], g: number, life: [number, number], speed: [number, number]) => new ParticleEmitter({
      texture: Texture.WHITE, max: 200, rate: 0, life, speed, angle: [0, Math.PI * 2], gravity: { x: 0, y: g },
      scale: [4, 1], alpha: [1, 0], tint, spin: [-8, 8],
    });
    this.debris = mk([0x92400e, 0xfbbf24], 600, [0.6, 1.4], [60, 220]);
    this.spray = mk([0xbae6fd, 0xffffff], 500, [0.5, 1.1], [80, 260]);
    this.layers.fx.addChild(this.debris, this.spray);

    this.world.eventMode = 'static';
    this.world.hitArea = new Rectangle(-2000, -2000, 4000, 4000);
    this.world.on('pointerdown', (e: FederatedPointerEvent) => this.onDown(e));
    this.world.on('pointermove', (e: FederatedPointerEvent) => this.onMove(e));
    this.world.on('pointerup', (e: FederatedPointerEvent) => this.onUp(e));
    this.world.on('pointerupoutside', () => { this.drag = null; });
    this.world.on('pointerleave', () => { this.pointerIn = false; });

    this.buildHud();
    this.stage.addChild(this.effects, this.windows);
    // clic droit = effacer : pas de menu contextuel du navigateur par-dessus le jeu
    Game.current.app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.keyHandler);
    Input.onAction.add(this.actionHandler);
    this.loadLevel(Math.min(Number(saved) || 0, LEVELS.length - 1));
    if (location.hash === '#debug') (window as unknown as Record<string, unknown>).__pontifex = this;
    this.resize(this.vw || window.innerWidth, this.vh || window.innerHeight);
  }

  override teardown(): void {
    window.removeEventListener('keydown', this.keyHandler);
    Input.onAction.remove(this.actionHandler);
    super.teardown();
  }

  // ------------------------------------------------------------------ progression
  private loadProgress(): void {
    try { this.progress = JSON.parse(String(this.settings.getCustom('progress2', '{"stars":{}}'))); } catch { this.progress = { stars: {} }; }
    if (!this.progress.stars) this.progress = { stars: {} };
  }
  private saveProgress(): void { this.settings.setCustom('progress2', JSON.stringify(this.progress)); }
  private unlocked(idx: number): boolean { return idx === 0 || (this.progress.stars[String(LEVELS[idx - 1].id)] ?? 0) > 0; }

  // ------------------------------------------------------------------ niveau
  private loadLevel(idx: number): void {
    this.levelIdx = idx;
    this.level = LEVELS[idx];
    this.sim = null;
    this.windows.closeAll();
    this.structure = { nodes: this.level.anchors.map((a) => ({ x: a.x, y: a.y, fixed: true })), beams: [] };
    this.history.clear();
    this.history.push(JSON.stringify(this.structure));
    this.drag = null;
    this.debris.clear(); this.spray.clear();
    this.settings.setCustom('level2', idx);
    for (const id of MATERIAL_ORDER) { const b = this.matButtons.get(id); if (b) b.visible = this.level.materials.includes(id); }
    if (this.tool !== 'delete' && !this.level.materials.includes(this.tool)) this.tool = this.level.materials[0];
    this.btnLevel?.setText(`▾ ${this.level.label}. ${this.level.name}`);
    const v = this.level.vehicle;
    this.lblHint.setText(`${this.level.hint}  ·  Véhicule : ${v.name}, ${(v.mass / 10).toFixed(1).replace('.', ',')} t`);
    drawScene.static(this.layers, this.level, this.snapOn);
    buildDecor(this.level, this.layers.decor);
    this.layers.car.removeChildren().forEach((c) => c.destroy());
    this.car = makeVehicle(this.level.vehicle);
    this.layers.car.addChild(this.car);
    this.carState = '';
    this.refreshHud();
    this.layoutHud();
  }

  // ------------------------------------------------------------------ édition
  private snap(p: Pt): Pt {
    if (!this.snapOn) return { x: Math.round(p.x), y: Math.round(p.y) };
    return { x: Math.round(p.x / GRID) * GRID, y: Math.round(p.y / GRID) * GRID };
  }
  private nodeAt(p: Pt, r = SNAP_R): number {
    let best = -1, bd = r;
    this.structure.nodes.forEach((n, i) => { const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  private solid(p: Pt): boolean {
    // à l'intérieur de la roche, avec 2 px de tolérance pour les points posés sur le bord
    const polys = [this.level.leftCliff, this.level.rightCliff, ...(this.level.island ? [this.level.island] : []), ...(this.level.island2 ? [this.level.island2] : [])];
    return polys.some((poly) => pointInPoly(p, poly) &&
      [[2, 0], [-2, 0], [0, 2], [0, -2]].every(([dx, dy]) => pointInPoly({ x: p.x + dx, y: p.y + dy }, poly)));
  }
  private inWorld(p: Pt): boolean { return p.x >= 0 && p.x <= WORLD_W && p.y >= 20 && p.y <= this.level.waterY + 30; }
  private beamExists(a: number, b: number): boolean {
    return this.structure.beams.some((m) => (m.a === a && m.b === b) || (m.a === b && m.b === a));
  }
  private commit(): void {
    this.prune();
    this.history.push(JSON.stringify(this.structure));
    this.refreshHud();
  }
  private prune(): void { this.structure = prune(this.structure); }
  private restore(json: string | null): void {
    if (json === null) return;
    this.structure = JSON.parse(json);
    this.sfx.onDelete();
    this.refreshHud();
  }
  private toWorld(e: FederatedPointerEvent): Pt {
    const p = this.world.toLocal(e.global);
    return { x: p.x, y: p.y };
  }

  private onDown(e: FederatedPointerEvent): void {
    if (this.sim || !this.windows.isEmpty) return;
    const raw = this.toWorld(e);
    this.pointer = raw;
    if (e.button === 2 || this.tool === 'delete') { this.deleteAt(raw); return; }
    const p = this.snap(raw);
    const idx = this.nodeAt(p);
    // un câble fin peut s'accrocher n'importe où sur un câble porteur
    const rope = idx < 0 && this.tool === 'cable' ? ropeHit(this.structure, raw) : null;
    const from = idx >= 0 ? { x: this.structure.nodes[idx].x, y: this.structure.nodes[idx].y } : rope ? rope.pos : p;
    if (idx < 0 && !rope && (this.solid(p) || !this.inWorld(p))) return;
    this.drag = { from, fromIdx: idx, fromRope: rope };
  }
  private onMove(e: FederatedPointerEvent): void {
    this.pointer = this.toWorld(e);
    this.pointerIn = true;
  }
  private onUp(e: FederatedPointerEvent): void {
    const d = this.drag;
    this.drag = null;
    if (!d || this.sim) return;
    const raw = this.toWorld(e);
    const pEnd = this.snap(raw);
    const endIdx = this.nodeAt(pEnd);
    const endRope = endIdx < 0 && this.tool === 'cable' ? ropeHit(this.structure, raw) : null;
    const to = endIdx >= 0 ? { x: this.structure.nodes[endIdx].x, y: this.structure.nodes[endIdx].y } : endRope ? endRope.pos : pEnd;
    const mat = MATERIALS[this.tool as MaterialId];
    const len = Math.hypot(to.x - d.from.x, to.y - d.from.y);
    if (len < 10) return;
    if (len > mat.maxLen) { this.reject('Trop long pour ce matériau'); return; }
    if (endIdx < 0 && !endRope && (this.solid(to) || !this.inWorld(to))) return;
    if (d.fromRope && endRope) { this.reject('Une suspente relie le câble porteur au tablier'); return; }
    const mid = { x: (to.x + d.from.x) / 2, y: (to.y + d.from.y) / 2 };
    if (this.solid(mid)) return;
    const cost = (len / 10) * mat.cost;
    if (structureCost(this.structure) + cost > this.level.budget + 1e-6) { this.reject('Budget dépassé'); return; }
    let a = d.fromIdx, b = endIdx;
    if (a >= 0 && a === b) return;
    if (a >= 0 && b >= 0 && this.beamExists(a, b)) return;
    if (a < 0) a = d.fromRope ? splitBeam(this.structure, d.fromRope.beam, d.fromRope.pos) : this.addNode(d.from);
    if (b < 0) b = endRope ? splitBeam(this.structure, endRope.beam, endRope.pos) : this.addNode(to);
    this.structure.beams.push({ a, b, mat: mat.id });
    this.sfx.onBuild();
    this.commit();
  }
  private addNode(p: Pt): number {
    this.structure.nodes.push({ x: p.x, y: p.y, fixed: false });
    return this.structure.nodes.length - 1;
  }
  private deleteAt(p: Pt): void {
    let best = -1, bd = 9;
    this.structure.beams.forEach((b, i) => {
      const d = distToSegment(p, this.structure.nodes[b.a], this.structure.nodes[b.b]);
      if (d < bd) { bd = d; best = i; }
    });
    if (best < 0) return;
    this.structure.beams.splice(best, 1);
    this.sfx.onDelete();
    this.commit();
  }
  private reject(msg: string): void {
    this.overBudgetFlash = 1;
    this.sfx.onDelete();
    this.toastMsg = msg;
    this.toastT = 1.6;
  }
  private toastMsg = '';
  private toastT = 0;

  // ------------------------------------------------------------------ simulation
  private toggleSim(): void {
    if (this.sim) { this.stopSim(); return; }
    if (this.structure.beams.length === 0) { this.reject('Construis d’abord un pont !'); return; }
    this.sim = new BridgeSim(this.level, clone(this.structure));
    this.acc = 0;
    this.drag = null;
    this.debris.clear(); this.spray.clear();
    this.refreshHud();
  }
  private stopSim(): void {
    this.sim = null;
    this.debris.clear(); this.spray.clear();
    this.refreshHud();
  }
  private handleEvents(): void {
    const sim = this.sim!;
    for (const ev of sim.events) {
      if (ev.type === 'break') {
        this.sfx.onBreak();
        this.debris.position.set(ev.x, ev.y);
        this.debris.burst(14);
        this.camera.shake(3, 0.25);
      } else if (ev.type === 'crash') {
        this.sfx.onBreak();
        this.camera.shake(4, 0.3);
      } else if (ev.type === 'splash') {
        this.sfx.onSplash();
        this.spray.position.set(ev.x, this.level.waterY);
        this.spray.burst(40);
        this.camera.shake(5, 0.35);
      } else if (ev.type === 'win') {
        this.sfx.onWin();
        this.effects.flash(0.4, 0xffffff, 0.35);
      }
    }
    sim.events.length = 0;
  }
  private showResult(): void {
    const sim = this.sim!;
    const won = sim.status === 'won';
    const cost = Math.round(structureCost(this.structure));
    const left = this.level.budget - cost;
    const okBudget = won && left >= this.level.budget * 0.2;
    const okStress = won && sim.maxRatio < 0.75;
    const stars = won ? 1 + Number(okBudget) + Number(okStress) : 0;
    if (won) {
      const key = String(this.level.id);
      if (stars > (this.progress.stars[key] ?? 0)) { this.progress.stars[key] = stars; this.saveProgress(); }
    }
    const win = new Window({ width: 360, height: won ? 320 : 250, title: won ? 'Niveau réussi !' : 'Le pont s’est effondré', modal: true, closable: false });
    const c = win.content;
    const star = new Label({ text: won ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '✖', size: 40, color: won ? 0xfbbf24 : 0xf43f5e });
    star.position.set(win.contentWidth / 2 - star.width / 2, 4);
    const mark = (ok: boolean) => (ok ? '✔' : '✖');
    const info = new Label({
      text: won
        ? `${mark(true)}  Le véhicule a traversé\n${mark(okBudget)}  Au moins 20 % du budget restant (${left} €)\n${mark(okStress)}  Contrainte max sous 75 % (${Math.round(sim.maxRatio * 100)} %)`
        : 'Renforce les poutres qui rougissent en premier, ou ajoute des triangles : un triangle ne se déforme pas.',
      size: 13, wrapWidth: win.contentWidth - 16, color: 0xcbd5e1,
    });
    info.position.set(8, 70);
    c.addChild(star, info);
    const y = win.contentHeight - 44;
    const bw = (win.contentWidth - 24) / 2;
    const retry = new Button({ width: bw, height: 36, text: 'Modifier', onClick: () => { win.close(); this.stopSim(); } });
    retry.position.set(8, y);
    const next = new Button({
      width: bw, height: 36, text: won ? (this.levelIdx < LEVELS.length - 1 ? 'Suivant →' : 'Recommencer') : 'Revoir la chute',
      onClick: () => { win.close(); if (!won) { this.stopSim(); this.toggleSim(); } else this.loadLevel(this.levelIdx < LEVELS.length - 1 ? this.levelIdx + 1 : 0); },
    });
    next.position.set(16 + bw, y);
    c.addChild(retry, next);
    this.windows.push(win);
  }
  private showLevels(): void {
    const cols = 4, bw = 172, bh = 56, gap = 8;
    const rows = Math.ceil(LEVELS.length / cols);
    const win = new Window({ width: cols * (bw + gap) + gap + 16, height: rows * (bh + gap) + gap + 96, title: 'Choisir un niveau', modal: true, closable: true });
    LEVELS.forEach((lv, i) => {
      const s = this.progress.stars[String(lv.id)] ?? 0;
      const ok = this.unlocked(i);
      const b = new Button({
        width: bw, height: bh, disabled: !ok,
        text: `${lv.label}. ${lv.name}\n${ok ? '★'.repeat(s) + '☆'.repeat(3 - s) : '— verrouillé —'}`,
        label: { size: 12 },
        onClick: () => { win.close(); this.loadLevel(i); },
      });
      b.position.set(gap + (i % cols) * (bw + gap), gap + Math.floor(i / cols) * (bh + gap));
      win.content.addChild(b);
    });
    const close = new Button({ width: 120, height: 32, text: 'Fermer', onClick: () => win.close() });
    close.position.set(win.contentWidth - 128, rows * (bh + gap) + gap + 4);
    win.content.addChild(close);
    this.windows.push(win);
  }

  // ------------------------------------------------------------------ interface
  private button(text: string, onClick: () => void, w = 96, size = 12): Button {
    return new Button({ width: w, height: 34, text, label: { size }, onClick: () => { this.sfx.onClick(); onClick(); } });
  }
  private buildHud(): void {
    this.btnLevel = this.button('', () => this.showLevels(), 190);
    for (const id of MATERIAL_ORDER) {
      const m = MATERIALS[id];
      const b = this.button('', () => { this.tool = id; this.refreshHud(); }, 150);
      this.matButtons.set(id, b);
    }
    this.btnDelete = this.button('Effacer', () => { this.tool = 'delete'; this.refreshHud(); }, 80);
    this.matButtons.set('delete', this.btnDelete);
    this.btnUndo = this.button('Annuler', () => this.undo(), 80);
    this.btnRedo = this.button('Rétablir', () => this.redo(), 80);
    this.btnClear = this.button('Vider', () => this.clearAll(), 66);
    this.btnSpeed = this.button('1×', () => { this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 0.5 : 1; this.refreshHud(); }, 52);
    this.btnGrid = this.button('', () => { this.snapOn = !this.snapOn; this.settings.setCustom('grid', this.snapOn); drawScene.static(this.layers, this.level, this.snapOn); this.refreshHud(); }, 90);
    this.btnSound = this.button('', () => { this.sfx.enabled = !this.sfx.enabled; this.settings.setCustom('sound', this.sfx.enabled); this.refreshHud(); }, 74);
    this.btnTest = new Button({ width: 130, height: 40, text: '▶  TESTER', label: { size: 14, bold: true }, onClick: () => { this.sfx.onClick(); this.toggleSim(); } });
    this.stage.addChild(this.topBar, this.botBar);
    for (const o of [this.lblTitle, this.btnLevel, this.lblBudget, this.barBudget, this.lblStress, this.barStress, this.lblHint, this.lblToast,
      ...this.matButtons.values(), this.btnUndo, this.btnRedo, this.btnClear, this.btnSpeed, this.btnGrid, this.btnSound, this.btnTest]) this.stage.addChild(o);
    this.flow = [
      { bar: 'top', items: [this.lblTitle, this.btnLevel, this.lblBudget, this.barBudget, this.lblStress, this.barStress] },
      { bar: 'bot', items: [...MATERIAL_ORDER.map((m) => this.matButtons.get(m)!), this.btnDelete, this.btnUndo, this.btnRedo, this.btnClear, this.btnSpeed, this.btnGrid, this.btnSound, this.btnTest] },
    ];
  }
  private undo(): void { if (!this.sim) this.restore(this.history.undo()); }
  private redo(): void { if (!this.sim) this.restore(this.history.redo()); }
  private clearAll(): void {
    if (this.sim || this.structure.beams.length === 0) return;
    this.structure = { nodes: this.structure.nodes.filter((n) => n.fixed), beams: [] };
    this.sfx.onDelete();
    this.commit();
  }

  private refreshHud(): void {
    const cost = Math.round(structureCost(this.structure));
    const over = cost > this.level.budget;
    this.lblBudget.setText(`Budget  ${cost} € / ${this.level.budget} €`);
    this.barBudget.setValue(Math.min(cost, this.level.budget), this.level.budget);
    this.barBudget.setColor(over ? 0xf43f5e : cost > this.level.budget * 0.8 ? 0xf59e0b : 0x10b981);
    for (const [t, b] of this.matButtons) {
      const sel = t === this.tool;
      b.setText(sel ? `● ${this.labelFor(t)}` : this.labelFor(t));
    }
    this.btnUndo.setDisabled(!!this.sim || !this.history.canUndo);
    this.btnRedo.setDisabled(!!this.sim || !this.history.canRedo);
    this.btnClear.setDisabled(!!this.sim);
    this.btnSpeed.setText(`${this.speed === 0.5 ? '½' : this.speed}×`);
    this.btnGrid.setText(`Grille ${this.snapOn ? 'ON' : 'OFF'}`);
    this.btnSound.setText(this.sfx.enabled ? 'Son ON' : 'Son OFF');
    this.btnTest.setText(this.sim ? '🛠  ÉDITER' : '▶  TESTER');
    if (!this.sim) this.setStress(0);
  }
  private labelFor(t: Tool): string {
    if (t === 'delete') return 'Effacer';
    const m = MATERIALS[t];
    const prev = this.levelIdx > 0 ? LEVELS[this.levelIdx - 1].materials : [];
    return `${prev.includes(t) || this.levelIdx === 0 ? '' : '✦ '}${m.name}  ${m.cost}€/m`;
  }
  private setStress(r: number): void {
    const pct = Math.min(100, Math.round(r * 100));
    this.lblStress.setText(`Contrainte  ${pct} %`);
    this.barStress.setValue(Math.min(1, r), 1);
    this.barStress.setColor(r > 0.8 ? 0xf43f5e : r > 0.5 ? 0xf59e0b : 0x10b981);
  }

  /** Dispose des éléments en ligne, avec retour à la ligne si la fenêtre est étroite. */
  private layoutHud(): void {
    const { vw, vh } = this;
    if (!vw) return;
    const place = (items: Container[], gap: number, pad: number) => {
      let x = pad, y = pad, rowH = 0, rows = 1;
      for (const it of items) {
        const w = it.width, h = it.height;
        if (x + w > vw - pad && x > pad) { x = pad; y += rowH + 6; rowH = 0; rows++; }
        it.position.set(x, y);
        x += w + gap; rowH = Math.max(rowH, h);
      }
      return y + rowH + pad;
    };
    // barre haute : titre, niveau, jauges (label au-dessus de la barre)
    const topItems = [this.lblTitle, this.btnLevel];
    let topH = place(topItems, 12, 10);
    let x = this.btnLevel.x + this.btnLevel.width + 24;
    const gy = 8;
    if (x + 150 + 24 + 120 > vw - 10) { x = 10; }
    const hudY = x === 10 ? topH : gy;
    this.lblBudget.position.set(x, hudY); this.barBudget.position.set(x, hudY + 20);
    const x2 = x + 210;
    this.lblStress.position.set(x2, hudY); this.barStress.position.set(x2, hudY + 20);
    topH = Math.max(topH, hudY + 36);
    this.topH = topH;
    // barre basse
    const botItems = [...MATERIAL_ORDER.map((m) => this.matButtons.get(m)!).filter((b) => b.visible), this.btnDelete, this.btnUndo, this.btnRedo, this.btnClear, this.btnSpeed, this.btnGrid, this.btnSound, this.btnTest];
    const h = place(botItems, 8, 8);
    const oy = vh - h;
    for (const it of botItems) it.y += oy;
    if (h <= 56) { this.btnTest.x = vw - this.btnTest.width - 10; }
    this.botY = oy;
    this.lblHint.position.set(10, this.topH + 6);
    this.lblHint.style.wordWrap = true;
    this.lblHint.style.wordWrapWidth = Math.max(160, vw - 20);
    this.topBar.clear().rect(0, 0, vw, this.topH).fill({ color: 0x0f172a, alpha: 0.92 }).rect(0, this.topH - 1, vw, 1).fill(0x1e293b);
    this.botBar.clear().rect(0, oy, vw, h).fill({ color: 0x0f172a, alpha: 0.92 }).rect(0, oy, vw, 1).fill(0x1e293b);
    // caméra : le monde 800×550 tient dans l'espace libre
    const availH = oy - this.topH, availW = vw;
    const view = this.level?.view ?? { x: 0, y: 0, w: WORLD_W, h: WORLD_H };
    const zoom = Math.min(availW / view.w, availH / view.h);
    this.camera.setViewport(vw, availH, 0, this.topH);
    this.camera.zoom = zoom;
    this.camera.snapTo(view.x + view.w / 2, view.y + view.h / 2);
    this.camera.update(0);
  }
  private topH = 54;
  private botY = 0;

  override resize(w: number, h: number): void {
    this.vw = w; this.vh = h;
    this.effects.setViewport(w, h);
    this.windows.setViewport(w, h);
    this.layoutHud();
  }

  private onKey(e: KeyboardEvent): void {
    if (e.repeat) return;
    if (e.code === 'Space') { e.preventDefault(); if (this.windows.isEmpty) this.toggleSim(); }
    else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') { e.preventDefault(); this.redo(); }
    else if (e.code === 'Delete' || e.code === 'KeyX') { this.tool = 'delete'; this.refreshHud(); }
    else if (e.code === 'KeyG') { this.btnGrid.onClick.dispatch(); }
    else if (e.code >= 'Digit1' && e.code <= 'Digit5') {
      const m = MATERIAL_ORDER[Number(e.code.slice(5)) - 1];
      if (this.level.materials.includes(m)) { this.tool = m; this.refreshHud(); }
    }
  }

  // ------------------------------------------------------------------ boucle
  override update(dt: number): void {
    this.time += dt;
    if (this.sim) {
      this.acc += dt * this.speed;
      let n = 0;
      while (this.acc >= FRAME_DT && this.sim.status === 'running' && n++ < 12) {
        this.sim.step();
        this.acc -= FRAME_DT;
        this.handleEvents();
      }
      this.setStress(this.sim.curRatio);
      if (this.sim.status !== 'running' && this.windows.isEmpty) {
        // laisse un instant pour voir la chute
        this.endTimer += dt;
        if (this.endTimer > (this.sim.status === 'won' ? 0.2 : 0.8)) { this.endTimer = 0; this.showResult(); }
      } else this.endTimer = 0;
    }
    this.debris.update(dt); this.spray.update(dt);
    this.camera.update(dt);
    this.effects.update(dt);
    this.windows.update(dt);
    if (this.toastT > 0) this.toastT -= dt;
    this.overBudgetFlash = Math.max(0, this.overBudgetFlash - dt * 2);
    const preview = !this.sim && this.drag ? { from: this.drag.from, to: this.snap(this.pointer) } : null;
    drawScene.dynamic(this.layers, {
      level: this.level, structure: this.structure, sim: this.sim, time: this.time, preview,
      tool: this.tool, hoverNode: !this.sim && this.pointerIn ? this.nodeAt(this.snap(this.pointer)) : -1,
      pointer: this.pointerIn && !this.sim ? this.snap(this.pointer) : null, flash: this.overBudgetFlash,
      ropePoint: !this.sim && this.pointerIn && this.tool === 'cable' && this.nodeAt(this.snap(this.pointer)) < 0 ? (ropeHit(this.structure, this.pointer)?.pos ?? null) : null,
    });
    this.updateCar(dt);
    this.clouds?.update(dt);
    this.lblToast.visible = this.toastT > 0;
    if (this.toastT > 0) { this.lblToast.setText(this.toastMsg); this.lblToast.position.set((this.vw - this.lblToast.width) / 2, this.botY - 40); }
    this.lblHint.visible = !this.sim && this.structure.beams.length === 0;
  }
  private endTimer = 0;

  private setCar(state: CarState): void {
    if (!this.car || this.carState === state) return;
    this.carState = state;
    this.car.play(state, true);
  }
  private updateCar(dt: number): void {
    const car = this.car;
    if (!car) return;
    const lv = this.level, sim = this.sim;
    if (!sim) {
      this.setCar('idle');
      car.position.set(lv.x0 - lv.vehicle.width, lv.deckY - 5 + 5);
      car.rotation = 0;
    } else {
      this.setCar(sim.crashed ? 'destroyed' : sim.time <= SETTLE ? 'idle' : 'ride');
      car.position.set(sim.carX, sim.carY + 5);
      car.rotation = sim.angle;
    }
    car.update(dt * (sim ? this.speed : 1));
  }
}
