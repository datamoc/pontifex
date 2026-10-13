// Interface de l'éditeur de niveaux : boutons, outils et saisie du pointeur. La logique est dans editor.ts.
import { Button } from '@datamoc/mw_games/two-d';
import type { Container } from 'pixi.js';
import { MATERIALS, MATERIAL_ORDER, CARS, type Pt } from './data.ts';
import { deriveLevel, type LevelSpec } from './level.ts';
import * as ops from './editor.ts';
import { structureCost } from './physics.ts';

export type EditTool = 'anchor' | 'tower' | 'island';

/** Ce que l'éditeur attend de la scène qui l'héberge. */
export interface EditorHost {
  click(): void;
  toast(msg: string): void;
  /** redessine le niveau (décor, ancrages) à partir de la spécification */
  preview(spec: LevelSpec): void;
  askText(title: string, initial: string, max: number, done: (value: string) => void): void;
  playtest(spec: LevelSpec): void;
  save(spec: LevelSpec): void;
  exportSpec(spec: LevelSpec): void;
  quit(): void;
}

export class LevelEditor {
  draft: LevelSpec = ops.newSpec();
  tool: EditTool = 'anchor';
  /** boutons de la barre du bas, dans l'ordre d'affichage */
  readonly items: Container[] = [];
  private tools = new Map<EditTool, Button>();
  private matBtns = new Map<string, Button>();
  private btnCar!: Button;
  private btnBudget!: Button;

  constructor(private host: EditorHost) {
    const b = (text: string, onClick: () => void, w = 84) => {
      const btn = new Button({ width: w, height: 34, text, label: { size: 12 }, onClick: () => { host.click(); onClick(); } });
      this.items.push(btn);
      return btn;
    };
    const apply = (next: LevelSpec | null) => {
      if (!next) { host.toast(ops.lastError); return; }
      this.draft = next;
      this.refresh();
    };
    for (const [t, label] of [['anchor', 'Ancre'], ['tower', 'Pylône'], ['island', 'Îlot']] as const) {
      this.tools.set(t, b(label, () => { this.tool = t; this.refresh(); }, 80));
    }
    b('Écart −', () => apply(ops.widen(this.draft, -1)), 80); b('Écart +', () => apply(ops.widen(this.draft, 1)), 80);
    b('Route ↑', () => apply(ops.moveDeck(this.draft, -1)), 80); b('Route ↓', () => apply(ops.moveDeck(this.draft, 1)), 80);
    b('Eau ↑', () => apply(ops.moveWater(this.draft, -1)), 72); b('Eau ↓', () => apply(ops.moveWater(this.draft, 1)), 72);
    b('Budget −', () => apply(ops.adjustBudget(this.draft, -1)), 88);
    this.btnBudget = b('', () => undefined, 92);
    this.btnBudget.setDisabled(true);
    b('Budget +', () => apply(ops.adjustBudget(this.draft, 1)), 88);
    this.btnCar = b('', () => apply(ops.cycleCar(this.draft)), 120);
    for (const m of MATERIAL_ORDER) {
      if (m === 'road') continue;
      this.matBtns.set(m, b('', () => apply(ops.toggleMaterial(this.draft, m)), 136));
    }
    b('Nom…', () => host.askText('Nom du niveau', this.draft.name, 40, (v) => { this.draft.name = v.trim(); this.refresh(); }), 66);
    b('Texte…', () => host.askText('Consigne affichée au joueur', this.draft.hint, 200, (v) => { this.draft.hint = v.trim(); this.refresh(); }), 70);
    b('▶ Tester', () => { const p = ops.problems(this.draft); if (p) host.toast(p); else host.playtest(this.draft); }, 92);
    b('Enregistrer', () => { const p = ops.problems(this.draft); if (p) host.toast(p); else host.save(this.draft); }, 100);
    b('Exporter', () => host.exportSpec(this.draft), 84);
    b('Quitter', () => host.quit(), 80);
  }

  open(spec: LevelSpec): void {
    this.draft = JSON.parse(JSON.stringify(spec));
    this.tool = 'anchor';
    this.refresh();
  }

  /** Met à jour les libellés et redessine le niveau. */
  refresh(): void {
    const d = this.draft;
    for (const [t, btn] of this.tools) btn.setText((t === this.tool ? '● ' : '') + ({ anchor: 'Ancre', tower: 'Pylône', island: 'Îlot' })[t]);
    this.btnBudget.setText(`${d.budget} €`);
    this.btnCar.setText(`${CARS[d.car].name} ${(CARS[d.car].mass / 10).toFixed(1).replace('.', ',')} t`);
    for (const [m, btn] of this.matBtns) btn.setText(`${MATERIALS[m as keyof typeof MATERIALS].name} ${d.materials.includes(m as never) ? '✔' : '✖'}`);
    this.host.preview(d);
  }

  /** Une phrase d'état : où en est la solution de référence. */
  status(): string {
    const d = this.draft;
    const gap = (d.x1 - d.x0) / 20;
    const sol = d.solution
      ? `solution ✔ ${Math.round(structureCost(d.solution))} €${structureCost(d.solution) > d.budget ? ' (> budget !)' : ''}`
      : 'solution ✖ à valider : ▶ Tester puis traverse le niveau';
    return `Éditeur · ${d.name} · ${gap} cases · ${sol}`;
  }

  /** Clic dans le monde (déjà aimanté sur la grille). */
  pointer(p: Pt, button: number): void {
    const apply = (next: LevelSpec | null) => { if (!next) this.host.toast(ops.lastError); else { this.draft = next; this.refresh(); } };
    if (button === 2) { apply(ops.toggleAnchor(this.draft, p)); return; }
    if (this.tool === 'anchor') apply(ops.toggleAnchor(this.draft, p));
    else if (this.tool === 'tower') apply(ops.toggleTower(this.draft, p));
    else apply(ops.toggleIsland(this.draft, p));
  }

  level() { return deriveLevel(this.draft); }
}
