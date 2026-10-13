// Données pures du jeu : matériaux, niveaux. Aucune dépendance au rendu.

export type MaterialId = 'road' | 'wood' | 'steel' | 'rope' | 'cable';

export interface MaterialDef {
  id: MaterialId;
  name: string;
  /** € par mètre (1 m = 10 px) */
  cost: number;
  /** longueur maximale d'une poutre, en px */
  maxLen: number;
  color: number;
  /** raideur EA (force) : plus elle est grande, moins la poutre s'étire */
  stiffness: number;
  /** effort de rupture (compression, et traction si `tensionStrength` n'est pas donné) */
  strength: number;
  /** effort de rupture en traction, s'il diffère (la chaussée est bien moins résistante tendue que comprimée) */
  tensionStrength?: number;
  /** masse linéique (par px) */
  density: number;
  isRoad: boolean;
  /** un câble ne travaille qu'en traction */
  tensionOnly: boolean;
  key: string;
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  road: { id: 'road', name: 'Chaussée', cost: 6, maxLen: 120, color: 0xf59e0b, stiffness: 1.6e6, strength: 35000, tensionStrength: 14000, density: 0.02, isRoad: true, tensionOnly: false, key: '1' },
  wood: { id: 'wood', name: 'Bois', cost: 3, maxLen: 130, color: 0xc2410c, stiffness: 7e5, strength: 22000, density: 0.008, isRoad: false, tensionOnly: false, key: '2' },
  steel: { id: 'steel', name: 'Acier', cost: 10, maxLen: 160, color: 0x94a3b8, stiffness: 3e6, strength: 58000, density: 0.02, isRoad: false, tensionOnly: false, key: '3' },
  rope: { id: 'rope', name: 'Câble porteur', cost: 7, maxLen: 300, color: 0xe5e7eb, stiffness: 4e6, strength: 60000, density: 0.012, isRoad: false, tensionOnly: true, key: '4' },
  cable: { id: 'cable', name: 'Câble fin', cost: 4, maxLen: 250, color: 0x22d3ee, stiffness: 8e5, strength: 16000, density: 0.003, isRoad: false, tensionOnly: true, key: '5' },
};
export const MATERIAL_ORDER: MaterialId[] = ['road', 'wood', 'steel', 'rope', 'cable'];

export interface VehicleDef {
  name: string;
  /** masse totale (répartie sur 2 roues) */
  mass: number;
  /** px/s */
  speed: number;
  width: number;
  height: number;
  /** planche de sprites utilisée (voir art.ts) */
  sprite: 'citadine' | 'jeep1' | 'jeep2';
}

/** Les trois voitures : la masse (donc la difficulté) suit la taille du véhicule, pas le niveau. */
export const CARS: Record<VehicleDef['sprite'], VehicleDef> = {
  citadine: { name: 'Citadine', sprite: 'citadine', mass: 9, speed: 70, width: 62, height: 24 },
  jeep1: { name: 'Jeep', sprite: 'jeep1', mass: 15, speed: 64, width: 70, height: 28 },
  jeep2: { name: 'Jeep 4x4', sprite: 'jeep2', mass: 21, speed: 56, width: 78, height: 32 },
};

export interface Pt { x: number; y: number }

export interface LevelDef {
  id: number;
  /** numéro affiché (« 1bis ») */
  label: string;
  /** zone du monde cadrée à l'écran (par défaut tout le monde 800×550) */
  view?: { x: number; y: number; w: number; h: number };
  name: string;
  hint: string;
  budget: number;
  vehicle: VehicleDef;
  /** points d'ancrage fixes */
  anchors: Pt[];
  /** hauteur de la route sur les falaises */
  deckY: number;
  /** bord de la falaise gauche / droite (x) : au-delà, le véhicule roule sur le sol */
  x0: number;
  x1: number;
  leftCliff: Pt[];
  rightCliff: Pt[];
  islands: Pt[][];
  /** matériaux disponibles dans ce niveau (introduction progressive) */
  materials: MaterialId[];
  /** pylônes dessinés (les points d'ancrage en haut sont dans `anchors`) */
  towers: { x: number; top: number; base: number }[];
  waterY: number;
}

export const WORLD_W = 800;
export const WORLD_H = 550;
export const GRID = 20;

