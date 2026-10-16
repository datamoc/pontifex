import * as Skeleton from '@datamoc/mwg/skeleton';

export const WALKERS = [
  'common/walker_man_short_hair_trousers',
  'common/walker_woman_ponytail_trousers',
  'common/walker_man_bald_shorts',
  'common/walker_woman_long_hair_midi_skirt',
];

export interface WalkerArt {
  width: number;
  height: number;
  anchor: [number, number];
  pivots: Record<string, [number, number]>;
  rig: { walk: { thigh: number; shin: number; upperArm: number; foreArm: number } };
}

export const WALK_PARTS = [
  'arm-far', 'forearm-far', 'hair-back', 'leg-far', 'shin-far',
  'leg-near', 'shin-near', 'skirt', 'torso', 'head', 'arm-near', 'forearm-near',
];

export function walkerPivot(art: WalkerArt, part: string): [number, number] {
  if (part === 'torso') return art.pivots['leg-near'];
  if (part === 'head') return [21.4, 11.5];
  return art.pivots[part];
}

export function isWalkerLimb(part: string): boolean {
  return /^(leg|shin|arm|forearm)-/.test(part);
}

/** Les os de montage portent les points d'attache, sans pièce dessinée. */
export function createWalkerSkeleton(art: WalkerArt): Skeleton.SkeletonBones {
  const [hipX, hipY] = art.pivots['leg-near'];
  const [shoulderX, shoulderY] = art.pivots['arm-near'];
  const lengths = art.rig.walk;
  return Skeleton.create([
    { name: 'hip', origin: { x: hipX, y: hipY } },
    { name: 'torso', parent: 'hip' },
    { name: 'shoulder', parent: 'torso', origin: { x: shoulderX - hipX, y: shoulderY - hipY } },
    { name: 'head-mount', parent: 'torso', origin: { x: 21.4 - hipX, y: 11.5 - hipY } },
    { name: 'head', parent: 'head-mount' },
    { name: 'hair-back', parent: 'head' },
    { name: 'skirt', parent: 'hip' },
    ...['far', 'near'].flatMap((side) => [
      { name: `leg-${side}`, parent: 'hip', length: lengths.thigh, rotation: 90 },
      { name: `shin-${side}`, parent: `leg-${side}`, length: lengths.shin },
      { name: `arm-${side}`, parent: 'shoulder', length: lengths.upperArm, rotation: 90 },
      { name: `forearm-${side}`, parent: `arm-${side}`, length: lengths.foreArm },
    ]),
  ]);
}

const THIGH_SWING = 24;

/** Distance parcourue en un cycle : deux appuis, chacun couvrant l'amplitude du pied. */
export function walkerCycleDistance(art: WalkerArt): number {
  const legLength = art.rig.walk.thigh + art.rig.walk.shin;
  return 4 * legLength * Math.sin(THIGH_SWING * Math.PI / 180);
}

/** Angles locaux en degrés : les tibias et avant-bras héritent de leur membre parent. */
export const WALK_CLIP: Skeleton.Clip = {
  id: 'walk', duration: 1, loop: true,
  frames: Array.from({ length: 9 }, (_, frame) => {
    const phase = frame * Math.PI / 4;
    const swing = Math.cos(phase);
    return {
      time: frame / 8,
      rotations: {
        'leg-near': swing * THIGH_SWING,
        'leg-far': -swing * THIGH_SWING,
        'shin-near': Math.max(0, Math.sin(phase)) * 42,
        'shin-far': Math.max(0, -Math.sin(phase)) * 42,
        'arm-near': -swing * 18,
        'arm-far': swing * 18,
        'forearm-near': -10 - Math.max(0, -swing) * 8,
        'forearm-far': -10 - Math.max(0, swing) * 8,
        'hair-back': Math.sin(phase - 0.5) * 4,
        skirt: swing * 3,
      },
    };
  }),
};
