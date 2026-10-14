import { get, getBinary, loadBinary, sanitizeSvg, svgDataUri, texture } from '@datamoc/mw_games/assets';
import { Assets } from 'pixi.js';
import { Node2D } from '@datamoc/mw_games/two-d';
import { SkeletalSprite } from '@datamoc/mw_games/two-d/render';
import { CYCLIST, CYCLIST_PARTS, CYCLIST_WHEEL_RADIUS, createCyclistSkeleton, cyclistPose, cyclistRestAngles, type CyclistArt } from './cyclist-rig.ts';
import type { AnimatedResident } from './resident-animation.ts';

const partAlias = (part: string): string => `${CYCLIST}/skeletal-${part}`;

export async function loadCyclistSkeleton(): Promise<void> {
  await loadBinary([`${CYCLIST}.svg`]);
  const art = get<Record<string, CyclistArt>>('manifest.json')[CYCLIST];
  const document = new DOMParser().parseFromString(sanitizeSvg(new TextDecoder().decode(getBinary(`${CYCLIST}.svg`))), 'image/svg+xml');
  const root = document.documentElement;
  const rest = cyclistRestAngles(art);
  const aliases: string[] = [];
  for (const part of CYCLIST_PARTS) {
    let drawing: Element;
    if (part === 'body') {
      drawing = document.createElementNS(root.namespaceURI, 'g');
      for (const child of root.children) drawing.appendChild(child.cloneNode(true));
      for (const member of drawing.querySelectorAll('g[id]')) {
        if (CYCLIST_PARTS.includes(member.id)) member.remove();
      }
    } else {
      const group = root.querySelector(`[id="${part}"]`);
      if (!group) throw new Error(`${CYCLIST} : groupe ${part} manquant`);
      drawing = group.cloneNode(true) as Element;
      for (const member of drawing.querySelectorAll('g[id]')) {
        if (CYCLIST_PARTS.includes(member.id)) member.remove();
      }
    }
    const [x, y] = part === 'body' ? [0, 0] : art.pivots[part];
    const isolated = root.cloneNode(false) as Element;
    const radius = art.height;
    isolated.setAttribute('viewBox', `${-radius} ${-radius} ${radius * 2} ${radius * 2}`);
    isolated.setAttribute('width', String(radius * 2));
    isolated.setAttribute('height', String(radius * 2));
    const local = document.createElementNS(root.namespaceURI, 'g');
    local.setAttribute('transform', `rotate(${-rest[part]}) translate(${-x} ${-y})`);
    local.appendChild(drawing);
    isolated.appendChild(local);
    const alias = partAlias(part);
    Assets.add({ alias, src: svgDataUri(new XMLSerializer().serializeToString(isolated)), format: 'svg', data: { resolution: 2 } });
    aliases.push(alias);
  }
  await Assets.load(aliases);
}

export function makeSkeletalCyclist(): AnimatedResident {
  const art = get<Record<string, CyclistArt>>('manifest.json')[CYCLIST];
  const rig = new SkeletalSprite(createCyclistSkeleton(art));
  rig.label = 'skeletal-cyclist';
  for (const part of CYCLIST_PARTS) {
    const sprite = rig.bind(part, texture(partAlias(part)));
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
