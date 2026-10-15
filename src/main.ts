import { Game } from '@datamoc/mwg/two-d';
import { resolve } from '@datamoc/mwg/assets';
import { PontifexScene } from './scene.ts';
import { loadArt } from './art.ts';

const game = new Game({ background: 0x020617, pixelArt: false });
// les images sont compilées dans la page par mwgPage : `load` ne fait que les décoder
loadArt()
  .then(() => {
    document.querySelector<HTMLImageElement>('#mwg-badge')!.src = resolve('powered-by-mwg.svg');
    return game.start(PontifexScene);
  })
  .catch((e) => {
    document.body.insertAdjacentHTML('beforeend', `<pre style="color:#f87171;padding:16px">${String(e)}</pre>`);
    throw e;
  });
