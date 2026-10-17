// Défilement (liste des niveaux, texte long) et transitions (tuiles entre niveaux, jaillissement des fenêtres),
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
    return { open: p.isOpen, scrollable: p.isScrollable, offset: p.scrollOffset, height: p.listHeight, rows: p.rows.length, level: window.__pontifex.levelIdx };
  });

  // ------------------------------------------------------------ transitions
  await scene(() => window.__pontifex.loadLevel(0));
  await page.waitForFunction(() => !window.__pontifex.transition);
  await scene(() => window.__pontifex.loadLevel(1));
  const started = await scene(() => ({ tiles: window.__pontifex.transition?.tileCount, children: window.__pontifex.transition?.container.children.length }));
  assert.deepEqual(started, { tiles: 40, children: 40 }, 'changement de niveau : 8 × 5 tuiles');
  await sleep(100);
  // Chrome sans carte graphique est lent : on fige la transition à 45 % pour une vérification et une capture reproductibles
  await scene(() => { const t = window.__pontifex.transition; const next = t.update.bind(t); t.elapsed = 0.45 * t.duration; next(0); t.update = () => false; t.next = next; });
  const middle = await scene(() => window.__pontifex.transition.container.children.map((tile) => (tile.visible ? tile.scale.x : 0)));
  assert.ok(middle.some((scale) => scale > 0.95) && middle.some((scale) => scale < 0.05), 'à 45 % : des tuiles intactes, d’autres disparues');
  await page.screenshot({ path: `${out}/transition-tuiles.png` });
  await scene(() => { const t = window.__pontifex.transition; t.update = t.next; });
  console.log(`✔ tuiles : 40 tuiles, ${middle.filter((s) => s === 0).length} déjà disparues à mi-parcours (e2e/out/transition-tuiles.png)`);
  await sleep(900);
  const ended = await scene(() => ({ transition: window.__pontifex.transition, level: window.__pontifex.levelIdx }));
  assert.deepEqual(ended, { transition: null, level: 1 });
  console.log('✔ la transition se termine et libère ses tuiles');

  // ouverture et lecture dans le même tour : aucune image n'a encore fait avancer l'animation
  const popStart = await scene(() => { window.__pontifex.confirm('Fenêtre de test', () => undefined); const w = window.__pontifex.windows.top; return { scale: w.scale.x, alpha: w.alpha }; });
  assert.ok(popStart.scale < 0.9 && popStart.alpha < 1, 'la fenêtre jaillit : petite et transparente au départ');
  await page.waitForFunction(() => window.__pontifex.pops.length === 0);
  const popEnd = await scene(() => { const w = window.__pontifex.windows.top; return { scale: w.scale.x, alpha: w.alpha, x: w.x, y: w.y }; });
  assert.equal(popEnd.scale, 1);
  assert.equal(popEnd.alpha, 1);
  await page.screenshot({ path: `${out}/pop-fenetre.png` });
  await scene(() => window.__pontifex.windows.closeAll());
  console.log('✔ jaillissement : la fenêtre se pose à sa taille et sa place normales');

  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await scene(() => window.__pontifex.loadLevel(2));
  assert.equal(await scene(() => window.__pontifex.transition), null, 'mouvement réduit : pas de tuiles');
  await scene(() => window.__pontifex.confirm('Sans animation', () => undefined));
  assert.equal(await scene(() => window.__pontifex.windows.top.scale.x), 1, 'mouvement réduit : fenêtre posée directement');
  await scene(() => window.__pontifex.windows.closeAll());
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  console.log('✔ « réduire les animations » : ni tuiles ni jaillissement');

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
  await sleep(1200);
  await page.mouse.click(...(await centerOf('levelPicker.head')));
  await sleep(300);
  let state = await picker();
  const botY = await scene(() => window.__pontifex.botY);
  assert.equal(state.rows, 9 + 25 + 1, '9 niveaux + 25 du joueur + « Mes niveaux »');
  assert.equal(state.scrollable, true, 'la liste dépasse l’écran : elle défile');
  assert.ok(state.height < 35 * 34 && state.height > 100, `hauteur plafonnée (${state.height} px au lieu de ${35 * 34})`);
  const listBottom = await scene(() => { const p = window.__pontifex.levelPicker; return p.getGlobalPosition().y + 34 + p.listHeight; });
  assert.ok(listBottom <= botY, `la liste reste au-dessus de la barre du bas (${Math.round(listBottom)} ≤ ${Math.round(botY)})`);
  await page.screenshot({ path: `${out}/liste-defilante.png` });
  console.log(`✔ liste de 35 entrées plafonnée à ${Math.round(state.height)} px, au-dessus de la barre du bas`);

  const [px, py] = await centerOf('levelPicker.rows.3');
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
  await sleep(300);
  state = await picker();
  assert.equal(state.level, 33, 'Fin, ↑, Entrée : dernier niveau du joueur');
  assert.equal(state.open, false);
  console.log('✔ clavier : Page↑, Fin, ↑, Entrée → dernier niveau du joueur chargé');

  // un clic sur une ligne après défilement choisit la bonne
  await sleep(1000);
  await page.mouse.click(...(await centerOf('levelPicker.head')));
  await sleep(300);
  await page.mouse.wheel({ deltaY: 300 });
  await sleep(200);
  const target = await scene(() => {
    const p = window.__pontifex.levelPicker;
    const top = p.getGlobalPosition().y + 34;
    const index = p.rows.findIndex((row) => { const y = row.getGlobalPosition().y; return y >= top + 40 && y <= top + 80 && !row.disabled; });
    return index;
  });
  assert.ok(target > 0);
  await page.mouse.click(...(await centerOf(`levelPicker.rows.${target}`)));
  await sleep(300);
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
    return { scrollable: h.isScrollable, height: h.viewHeight };
  }, long);
  assert.equal(hint.scrollable, true, 'texte long : il défile');
  assert.ok(hint.height <= 58, `hauteur plafonnée à 58 px (${hint.height})`);
  const [hx, hy] = await centerOf('lblHint');
  await page.mouse.move(hx, hy);
  await page.mouse.wheel({ deltaY: 100 });
  await sleep(200);
  assert.ok(await scene(() => window.__pontifex.lblHint.offset) > 0, 'la molette fait défiler le texte');
  await page.screenshot({ path: `${out}/texte-defilant.png` });
  const short = await scene(() => { const h = window.__pontifex.lblHint; h.setText('Court.'); return { scrollable: h.isScrollable, offset: h.offset }; });
  assert.deepEqual(short, { scrollable: false, offset: 0 }, 'texte court : pas de défilement, retour en haut');
  console.log('✔ texte long : plafonné à 58 px et défilant ; texte court : inchangé');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
