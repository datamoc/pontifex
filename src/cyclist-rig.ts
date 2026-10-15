import * as Skeleton from '@datamoc/mwg/skeleton';

export const CYCLIST = 'common/cyclist';
export const CYCLIST_WHEEL_RADIUS = 14;
export const CYCLIST_PARTS = ['wheel-rear', 'wheel-front', 'leg-far', 'shin-far', 'body', 'crank', 'leg-near', 'shin-near'];

export interface CyclistArt {
  width: number;
  height: number;
  anchor: [number, number];
  pivots: Record<string, [number, number]>;
  rig: { legs: { hip: [number, number]; bb: [number, number]; crank: number; thigh: number; shin: number; baseAngle: number } };
}

const pedalChains = new WeakMap<CyclistArt, Skeleton.SkeletonBones>();

/** Le pied suit la pédale ; le genou est résolu par les longueurs des deux os. */
function pedalAngles(art: CyclistArt, phase: number): { thigh: number; shin: number } {
  const leg = art.rig.legs;
  const dx = leg.bb[0] + Math.cos(phase) * leg.crank - leg.hip[0];
  const dy = leg.bb[1] + Math.sin(phase) * leg.crank - leg.hip[1];
  let chain = pedalChains.get(art);
  if (!chain) {
    chain = Skeleton.create([
      { name: 'thigh', length: leg.thigh },
      { name: 'shin', parent: 'thigh', length: leg.shin },
    ]);
    pedalChains.set(art, chain);
  }
  const pose = Skeleton.solveTwoBoneIK(chain, 'thigh', 'shin', { x: dx, y: dy });
  return { thigh: pose.thigh, shin: pose.shin };
}

export function cyclistRestAngles(art: CyclistArt): Record<string, number> {
  const phase = art.rig.legs.baseAngle * Math.PI / 180;
  const near = pedalAngles(art, phase);
  const far = pedalAngles(art, phase + Math.PI);
  return {
    'leg-near': near.thigh, 'shin-near': near.thigh + near.shin,
    'leg-far': far.thigh, 'shin-far': far.thigh + far.shin,
    body: 0, crank: 0, 'wheel-front': 0, 'wheel-rear': 0,
  };
}

export function createCyclistSkeleton(art: CyclistArt): Skeleton.SkeletonBones {
  const rest = cyclistRestAngles(art);
  const bones: Skeleton.Bone[] = [{ name: 'root' }, { name: 'body', parent: 'root' }];
  for (const part of ['wheel-rear', 'wheel-front', 'crank']) {
    const [x, y] = art.pivots[part];
    bones.push({ name: `${part}-mount`, parent: 'root', origin: { x, y } });
    bones.push({ name: part, parent: `${part}-mount` });
  }
  const [x, y] = art.rig.legs.hip;
  bones.push({ name: 'hip', parent: 'root', origin: { x, y } });
  for (const side of ['far', 'near']) {
    bones.push({ name: `leg-${side}`, parent: 'hip', length: art.rig.legs.thigh, rotation: rest[`leg-${side}`] });
    bones.push({ name: `shin-${side}`, parent: `leg-${side}`, length: art.rig.legs.shin, rotation: rest[`shin-${side}`] - rest[`leg-${side}`] });
  }
  return Skeleton.create(bones);
}

export function cyclistPose(art: CyclistArt, wheelAngle: number): Skeleton.Pose {
  const rest = cyclistRestAngles(art);
  const crankAngle = wheelAngle * 0.5;
  const phase = art.rig.legs.baseAngle * Math.PI / 180 + crankAngle;
  const near = pedalAngles(art, phase);
  const far = pedalAngles(art, phase + Math.PI);
  return {
    'wheel-rear': wheelAngle * 180 / Math.PI,
    'wheel-front': wheelAngle * 180 / Math.PI,
    crank: crankAngle * 180 / Math.PI,
    'leg-near': near.thigh - rest['leg-near'],
    'leg-far': far.thigh - rest['leg-far'],
    'shin-near': near.shin - (rest['shin-near'] - rest['leg-near']),
    'shin-far': far.shin - (rest['shin-far'] - rest['leg-far']),
  };
}
