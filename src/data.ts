// Données pures du jeu : matériaux, niveaux. Aucune dépendance au rendu.

export type MaterialId = 'road' | 'wood' | 'steel' | 'rope' | 'cable' | 'concrete' | 'hydraulics';

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

export { MATERIALS, CARS } from './generated/content.ts';
export const MATERIAL_ORDER: MaterialId[] = ['road', 'wood', 'steel', 'rope', 'cable', 'concrete', 'hydraulics'];

export interface VehicleDef {
  name: string;
  /** masse totale (répartie sur 2 roues) */
  mass: number;
  /** temps du 0 à 100 km/h (s) : il définit la puissance constante du moteur (voir physics.ts) */
  zeroTo100: number;
  width: number;
  height: number;
  /** planche de sprites utilisée (voir art.ts) */
  sprite: 'citadine' | 'jeep1' | 'jeep2' | 'train' | 'bike' | 'bus' | 'boat';
}

export interface Pt { x: number; y: number }

export type ShipType = 'small' | 'medium' | 'large';

export interface ShipDef {
  name: string;
  /** dessin dans assets/common (ship_<type>.svg, rendu à 2× sa taille : voir SHIP_SCALE) */
  sprite: string;
  /** gabarit : largeur de la coque et hauteur au-dessus de l'eau (px) ; tout ce qui y pénètre casse */
  width: number;
  height: number;
  /** vitesse de traversée (px/s) */
  speed: number;
}

/** les SVG des navires font 40×20, 60×25 et 80×30 ; le jeu les affiche à cette échelle */
export const SHIP_SCALE = 2;
/** enfoncement de la coque sous la ligne d'eau (px) */
export const SHIP_DRAFT = 10;
export const SHIPS: Record<ShipType, ShipDef> = {
  small: { name: 'Petit navire', sprite: 'ship_small', width: 40 * SHIP_SCALE, height: 20 * SHIP_SCALE, speed: 60 },
  medium: { name: 'Navire moyen', sprite: 'ship_medium', width: 60 * SHIP_SCALE, height: 25 * SHIP_SCALE, speed: 48 },
  large: { name: 'Grand navire', sprite: 'ship_large', width: 80 * SHIP_SCALE, height: 30 * SHIP_SCALE, speed: 40 },
};

/** Événement programmé d'un niveau : un navire traverse le canal à la ligne d'eau à partir de `time` (s). */
export interface LevelEvent { type: 'ship'; time: number; shipType: ShipType }

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
  /** navires de passage, triés par `time` */
  events: LevelEvent[];
}

export const WORLD_W = 800;
export const WORLD_H = 550;
export const GRID = 20;

