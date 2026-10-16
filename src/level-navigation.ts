// Navigation entre niveaux : quels niveaux le joueur peut ouvrir, et où mènent « premier / précédent / suivant / dernier ».

/** Un niveau intégré s'ouvre dès que le précédent a au moins une étoile ; les niveaux du joueur sont toujours ouverts. */
export function isLevelUnlocked(index: number, builtinCount: number, starsOfPrevious: (index: number) => number): boolean {
  return index === 0 || index >= builtinCount || starsOfPrevious(index - 1) > 0;
}

/** Indices des niveaux ouvrables, dans l'ordre (niveaux intégrés puis niveaux du joueur). */
export function accessibleIndexes(total: number, isUnlocked: (index: number) => boolean): number[] {
  return Array.from({ length: total }, (_, index) => index).filter(isUnlocked);
}

export interface NavigationTargets {
  first: number | null;
  previous: number | null;
  next: number | null;
  last: number | null;
}

/**
 * Destinations depuis le niveau `current` parmi les niveaux ouvrables. Une destination vaut null quand elle
 * n'existe pas ou qu'on y est déjà (le bouton correspondant est alors grisé).
 */
export function navigationTargets(accessible: readonly number[], current: number): NavigationTargets {
  const first = accessible[0] ?? null;
  const last = accessible.length ? accessible[accessible.length - 1] : null;
  const before = accessible.filter((index) => index < current);
  const after = accessible.filter((index) => index > current);
  return {
    first: first !== null && first !== current ? first : null,
    previous: before.length ? before[before.length - 1] : null,
    next: after.length ? after[0] : null,
    last: last !== null && last !== current ? last : null,
  };
}
