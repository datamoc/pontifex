import { buildPopulation, type Population } from './population.ts';
import { BIOMES, randomBiome, type Biome } from './biomes.ts';
import {
  Game, Scene2D, Button, Label, Sprite2D, Bar, WindowStack, ScreenEffects, ParticleEmitter, Shape2D, Node2D, TextPrompt, Tooltip,
} from '@datamoc/mwg/two-d';
import { texture } from '@datamoc/mwg/assets';
import { Camera } from '@datamoc/mwg/two-d/render';
import { Settings, UndoHistory, Input, FixedStepper } from '@datamoc/mwg/core';
import { Texture, FederatedPointerEvent, Rectangle, type Container } from 'pixi.js';
import { LevelPicker } from './level-picker.ts';
import { ScrollText } from './scroll.ts';
import { PopIn, TileShrink, prefersReducedMotion } from './transitions.ts';
import {
  MATERIALS, MATERIAL_ORDER, SHIPS, WORLD_H, WORLD_W, type LevelDef, type MaterialId, type Pt,
} from './data.ts';
import { BridgeSim, FRAME_DT, SETTLE, WHEEL_R, structureCost, type Structure } from './physics.ts';
import { Sfx } from './audio.ts';
import { BackgroundMusic, drawTrackId } from './music.ts';
import { LEVELS as BUILTIN_LEVELS } from './levels.ts';
import { deriveLevel, isInsideWorld, isSolid, slug, type LevelSpec } from './level.ts';
import { ProgressStore, rateAttempt } from './progress.ts';
import { accessibleIndexes, isLevelUnlocked, navigationTargets, type NavigationTargets } from './level-navigation.ts';
import type { Window } from '@datamoc/mwg/two-d';
import { buildConfirmWindow, buildLevelsWindow, buildMusicWindow, buildResultWindow } from './dialogs.ts';
import { CustomLevels, parseLevelFile } from './custom-levels.ts';
import { LevelEditor } from './editor-ui.ts';
import { newSpec } from './editor.ts';
import { ropeHit, splitBeam, prune, nearestNode, chainStart, beamNear, beamExists, snapPoint, type RopeHit } from './structure.ts';
import { drawScene, type Layers } from './render.ts';
import { buildClouds, buildDecor, buildFleet, buildLandscape, makeVehicle, type CarState, type Clouds, type Fleet, type Vehicle } from './art.ts';

type Tool = MaterialId | 'delete';
const SNAP_R = 14;
/** aimantation au clic : le point d'accroche proche du curseur brut l'emporte, même hors case de grille */
const MAGNET_R = 22;
/** largeur de la liste déroulante des niveaux, assez pour « 3. Le Fleuve profond  (verrouillé) » */
const PICKER_WIDTH = 290;

const clone = (s: Structure): Structure => JSON.parse(JSON.stringify(s));

interface BuildStart { from: Pt; fromIdx: number; fromRope: RopeHit | null }

export class PontifexScene extends Scene2D {
  private settings = new Settings({ namespace: 'pontifex' });
  private sfx = new Sfx();
  private music = new BackgroundMusic();
  private progress = new ProgressStore(this.settings);
  private customLevels = new CustomLevels(this.settings);

  // --- état de jeu
  private levelIdx = 0;
  private biome: Biome = BIOMES[0];
  private level!: LevelDef;
  /** niveaux du jeu puis niveaux personnalisés */
  private levels: LevelDef[] = [...BUILTIN_LEVELS];
  private editing = false;
  /** brouillon en cours d'essai depuis l'éditeur */
  private testingSpec: LevelSpec | null = null;
  private editor!: LevelEditor;
  private lastHint = '';
  private structure!: Structure;
  private history = new UndoHistory<string>({ limit: 100 });
  private tool: Tool = 'road';
  private snapOn = true;
  private sim: BridgeSim | null = null;
  private stepper = new FixedStepper(FRAME_DT, 12);
  /** Vitesse de lecture ; les unités physiques restent celles du temps réel. */
  private speed = 0.5;
  private carDistance = 0;
  private overBudgetFlash = 0;

  // --- interaction
  private drag: BuildStart | null = null;
  private pendingStart: BuildStart | null = null;
  private pressAt: Pt | null = null;
  private activePointer: number | null = null;
  private touchAction: { point: Pt; button: number } | null = null;
  private touches = new Map<number, Pt>();
  private pinching = false;
  private pinch: { distance: number; zoom: number; anchor: Pt } | null = null;
  private fitZoom = 1;
  private touchHandler = (event: PointerEvent) => this.handleTouch(event);
  private pointer: Pt = { x: 0, y: 0 };
  private pointerIn = false;

  // --- scène
  private camera = new Camera();
  private world!: Container;
  private layers!: Layers;
  private clouds: Clouds | null = null;
  private population: Population | null = null;
  private car: Vehicle | null = null;
  private fleet: Fleet | null = null;
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
  /** « Éditeur » / « Essai du brouillon » : ouvre la fenêtre de gestion des niveaux */
  private btnLevel!: Button;
  /** premier · précédent · liste déroulante · suivant · dernier, pour jouer */
  private levelNav = new Node2D();
  private levelPicker!: LevelPicker;
  private navButtons!: Record<keyof NavigationTargets, Button>;
  private navTargets: NavigationTargets = { first: null, previous: null, next: null, last: null };
  private lblBudget = new Label({ text: '', size: 13 });
  private barBudget = new Bar({ width: 150, height: 10, color: 0x10b981, background: 0x1e293b, max: 1 });
  private lblStress = new Label({ text: '', size: 13 });
  private barStress = new Bar({ width: 120, height: 10, color: 0x10b981, background: 0x1e293b, max: 1 });
  /** consigne du niveau : défile au-delà de 3 lignes (écrans étroits) */
  private lblHint = new ScrollText({ width: 600, maxHeight: 58, size: 13, bold: true, color: 0x0b1220 });
  private lblToast = new Label({ text: '', size: 15, bold: true, color: 0xfda4af });
  private matButtons = new Map<Tool, Button>();
  private btnDelete!: Button;
  private btnUndo!: Button;
  private btnRedo!: Button;
  private btnClear!: Button;
  private btnSpeed!: Button;
  private lblCarSpeed = new Label({ text: '0 km/h', size: 13, color: 0xcbd5e1 });
  private btnGrid!: Button;
  private btnSound!: Button;
  private btnMusic!: Button;
  private btnMusicPause!: Button;
  private btnMusicNext!: Button;
  private btnFullscreen!: Button;
  private buttonIcons = new Map<Button, Sprite2D>();
  /** explication des boutons à icône, affichée quand le pointeur s'y attarde */
  private tooltip = new Tooltip({ delay: 0.6, maxWidth: 260 });
  private tips = new Map<Button, () => string>();
  /** transition entre deux niveaux : tuiles de l'ancien écran qui rétrécissent */
  private transition: TileShrink | null = null;
  private pops: PopIn[] = [];
  /** position du pointeur (souris ou stylet) dans le repère de l'écran, ou null hors du canevas */
  private screenPointer: Pt | null = null;
  private hoverHandler = (event: PointerEvent) => this.trackScreenPointer(event);
  private btnTest!: Button;
  private btnBack!: Button;
  private vw = 0;
  private vh = 0;
  private keyHandler = (e: KeyboardEvent) => this.onKey(e);
  private fullscreenHandler = () => this.refreshHud();
  private actionHandler = (a: string) => { if (!this.windows.isEmpty) return this.windows.handleAction(a); };

