import { deriveLevel } from './level.ts';
import { BUILTIN_SPECS } from './generated/content.ts';

export { BUILTIN_SPECS };
export const LEVELS = BUILTIN_SPECS.map(deriveLevel);
