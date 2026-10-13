import { build } from './helpers.ts';
import { LEVELS } from '../src/data.ts';
import type { MaterialId } from '../src/data.ts';
import type { Structure } from '../src/physics.ts';
type Beam = [number, number, MaterialId];

/** Ponts de référence : prouvent que chaque niveau est faisable et servent de garde-fou au réglage. */
function legacy(levelIdx: number): Structure {
  const L = LEVELS[levelIdx + 1];
  if (levelIdx === 0) {
    const y = 440;
    const free: [number, number][] = [[280, 340], [400, 340], [520, 340], [240, y], [340, y], [460, y], [560, y]];
    const b: Beam[] = [
      [0, 2, 'road'], [2, 3, 'road'], [3, 4, 'road'], [4, 1, 'road'],
      [0, 5, 'wood'], [5, 2, 'wood'], [2, 6, 'wood'], [6, 3, 'wood'], [3, 7, 'wood'], [7, 4, 'wood'], [4, 8, 'wood'], [8, 1, 'wood'],
      [5, 6, 'wood'], [6, 7, 'wood'], [7, 8, 'wood']];
    return build(L, free, b);
  }
  if (levelIdx === 1) {
    const D = [240, 340, 460, 560];
    const free: [number, number][] = [...D.map((x) => [x, 320] as [number, number]), ...D.map((x) => [x, 420] as [number, number])];
    // ancres 0:(140,320) 1:(140,420) 2:(660,320) 3:(660,420) ; tablier 4..7 ; membrure basse 8..11
    const b: Beam[] = [[0, 4, 'road'], [4, 5, 'road'], [5, 6, 'road'], [6, 7, 'road'], [7, 2, 'road'],
      [1, 8, 'wood'], [8, 9, 'wood'], [9, 10, 'wood'], [10, 11, 'wood'], [11, 3, 'wood'],
      [0, 8, 'steel'], [4, 9, 'wood'], [5, 10, 'wood'], [7, 10, 'wood'], [2, 11, 'steel'], [4, 8, 'wood'], [6, 11, 'wood'], [5, 9, 'wood'], [6, 10, 'wood'], [7, 11, 'wood']];
    return build(L, free, b);
  }
  if (levelIdx === 3) {
    // ancres 0:(100,300) 1:(100,420) 2:(300,480) 3:(500,480) 4:(700,300) 5:(700,420)
    const free: [number, number][] = [
      [200, 300], [300, 300], [400, 300], [500, 300], [600, 300],      // 6..10 tablier
      [300, 390], [500, 390],                                          // 11,12 piliers
      [200, 400], [400, 400], [600, 400],                              // 13..15 membrure basse
    ];
    const b: Beam[] = [
      [0, 6, 'road'], [6, 7, 'road'], [7, 8, 'road'], [8, 9, 'road'], [9, 10, 'road'], [10, 4, 'road'],
      [2, 11, 'steel'], [11, 7, 'steel'], [3, 12, 'steel'], [12, 9, 'steel'],
      [11, 6, 'steel'], [11, 8, 'steel'], [12, 8, 'steel'], [12, 10, 'steel'],
      [1, 13, 'wood'], [13, 11, 'wood'], [11, 14, 'wood'], [14, 12, 'wood'], [12, 15, 'wood'], [15, 5, 'wood'],
      [0, 13, 'steel'], [13, 6, 'wood'], [4, 15, 'steel'], [15, 10, 'wood'], [8, 14, 'wood'], [7, 14, 'wood'], [9, 14, 'wood'],
    ];
    return build(L, free, b);
  }
  // niveau 3 : un pilier sur l'îlot, deux demi-ponts en treillis
  const free: [number, number][] = [
    [220, 280], [320, 280], [400, 280], [480, 280], [580, 280],   // 5..9 tablier
    [400, 380],                                                    // 10 pilier
    [220, 400], [320, 400], [480, 400], [580, 400],                // 11..14 membrure basse
  ];
  const b: Beam[] = [
    [0, 5, 'road'], [5, 6, 'road'], [6, 7, 'road'], [7, 8, 'road'], [8, 9, 'road'], [9, 3, 'road'],
    [2, 10, 'steel'], [10, 7, 'steel'],
    [10, 6, 'steel'], [10, 8, 'steel'],
    [1, 11, 'wood'], [11, 12, 'wood'], [12, 10, 'wood'], [10, 13, 'wood'], [13, 14, 'wood'], [14, 4, 'wood'],
    [0, 11, 'steel'], [11, 5, 'wood'], [5, 12, 'wood'], [12, 6, 'wood'],
    [3, 14, 'steel'], [14, 9, 'wood'], [9, 13, 'wood'], [13, 8, 'wood'],
  ];
  return build(L, free, b);
}

type Free = [number, number][];
export function reference(i: number): Structure {
  const L = LEVELS[i];
  switch (i) {
    case 0: // chaussée seule : trois tronçons, deux points intermédiaires
      return build(L, [[360, 340], [440, 340]], [[0, 2, 'road'], [2, 3, 'road'], [3, 1, 'road']]);
    case 1: return legacy(0);
    case 2: return legacy(1);
    case 3: return legacy(2);
    case 4: return legacy(3);
    case 5: { // pylône central : tablier + haubans (câbles fins)
      // ancres 0:(140,340) 1:(660,340) 2:(400,160)
      const free: Free = [[240, 340], [340, 340], [400, 340], [460, 340], [560, 340]]; // 3..7
      const b: Beam[] = [[0, 3, 'road'], [3, 4, 'road'], [4, 5, 'road'], [5, 6, 'road'], [6, 7, 'road'], [7, 1, 'road'],
        [2, 3, 'cable'], [2, 4, 'cable'], [2, 5, 'cable'], [2, 6, 'cable'], [2, 7, 'cable']];
      return build(L, free, b);
    }
    default: { // viaduc suspendu : câble porteur entre les pylônes, suspentes (câbles fins), tablier
      // ancres 0:(140,340) 1:(660,340) 2:(120,150) 3:(680,150)
      const xs = [240, 320, 400, 480, 560];
      const ry = [220, 260, 260, 260, 220];
      const free: Free = [...xs.map((x) => [x, 340] as [number, number]), ...xs.map((x, k) => [x, ry[k]] as [number, number])]; // deck 4..8, rope 9..13
      const b: Beam[] = [[0, 4, 'road'], [4, 5, 'road'], [5, 6, 'road'], [6, 7, 'road'], [7, 8, 'road'], [8, 1, 'road'],
        [2, 9, 'rope'], [9, 10, 'rope'], [10, 11, 'rope'], [11, 12, 'rope'], [12, 13, 'rope'], [13, 3, 'rope'],
        [4, 9, 'cable'], [5, 10, 'cable'], [6, 11, 'cable'], [7, 12, 'cable'], [8, 13, 'cable']];
      return build(L, free, b);
    }
  }
}
