import { get, getBinary, loadBinary, sanitizeSvg, svgDataUri, texture } from '@datamoc/mwg/assets';
import { Assets } from 'pixi.js';
import { DeformableSprite } from '@datamoc/mwg/two-d/render';
import { Node2D, Sprite2D } from '@datamoc/mwg/two-d';
import { BIOMES } from './biomes.ts';

const FLAP_FREQUENCY = 3;
const WING_TIP_TRAVEL = 20;
const WING_ATTACHMENT_Y = 13;
const WING_TIP_Y: Record<string, number> = { 'wing-back': 3, wing: 1 };

export function wingTipDrop(time: number): number {
  return WING_TIP_TRAVEL * (1 - Math.cos(time * Math.PI * 2 * FLAP_FREQUENCY)) / 2;
}

export function wingVertexY(y: number, tipY: number, drop: number): number {
  const weight = Math.max(0, Math.min(1, (WING_ATTACHMENT_Y - y) / (WING_ATTACHMENT_Y - tipY)));
  return y + weight * drop;
}
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
  const wings = ['wing-back', 'wing'].map((part) => {
    const plane = new DeformableSprite(texture(animationAlias(name, part)), {
      columns: 2, rows: artwork.height + 1,
    });
    plane.label = part;
    // Une ligne par unité SVG : la pointe se déplace exactement de 20 unités,
    // tandis que les points d'attache et les coordonnées horizontales restent fixes.
    const original = Array.from({ length: plane.count }, (_, index) => ({ index, ...plane.restAt(index) }));
    const points = original.map((point) => ({ ...point }));
    return { plane, original, points, tipY: WING_TIP_Y[part] };
  });
  node.addChild(wings[0].plane, body, wings[1].plane);
  return {
    node,
    update(time) {
      const drop = wingTipDrop(time);
      const rise = -drop / 10;
      body.y = rise;
      for (const { plane, original, points, tipY } of wings) {
        plane.y = rise;
        for (const point of points) point.y = wingVertexY(original[point.index].y, tipY, drop);
        plane.dragVertices(points);
      }
    },
  };
}
