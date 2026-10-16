import { get, getBinary, loadBinary, sanitizeSvg } from '@datamoc/mwg/assets';
import { Node2D } from '@datamoc/mwg/two-d';
import { SkeletalSprite, loadSvgSkeleton } from '@datamoc/mwg/two-d/render';
import * as Skeleton from '@datamoc/mwg/skeleton';
import { WALKERS, WALK_PARTS, WALK_CLIP, createWalkerSkeleton, walkerPivot, isWalkerLimb, walkerCycleDistance, type WalkerArt } from './walker-rig.ts';
import type { AnimatedResident } from './resident-animation.ts';

type WalkerTextures = Awaited<ReturnType<typeof loadSvgSkeleton>>['textures'];
const texturesOf = new Map<string, WalkerTextures>();

export async function loadWalkerSkeletons(): Promise<void> {
  await loadBinary(WALKERS.map((name) => `${name}.svg`));
  const manifest = get<Record<string, WalkerArt>>('manifest.json');
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
    const loaded = await loadSvgSkeleton(new XMLSerializer().serializeToString(root), {
      skeleton: createWalkerSkeleton(artwork), resolution: 2,
      bindings: parts.map((bone) => {
        const [x, y] = walkerPivot(artwork, bone);
        return { bone, pivot: { x, y }, rotation: isWalkerLimb(bone) ? 90 : 0 };
      }),
    });
    texturesOf.set(name, loaded.textures);
    loaded.sprite.destroy({ children: true });
  }
}

export function makeSkeletalWalker(name: string): AnimatedResident {
  const artwork = get<Record<string, WalkerArt>>('manifest.json')[name];
  const cycleDistance = walkerCycleDistance(artwork);
  const bones = createWalkerSkeleton(artwork);
  const mixer = Skeleton.createMixer(bones, WALK_CLIP);
  const rig = new SkeletalSprite(bones, mixer);
  rig.label = 'skeletal-walker';
  for (const [part, texture] of Object.entries(texturesOf.get(name)!)) {
    const sprite = rig.bind(part, texture);
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
      mixer.base.rate = speed * WALK_CLIP.duration / (cycleDistance * scale);
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
