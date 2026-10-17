// Infobulles : les boutons à icône n'ont plus de texte ; leur rôle s'affiche quand le pointeur s'y attarde.
// npm run e2e:tooltips (après npm run build). Captures dans e2e/out/.
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
  await page.evaluate(() => window.__pontifex.loadLevel(0));
  await sleep(500);

  const buttons = ['btnDelete', 'btnUndo', 'btnRedo', 'btnClear', 'btnSpeed', 'btnGrid', 'btnSound', 'btnMusic', 'btnMusicPause', 'btnMusicNext', 'btnFullscreen', 'btnTest'];
  const center = (name) => page.evaluate((n) => {
    const button = window.__pontifex[n];
    const g = button.getGlobalPosition();
    return [g.x + button.width / 2, g.y + button.height / 2, button.width];
  }, name);

  for (const name of buttons) {
    const [, , width] = await center(name);
    assert.ok(width <= 70, `${name} : bouton à icône seule attendu, largeur ${Math.round(width)}`);
  }
  console.log('✔ aucun texte sur les boutons à icône (largeur réduite à l’icône)');

  const expected = {
    btnTest: 'Tester le pont', btnUndo: 'Annuler', btnGrid: 'Grille', btnSound: 'Son', btnSpeed: 'Ralenti', btnMusicNext: 'Morceau suivant', btnFullscreen: 'Plein écran',
  };
  for (const [name, start] of Object.entries(expected)) {
    const [x, y] = await center(name);
    await page.mouse.move(x, y);
    await sleep(150);
    assert.equal(await page.evaluate(() => window.__pontifex.tooltips.tooltip.isShowing), false, `${name} : pas d’infobulle avant le délai`);
    await sleep(900);
    const shown = await page.evaluate(() => ({ showing: window.__pontifex.tooltips.tooltip.isShowing, text: window.__pontifex.tooltips.tooltip.text }));
    assert.equal(shown.showing, true, `${name} : infobulle attendue après le délai`);
    assert.ok(shown.text.startsWith(start), `${name} : « ${shown.text} » ne commence pas par « ${start} »`);
    if (name === 'btnGrid') await page.screenshot({ path: `${out}/tooltip-grille.png` });
    await page.mouse.move(640, 300);
    await sleep(100);
    assert.equal(await page.evaluate(() => window.__pontifex.tooltips.tooltip.isShowing), false, `${name} : infobulle masquée en quittant le bouton`);
    console.log(`✔ ${name} : « ${shown.text} »`);
  }

  // matériau : nom, prix, portée
  const [mx, my] = await page.evaluate(() => {
    const button = window.__pontifex.matButtons.get('road');
    const g = button.getGlobalPosition();
    return [g.x + button.width / 2, g.y + button.height / 2];
  });
  await page.mouse.move(mx, my);
  await sleep(1000);
  const material = await page.evaluate(() => window.__pontifex.tooltips.tooltip.text);
  assert.match(material, /Chaussée · \d+ €\/m · poutre de \d+(\.\d+)? m max \(touche 1\)/);
  await page.screenshot({ path: `${out}/tooltip-materiau.png` });
  console.log(`✔ matériau : « ${material} »`);

  // cliquer fait disparaître l'infobulle et exécute l'action
  await page.mouse.click(mx, my);
  await sleep(100);
  assert.equal(await page.evaluate(() => window.__pontifex.tooltips.tooltip.isShowing), false);
  console.log('✔ un clic masque l’infobulle');

  // sous une fenêtre ouverte, aucune infobulle
  await page.evaluate(() => window.__pontifex.showLevels());
  await sleep(200);
  const [bx, by] = await center('btnUndo');
  await page.mouse.move(bx, by);
  await sleep(1000);
  assert.equal(await page.evaluate(() => window.__pontifex.tooltips.tooltip.isShowing), false, 'pas d’infobulle sous une fenêtre modale');
  console.log('✔ pas d’infobulle sous une fenêtre ouverte');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
