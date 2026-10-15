import { get, getBinary, loadBinary, sanitizeSvg } from '@datamoc/mwg/assets';
import { Node2D } from '@datamoc/mwg/two-d';
import { SkeletalSprite, loadSvgSkeleton } from '@datamoc/mwg/two-d/render';
import { CYCLIST, CYCLIST_PARTS, CYCLIST_WHEEL_RADIUS, createCyclistSkeleton, cyclistPose, cyclistRestAngles, type CyclistArt } from './cyclist-rig.ts';
import type { AnimatedResident } from './resident-animation.ts';

let textures: Awaited<ReturnType<typeof loadSvgSkeleton>>['textures'];

export async function loadCyclistSkeleton(): Promise<void> {
  await loadBinary([`${CYCLIST}.svg`]);
  const art = get<Record<string, CyclistArt>>('manifest.json')[CYCLIST];
  const document = new DOMParser().parseFromString(sanitizeSvg(new TextDecoder().decode(getBinary(`${CYCLIST}.svg`))), 'image/svg+xml');
  const root = document.documentElement;
  const rest = cyclistRestAngles(art);
  // Le corps rassemble les éléments fixes ; MWG retire les descendants articulés.
  const body = document.createElementNS(root.namespaceURI, 'g');
  body.setAttribute('id', 'body');
  for (const child of [...root.children]) body.appendChild(child);
  root.appendChild(body);
  const loaded = await loadSvgSkeleton(new XMLSerializer().serializeToString(root), {
    skeleton: createCyclistSkeleton(art), resolution: 2,
    bindings: CYCLIST_PARTS.map((bone) => {
      const [x, y] = bone === 'body' ? [0, 0] : art.pivots[bone];
      return { bone, pivot: { x, y }, rotation: rest[bone] };
    }),
  });
  textures = loaded.textures;
  loaded.sprite.destroy({ children: true });
}

export function makeSkeletalCyclist(): AnimatedResident {
  const art = get<Record<string, CyclistArt>>('manifest.json')[CYCLIST];
  const rig = new SkeletalSprite(createCyclistSkeleton(art));
  rig.label = 'skeletal-cyclist';
  for (const part of CYCLIST_PARTS) {
    const sprite = rig.bind(part, textures[part]);
    sprite.anchor.set(0.5);
    sprite.label = part;
  }
  const node = new Node2D();
  node.pivot.set(art.width * art.anchor[0], art.height * art.anchor[1]);
  node.addChild(rig);
  return {
    node,
    update(time, speed, scale) {
      rig.apply(cyclistPose(art, time * speed / (CYCLIST_WHEEL_RADIUS * scale)));
    },
  };
}
