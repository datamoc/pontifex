// Contournement de MWG 0.43 : la molette n'atteint un ScrollBox que s'il a une zone de contact (hitArea) ;
// sans elle, les lignes qu'il contient ne la lui transmettent pas (voir MWG-FEEDBACK.md, point 51).
import { Rectangle } from 'pixi.js';
import type { ScrollBox } from '@datamoc/mwg/two-d';

/** Donne au ScrollBox la zone de sa fenêtre visible ; à rappeler quand sa taille change. */
export function ensureWheelArea(box: ScrollBox | null | undefined, width: number): void {
  if (!box) return;
  const height = Math.max(1, box.viewportHeight);
  const area = box.hitArea;
  if (area instanceof Rectangle && area.width === width && area.height === height) return;
  box.hitArea = new Rectangle(0, 0, width, height);
}
