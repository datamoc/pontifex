// Défilement (liste des niveaux, texte long) et transitions (tuiles entre niveaux, jaillissement des fenêtres) fournis par MWG,
// avec de vrais clics, glissés et roulettes dans Chrome. npm run e2e:scroll (après npm run build). Captures dans e2e/out/.
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const chrome = process.env.CHROME ?? (process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
const out = path.resolve('e2e/out');
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', defaultViewport: { width: 1280, height: 720 },
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto('file://' + path.resolve('dist/standalone.html') + '#debug');
  await page.waitForFunction(() => window.__pontifex);
  const scene = (fn, ...args) => page.evaluate(fn, ...args);
  const centerOf = (propertyPath) => scene((p) => {
    const node = p.split('.').reduce((object, key) => object[key], window.__pontifex);
    const g = node.getGlobalPosition();
    return [g.x + node.width / 2, g.y + node.height / 2];
  }, propertyPath);
  const picker = () => scene(() => {
    const p = window.__pontifex.levelPicker;
    const box = p.scroller;
    return { open: p.model.isOpen, scrollable: box?.scrollable ?? false, offset: box?.offset ?? 0, height: box?.viewportHeight ?? 0, rows: box?.content.children.length ?? 0, level: window.__pontifex.levelIdx };
  });
  const settled = () => page.waitForFunction(() => !window.__pontifex.isTransitioning);

  // ------------------------------------------------------------ transitions (MWG : tileShrink, Window.open)
  await scene(() => window.__pontifex.loadLevel(0));
  await sleep(300);
  await scene(() => window.__pontifex.goToLevel(1));
  await page.waitForFunction(() => window.__pontifex.levelIdx === 1);
  assert.equal(await scene(() => window.__pontifex.isTransitioning), true, 'changement de niveau : une transition joue');
  await page.screenshot({ path: `${out}/transition-tuiles.png` });
  await settled();
  console.log('✔ changement de niveau : transition en tuiles, niveau 2 chargé, transition terminée (e2e/out/transition-tuiles.png)');

  // ouverture et lecture dans le même tour : aucune image n'a encore fait avancer l'animation
  const popStart = await scene(() => { window.__pontifex.confirm('Fenêtre de test', () => undefined); const w = window.__pontifex.windows.top; return { scale: w.scale.x, alpha: w.alpha }; });
  assert.ok(popStart.scale < 0.9 && popStart.alpha < 1, 'la fenêtre jaillit : petite et transparente au départ');
  await page.waitForFunction(() => { const w = window.__pontifex.windows.top; return w.scale.x === 1 && w.alpha === 1; });
  await page.screenshot({ path: `${out}/pop-fenetre.png` });
  await scene(() => window.__pontifex.windows.closeAll());
  console.log('✔ jaillissement : la fenêtre se pose à sa taille normale');

  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await scene(() => window.__pontifex.goToLevel(2));
  await page.waitForFunction(() => window.__pontifex.levelIdx === 2);
  assert.equal(await scene(() => window.__pontifex.isTransitioning), false, 'mouvement réduit : pas de transition');
  await scene(() => window.__pontifex.confirm('Sans animation', () => undefined));
  assert.equal(await scene(() => window.__pontifex.windows.top.scale.x), 1, 'mouvement réduit : fenêtre posée directement');
  await scene(() => window.__pontifex.windows.closeAll());
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  console.log('✔ « réduire les animations » : ni tuiles ni jaillissement');
  await settled();

  // ------------------------------------------------------------ liste déroulante qui défile
  await scene(() => {
    const s = window.__pontifex;
    for (let i = 0; i < 25; i++) {
      s.customLevels.add({ name: `Niveau du joueur ${i + 1}`, hint: '', budget: 300, materials: ['road', 'wood'], car: 'citadine', x0: 340, x1: 460, deckY: 340, waterY: 470,
        anchors: [{ x: 340, y: 340 }, { x: 460, y: 340 }], towers: [], islands: [] });
    }
    s.rebuildLevels();
    s.loadLevel(0);
  });
  await settled();
  await page.mouse.click(...(await centerOf('levelPicker.head')));
  await sleep(300);
  let state = await picker();
  const botY = await scene(() => window.__pontifex.botY);
  assert.equal(await scene(() => window.__pontifex.levelPicker.model.options.length), 9 + 25 + 1, '9 niveaux + 25 du joueur + « Mes niveaux »');
  assert.ok(state.rows >= 12, 'les lignes sont créées (au moins celles visibles)');
  assert.equal(state.scrollable, true, 'la liste dépasse l’écran : elle défile');
  assert.ok(state.height < 35 * 34 && state.height > 100, `hauteur plafonnée (${state.height} px au lieu de ${35 * 34})`);
  const listBottom = await scene(() => { const p = window.__pontifex.levelPicker; return p.getGlobalPosition().y + 34 + p.scroller.viewportHeight; });
  assert.ok(listBottom <= botY, `la liste reste au-dessus de la barre du bas (${Math.round(listBottom)} ≤ ${Math.round(botY)})`);
  await page.screenshot({ path: `${out}/liste-defilante.png` });
  console.log(`✔ liste de 35 entrées plafonnée à ${Math.round(state.height)} px, au-dessus de la barre du bas`);

  const [px, py] = await centerOf('levelPicker.scroller.content.children.3');
  await page.mouse.move(px, py);
  await page.mouse.wheel({ deltaY: 200 });
  await sleep(200);
  const afterWheel = (await picker()).offset;
  assert.ok(afterWheel > 0, 'la molette fait défiler');
  console.log(`✔ molette : décalage ${Math.round(afterWheel)} px`);

  // glisser : le défilement ne doit pas choisir la ligne sur laquelle on relâche
  await page.mouse.move(px, py + 60);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++) await page.mouse.move(px, py + 60 - step * 12);
  await page.mouse.up();
  await sleep(200);
  state = await picker();
  assert.ok(state.offset > afterWheel, 'le glisser vers le haut fait défiler vers le bas');
  assert.equal(state.open, true, 'la liste reste ouverte après un glisser');
  assert.equal(state.level, 0, 'le glisser ne choisit aucun niveau');
  console.log(`✔ glisser : décalage ${Math.round(state.offset)} px, aucune ligne choisie`);

  // clavier : Fin → dernière entrée, Page↑, Entrée
  await page.keyboard.press('PageUp');
  await sleep(100);
  assert.ok((await picker()).offset < state.offset, 'Page↑ remonte');
  await page.keyboard.press('End');
  await sleep(100);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__pontifex.levelIdx === 33);
  await settled();
  state = await picker();
  assert.equal(state.level, 33, 'Fin, ↑, Entrée : dernier niveau du joueur');
  assert.equal(state.open, false);
  console.log('✔ clavier : Page↑, Fin, ↑, Entrée → dernier niveau du joueur chargé');

  // un clic sur une ligne après défilement choisit la bonne
  await page.mouse.click(...(await centerOf('levelPicker.head')));
  await sleep(300);
  await page.mouse.move(...(await centerOf('levelPicker.scroller.content.children.2')));
  await page.mouse.wheel({ deltaY: 300 });
  await sleep(300);
  const target = await scene(() => {
    const p = window.__pontifex.levelPicker;
    const top = p.getGlobalPosition().y + 34;
    const index = p.scroller.content.children.findIndex((row) => { const y = row.getGlobalPosition().y; return y >= top + 40 && y <= top + 200 && !row.disabled; });
    return index;
  });
  assert.ok(target > 0);
  await page.mouse.click(...(await centerOf(`levelPicker.scroller.content.children.${target}`)));
  await page.waitForFunction((index) => window.__pontifex.levelIdx === index, {}, target);
  await settled();
  assert.equal((await picker()).level, target, 'le clic après défilement charge la ligne visée');
  console.log(`✔ clic après défilement : niveau ${target + 1} chargé`);

  // ------------------------------------------------------------ texte long qui défile
  await page.setViewport({ width: 390, height: 844 });
  await scene(() => window.__pontifex.resize(390, 844));
  await sleep(300);
  const long = Array.from({ length: 14 }, (_, i) => `Étape ${i + 1} : place une poutre entre les deux points orange.`).join(' ');
  const hint = await scene((text) => {
    const h = window.__pontifex.lblHint;
    h.setText(text);
    return { scrollable: h.box.scrollable, height: h.box.viewportHeight };
  }, long);
  assert.equal(hint.scrollable, true, 'texte long : il défile');
  assert.ok(hint.height <= 58, `hauteur plafonnée à 58 px (${hint.height})`);
  const [hx, hy] = await centerOf('lblHint');
  await page.mouse.move(hx, hy);
  await page.mouse.wheel({ deltaY: 100 });
  await sleep(200);
  assert.ok(await scene(() => window.__pontifex.lblHint.box.offset) > 0, 'la molette fait défiler le texte');
  await page.screenshot({ path: `${out}/texte-defilant.png` });
  const short = await scene(() => { const h = window.__pontifex.lblHint; h.setText('Court.'); return { scrollable: h.box.scrollable, offset: h.box.offset }; });
  assert.deepEqual(short, { scrollable: false, offset: 0 }, 'texte court : pas de défilement, retour en haut');
  console.log('✔ texte long : plafonné à 58 px et défilant ; texte court : inchangé');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
