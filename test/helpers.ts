import { BridgeSim, type Structure, FRAME_DT } from '../src/physics.ts';
import { type LevelDef, type MaterialId } from '../src/data.ts';
import { LEVELS } from '../src/levels.ts';

/** Construit une Structure depuis des nœuds libres et des poutres données par coordonnées. */
export function build(level: LevelDef, free: [number, number][], beams: [number, number, MaterialId][]): Structure {
  const nodes = [
    ...level.anchors.map((a) => ({ x: a.x, y: a.y, fixed: true })),
    ...free.map(([x, y]) => ({ x, y, fixed: false })),
  ];
  return { nodes, beams: beams.map(([a, b, mat]) => ({ a, b, mat })) };
}

export function run(level: LevelDef, s: Structure, maxSeconds = 40) {
  const sim = new BridgeSim(level, s);
  let breaks = 0;
  for (let i = 0; i < maxSeconds / FRAME_DT && sim.status === 'running'; i++) {
    sim.step();
    for (const e of sim.events) if (e.type === 'break') breaks++;
    sim.events.length = 0;
  }
  return { status: sim.status, maxRatio: sim.maxRatio, breaks, time: sim.time };
}
export { LEVELS };
