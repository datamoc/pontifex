import { get, getBinary, loadBinary, sanitizeSvg, svgDataUri, texture } from '@datamoc/mw_games/assets';
import { Assets } from 'pixi.js';
import { Node2D } from '@datamoc/mw_games/two-d';
import { SkeletalSprite } from '@datamoc/mw_games/two-d/render';
import * as Skeleton from '@datamoc/mw_games/skeleton';
import { WALKERS, WALK_PARTS, WALK_CLIP, createWalkerSkeleton, walkerPivot, isWalkerLimb, type WalkerArt } from './walker-rig.ts';
import type { AnimatedResident } from './resident-animation.ts';

const WALK_STRIDE = 28;
const availableParts = new Map<string, string[]>();
const partAlias = (name: string, part: string): string => `${name}/skeletal-${part}`;

export async function loadWalkerSkeletons(): Promise<void> {
  await loadBinary(WALKERS.map((name) => `${name}.svg`));
  const manifest = get<Record<string, WalkerArt>>('manifest.json');
  const aliases: string[] = [];
  for (const name of WALKERS) {
    const artwork = manifest[name];
    const source = sanitizeSvg(new TextDecoder().decode(getBinary(`${name}.svg`)));
    const document = new DOMParser().parseFromString(source, 'image/svg+xml');
    const root = document.documentElement;
    // Un SVG retouché à la main peut avoir une cuisse dégroupée, devant son tibia.
    if (!root.querySelector('[id="leg-near"]')) {
      const shin = root.querySelector('[id="shin-near"]');
      if (!shin) throw new Error(`${name} : jambe proche absente`);
      const thigh = document.createElementNS(root.namespaceURI, 'g');
      thigh.setAttribute('id', 'leg-near');
      shin.before(thigh);
      while (thigh.previousElementSibling?.localName === 'path') thigh.prepend(thigh.previousElementSibling);
    }
    const parts = WALK_PARTS.filter((part) => root.querySelector(`[id="${part}"]`));
    availableParts.set(name, parts);
    for (const part of parts) {
      const group = root.querySelector(`[id="${part}"]`)!.cloneNode(true) as Element;
      // Chaque articulation est dessinée une seule fois, par son propre os.
      for (const child of group.querySelectorAll('g[id]')) {
        if (WALK_PARTS.includes(child.id)) child.remove();
      }
      const [pivotX, pivotY] = walkerPivot(artwork, part);
      const isolated = root.cloneNode(false) as Element;
      const local = document.createElementNS(root.namespaceURI, 'g');
      // Une marge autour du pivot évite de couper le membre une fois orienté sur l'axe de l'os.
      const radius = artwork.height;
      isolated.setAttribute('viewBox', `${-radius} ${-radius} ${radius * 2} ${radius * 2}`);
      isolated.setAttribute('width', String(radius * 2));
      isolated.setAttribute('height', String(radius * 2));
      const rotation = isWalkerLimb(part) ? 'rotate(-90) ' : '';
      local.setAttribute('transform', `${rotation}translate(${-pivotX} ${-pivotY})`);
      local.appendChild(group);
      isolated.appendChild(local);
      const alias = partAlias(name, part);
      Assets.add({ alias, src: svgDataUri(new XMLSerializer().serializeToString(isolated)), format: 'svg', data: { resolution: 2 } });
      aliases.push(alias);
    }
  }
  await Assets.load(aliases);
}

export function makeSkeletalWalker(name: string): AnimatedResident {
  const artwork = get<Record<string, WalkerArt>>('manifest.json')[name];
  const bones = createWalkerSkeleton(artwork);
  const mixer = Skeleton.createMixer(bones, WALK_CLIP);
  const rig = new SkeletalSprite(bones, mixer);
  rig.label = 'skeletal-walker';
  for (const part of availableParts.get(name) ?? []) {
    const sprite = rig.bind(part, texture(partAlias(name, part)));
    sprite.anchor.set(0.5);
    sprite.label = part;
  }
  const node = new Node2D();
  node.pivot.set(artwork.width * artwork.anchor[0], artwork.height * artwork.anchor[1]);
  node.addChild(rig);
  let previousTime: number | null = null;
  return {
    node,
    update(time, speed, scale) {
      mixer.base.rate = speed / (WALK_STRIDE * scale);
      if (previousTime === null) mixer.base.time = time % WALK_CLIP.duration;
      rig.update(previousTime === null ? 0 : Math.max(0, time - previousTime));
      previousTime = time;
      // Le pied le plus bas reste sur le sol pendant la flexion des genoux.
      const transforms = Skeleton.resolve(bones, Skeleton.samplePose(WALK_CLIP, mixer.base.time));
      const soles = transforms.filter((bone) => bone.name.startsWith('shin-')).map((bone) => bone.tipY + 2);
      rig.y = artwork.height - Math.max(...soles);
    },
  };
}
