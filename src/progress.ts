// Progression du joueur : étoiles par niveau (indexées par identifiant de niveau, qui ne doit donc jamais changer).

/** Ce dont la progression a besoin du stockage : `Settings` de MWG le satisfait. */
export interface SettingsStore {
  getCustom(key: string, fallback: string | number | boolean): string | number | boolean;
  setCustom(key: string, value: string | number | boolean): void;
}

const STORAGE_KEY = 'progress2';
/** Pour la 2e étoile : au moins cette part du budget doit rester. */
export const BUDGET_LEFT_RATIO = 0.2;
/** Pour la 3e étoile : la contrainte maximale doit rester sous ce ratio. */
export const STRESS_LIMIT = 0.75;

export interface Rating {
  stars: number;
  budgetLeft: number;
  budgetOk: boolean;
  stressOk: boolean;
}

/** Une étoile pour avoir traversé, une pour le budget économisé, une pour un pont peu sollicité. */
export function rateAttempt(attempt: { won: boolean; cost: number; budget: number; maxRatio: number }): Rating {
  const budgetLeft = attempt.budget - attempt.cost;
  const budgetOk = attempt.won && budgetLeft >= attempt.budget * BUDGET_LEFT_RATIO;
  const stressOk = attempt.won && attempt.maxRatio < STRESS_LIMIT;
  const stars = attempt.won ? 1 + Number(budgetOk) + Number(stressOk) : 0;
  return { stars, budgetLeft, budgetOk, stressOk };
}

export class ProgressStore {
  private stars: Record<string, number> = {};

  constructor(private readonly settings: SettingsStore) {}

  /** Relit le stockage ; un contenu illisible ou mal formé repart de zéro. */
  load(): void {
    this.stars = {};
    try {
      const saved = JSON.parse(String(this.settings.getCustom(STORAGE_KEY, '{"stars":{}}')));
      if (saved && typeof saved.stars === 'object' && saved.stars !== null) this.stars = saved.stars;
    } catch { /* stockage corrompu : on repart sans étoile */ }
  }

  starsOf(levelId: number): number {
    return this.stars[String(levelId)] ?? 0;
  }

  /** Enregistre le score s'il bat le précédent ; renvoie vrai si la progression a changé. */
  record(levelId: number, stars: number): boolean {
    if (stars <= this.starsOf(levelId)) return false;
    this.stars[String(levelId)] = stars;
    this.settings.setCustom(STORAGE_KEY, JSON.stringify({ stars: this.stars }));
    return true;
  }
}
