import { get, getBinary, loadBinary, sanitizeSvg, svgDataUri, texture } from '@datamoc/mw_games/assets';
import { Assets } from 'pixi.js';
import { Node2D, Sprite2D } from '@datamoc/mw_games/two-d';
import { BIOMES } from './biomes.ts';

const CYCLIST = 'common/cyclist';
const FRAME_COUNT = 8;
const WHEEL_RADIUS = 14;
const FLAP_FREQUENCY = 3;
const animationAlias = (name: string, part: string): string => `${name}/animated-${part}`;

interface ResidentArt {
  width: number;
  height: number;
  anchor: [number, number];
  pivots: Record<string, [number, number]>;
}

/** Les textures des membres conservent le repère du SVG pour placer leurs pivots. */
export async function loadResidentAnimations(): Promise<void> {
  const birds = [...new Set(BIOMES.flatMap((biome) => biome.flyingBirds))];
  const cyclists = Array.from({ length: FRAME_COUNT }, (_, frame) => `${CYCLIST}_f${frame}`);
  await loadBinary([...cyclists, ...birds].map((name) => `${name}.svg`));
  const aliases: string[] = [];
  for (const name of [...cyclists, ...birds]) {
    const cyclist = cyclists.includes(name);
    const parts = cyclist ? ['wheel-rear', 'wheel-front'] : ['wing-back', 'wing'];
    const source = sanitizeSvg(new TextDecoder().decode(getBinary(`${name}.svg`)));
    const document = new DOMParser().parseFromString(source, 'image/svg+xml');
    const root = document.documentElement;
    for (const part of parts) {
      const member = root.querySelector(`[id="${part}"]`);
      if (!member) throw new Error(`${name} : groupe ${part} manquant`);
      const isolated = root.cloneNode(false) as Element;
      isolated.appendChild(member.cloneNode(true));
      const alias = animationAlias(name, part);
      Assets.add({ alias, src: svgDataUri(new XMLSerializer().serializeToString(isolated)), format: 'svg', data: { resolution: 2 } });
      aliases.push(alias);
      member.remove();
    }
    const alias = animationAlias(name, 'body');
    Assets.add({ alias, src: svgDataUri(new XMLSerializer().serializeToString(root)), format: 'svg', data: { resolution: 2 } });
    aliases.push(alias);
  }
  await Assets.load(aliases);
}

export interface AnimatedResident {
  node: Node2D;
  update(time: number, speed: number, scale: number): void;
}

export function makeAnimatedResident(name: string, cyclist: boolean): AnimatedResident {
  const artwork = get<Record<string, ResidentArt>>('manifest.json')[name];
  const node = new Node2D();
  node.pivot.set(artwork.width * artwork.anchor[0], artwork.height * artwork.anchor[1]);
  const firstFrame = cyclist ? `${name}_f0` : name;
  const body = new Sprite2D(texture(animationAlias(firstFrame, 'body')));
  body.anchor.set(0);
  const members: Sprite2D[] = [];
  for (const part of cyclist ? ['wheel-rear', 'wheel-front'] : ['wing-back', 'wing']) {
    const sprite = new Sprite2D(texture(animationAlias(firstFrame, part)));
    sprite.label = part;
    sprite.anchor.set(0);
    const pivot = artwork.pivots[part] ?? artwork.pivots.wing;
    sprite.pivot.set(...pivot);
    sprite.position.set(...pivot);
    members.push(sprite);
  }
  // Roues derrière le cadre ; aile arrière derrière le corps, aile avant devant.
  if (cyclist) node.addChild(...members, body);
  else node.addChild(members[0], body, members[1]);
  const bodies = cyclist
    ? Array.from({ length: FRAME_COUNT }, (_, frame) => texture(animationAlias(`${name}_f${frame}`, 'body')))
    : [body.texture];
  return {
    node,
    update(time, speed, scale) {
      if (cyclist) {
        const angle = time * speed / (WHEEL_RADIUS * scale);
        for (const wheel of members) wheel.rotation = angle;
        body.texture = bodies[Math.floor(angle * FRAME_COUNT / (Math.PI * 2)) % FRAME_COUNT];
      } else {
        const phase = time * Math.PI * 2 * FLAP_FREQUENCY;
        members[0].rotation = Math.sin(phase + 0.4) * 0.75;
        members[1].rotation = Math.sin(phase) * 0.95;
      }
    },
  };
}