  create(): void {
    this.progress.load();
    this.customLevels.load();
    this.rebuildLevels();
    const saved = this.settings.getCustom('level2', 0);
    this.sfx.enabled = this.settings.getCustom('sound', true) !== false;
    this.music.setEnabled(this.sfx.enabled);
    // Tirage au sort au lancement, sauf « Sans musique » déjà choisi.
    const savedMusic = String(this.settings.getCustom('music', '__unset__'));
    this.music.select(savedMusic === '' ? '' : drawTrackId());
    this.snapOn = this.settings.getCustom('grid', true) !== false;

    this.world = this.camera.world;
    this.stage.addChild(this.world);
    const L = (n: string) => { const s = new Shape2D(); s.label = n; return s; };
    this.layers = { sky: L('sky'), clouds: new Node2D(), landscape: new Node2D(), ships: new Node2D(), back: L('back'), wildlife: new Node2D(), decor: new Node2D(), grid: L('grid'), bridge: L('bridge'), car: new Node2D(), front: L('front'), fx: new Node2D() };
    this.world.addChild(this.layers.sky, this.layers.clouds, this.layers.landscape, this.layers.ships, this.layers.back, this.layers.wildlife, this.layers.decor, this.layers.grid, this.layers.bridge, this.layers.car, this.layers.front, this.layers.fx);
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
    this.world.on('pointerupoutside', () => this.cancelBuild());
    this.world.on('pointercancel', () => this.cancelBuild());
    this.world.on('pointerleave', () => { this.pointerIn = false; });

    const canvas = Game.current.app.canvas;
    canvas.style.touchAction = 'none';
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
      canvas.addEventListener(type, this.touchHandler as EventListener, { capture: true, passive: false });
    }

