// Défilement : glisser (souris, stylet, doigt) sur un ScrollBox de MWG, et texte long qui défile.
// MWG gère la molette ; ces deux morceaux complètent ce qui manque (voir MWG-FEEDBACK.md, points 46 et 47).
import { Container, Rectangle } from 'pixi.js';
import { Label, ScrollBox } from '@datamoc/mwg/two-d';
import type { FederatedPointerEvent } from 'pixi.js';

/** Déplacement (px) à partir duquel un appui devient un défilement et non plus un clic. */
export const DRAG_THRESHOLD = 6;

/**
 * Rend un ScrollBox défilable au glisser. Pendant un défilement, les enfants ne reçoivent plus les clics :
 * relâcher le doigt sur une ligne ne la choisit donc pas.
 */
export function enableDragScroll(box: ScrollBox, width: number): void {
  box.eventMode = 'static';
  const refreshHitArea = () => { box.hitArea = new Rectangle(0, 0, width, box.viewportHeight); };
  refreshHitArea();
  box.onChange.add(refreshHitArea);
  let startY = 0;
  let startOffset = 0;
  let pressed = false;
  let dragging = false;
  const release = () => {
    pressed = false;
    if (!dragging) return;
    dragging = false;
    // les clics du relâchement sont déjà distribués : on rend les enfants cliquables au tour suivant
    setTimeout(() => { box.content.interactiveChildren = true; }, 0);
  };
  box.on('pointerdown', (event: FederatedPointerEvent) => {
    pressed = true;
    dragging = false;
    startY = event.global.y;
    startOffset = box.offset;
  });
  box.on('globalpointermove', (event: FederatedPointerEvent) => {
    if (!pressed || !box.scrollable) return;
    const moved = event.global.y - startY;
    if (!dragging && Math.abs(moved) < DRAG_THRESHOLD) return;
    if (!dragging) {
      dragging = true;
      box.content.interactiveChildren = false;
    }
    box.scrollTo(startOffset - moved);
  });
  box.on('pointerup', release);
  box.on('pointerupoutside', release);
  box.on('pointercancel', release);
}

export interface ScrollTextOptions {
  width: number;
  /** hauteur au-delà de laquelle le texte défile */
  maxHeight: number;
  size?: number;
  color?: number;
  bold?: boolean;
}

/** Un texte qui garde sa hauteur naturelle jusqu'à `maxHeight`, puis défile (molette, glisser, barre). */
export class ScrollText extends Container {
  private readonly text: Label;
  private readonly box: ScrollBox;
  private width_: number;
  private readonly maxHeight: number;
  /** hauteur affichée (celle du texte, plafonnée à maxHeight) */
  viewHeight = 0;

  constructor(options: ScrollTextOptions) {
    super();
    this.width_ = options.width;
    this.maxHeight = options.maxHeight;
    this.text = new Label({ text: '', size: options.size ?? 13, bold: options.bold, color: options.color, wrapWidth: options.width });
    this.box = new ScrollBox({ width: options.width, height: options.maxHeight, contentHeight: 0 });
    this.box.content.addChild(this.text);
    enableDragScroll(this.box, options.width);
    this.addChild(this.box);
  }

  get isScrollable(): boolean { return this.box.scrollable; }

  get offset(): number { return this.box.offset; }

  scrollBy(delta: number): void { this.box.scrollBy(delta); }

  setText(text: string): void {
    this.text.setText(text);
    this.fit();
  }

  setWrapWidth(width: number): void {
    this.width_ = width;
    this.text.setWrapWidth(width);
    this.fit();
  }

  private fit(): void {
    const contentHeight = this.text.height;
    this.viewHeight = Math.min(contentHeight, this.maxHeight);
    this.box.resize(this.width_, Math.max(1, this.viewHeight));
    this.box.setContentHeight(contentHeight);
    this.box.hitArea = new Rectangle(0, 0, this.width_, Math.max(1, this.viewHeight));
    this.box.scrollTo(0);
  }
}
