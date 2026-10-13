// Données pures du jeu : matériaux, niveaux. Aucune dépendance au rendu.

export type MaterialId = 'road' | 'wood' | 'steel' | 'cable';

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
  /** effort de rupture */
  strength: number;
  /** masse linéique (par px) */
  density: number;
  isRoad: boolean;
  /** un câble ne travaille qu'en traction */
  tensionOnly: boolean;
  key: string;
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  road: { id: 'road', name: 'Chaussée', cost: 6, maxLen: 120, color: 0xf59e0b, stiffness: 1.6e6, strength: 35000, density: 0.02, isRoad: true, tensionOnly: false, key: '1' },
  wood: { id: 'wood', name: 'Bois', cost: 3, maxLen: 130, color: 0xc2410c, stiffness: 7e5, strength: 22000, density: 0.008, isRoad: false, tensionOnly: false, key: '2' },
  steel: { id: 'steel', name: 'Acier', cost: 10, maxLen: 160, color: 0x94a3b8, stiffness: 3e6, strength: 58000, density: 0.02, isRoad: false, tensionOnly: false, key: '3' },
  cable: { id: 'cable', name: 'Câble', cost: 5, maxLen: 220, color: 0x22d3ee, stiffness: 1e6, strength: 29000, density: 0.004, isRoad: false, tensionOnly: true, key: '4' },
};
export const MATERIAL_ORDER: MaterialId[] = ['road', 'wood', 'steel', 'cable'];

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
  island?: Pt[];
  island2?: Pt[];
  waterY: number;
}

export const WORLD_W = 800;
export const WORLD_H = 550;
export const GRID = 20;

export const LEVELS: LevelDef[] = [
  {
    id: 1, name: 'La Ravine', hint: 'Relie les deux rives. Un triangle est la forme la plus solide.',
    budget: 750,
    vehicle: CARS.citadine,
    anchors: [{ x: 180, y: 340 }, { x: 620, y: 340 }],
    deckY: 340, x0: 180, x1: 620,
    leftCliff: [{ x: 0, y: 340 }, { x: 180, y: 340 }, { x: 180, y: 550 }, { x: 0, y: 550 }],
    rightCliff: [{ x: 620, y: 340 }, { x: 800, y: 340 }, { x: 800, y: 550 }, { x: 620, y: 550 }],
    waterY: 480,
  },
  {
    id: 2, name: 'Le Fleuve profond', hint: 'Deux points d’appui de chaque côté : profite de la hauteur.',
    budget: 1250,
    vehicle: CARS.jeep1,
    anchors: [{ x: 140, y: 320 }, { x: 140, y: 420 }, { x: 660, y: 320 }, { x: 660, y: 420 }],
    deckY: 320, x0: 140, x1: 660,
    leftCliff: [{ x: 0, y: 320 }, { x: 140, y: 320 }, { x: 140, y: 550 }, { x: 0, y: 550 }],
    rightCliff: [{ x: 660, y: 320 }, { x: 800, y: 320 }, { x: 800, y: 550 }, { x: 660, y: 550 }],
    waterY: 490,
  },
  {
    id: 3, name: 'Le Canyon périlleux', hint: 'Un îlot au milieu : appuie-toi dessus.',
    budget: 1800,
    vehicle: CARS.jeep2,
    anchors: [{ x: 120, y: 280 }, { x: 120, y: 440 }, { x: 400, y: 480 }, { x: 680, y: 280 }, { x: 680, y: 440 }],
    deckY: 280, x0: 120, x1: 680,
    leftCliff: [{ x: 0, y: 280 }, { x: 120, y: 280 }, { x: 120, y: 550 }, { x: 0, y: 550 }],
    rightCliff: [{ x: 680, y: 280 }, { x: 800, y: 280 }, { x: 800, y: 550 }, { x: 680, y: 550 }],
    island: [{ x: 370, y: 480 }, { x: 430, y: 480 }, { x: 410, y: 550 }, { x: 390, y: 550 }],
    waterY: 510,
  },
  {
    id: 4, name: 'Les Deux Îlots', hint: 'Deux piliers naturels : répartis la charge entre eux.',
    budget: 2300,
    vehicle: CARS.jeep2,
    anchors: [{ x: 100, y: 300 }, { x: 100, y: 420 }, { x: 300, y: 480 }, { x: 500, y: 480 }, { x: 700, y: 300 }, { x: 700, y: 420 }],
    deckY: 300, x0: 100, x1: 700,
    leftCliff: [{ x: 0, y: 300 }, { x: 100, y: 300 }, { x: 100, y: 550 }, { x: 0, y: 550 }],
    rightCliff: [{ x: 700, y: 300 }, { x: 800, y: 300 }, { x: 800, y: 550 }, { x: 700, y: 550 }],
    island: [{ x: 270, y: 480 }, { x: 330, y: 480 }, { x: 315, y: 550 }, { x: 285, y: 550 }],
    island2: [{ x: 470, y: 480 }, { x: 530, y: 480 }, { x: 515, y: 550 }, { x: 485, y: 550 }],
    waterY: 520,
  },
];
