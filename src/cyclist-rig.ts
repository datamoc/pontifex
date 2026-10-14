import * as Skeleton from '@datamoc/mw_games/skeleton';

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

/** Le pied suit la pédale ; le genou est résolu par les longueurs des deux os. */
function pedalAngles(art: CyclistArt, phase: number): { thigh: number; shin: number } {
  const leg = art.rig.legs;
  const dx = leg.bb[0] + Math.cos(phase) * leg.crank - leg.hip[0];
  const dy = leg.bb[1] + Math.sin(phase) * leg.crank - leg.hip[1];
  const distance = Math.hypot(dx, dy);
  const bend = Math.acos(Math.max(-1, Math.min(1,
    (leg.thigh ** 2 + distance ** 2 - leg.shin ** 2) / (2 * leg.thigh * distance))));
  const thigh = Math.atan2(dy, dx) - bend;
  const kneeX = Math.cos(thigh) * leg.thigh;
  const kneeY = Math.sin(thigh) * leg.thigh;
  const shin = Math.atan2(dy - kneeY, dx - kneeX) - thigh;
  return { thigh: thigh * 180 / Math.PI, shin: shin * 180 / Math.PI };
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