    this.buildHud();
    this.editor = new LevelEditor(this.editorHost());
    for (const it of this.editor.items) this.stage.addChild(it);
    this.stage.addChild(this.effects, this.windows, this.tooltip);
    // clic droit = effacer : pas de menu contextuel du navigateur par-dessus le jeu
    Game.current.app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    for (const type of ['pointermove', 'pointerdown', 'pointerleave']) canvas.addEventListener(type, this.hoverHandler as EventListener);
    window.addEventListener('keydown', this.keyHandler);
    window.addEventListener('fullscreenchange', this.fullscreenHandler);
    Input.onAction.add(this.actionHandler);
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => { e.preventDefault(); void e.dataTransfer?.files[0]?.text().then((t) => this.importText(t)); });
    this.loadLevel(Math.min(Number(saved) || 0, BUILTIN_LEVELS.length - 1));
    if (location.hash === '#debug') (window as unknown as Record<string, unknown>).__pontifex = this;
    this.resize(this.vw || window.innerWidth, this.vh || window.innerHeight);
  }

  override teardown(): void {
    this.transition?.destroy();
    this.music.dispose();
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
      Game.current.app.canvas.removeEventListener(type, this.touchHandler as EventListener, true);
    }
    this.touches.clear();
    this.cancelBuild();
    for (const type of ['pointermove', 'pointerdown', 'pointerleave']) Game.current.app.canvas.removeEventListener(type, this.hoverHandler as EventListener);
    window.removeEventListener('keydown', this.keyHandler);
    window.removeEventListener('fullscreenchange', this.fullscreenHandler);
    Input.onAction.remove(this.actionHandler);
    super.teardown();
  }

  // ------------------------------------------------------------------ progression
  private get builtinCount(): number { return BUILTIN_LEVELS.length; }
  /** Un niveau intégré s'ouvre dès que le précédent a au moins une étoile ; les niveaux du joueur sont toujours ouverts. */
  private unlocked(idx: number): boolean { return isLevelUnlocked(idx, this.builtinCount, (previous) => this.progress.starsOf(this.levels[previous].id)); }

  // ------------------------------------------------------------------ niveau
  /** Capture l'écran de jeu avant un changement de niveau, pour que ses tuiles rétrécissent par-dessus le nouveau. */
  private captureForTransition(): TileShrink | null {
    this.transition?.destroy();
    this.transition = null;
    const height = this.botY - this.topH;
    if (!this.level || this.editing || !this.vw || height <= 0 || prefersReducedMotion()) return null;
    return new TileShrink(Game.current.app.renderer, this.stage, new Rectangle(0, this.topH, this.vw, height));
  }

  private startTransition(tiles: TileShrink | null): void {
    if (!tiles) return;
    this.stage.addChildAt(tiles.container, this.stage.getChildIndex(this.world) + 1);
    this.transition = tiles;
  }

  private loadLevel(idx: number): void {
    const tiles = this.captureForTransition();
    this.levelIdx = idx;
    this.editing = false;
    this.testingSpec = null;
    if (idx < this.builtinCount) this.settings.setCustom('level2', idx);
    this.applyLevel(this.levels[idx]);
    this.startTransition(tiles);
  }

  /** Installe un niveau : décor, ancrages, véhicule, interface. */
  private applyLevel(level: LevelDef): void {
    this.level = level;
    this.biome = randomBiome();
    this.sim = null;
    this.windows.closeAll();
    this.structure = { nodes: this.level.anchors.map((a) => ({ x: a.x, y: a.y, fixed: true })), beams: [] };
    this.history.clear();
    this.history.push(JSON.stringify(this.structure));
    this.cancelBuild();
    this.chain = null;
    this.debris.clear(); this.spray.clear();
    if (this.tool !== 'delete' && !this.level.materials.includes(this.tool)) this.tool = this.level.materials[0];
    const v = this.level.vehicle;
    this.lblHint.setText(`${this.level.hint}  ·  ${this.biome.name}  ·  Véhicule : ${v.name}, ${(v.mass / 10).toFixed(1).replace('.', ',')} t`);
    drawScene.static(this.layers, this.level, this.snapOn, this.biome);
    buildLandscape(this.level, this.layers.landscape, this.biome);
    this.fleet = buildFleet(this.level, this.layers.ships);
    buildDecor(this.level, this.layers.decor, this.biome);
    this.layers.wildlife.removeChildren().forEach((child) => child.destroy());
    this.population = buildPopulation(this.level, this.biome, this.layers.decor, this.layers.wildlife);
    this.layers.car.removeChildren().forEach((c) => c.destroy());
    this.car = makeVehicle(this.level.vehicle);
    this.layers.car.addChild(this.car);
    this.carState = '';
    this.updateVisibility();
    this.refreshHud();
    this.layoutHud();
  }

  /** Quels éléments d'interface sont visibles : jeu, essai depuis l'éditeur, ou éditeur. */
  private updateVisibility(): void {
    this.cancelBuild();
    const play = !this.editing;
    for (const [t, b] of this.matButtons) b.visible = play && (t === 'delete' || this.level.materials.includes(t));
    for (const b of [this.btnUndo, this.btnRedo, this.btnClear, this.btnSpeed, this.btnGrid, this.btnSound, this.btnMusic, this.btnMusicPause, this.btnMusicNext, this.btnFullscreen, this.btnTest]) b.visible = play;
    for (const o of [this.lblBudget, this.barBudget, this.lblStress, this.barStress, this.lblCarSpeed]) o.visible = play;
    this.btnBack.visible = play && this.testingSpec !== null;
    for (const it of this.editor?.items ?? []) it.visible = this.editing;
    const navigating = !this.editing && this.testingSpec === null;
    this.levelNav.visible = navigating;
    if (this.btnLevel) {
      this.btnLevel.visible = !navigating;
      this.btnLevel.setText(this.editing ? '▾ Éditeur' : '▾ Essai du brouillon');
    }
    this.refreshLevelNav();
  }

  // ------------------------------------------------------------------ édition
  private snap(p: Pt): Pt { return snapPoint(p, this.snapOn); }
  private nodeAt(p: Pt, r = SNAP_R): number {
    return nearestNode(this.structure.nodes, p, r);
  }
  /** Point d'accroche sous le curseur : nœud aimanté (curseur brut d'abord), sinon case de grille. */
  private magnetAt(raw: Pt): number {
    const idx = this.nodeAt(raw, MAGNET_R);
    return idx >= 0 ? idx : this.nodeAt(this.snap(raw));
  }
  /** Fin du dernier élément créé, si elle existe encore (annuler/effacer l'a peut-être retirée). */
  private chain: Pt | null = null;
  private chainNode(): number {
    return this.chain ? this.nodeAt(this.chain, 6) : -1;
  }
  /** Nœud de chaînage utilisable depuis `raw`, ou -1 : il faut cliquer à portée du dernier point. */
  private chainTarget(raw: Pt): number {
    if (this.tool === 'delete' || !this.chain) return -1;
    if (chainStart(this.chain, raw, MATERIALS[this.tool].maxLen) === null) return -1;
    return this.chainNode();
  }
  private setTool(t: Tool): void {
    this.cancelBuild();
    this.tool = t;
    this.chain = null; // la portée change : le chaînage ne suit pas
    this.refreshHud();
  }
  /** Où la poutre atterrira : nœud aimanté sous le curseur, sinon point de grille (comme onUp). */
  private previewTo(raw: Pt): Pt {
    const idx = this.magnetAt(raw);
    if (idx >= 0) { const n = this.structure.nodes[idx]; return { x: n.x, y: n.y }; }
    return this.snap(raw);
  }
  /** Nœud survolé : aimant d'abord, puis point chaîné (anneau bleu = départ du prochain élément). */
  private hoverAt(raw: Pt): number {
    const idx = this.magnetAt(raw);
    if (idx >= 0 || this.tool === 'delete') return idx;
    return this.chainTarget(raw);
  }
  private solid(p: Pt): boolean { return isSolid(this.level, p); }
  private inWorld(p: Pt): boolean { return isInsideWorld(this.level, p); }
  private commit(): void {
    this.prune();
    this.history.push(JSON.stringify(this.structure));
    this.refreshHud();
  }
  private prune(): void { this.structure = prune(this.structure); }
  private restore(json: string | null): void {
    if (json === null) return;
    this.cancelBuild();
    this.chain = null;
    this.structure = JSON.parse(json);
    this.sfx.onDelete();
    this.refreshHud();
  }
  private toWorld(e: FederatedPointerEvent): Pt {
    const p = this.world.toLocal(e.global);
    return { x: p.x, y: p.y };
  }

  private cancelBuild(): void {
    this.drag = null;
    this.pendingStart = null;
    this.pressAt = null;
    this.activePointer = null;
    this.touchAction = null;
  }

  /** Le pincement prend la main avant Pixi et ne produit aucune action de construction. */
  private handleTouch(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;
    const canvas = Game.current.app.canvas;
    const bounds = canvas.getBoundingClientRect();
    const point = {
      x: (event.clientX - bounds.left) * this.vw / bounds.width,
      y: (event.clientY - bounds.top) * this.vh / bounds.height,
    };
    if (event.type === 'pointerdown') {
      if (!this.windows.isEmpty || point.y < this.topH || point.y >= this.botY) return;
      this.touches.set(event.pointerId, point);
      canvas.setPointerCapture(event.pointerId);
      if (this.touches.size === 2) {
        this.cancelBuild();
        this.pinching = true;
        const [a, b] = [...this.touches.values()];
        this.pinch = {
          distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
          zoom: this.camera.zoom,
          anchor: this.camera.toWorld((a.x + b.x) / 2, (a.y + b.y) / 2),
        };
      }
    } else if (!this.touches.has(event.pointerId)) return;
    else if (event.type === 'pointermove') {
      this.touches.set(event.pointerId, point);
      if (this.pinch && this.touches.size === 2 && this.windows.isEmpty) {
        const [a, b] = [...this.touches.values()];
        this.camera.zoom = Math.max(this.fitZoom * 0.5, Math.min(this.fitZoom * 4,
          this.pinch.zoom * Math.hypot(b.x - a.x, b.y - a.y) / this.pinch.distance));
        const underFingers = this.camera.toWorld((a.x + b.x) / 2, (a.y + b.y) / 2);
        this.camera.snapTo(this.camera.x + this.pinch.anchor.x - underFingers.x,
          this.camera.y + this.pinch.anchor.y - underFingers.y);
        this.camera.update(0);
      }
    }
    const suppress = this.pinching || event.type === 'pointercancel';
    if (event.type === 'pointerup' || event.type === 'pointercancel') {
      this.touches.delete(event.pointerId);
      if (this.touches.size < 2) this.pinch = null;
      if (this.touches.size === 0) this.pinching = false;
      if (suppress) this.cancelBuild();
    }
    if (suppress) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  private onDown(e: FederatedPointerEvent): void {
    this.closeLevelPicker();
    if (this.sim || !this.windows.isEmpty || this.pinching) return;
    const raw = this.toWorld(e);
    this.pointer = raw;
    this.activePointer = e.pointerId;
    this.pressAt = { x: e.global.x, y: e.global.y };
    if (this.editing || e.button === 2 || this.tool === 'delete') {
      this.pendingStart = null;
      this.drag = null;
      if (e.pointerType === 'touch') this.touchAction = { point: raw, button: e.button };
      else if (this.editing) this.editor.pointer(this.snap(raw), e.button);
      else this.deleteAt(raw);
      return;
    }
    if (this.pendingStart) { this.drag = this.pendingStart; return; }
    const p = this.snap(raw);
    let idx = this.magnetAt(raw);
    // un câble fin peut s'accrocher n'importe où sur un câble porteur
    const rope = idx < 0 && this.tool === 'cable' ? ropeHit(this.structure, raw) : null;
    if (idx < 0 && !rope) {
      // chaînage : on repart de la fin du dernier élément, sauf clic au-delà de sa portée
      idx = this.chainTarget(raw);
      if (idx < 0) this.chain = null;
    }
    const from = idx >= 0 ? { x: this.structure.nodes[idx].x, y: this.structure.nodes[idx].y } : rope ? rope.pos : p;
    if (idx < 0 && !rope && (this.solid(p) || !this.inWorld(p))) return;
    this.drag = { from, fromIdx: idx, fromRope: rope };
  }
  private onMove(e: FederatedPointerEvent): void {
    this.pointer = this.toWorld(e);
    this.pointerIn = true;
  }
  private onUp(e: FederatedPointerEvent): void {
    if (e.pointerId !== this.activePointer) return;
    const press = this.pressAt;
    const d = this.drag;
    this.drag = null;
    this.activePointer = null;
    this.pressAt = null;
    if (this.sim || !this.windows.isEmpty || this.pinching) { this.cancelBuild(); return; }
    const raw = this.toWorld(e);
    this.pointer = raw;
    const tapped = !!press && Math.hypot(e.global.x - press.x, e.global.y - press.y) < 8;
    if (this.touchAction) {
      const action = this.touchAction;
      this.touchAction = null;
      if (tapped) {
        if (this.editing) this.editor.pointer(this.snap(action.point), action.button);
        else this.deleteAt(action.point);
      }
      return;
    }
    if (!d) return;
    if (tapped && !this.pendingStart) { this.pendingStart = d; return; }
    const pEnd = this.snap(raw);
    const endIdx = this.magnetAt(raw);
    const endRope = endIdx < 0 && this.tool === 'cable' ? ropeHit(this.structure, raw) : null;
    const to = endIdx >= 0 ? { x: this.structure.nodes[endIdx].x, y: this.structure.nodes[endIdx].y } : endRope ? endRope.pos : pEnd;
    const mat = MATERIALS[this.tool as MaterialId];
    const len = Math.hypot(to.x - d.from.x, to.y - d.from.y);
    if (len < 10) { this.pendingStart = null; return; }
    if (len > mat.maxLen) { this.reject('Trop long pour ce matériau'); return; }
    if (endIdx < 0 && !endRope && (this.solid(to) || !this.inWorld(to))) return;
    if (d.fromRope && endRope) { this.reject('Une suspente relie le câble porteur au tablier'); return; }
    const mid = { x: (to.x + d.from.x) / 2, y: (to.y + d.from.y) / 2 };
    if (this.solid(mid)) return;
    const cost = (len / 10) * mat.cost;
    if (structureCost(this.structure) + cost > this.level.budget + 1e-6) { this.reject('Budget dépassé'); return; }
    let a = d.fromIdx, b = endIdx;
    if (a >= 0 && a === b) return;
    if (a >= 0 && b >= 0 && beamExists(this.structure, a, b)) return;
    if (a < 0) a = d.fromRope ? splitBeam(this.structure, d.fromRope.beam, d.fromRope.pos) : this.addNode(d.from);
    if (b < 0) b = endRope ? splitBeam(this.structure, endRope.beam, endRope.pos) : this.addNode(to);
    this.pendingStart = null;
    this.structure.beams.push({ a, b, mat: mat.id });
    this.chain = { x: to.x, y: to.y };
    this.sfx.onBuild();
    this.commit();
  }
  private addNode(p: Pt): number {
    this.structure.nodes.push({ x: p.x, y: p.y, fixed: false });
    return this.structure.nodes.length - 1;
  }
  private deleteAt(p: Pt): void {
    const best = beamNear(this.structure, p);
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

  /** Plein écran : l’icône change selon l’état (⤢ entrer, ⤡ sortir). */
  private toggleFullscreen(): void {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else document.documentElement.requestFullscreen().catch(() => {
      this.toastMsg = 'Plein écran indisponible';
      this.toastT = 1.6;
    });
  }

  // ------------------------------------------------------------------ simulation
  private toggleSim(): void {
    if (this.sim) { this.stopSim(); return; }
    if (this.structure.beams.length === 0) { this.reject('Construis d’abord un pont !'); return; }
    this.sim = new BridgeSim(this.level, clone(this.structure));
    this.carDistance = 0;
    this.stepper.reset();
    this.cancelBuild();
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
        this.debris.burst(14, { x: ev.x, y: ev.y, tint: MATERIALS[sim.links[ev.beam].mat].color });
        this.camera.shake(3, 0.25);
      } else if (ev.type === 'crash') {
        this.sfx.onBreak();
        this.camera.shake(4, 0.3);
      } else if (ev.type === 'splash') {
        this.sfx.onSplash();
        this.spray.burst(40, { x: ev.x, y: this.level.waterY });
        this.camera.shake(5, 0.35);
      } else if (ev.type === 'ship') {
        this.sfx.onShip();
        this.toastMsg = `⚓ ${SHIPS[ev.ship].name} sous le pont : tout ce qui touche sa coque casse !`; this.toastT = 3;
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
    const rating = rateAttempt({ won, cost, budget: this.level.budget, maxRatio: sim.maxRatio });
    const testing = this.testingSpec;
    if (won && testing) testing.solution = clone(this.structure);
    else if (won) { this.progress.record(this.level.id, rating.stars); this.refreshLevelNav(); }
    const custom = this.levelIdx >= this.builtinCount;
    const lastBuiltin = this.levelIdx >= this.builtinCount - 1;
    const nextLabel = !won ? 'Revoir la chute' : testing ? '↩ Éditeur' : custom ? 'Niveaux' : lastBuiltin ? 'Recommencer' : 'Suivant →';
    this.showWindow(buildResultWindow({
      won, testing: testing !== null, rating, cost, maxRatio: sim.maxRatio, nextLabel,
      onModify: () => this.stopSim(),
      onNext: () => {
        if (!won) { this.stopSim(); this.toggleSim(); }
        else if (testing) this.backToEditor();
        else if (custom) { this.stopSim(); this.showLevels(); }
        else this.loadLevel(lastBuiltin ? 0 : this.levelIdx + 1);
      },
    }));
  }

  private showLevels(): void {
    this.cancelBuild();
    this.windows.closeAll();
    const customs = this.customLevels.all;
    this.showWindow(buildLevelsWindow({
      builtin: this.levels.slice(0, this.builtinCount).map((level, i) => ({
        label: level.label, name: level.name, stars: this.progress.starsOf(level.id), unlocked: this.unlocked(i),
      })),
      customs: customs.map((spec) => ({ name: spec.name, validated: !!spec.solution, stars: this.progress.starsOf(spec.id) })),
      onPlayBuiltin: (index) => this.loadLevel(index),
      onPlayCustom: (index) => this.loadLevel(this.builtinCount + index),
      onEdit: (index) => this.enterEditor(customs[index]),
      onDelete: (index) => this.confirm(`Supprimer « ${customs[index].name} » ?`, () => {
        this.customLevels.remove(index);
        this.rebuildLevels();
        this.showLevels();
      }),
      onNew: () => this.enterEditor(null),
      onImportText: (text) => this.importText(text),
      onClipboardDenied: () => this.reject('Presse-papiers inaccessible : dépose plutôt le fichier .json sur la page'),
    }));
  }

  /** Ouvre une fenêtre avec un jaillissement depuis son centre (sans mouvement si l'utilisateur le préfère). */
  private showWindow(win: Window): void {
    this.windows.push(win);
    if (!prefersReducedMotion()) this.pops.push(new PopIn(win, win.width, win.height));
  }

  private confirm(message: string, onYes: () => void): void {
    this.cancelBuild();
    this.showWindow(buildConfirmWindow(message, onYes));
  }

  // ------------------------------------------------------------------ niveaux personnalisés
  private rebuildLevels(): void {
    this.levels = [...BUILTIN_LEVELS, ...this.customLevels.levels()];
    this.refreshLevelNav();
  }

  private importText(text: string): void {
    const parsed = parseLevelFile(text);
    if ('error' in parsed) { this.reject(parsed.error); return; }
    this.customLevels.add(parsed.spec);
    this.rebuildLevels();
    this.toastMsg = `Niveau « ${parsed.spec.name} » importé`; this.toastT = 2.5;
    this.showLevels();
  }

  private editorHost() {
    return {
      click: () => this.sfx.onClick(),
      toast: (m: string) => this.reject(m),
      preview: (spec: LevelSpec) => this.previewDraft(spec),
      askText: (title: string, initial: string, max: number, done: (v: string) => void) => {
        const prompt = new TextPrompt({
          width: 460, height: 230, title, initialValue: initial, maxLength: max, validate: (v) => (v.trim() ? null : 'Texte requis'),
          onConfirm: (v) => { prompt.close(); done(v); }, onCancel: () => prompt.close(),
        });
        this.showWindow(prompt);
      },
      playtest: (spec: LevelSpec) => this.playtest(spec),
      save: (spec: LevelSpec) => this.saveDraft(spec),
      exportSpec: (spec: LevelSpec) => this.exportSpec(spec),
      quit: () => { this.editing = false; this.loadLevel(Math.min(this.levelIdx, this.levels.length - 1)); },
    };
  }

  private editingId = 0;
  private enterEditor(spec: LevelSpec | null): void {
    this.editingId = spec?.id ?? 0;
    this.editing = true;
    this.testingSpec = null;
    this.windows.closeAll();
    this.sim = null;
    this.editor.open(spec ?? newSpec());
    this.updateVisibility();
    this.layoutHud();
  }
  private backToEditor(): void {
    const spec = this.testingSpec!;
    this.editing = true;
    this.testingSpec = null;
    this.sim = null;
    this.editor.open(spec);
    this.updateVisibility();
    this.layoutHud();
  }
  /** Redessine le niveau en cours d'édition (appelé à chaque modification). */
  private previewDraft(spec: LevelSpec): void {
    this.level = deriveLevel({ ...spec, id: 0, label: 'P' });
    this.structure = { nodes: this.level.anchors.map((a) => ({ x: a.x, y: a.y, fixed: true })), beams: [] };
    drawScene.static(this.layers, this.level, this.snapOn, this.biome);
    buildLandscape(this.level, this.layers.landscape, this.biome);
    this.fleet = buildFleet(this.level, this.layers.ships);
    buildDecor(this.level, this.layers.decor, this.biome);
    this.layers.wildlife.removeChildren().forEach((child) => child.destroy());
    this.population = buildPopulation(this.level, this.biome, this.layers.decor, this.layers.wildlife);
    this.layers.car.removeChildren().forEach((c) => c.destroy());
    this.car = makeVehicle(this.level.vehicle);
    this.layers.car.addChild(this.car);
    this.carState = '';
    this.layoutHud();
  }
  private playtest(spec: LevelSpec): void {
    this.testingSpec = spec;
    this.editing = false;
    this.applyLevel(deriveLevel({ ...spec, id: 0, label: 'P' }));
  }
  private saveDraft(spec: LevelSpec): void {
    this.editingId = this.customLevels.saveDraft(spec, this.editingId);
    this.rebuildLevels();
    this.toastMsg = spec.solution ? 'Niveau enregistré' : 'Niveau enregistré (solution non validée)';
    this.toastT = 2.2;
  }
  private exportSpec(spec: LevelSpec): void {
    const json = JSON.stringify({ ...spec, id: undefined, label: undefined }, null, 1);
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = `pontifex-${slug(spec.name)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch { /* téléchargement refusé : le presse-papiers suffira */ }
    void navigator.clipboard?.writeText(json).catch(() => undefined);
    this.toastMsg = 'Niveau exporté (fichier .json + presse-papiers)'; this.toastT = 2.5;
  }

  // ------------------------------------------------------------------ interface
  private button(text: string, onClick: () => void, w = 96, size = 12): Button {
    return new Button({ width: w, height: 34, text, label: { size }, onClick: () => { this.sfx.onClick(); onClick(); } });
  }
  private setButtonIcon(button: Button, name: string): void {
    const icon = this.buttonIcons.get(button);
    if (icon) icon.texture = texture(`ui/${name}.svg`);
  }

  /** Bouton à icône seule : son rôle s'explique dans une infobulle (`tip` est relu à chaque survol, il suit l'état). */
  private iconButton(name: string, tip: () => string, onClick: () => void, size = { width: 44, height: 34 }): Button {
    const icon = new Sprite2D(texture(`ui/${name}.svg`));
    icon.width = 20;
    icon.height = 20;
    icon.eventMode = 'none';
    const button = new Button({ ...size, icon, onClick: () => { this.sfx.onClick(); onClick(); } });
    this.buttonIcons.set(button, icon);
    this.tips.set(button, tip);
    return button;
  }

  private buildHud(): void {
    this.btnLevel = this.button('', () => this.showLevels(), 190);
    this.buildLevelNav();
    for (const id of MATERIAL_ORDER) {
      const name = id === 'concrete' || id === 'hydraulics' ? `icon_${id}` : `mat_${id}`;
      this.matButtons.set(id, this.iconButton(name, () => this.materialTip(id), () => this.setTool(id)));
    }
    this.btnDelete = this.iconButton('tool_delete', () => 'Effacer une poutre (touche Suppr. ou X, ou clic droit)', () => this.setTool('delete'));
    this.matButtons.set('delete', this.btnDelete);
    this.btnUndo = this.iconButton('tool_undo', () => 'Annuler (Ctrl+Z)', () => this.undo());
    this.btnRedo = this.iconButton('tool_redo', () => 'Rétablir (Ctrl+Y)', () => this.redo());
    this.btnClear = this.iconButton('tool_clear', () => 'Vider : retire toutes les poutres', () => this.clearAll());
    this.btnSpeed = this.iconButton('speed_slow', () => this.speed === 1
      ? 'Temps réel : cliquer pour ralentir ×½'
      : 'Ralenti ×½ : cliquer pour revenir au temps réel', () => { this.speed = this.speed === 0.5 ? 1 : 0.5; this.refreshHud(); });
    this.btnGrid = this.iconButton('grid_on', () => `Grille ${this.snapOn ? 'activée' : 'désactivée'} : aimante les points (touche G)`, () => { this.snapOn = !this.snapOn; this.settings.setCustom('grid', this.snapOn); drawScene.static(this.layers, this.level, this.snapOn, this.biome); this.refreshHud(); });
    this.btnSound = this.iconButton('sound_on', () => this.sfx.enabled ? 'Son activé : cliquer pour couper bruitages et musique' : 'Son coupé : cliquer pour le réactiver', () => { this.sfx.enabled = !this.sfx.enabled; this.music.setEnabled(this.sfx.enabled); this.settings.setCustom('sound', this.sfx.enabled); this.refreshHud(); });
    this.btnMusic = this.iconButton('music', () => this.musicTip(), () => this.showMusic());
    this.btnMusicPause = this.iconButton('music_pause', () => this.music.paused ? 'Reprendre la musique' : 'Mettre la musique en pause', () => this.music.togglePause());
    this.btnMusicNext = this.iconButton('music_next', () => 'Morceau suivant (tiré au hasard)', () => this.music.next());
    this.btnFullscreen = this.iconButton('fullscreen_enter', () => document.fullscreenElement ? 'Quitter le plein écran' : 'Plein écran', () => this.toggleFullscreen());
    this.btnBack = this.iconButton('editor', () => 'Retour à l’éditeur de niveau', () => this.backToEditor());
    this.btnTest = this.iconButton('sim_play', () => this.sim ? 'Arrêter l’essai et modifier le pont (Espace)' : 'Tester le pont (Espace)', () => this.toggleSim(), { width: 64, height: 40 });
    this.stage.addChild(this.topBar, this.botBar);
    for (const o of [this.lblTitle, this.btnLevel, this.levelNav, this.lblBudget, this.barBudget, this.lblStress, this.barStress, this.lblHint, this.lblToast,
      ...this.matButtons.values(), this.btnBack, this.btnUndo, this.btnRedo, this.btnClear, this.btnSpeed, this.lblCarSpeed, this.btnGrid, this.btnSound, this.btnMusic, this.btnMusicPause, this.btnMusicNext, this.btnFullscreen, this.btnTest]) this.stage.addChild(o);
  }

  private buildLevelNav(): void {
    const step = (text: string, tip: () => string, key: keyof NavigationTargets): Button => {
      const button = this.button(text, () => { const target = this.navTargets[key]; if (target !== null) this.loadLevel(target); }, 36, 16);
      this.tips.set(button, tip);
      return button;
    };
    const named = (prefix: string, key: keyof NavigationTargets) => () => {
      const target = this.navTargets[key];
      return target === null ? `${prefix} : aucun` : `${prefix} : ${this.levels[target].label}. ${this.levels[target].name}`;
    };
    this.navButtons = {
      first: step('«', named('Premier niveau', 'first'), 'first'),
      previous: step('‹', named('Niveau précédent', 'previous'), 'previous'),
      next: step('›', named('Niveau suivant', 'next'), 'next'),
      last: step('»', named('Dernier niveau ouvert', 'last'), 'last'),
    };
    this.levelPicker = new LevelPicker(PICKER_WIDTH);
    this.levelPicker.onChoose = (index) => {
      if (index >= this.levels.length) { this.showLevels(); this.refreshLevelNav(); } else this.loadLevel(index);
    };
    const { first, previous, next, last } = this.navButtons;
    previous.x = 40;
    this.levelPicker.x = 80;
    next.x = 80 + PICKER_WIDTH + 4;
    last.x = next.x + 40;
    this.levelNav.addChild(first, previous, next, last, this.levelPicker);
  }

  /** Boutons et liste des niveaux : état d'ouverture, étoiles et niveau courant. */
  private refreshLevelNav(): void {
    if (!this.levelPicker || !this.level) return;
    const accessible = accessibleIndexes(this.levels.length, (index) => this.unlocked(index));
    this.navTargets = navigationTargets(accessible, this.levelIdx);
    for (const key of Object.keys(this.navButtons) as (keyof NavigationTargets)[]) this.navButtons[key].setDisabled(this.navTargets[key] === null);
    const options = this.levels.map((level, index) => {
      const open = this.unlocked(index);
      const stars = index < this.builtinCount ? this.progress.starsOf(level.id) : 0;
      const rating = index >= this.builtinCount ? '' : open ? `  ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}` : '  (verrouillé)';
      return { id: String(index), label: `${level.label}. ${level.name}${rating}`, disabled: !open };
    });
    options.push({ id: 'manage', label: 'Mes niveaux : éditer, importer…', disabled: false });
    this.levelPicker.setEntries(options, this.levelIdx);
  }
  private closeLevelPicker(): void {
    this.levelPicker?.close();
  }

  private showMusic(): void {
    this.cancelBuild();
    this.windows.closeAll();
    this.showWindow(buildMusicWindow({
      viewportWidth: this.vw, viewportHeight: this.vh, selected: this.music.selected,
      makeButton: (text, onClick, width, size) => this.button(text, onClick, width, size),
      onChoose: (id) => { this.music.select(id); this.settings.setCustom('music', id); },
    }));
  }
  private undo(): void { if (!this.sim) this.restore(this.history.undo()); }
  private redo(): void { if (!this.sim) this.restore(this.history.redo()); }
  private clearAll(): void {
    this.cancelBuild();
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
      b.setSelected(sel);
    }
    this.btnUndo.setDisabled(!!this.sim || !this.history.canUndo);
    this.btnRedo.setDisabled(!!this.sim || !this.history.canRedo);
    this.btnClear.setDisabled(!!this.sim);
    this.setButtonIcon(this.btnFullscreen, document.fullscreenElement ? 'fullscreen_exit' : 'fullscreen_enter');
    this.setButtonIcon(this.btnSpeed, this.speed === 1 ? 'speed_real' : 'speed_slow');
    this.setButtonIcon(this.btnGrid, this.snapOn ? 'grid_on' : 'grid_off');
    this.setButtonIcon(this.btnSound, this.sfx.enabled ? 'sound_on' : 'sound_off');
    this.setButtonIcon(this.btnTest, this.sim ? 'sim_stop' : 'sim_play');
    if (!this.sim) this.setStress(0);
  }
  /** Infobulle d'un matériau : nom, prix, portée maximale d'une poutre et raccourci clavier. */
  private materialTip(id: MaterialId): string {
    const material = MATERIALS[id];
    const i = this.levels.findIndex((level) => level.id === this.level.id);
    const isNew = i > 0 && i < this.builtinCount && !this.levels[i - 1].materials.includes(id);
    return `${isNew ? '✦ Nouveau : ' : ''}${material.name} · ${material.cost} €/m · poutre de ${material.maxLen / 10} m max (touche ${material.key})`;
  }
  private musicTip(): string {
    if (this.music.error) return 'Musique indisponible : cliquer pour choisir un morceau';
    if (this.music.loading) return 'Musique : préparation du morceau…';
    return this.music.selected ? 'Choisir la musique' : 'Musique coupée : cliquer pour choisir un morceau';
  }
  private trackScreenPointer(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    if (event.type === 'pointerleave' || event.type === 'pointerdown') { this.screenPointer = null; return; }
    const bounds = Game.current.app.canvas.getBoundingClientRect();
    this.screenPointer = { x: (event.clientX - bounds.left) * this.vw / bounds.width, y: (event.clientY - bounds.top) * this.vh / bounds.height };
  }
  /**
   * Montre l'explication du bouton sous le pointeur une fois qu'il s'y est arrêté ; jamais sous une fenêtre ouverte.
   * Les bornes sont testées ici plutôt que par les événements du bouton : un bouton désactivé n'en reçoit plus,
   * et c'est justement celui dont on veut savoir à quoi il servira.
   */
  private updateTooltip(dt: number): void {
    const pointer = this.screenPointer;
    const hovered = pointer && this.windows.isEmpty
      ? [...this.tips].find(([button]) => button.visible && button.getBounds().containsPoint(pointer.x, pointer.y))
      : undefined;
    if (hovered && pointer) this.tooltip.hover(hovered[1](), pointer.x, pointer.y);
    else this.tooltip.leave();
    this.tooltip.update(dt);
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
    const place = (items: Container[], gap: number, pad: number, firstRowRight = 0) => {
      let x = pad, y = pad, rowH = firstRowRight ? 38 : 0;
      for (const it of items) {
        const w = it.width, h = it.height;
        const right = vw - pad - (y === pad ? firstRowRight : 0);
        if (x + w > right && x > pad) { x = pad; y += rowH + 6; rowH = 0; }
        it.position.set(x, y);
        x += w + gap; rowH = Math.max(rowH, h);
      }
      return y + rowH + pad;
    };
    // barre haute : titre, niveau, jauges (label au-dessus de la barre)
    const levelItem = this.btnLevel.visible ? this.btnLevel : this.levelNav;
    const topItems = [this.lblTitle, levelItem];
    let topH = place(topItems, 12, 10, 208);
    let x = levelItem.x + levelItem.width + 24;
    const gy = 8;
    const right = vw - 10 - (levelItem.y === 10 ? 208 : 0);
    if (x + 330 > right) { x = 10; }
    const hudY = x === 10 ? topH : Math.max(gy, levelItem.y);
    this.lblBudget.position.set(x, hudY); this.barBudget.position.set(x, hudY + 20);
    const x2 = x + 210;
    this.lblStress.position.set(x2, hudY); this.barStress.position.set(x2, hudY + 20);
    topH = Math.max(topH, hudY + 36);
    this.topH = topH;
    // barre basse
    const botItems: Container[] = this.editing ? this.editor.items
      : [...(this.testingSpec ? [this.btnBack] : []), ...MATERIAL_ORDER.map((m) => this.matButtons.get(m)!).filter((b) => b.visible), this.btnDelete, this.btnUndo, this.btnRedo, this.btnClear, this.btnSpeed, this.lblCarSpeed, this.btnGrid, this.btnSound, this.btnMusic, this.btnMusicPause, this.btnMusicNext, this.btnFullscreen, this.btnTest];
    const h = place(botItems, 8, 8);
    const oy = vh - h;
    for (const it of botItems) it.y += oy;
    if (h <= 56 && !this.editing) { this.btnTest.x = vw - this.btnTest.width - 10; }
    this.botY = oy;
    this.levelPicker.setMaxHeight(oy - (this.levelNav.y + 34) - 8);
    this.lblHint.position.set(10, this.topH + 6);
    this.lblHint.setWrapWidth(Math.max(160, vw - 20));
    this.topBar.clear().rect(0, 0, vw, this.topH).fill({ color: 0x0f172a, alpha: 0.92 }).rect(0, this.topH - 1, vw, 1).fill(0x1e293b);
    this.botBar.clear().rect(0, oy, vw, h).fill({ color: 0x0f172a, alpha: 0.92 }).rect(0, oy, vw, 1).fill(0x1e293b);
    // caméra : le monde 800×550 tient dans l'espace libre
    const availH = oy - this.topH;
    // l'éditeur montre toujours tout le monde : on y pose des pylônes et des îlots hors du cadrage serré
    const view = (!this.editing && this.level?.view) || { x: 0, y: 0, w: WORLD_W, h: WORLD_H };
    this.camera.setViewport(vw, availH, 0, this.topH);
    this.camera.fit(view.w, view.h);
    this.fitZoom = this.camera.zoom;
    this.camera.snapTo(view.x + view.w / 2, view.y + view.h / 2);
    this.camera.update(0);
  }
  private topH = 54;
  private botY = 0;

  override resize(w: number, h: number): void {
    this.cancelBuild();
    this.pinch = null;
    this.vw = w; this.vh = h;
    this.effects.setViewport(w, h);
    this.windows.setViewport(w, h);
    this.tooltip.setViewport(w, h);
    this.layoutHud();
  }

  private onKey(e: KeyboardEvent): void {
    if (this.levelPicker.handleKey(e.code)) { e.preventDefault(); return; }
    if (e.code === 'Escape') this.cancelBuild();
    if (e.repeat || this.editing) return;
    if (e.code === 'Space') { e.preventDefault(); if (this.windows.isEmpty) this.toggleSim(); }
    else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') { e.preventDefault(); this.redo(); }
    else if (e.code === 'Delete' || e.code === 'KeyX') this.setTool('delete');
    else if (e.code === 'KeyG') { this.btnGrid.onClick.dispatch(); }
    else if (e.code >= 'Digit1' && e.code <= 'Digit5') {
      const m = MATERIAL_ORDER[Number(e.code.slice(5)) - 1];
      if (this.level.materials.includes(m)) this.setTool(m);
    }
  }

  // ------------------------------------------------------------------ boucle
  override update(dt: number): void {
    this.music.update();
    this.setButtonIcon(this.btnMusicPause, this.music.paused ? 'music_play' : 'music_pause');
    this.setButtonIcon(this.btnMusicPause, this.music.paused ? 'music_play' : 'music_pause');
    this.updateTooltip(dt);
    if (this.transition?.update(dt)) this.transition = null;
    this.pops = this.pops.filter((pop) => !pop.tick(dt));
    this.time += dt;
    if (this.sim) {
      const sim = this.sim;
      this.stepper.advance(dt * this.speed, () => {
        if (sim.status !== 'running') return;
        sim.step();
        this.handleEvents();
      });
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
    const start = this.drag ?? this.pendingStart;
    const preview = !this.sim && start ? { from: start.from, to: this.previewTo(this.pointer) } : null;
    drawScene.dynamic(this.layers, {
      level: this.level, structure: this.structure, sim: this.sim, time: this.time, preview,
      tool: this.tool, hoverNode: !this.sim && this.pointerIn ? this.hoverAt(this.pointer) : -1,
      pointer: this.pointerIn && !this.sim ? this.snap(this.pointer) : null, flash: this.overBudgetFlash,
      ropePoint: !this.sim && this.pointerIn && this.tool === 'cable' && this.magnetAt(this.pointer) < 0 ? (ropeHit(this.structure, this.pointer)?.pos ?? null) : null,
    });
    this.updateCar(dt);
    this.clouds?.update(dt);
    this.population?.update(dt);
    this.lblToast.visible = this.toastT > 0;
    if (this.toastT > 0) { this.lblToast.setText(this.toastMsg); this.lblToast.position.set((this.vw - this.lblToast.width) / 2, this.botY - 40); }
    if (this.editing) {
      const st = this.editor.status();
      if (st !== this.lastHint) { this.lastHint = st; this.lblHint.setText(st); }
    }
    this.lblHint.visible = this.editing || (!this.sim && this.structure.beams.length === 0);
  }
  private endTimer = 0;

  private setCar(state: CarState): void {
    if (!this.car || this.carState === state) return;
    this.carState = state;
    this.car.setState(state);
  }
  private updateCar(dt: number): void {
    const car = this.car;
    if (!car) return;
    const lv = this.level, sim = this.sim;
    this.lblCarSpeed.visible = !this.editing;
    this.lblCarSpeed.setText(`${String(Math.round(sim?.speedKmh ?? 0)).padStart(2, '0')} km/h`);
    const distance = sim ? sim.distance - this.carDistance : 0;
    this.carDistance = sim?.distance ?? 0;
    if (!sim) {
      this.setCar('idle');
      car.position.set(lv.x0 - lv.vehicle.width, lv.deckY - WHEEL_R);
      car.rotation = 0;
    } else {
      this.setCar(sim.crashed ? 'destroyed' : sim.time <= SETTLE ? 'idle' : 'ride');
      car.position.set(sim.carX, sim.carY);
      car.rotation = sim.angle;
    }
    car.update(dt * (sim ? this.speed : 1), distance);
    this.fleet?.update(sim, this.time);
  }
}
