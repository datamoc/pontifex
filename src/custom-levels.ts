// Niveaux créés par le joueur : stockage local, import, enregistrement, suppression.
import type { LevelDef } from './data.ts';
import { deriveLevel, parseSpec, type LevelSpec } from './level.ts';
import type { SettingsStore } from './progress.ts';

const STORAGE_KEY = 'customs';
/** Les identifiants des niveaux intégrés restent sous cette valeur (voir test/content.test.ts). */
const FIRST_CUSTOM_ID = 101;

export type ImportResult = { spec: LevelSpec } | { error: string };

/** Lit le texte d'un fichier de niveau (JSON) sans lui faire confiance. */
export function parseLevelFile(text: string): ImportResult {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { error: 'Ce n’est pas un niveau (JSON illisible)' }; }
  return parseSpec(raw);
}

export class CustomLevels {
  private specs: LevelSpec[] = [];

  constructor(private readonly settings: SettingsStore) {}

  get all(): readonly LevelSpec[] { return this.specs; }

  /** Niveaux jouables, étiquetés P1, P2... */
  levels(): LevelDef[] {
    return this.specs.map((spec, index) => deriveLevel({ ...spec, label: `P${index + 1}` }));
  }

  load(): void {
    this.specs = [];
    try {
      const saved = JSON.parse(String(this.settings.getCustom(STORAGE_KEY, '[]')));
      for (const entry of Array.isArray(saved) ? saved : []) {
        const parsed = parseSpec(entry);
        if ('spec' in parsed && Number.isInteger(entry.id)) this.specs.push({ ...parsed.spec, id: entry.id, label: 'P' });
      }
    } catch { /* stockage corrompu : on repart d'une liste vide */ }
  }

  private save(): void {
    this.settings.setCustom(STORAGE_KEY, JSON.stringify(this.specs));
  }

  nextId(): number {
    return Math.max(FIRST_CUSTOM_ID - 1, ...this.specs.map((spec) => spec.id)) + 1;
  }

  /** Ajoute un niveau importé et renvoie son identifiant. */
  add(spec: LevelSpec): number {
    const id = this.nextId();
    this.specs.push({ ...spec, id });
    this.save();
    return id;
  }

  /** Enregistre le brouillon : remplace le niveau `editingId` s'il existe, sinon en crée un. Renvoie l'identifiant. */
  saveDraft(draft: LevelSpec, editingId: number): number {
    const copy: LevelSpec = JSON.parse(JSON.stringify(draft));
    const at = this.specs.findIndex((spec) => spec.id === editingId);
    if (at >= 0) {
      copy.id = editingId;
      this.specs[at] = copy;
    } else {
      copy.id = this.nextId();
      this.specs.push(copy);
    }
    this.save();
    return copy.id;
  }

  remove(index: number): void {
    this.specs.splice(index, 1);
    this.save();
  }
}
