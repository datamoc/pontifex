// Liste déroulante des niveaux : tête + liste qui défile (molette, glisser, clavier) quand elle dépasse la hauteur disponible.
// Remplace DropdownView de MWG, qui déroule toutes ses lignes sans défilement (MWG-FEEDBACK.md, point 45).
import { Container } from 'pixi.js';
import { Button, ScrollBox, Shape2D } from '@datamoc/mwg/two-d';
import { enableDragScroll } from './scroll.ts';

export interface PickerEntry {
  label: string;
  disabled?: boolean;
}

const BACKDROP_COLOR = 0x0f172a;

export class LevelPicker extends Container {
  readonly head: Button;
  /** lignes de la liste ouverte, dans l'ordre des entrées (vide quand elle est fermée) */
  rows: Button[] = [];
  /** appelé avec l'indice de l'entrée choisie */
  onChoose: (index: number) => void = () => undefined;
  private readonly panel = new Container();
  private box: ScrollBox | null = null;
  private entries: PickerEntry[] = [];
  private selected = 0;
  private highlight = 0;
  private open_ = false;
  private maxListHeight = 400;

  constructor(private readonly width_: number, private readonly rowHeight = 34) {
    super();
    this.head = new Button({ width: width_, height: rowHeight, text: '', onClick: () => this.toggle() });
    this.panel.y = rowHeight;
    this.panel.visible = false;
    this.addChild(this.head, this.panel);
  }

  get isOpen(): boolean { return this.open_; }

  get isScrollable(): boolean { return this.box?.scrollable ?? false; }

  /** décalage de défilement de la liste ouverte (0 si fermée) */
  get scrollOffset(): number { return this.box?.offset ?? 0; }

  /** hauteur affichée de la liste ouverte (0 si fermée) */
  get listHeight(): number { return this.open_ && this.box ? this.box.viewportHeight : 0; }

  /** Hauteur maximale de la liste, en px (la place qui reste sous la tête dans la fenêtre). */
  setMaxHeight(height: number): void {
    this.maxListHeight = Math.max(this.rowHeight * 3, height);
    if (this.open_) this.buildList();
  }

  setEntries(entries: readonly PickerEntry[], selectedIndex: number): void {
    this.entries = [...entries];
    this.selected = selectedIndex;
    this.highlight = selectedIndex;
    this.head.setText(`${this.entries[selectedIndex]?.label ?? ''} ▾`);
    if (this.open_) this.buildList();
  }

  toggle(): void {
    if (this.open_) this.close();
    else this.open();
  }

  open(): void {
    if (this.open_) return;
    this.open_ = true;
    this.highlight = this.selected;
    this.buildList();
  }

  close(): void {
    if (!this.open_) return;
    this.open_ = false;
    this.clearList();
    this.panel.visible = false;
  }

  scrollBy(delta: number): void { this.box?.scrollBy(delta); }

  /** Clavier quand la liste est ouverte ; renvoie vrai si la touche a été utilisée. */
  handleKey(code: string): boolean {
    if (!this.open_) return false;
    switch (code) {
      case 'Escape': this.close(); return true;
      case 'ArrowDown': this.moveHighlight(1); return true;
      case 'ArrowUp': this.moveHighlight(-1); return true;
      case 'Home': this.setHighlight(this.nextEnabled(-1, 1)); return true;
      case 'End': this.setHighlight(this.nextEnabled(this.entries.length, -1)); return true;
      case 'PageDown': this.scrollBy(this.listHeight); return true;
      case 'PageUp': this.scrollBy(-this.listHeight); return true;
      case 'Enter': case 'NumpadEnter': this.choose(this.highlight); return true;
      default: return false;
    }
  }

  private choose(index: number): void {
    if (this.entries[index]?.disabled) return;
    this.close();
    this.onChoose(index);
  }

  private moveHighlight(step: number): void {
    this.setHighlight(this.nextEnabled(this.highlight, step));
  }

  /** Première entrée ouverte en partant de `from` (exclu) dans le sens `step` ; reste sur place s'il n'y en a pas. */
  private nextEnabled(from: number, step: number): number {
    for (let index = from + step; index >= 0 && index < this.entries.length; index += step) {
      if (!this.entries[index].disabled) return index;
    }
    return Math.min(Math.max(from, 0), this.entries.length - 1);
  }

  private setHighlight(index: number): void {
    this.highlight = index;
    this.rows.forEach((row, i) => row.setSelected(i === index));
    this.box?.scrollIntoView(index * this.rowHeight, this.rowHeight);
  }

  private clearList(): void {
    this.rows = [];
    this.box = null;
    for (const child of this.panel.removeChildren()) child.destroy({ children: true });
  }

  private buildList(): void {
    this.clearList();
    const height = Math.min(this.entries.length * this.rowHeight, this.maxListHeight);
    const backdrop = new Shape2D().rect(0, 0, this.width_, height).fill({ color: BACKDROP_COLOR, alpha: 1 });
    const box = new ScrollBox({ width: this.width_, height, contentHeight: this.entries.length * this.rowHeight });
    this.rows = this.entries.map((entry, index) => {
      const row = new Button({ width: this.width_ - (this.entries.length * this.rowHeight > height ? 10 : 0), height: this.rowHeight, text: entry.label, disabled: entry.disabled, onClick: () => this.choose(index) });
      row.y = index * this.rowHeight;
      row.setSelected(index === this.highlight);
      box.content.addChild(row);
      return row;
    });
    enableDragScroll(box, this.width_);
    this.panel.addChild(backdrop, box);
    this.box = box;
    this.panel.visible = true;
    box.scrollIntoView(this.highlight * this.rowHeight, this.rowHeight);
  }
}
