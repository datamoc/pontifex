// Navigation entre niveaux : premier / précédent / liste déroulante / suivant / dernier, selon les niveaux ouverts.
// npm run e2e:levels (après npm run build). Captures dans e2e/out/.
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
    const node = p.split(".").reduce((object, key) => object[key], window.__pontifex);
    const g = node.getGlobalPosition();
    return [g.x + node.width / 2, g.y + node.height / 2];
  }, propertyPath);
  const state = () => scene(() => {
    const s = window.__pontifex;
    return { level: s.levelIdx, targets: s.navTargets, disabled: Object.fromEntries(Object.entries(s.navButtons).map(([k, b]) => [k, b.disabled])) };
  });

  await scene(() => { window.__pontifex.loadLevel(0); });
  await page.waitForFunction(() => !window.__pontifex.isTransitioning);
  await sleep(100);
  let now = await state();
  assert.deepEqual(now.disabled, { first: true, previous: true, next: true, last: true }, 'niveau 1, aucun autre ouvert : tout est grisé');
  console.log('✔ départ : premier niveau, aucun autre ouvert → boutons grisés');

  // gagner le niveau 1 (index 0) ouvre le suivant
  await scene(() => { const s = window.__pontifex; s.progress.record(s.levels[0].id, 1); s.refreshLevelNav(); });
  now = await state();
  assert.deepEqual(now.targets, { first: null, previous: null, next: 1, last: 1 });
  assert.deepEqual(now.disabled, { first: true, previous: true, next: false, last: false });
  await page.mouse.click(...(await centerOf('navButtons.next')));
  await page.waitForFunction(() => !window.__pontifex.isTransitioning);
  await sleep(100);
  now = await state();
  assert.equal(now.level, 1);
  assert.deepEqual(now.targets, { first: 0, previous: 0, next: null, last: null });
  console.log('✔ suivant ouvre le niveau 2 ; premier et précédent s’activent');

  await page.mouse.click(...(await centerOf('navButtons.previous')));
  await page.waitForFunction(() => !window.__pontifex.isTransitioning);
  await sleep(100);
  assert.equal((await state()).level, 0);
  console.log('✔ précédent revient au niveau 1');

  // la liste montre tous les niveaux, les fermés sont grisés
  await page.mouse.click(...(await centerOf('levelPicker.head')));
  await sleep(200);
  const rows = await scene(() => window.__pontifex.levelPicker.scroller.content.children.map((row) => ({ disabled: row.disabled })));
  const levelCount = await scene(() => window.__pontifex.levels.length);
  assert.equal(rows.length, levelCount + 1, 'tous les niveaux + « Mes niveaux »');
  assert.equal(rows.slice(0, levelCount).filter((row) => !row.disabled).length, 2, 'seuls les niveaux 1 et 2 sont ouverts');
  await page.screenshot({ path: `${out}/levels-liste.png` });
  console.log(`✔ liste déroulante : ${levelCount} niveaux + « Mes niveaux », verrouillés grisés`);

  // tout ouvrir, puis choisir dans la liste
  await page.keyboard.press('Escape');
  await scene(() => { const s = window.__pontifex; s.levels.slice(0, s.builtinCount).forEach((level) => s.progress.record(level.id, 3)); s.refreshLevelNav(); });
  await page.mouse.click(...(await centerOf('levelPicker.head')));
  await sleep(200);
  await page.mouse.click(...(await centerOf('levelPicker.scroller.content.children.4')));
  await page.waitForFunction(() => !window.__pontifex.isTransitioning);
  await sleep(100);
  now = await state();
  assert.equal(now.level, 4, 'le niveau choisi dans la liste est chargé');
  assert.equal(await scene(() => window.__pontifex.levelPicker.model.isOpen), false, 'la liste se referme');
  console.log('✔ choix dans la liste : niveau 5 chargé, liste refermée');

  await page.mouse.click(...(await centerOf('navButtons.last')));
  await page.waitForFunction(() => !window.__pontifex.isTransitioning);
  await sleep(100);
  const builtin = await scene(() => window.__pontifex.builtinCount);
  assert.equal((await state()).level, builtin - 1);
  await page.mouse.click(...(await centerOf('navButtons.first')));
  await page.waitForFunction(() => !window.__pontifex.isTransitioning);
  await sleep(100);
  assert.equal((await state()).level, 0);
  console.log('✔ dernier puis premier niveau');

  // un clic dans le jeu referme la liste ouverte
  await page.mouse.click(...(await centerOf('levelPicker.head')));
  await sleep(200);
  assert.equal(await scene(() => window.__pontifex.levelPicker.model.isOpen), true);
  await page.mouse.click(640, 400);
  await sleep(200);
  assert.equal(await scene(() => window.__pontifex.levelPicker.model.isOpen), false);
  console.log('✔ un clic hors de la liste la referme');

  // « Mes niveaux » ouvre la gestion des niveaux
  await page.mouse.click(...(await centerOf('levelPicker.head')));
  await sleep(200);
  await page.mouse.click(...(await centerOf(`levelPicker.scroller.content.children.${builtin}`)));
  await page.waitForFunction(() => !window.__pontifex.isTransitioning);
  await sleep(100);
  assert.equal(await scene(() => !window.__pontifex.windows.isEmpty), true, 'la fenêtre de gestion des niveaux s’ouvre');
  console.log('✔ « Mes niveaux » ouvre la gestion (éditer, importer)');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
