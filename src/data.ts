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
  /** matériaux disponibles dans ce niveau (introduction progressive) */
  materials: MaterialId[];
  /** pylônes dessinés (les points d'ancrage en haut sont dans `anchors`) */
  towers?: { x: number; top: number; base: number }[];
  waterY: number;
}

export const WORLD_W = 800;
export const WORLD_H = 550;
export const GRID = 20;

export const LEVELS: LevelDef[] = [
  {
    id: 1, name: 'Premiers pas', hint: 'Relie les deux points orange avec de la chaussée : glisse de proche en proche.',
    budget: 260, materials: ['road'],
    vehicle: CARS.citadine,
    anchors: [{ x: 260, y: 340 }, { x: 540, y: 340 }],
    deckY: 340, x0: 260, x1: 540,
    leftCliff: [{ x: 0, y: 340 }, { x: 260, y: 340 }, { x: 260, y: 550 }, { x: 0, y: 550 }],
    rightCliff: [{ x: 540, y: 340 }, { x: 800, y: 340 }, { x: 800, y: 550 }, { x: 540, y: 550 }],
    waterY: 480,
  },
  {
    id: 2, name: 'La Ravine', hint: 'Le bois est léger et bon marché : un triangle ne se déforme pas.',
    budget: 750, materials: ['road', 'wood'],
    vehicle: CARS.citadine,
    anchors: [{ x: 180, y: 340 }, { x: 620, y: 340 }],
    deckY: 340, x0: 180, x1: 620,
    leftCliff: [{ x: 0, y: 340 }, { x: 180, y: 340 }, { x: 180, y: 550 }, { x: 0, y: 550 }],
    rightCliff: [{ x: 620, y: 340 }, { x: 800, y: 340 }, { x: 800, y: 550 }, { x: 620, y: 550 }],
    waterY: 480,
  },
  {
    id: 3, name: 'Le Fleuve profond', hint: 'L’acier coûte cher mais encaisse : réserve-le aux appuis.',
    budget: 1250, materials: ['road', 'wood', 'steel'],
    vehicle: CARS.jeep1,
    anchors: [{ x: 140, y: 320 }, { x: 140, y: 420 }, { x: 660, y: 320 }, { x: 660, y: 420 }],
    deckY: 320, x0: 140, x1: 660,
    leftCliff: [{ x: 0, y: 320 }, { x: 140, y: 320 }, { x: 140, y: 550 }, { x: 0, y: 550 }],
    rightCliff: [{ x: 660, y: 320 }, { x: 800, y: 320 }, { x: 800, y: 550 }, { x: 660, y: 550 }],
    waterY: 490,
  },
  {
    id: 4, name: 'Le Canyon périlleux', hint: 'Un îlot au milieu : appuie-toi dessus.',
    budget: 1800, materials: ['road', 'wood', 'steel'],
    vehicle: CARS.jeep2,
    anchors: [{ x: 120, y: 280 }, { x: 120, y: 440 }, { x: 400, y: 480 }, { x: 680, y: 280 }, { x: 680, y: 440 }],
    deckY: 280, x0: 120, x1: 680,
    leftCliff: [{ x: 0, y: 280 }, { x: 120, y: 280 }, { x: 120, y: 550 }, { x: 0, y: 550 }],
    rightCliff: [{ x: 680, y: 280 }, { x: 800, y: 280 }, { x: 800, y: 550 }, { x: 680, y: 550 }],
    island: [{ x: 370, y: 480 }, { x: 430, y: 480 }, { x: 410, y: 550 }, { x: 390, y: 550 }],
    waterY: 510,
  },
  {
    id: 5, name: 'Les Deux Îlots', hint: 'Deux piliers naturels : répartis la charge entre eux.',
    budget: 2300, materials: ['road', 'wood', 'steel'],
    vehicle: CARS.jeep2,
    anchors: [{ x: 100, y: 300 }, { x: 100, y: 420 }, { x: 300, y: 480 }, { x: 500, y: 480 }, { x: 700, y: 300 }, { x: 700, y: 420 }],
    deckY: 300, x0: 100, x1: 700,
    leftCliff: [{ x: 0, y: 300 }, { x: 100, y: 300 }, { x: 100, y: 550 }, { x: 0, y: 550 }],
    rightCliff: [{ x: 700, y: 300 }, { x: 800, y: 300 }, { x: 800, y: 550 }, { x: 700, y: 550 }],
    island: [{ x: 270, y: 480 }, { x: 330, y: 480 }, { x: 315, y: 550 }, { x: 285, y: 550 }],
    island2: [{ x: 470, y: 480 }, { x: 530, y: 480 }, { x: 515, y: 550 }, { x: 485, y: 550 }],
    waterY: 520,
  },
  {
    id: 6, name: 'Le Pylône', hint: 'Nouveau : le câble fin ne travaille qu’en traction. Suspends le tablier au sommet du pylône.',
    budget: 1000, materials: ['road', 'wood', 'steel', 'cable'],
    vehicle: CARS.jeep1,
    anchors: [{ x: 140, y: 340 }, { x: 660, y: 340 }, { x: 400, y: 160 }],
    deckY: 340, x0: 140, x1: 660,
    leftCliff: [{ x: 0, y: 340 }, { x: 140, y: 340 }, { x: 140, y: 550 }, { x: 0, y: 550 }],
    rightCliff: [{ x: 660, y: 340 }, { x: 800, y: 340 }, { x: 800, y: 550 }, { x: 660, y: 550 }],
    island: [{ x: 370, y: 480 }, { x: 430, y: 480 }, { x: 410, y: 550 }, { x: 390, y: 550 }],
    towers: [{ x: 400, top: 160, base: 480 }],
    waterY: 510,
  },
  {
    id: 7, name: 'Le Grand Viaduc', hint: 'Nouveau : le câble porteur. Tends-le entre les pylônes en le laissant s’affaisser, puis accroche-y des câbles fins (au bout du doigt, n’importe où sur le câble).',
    budget: 1300, materials: ['road', 'wood', 'steel', 'rope', 'cable'],
    vehicle: CARS.jeep2,
    anchors: [{ x: 140, y: 340 }, { x: 660, y: 340 }, { x: 120, y: 150 }, { x: 680, y: 150 }],
    deckY: 340, x0: 140, x1: 660,
    leftCliff: [{ x: 0, y: 340 }, { x: 140, y: 340 }, { x: 140, y: 550 }, { x: 0, y: 550 }],
    rightCliff: [{ x: 660, y: 340 }, { x: 800, y: 340 }, { x: 800, y: 550 }, { x: 660, y: 550 }],
    towers: [{ x: 120, top: 150, base: 340 }, { x: 680, top: 150, base: 340 }],
    waterY: 500,
  },
];
