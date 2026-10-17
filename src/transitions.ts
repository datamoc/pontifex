// Transitions entre écrans : tuiles qui rétrécissent (changement de niveau), jaillissement (fenêtres).
// Le calcul est pur (testable sans rendu) ; la mise en scène utilise une capture de l'écran sortant.
// MWG n'offre que fondu et flash (MWG-FEEDBACK.md, point 48) : ceci en tient lieu.
import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import type { Renderer } from 'pixi.js';

// ------------------------------------------------------------------ calcul pur
export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;
export const easeInOutQuad = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** Dépassement élastique : monte au-dessus de 1 avant de se poser (c = 1,70158 : le « back » classique). */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export interface TileGrid { columns: number; rows: number }

/**
 * Avancement (0..1) d'une tuile : les tuiles démarrent en diagonale depuis le coin haut gauche, chacune
 * durant `1 - stagger` de la transition. `progress` est l'avancement global (0..1).
 */
export function tileProgress(column: number, row: number, grid: TileGrid, progress: number, stagger = 0.5): number {
  const diagonal = (column / Math.max(1, grid.columns - 1) + row / Math.max(1, grid.rows - 1)) / 2;
  const start = diagonal * stagger;
  return Math.min(1, Math.max(0, (progress - start) / (1 - stagger)));
}

/** Échelle et rotation d'une tuile selon son avancement : elle se réduit vers son centre en tournant un peu. */
export function tileShrinkPose(tile: number): { scale: number; rotation: number } {
  const eased = easeInOutQuad(tile);
  return { scale: 1 - eased, rotation: eased * 0.35 };
}

/** Échelle et opacité d'une fenêtre qui jaillit : 0,7 → léger dépassement → 1, en fondu rapide. */
export function popPose(progress: number): { scale: number; alpha: number } {
  return { scale: 0.7 + 0.3 * easeOutBack(progress), alpha: Math.min(1, progress * 3) };
}

/** L'utilisateur préfère-t-il moins de mouvement ? Alors tout se fait sans transition. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ------------------------------------------------------------------ tuiles qui rétrécissent
export interface TileShrinkOptions {
  grid?: TileGrid;
  /** durée totale en secondes */
  duration?: number;
}

/**
 * La capture de l'ancien écran, découpée en tuiles posées par-dessus le nouveau : elles rétrécissent
 * l'une après l'autre en laissant apparaître ce qui était dessous.
 */
export class TileShrink {
  readonly container = new Container();
  private readonly tiles: { sprite: Sprite; column: number; row: number }[] = [];
  private readonly texture: Texture;
  private readonly grid: TileGrid;
  private readonly duration: number;
  private elapsed = 0;

  /** `region` est la zone de `source` à capturer, dans son repère (ici le repère de l'écran). */
  constructor(renderer: Renderer, source: Container, region: Rectangle, options: TileShrinkOptions = {}) {
    this.grid = options.grid ?? { columns: 8, rows: 5 };
    this.duration = options.duration ?? 0.8;
    this.texture = renderer.generateTexture({ target: source, frame: region, resolution: 1 });
    const tileWidth = region.width / this.grid.columns;
    const tileHeight = region.height / this.grid.rows;
    for (let row = 0; row < this.grid.rows; row++) {
      for (let column = 0; column < this.grid.columns; column++) {
        const frame = new Rectangle(column * tileWidth, row * tileHeight, tileWidth, tileHeight);
        const sprite = new Sprite(new Texture({ source: this.texture.source, frame }));
        sprite.anchor.set(0.5);
        sprite.position.set(region.x + (column + 0.5) * tileWidth, region.y + (row + 0.5) * tileHeight);
        sprite.eventMode = 'none';
        this.container.addChild(sprite);
        this.tiles.push({ sprite, column, row });
      }
    }
    this.container.eventMode = 'none';
  }

  get tileCount(): number { return this.tiles.length; }

  /** Avance la transition ; renvoie vrai quand elle est terminée (le conteneur est alors détruit). */
  update(dt: number): boolean {
    this.elapsed += dt;
    const progress = Math.min(1, this.elapsed / this.duration);
    for (const { sprite, column, row } of this.tiles) {
      const pose = tileShrinkPose(tileProgress(column, row, this.grid, progress));
      sprite.scale.set(pose.scale);
      sprite.rotation = pose.rotation;
      sprite.visible = pose.scale > 0.01;
    }
    if (progress < 1) return false;
    this.destroy();
    return true;
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.texture.destroy(true);
  }
}

// ------------------------------------------------------------------ jaillissement d'une fenêtre
/**
 * Fait jaillir une fenêtre depuis son centre. `tick` doit être appelée à chaque image jusqu'à ce qu'elle
 * renvoie vrai ; la position finale est exactement celle posée par la pile de fenêtres.
 */
export class PopIn {
  private elapsed = 0;
  private readonly baseX: number;
  private readonly baseY: number;

  constructor(private readonly target: Container, private readonly width: number, private readonly height: number, private readonly duration = 0.28) {
    this.baseX = target.x;
    this.baseY = target.y;
    this.apply(0);
  }

  private apply(progress: number): void {
    const { scale, alpha } = popPose(progress);
    this.target.scale.set(scale);
    this.target.alpha = alpha;
    this.target.position.set(this.baseX + (this.width * (1 - scale)) / 2, this.baseY + (this.height * (1 - scale)) / 2);
  }

  tick(dt: number): boolean {
    if (this.target.destroyed) return true;
    this.elapsed += dt;
    const progress = Math.min(1, this.elapsed / this.duration);
    this.apply(progress);
    return progress >= 1;
  }
}
