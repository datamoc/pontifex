import { type Pt } from './data.ts';
import { deriveLevel, type LevelSpec } from './level.ts';

type Mat = LevelSpec['materials'];
const P = (x: number, y: number): Pt => ({ x, y });
const ROAD: Mat = ['road'];
const RW: Mat = ['road', 'wood'];
const RWS: Mat = ['road', 'wood', 'steel'];

/** Les niveaux du jeu, dans l'ordre. `id` sert au stockage des étoiles : ne jamais le changer. */
export const BUILTIN_SPECS: LevelSpec[] = [
  { id: 1, label: '1', name: 'Premiers pas', hint: 'Relie les deux points orange avec une poutre de chaussée : glisse de l’un à l’autre.',
    budget: 150, materials: ROAD, car: 'citadine', x0: 340, x1: 460, deckY: 340, waterY: 470,
    view: { x: 190, y: 190, w: 420, h: 290 }, anchors: [P(340, 340), P(460, 340)], towers: [], islands: [] },
  { id: 8, label: '1bis', name: 'Le Petit Gué', hint: 'Nouveau : le bois. La chaussée tendue casse vite : soutiens-la par en dessous avec un triangle.',
    budget: 400, materials: RW, car: 'citadine', x0: 300, x1: 500, deckY: 340, waterY: 470,
    view: { x: 150, y: 190, w: 500, h: 290 }, anchors: [P(300, 340), P(500, 340)], towers: [], islands: [] },
  { id: 2, label: '2', name: 'La Ravine', hint: 'Le bois est léger et bon marché : un triangle ne se déforme pas.',
    budget: 800, materials: RW, car: 'citadine', x0: 180, x1: 620, deckY: 340, waterY: 480,
    anchors: [P(180, 340), P(620, 340)], towers: [], islands: [] },
  { id: 3, label: '3', name: 'Le Fleuve profond', hint: 'L’acier coûte cher mais encaisse : réserve-le aux appuis.',
    budget: 1250, materials: RWS, car: 'jeep1', x0: 140, x1: 660, deckY: 320, waterY: 490,
    anchors: [P(140, 320), P(140, 420), P(660, 320), P(660, 420)], towers: [], islands: [] },
  { id: 4, label: '4', name: 'Le Canyon périlleux', hint: 'Un îlot au milieu : appuie-toi dessus.',
    budget: 1800, materials: RWS, car: 'jeep2', x0: 120, x1: 680, deckY: 280, waterY: 510,
    anchors: [P(120, 280), P(120, 440), P(400, 480), P(680, 280), P(680, 440)], towers: [], islands: [{ x: 400, top: 480 }] },
  { id: 5, label: '5', name: 'Les Deux Îlots', hint: 'Deux piliers naturels : répartis la charge entre eux.',
    budget: 2300, materials: RWS, car: 'jeep2', x0: 100, x1: 700, deckY: 300, waterY: 520,
    anchors: [P(100, 300), P(100, 420), P(300, 480), P(500, 480), P(700, 300), P(700, 420)], towers: [],
    islands: [{ x: 300, top: 480 }, { x: 500, top: 480 }] },
  { id: 6, label: '6', name: 'Le Pylône', hint: 'Nouveau : le câble fin ne travaille qu’en traction. Suspends le tablier au sommet du pylône.',
    budget: 1000, materials: [...RWS, 'cable'], car: 'jeep1', x0: 140, x1: 660, deckY: 340, waterY: 510,
    anchors: [P(140, 340), P(660, 340), P(400, 160)], towers: [{ x: 400, top: 160 }], islands: [{ x: 400, top: 480 }] },
  { id: 7, label: '7', name: 'Le Grand Viaduc', hint: 'Nouveau : le câble porteur. Tends-le entre les pylônes en le laissant s’affaisser, puis accroche-y des câbles fins (n’importe où sur le câble).',
    budget: 1300, materials: [...RWS, 'rope', 'cable'], car: 'jeep2', x0: 140, x1: 660, deckY: 340, waterY: 500,
    anchors: [P(140, 340), P(660, 340), P(120, 150), P(680, 150)], towers: [{ x: 120, top: 150 }, { x: 680, top: 150 }], islands: [] },
];

export const LEVELS = BUILTIN_SPECS.map(deriveLevel);
