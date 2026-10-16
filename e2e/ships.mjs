// Navires : le niveau 9 est joué dans un vrai Chrome (npm run e2e:ships, après npm run build).
// Le gabarit est affiché en construction ; le navire sort de la roche, passe sous le pont, sa coque
// brise un pont trop bas. Captures dans e2e/out/.
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const chrome = process.env.CHROME ?? (process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
const out = path.resolve('e2e/out');
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', defaultViewport: { width: 1280, height: 720 },
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('request', (request) => {
    if (!/^(file|data|blob):/.test(request.url())) errors.push(`requête externe : ${request.url()}`);
  });
  await page.evaluateOnNewDocument(() => {
    window.__plays = 0;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) { window.__plays++; return play.apply(this, args); };
  });
  await page.goto('file://' + path.resolve('dist/standalone.html') + '#debug');
  await page.waitForFunction(() => window.__pontifex);
  await page.mouse.click(400, 250);

  const level = await page.evaluate(() => {
    const scene = window.__pontifex;
    const index = scene.levels.findIndex((l) => l.events.length > 0);
    scene.loadLevel(index);
    return { index, name: scene.level.name, events: scene.level.events };
  });
  assert.equal(level.name, 'Le Passage du Cargo');
  assert.deepEqual(level.events, [{ type: 'ship', time: 1, shipType: 'medium' }]);
  console.log('✔ niveau 9 chargé : un navire moyen annoncé');

  const hidden = await page.evaluate(() => window.__pontifex.layers.ships.children.map((sprite) => sprite.visible));
  assert.deepEqual(hidden, [false], 'le navire attend hors de vue avant l’essai');
  await new Promise((resolve) => setTimeout(resolve, 600));
  await page.screenshot({ path: `${out}/ships-gabarit.png` });
  console.log('✔ construction : navire caché, gabarit tracé (e2e/out/ships-gabarit.png)');

  // pont trop bas : un nœud à 38 px sous la route, dans le gabarit du cargo (y > 390)
  await page.evaluate(() => {
    const scene = window.__pontifex;
    const lv = scene.level;
    scene.structure = {
      nodes: [...lv.anchors.map((a) => ({ x: a.x, y: a.y, fixed: true })), { x: 400, y: 340, fixed: false }, { x: 400, y: 420, fixed: false }],
      beams: [{ a: 0, b: 2, mat: 'road' }, { a: 2, b: 1, mat: 'road' }, { a: 0, b: 3, mat: 'wood' }, { a: 3, b: 1, mat: 'wood' }, { a: 2, b: 3, mat: 'wood' }],
    };
    scene.toggleSim();
  });
  const before = await page.evaluate(() => window.__plays);
  await page.waitForFunction(() => window.__pontifex.sim.ships[0].sailing, { timeout: 20000 });
  const sailing = await page.evaluate(() => {
    const sprite = window.__pontifex.layers.ships.children[0];
    return { visible: sprite.visible, plays: window.__plays };
  });
  assert.equal(sailing.visible, true, 'le navire est visible en mer');
  assert.ok(sailing.plays > before, 'la sirène retentit');
  console.log('✔ le navire prend la mer, sirène jouée');

  await page.waitForFunction(() => window.__pontifex.sim.links.some((l) => l.broken), { timeout: 30000 });
  await page.screenshot({ path: `${out}/ships-choc.png` });
  const broken = await page.evaluate(() => window.__pontifex.sim.links.filter((l) => l.broken).length);
  assert.ok(broken > 0);
  console.log(`✔ la coque brise ${broken} poutre(s) trop basses (e2e/out/ships-choc.png)`);

  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
