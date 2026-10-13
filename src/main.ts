import { Game } from '@datamoc/mw_games/two-d';
import { PontifexScene } from './scene.ts';
import { loadArt } from './art.ts';

const game = new Game({ background: 0x020617, pixelArt: false });
// les images sont compilées dans la page par mwgPage : `load` ne fait que les décoder
loadArt()
  .then(() => game.start(PontifexScene))
  .catch((e) => {
    document.body.insertAdjacentHTML('beforeend', `<pre style="color:#f87171;padding:16px">${String(e)}</pre>`);
    throw e;
  });
