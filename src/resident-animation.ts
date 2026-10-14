import { get, getBinary, loadBinary, sanitizeSvg, svgDataUri, texture } from '@datamoc/mw_games/assets';
import { Assets } from 'pixi.js';
import { Node2D, Sprite2D } from '@datamoc/mw_games/two-d';
import { BIOMES } from './biomes.ts';

const FLAP_FREQUENCY = 3;
const animationAlias = (name: string, part: string): string => `${name}/animated-${part}`;

interface BirdArt {
  width: number;
  height: number;
  anchor: [number, number];
  pivots: Record<string, [number, number]>;
}

/** Les textures des membres conservent le repère du SVG pour placer leurs pivots. */
export async function loadResidentAnimations(): Promise<void> {
  const birds = [...new Set(BIOMES.flatMap((biome) => biome.flyingBirds))];
  await loadBinary(birds.map((name) => `${name}.svg`));
  const aliases: string[] = [];
  for (const name of birds) {
    const parts = ['wing-back', 'wing'];
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

export function makeFlyingBird(name: string): AnimatedResident {
  const artwork = get<Record<string, BirdArt>>('manifest.json')[name];
  const node = new Node2D();
  node.pivot.set(artwork.width * artwork.anchor[0], artwork.height * artwork.anchor[1]);
  const body = new Sprite2D(texture(animationAlias(name, 'body')));
  body.anchor.set(0);
  const members: Sprite2D[] = [];
  for (const part of ['wing-back', 'wing']) {
    const sprite = new Sprite2D(texture(animationAlias(name, part)));
    sprite.label = part;
    sprite.anchor.set(0);
    const pivot = artwork.pivots[part] ?? artwork.pivots.wing;
    sprite.pivot.set(...pivot);
    sprite.position.set(...pivot);
    members.push(sprite);
  }
  node.addChild(members[0], body, members[1]);
  return {
    node,
    update(time) {
      const phase = time * Math.PI * 2 * FLAP_FREQUENCY;
      members[0].rotation = Math.sin(phase + 0.4) * 0.75;
      members[1].rotation = Math.sin(phase) * 0.95;
    },
  };
}
