import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const chrome = process.env.CHROME
  ?? (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
const browser = await puppeteer.launch({ executablePath: chrome, headless: true,
  defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(pathToFileURL(resolve('dist/standalone.html')).href + '#debug');
  await page.waitForFunction(() => window.__pontifex);
  const scene = (fn, ...args) => page.evaluate(fn, ...args);
  const worldPoint = (x, y) => scene((x, y) => {
    const p = window.__pontifex.world.toGlobal({ x, y });
    return { x: p.x, y: p.y };
  }, x, y);
  const count = () => scene(() => window.__pontifex.structure.beams.length);
  const reset = () => scene(() => window.__pontifex.loadLevel(0));
  const cdp = await page.createCDPSession();
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: points.map((p, id) => ({ ...p, id, radiusX: 5, radiusY: 5 })),
  });
  const tap = async (p) => { await touch('touchStart', [p]); await touch('touchEnd', []); };
  const pinch = async (factor, shift = 0, y = 420) => {
    await touch('touchStart', [{ x: 155, y }]);
    await touch('touchStart', [{ x: 155, y }, { x: 235, y }]);
    await touch('touchMove', [{ x: 195 - 40 * factor + shift, y }, { x: 195 + 40 * factor + shift, y }]);
    await touch('touchEnd', [{ x: 195 - 40 * factor + shift, y }]);
    await touch('touchEnd', []);
  };

  // Deux taps créent la même poutre que le glisser, sans nœud créé au premier tap.
  await reset();
  const nodesBefore = await scene(() => window.__pontifex.structure.nodes.length);
  await tap(await worldPoint(340, 340));
  assert.equal(await count(), 0);
  assert.equal(await scene(() => window.__pontifex.structure.nodes.length), nodesBefore);
  assert.ok(await scene(() => window.__pontifex.pendingStart));
  await tap(await worldPoint(460, 340));
  assert.equal(await count(), 1);
  console.log('✔ mobile : construction en deux taps');

  // Pincer annule une sélection et garde le point central sous les doigts.
  await reset();
  await tap(await worldPoint(340, 340));
  const zoom = await scene(() => window.__pontifex.camera.zoom);
  const anchor = await scene(() => window.__pontifex.camera.toWorld(195, 420));
  await pinch(2, 20);
  const after = await scene(() => ({ zoom: window.__pontifex.camera.zoom,
    point: window.__pontifex.camera.toWorld(215, 420), pending: window.__pontifex.pendingStart }));
  assert.ok(Math.abs(after.zoom / zoom - 2) < 0.03);
  assert.ok(Math.hypot(after.point.x - anchor.x, after.point.y - anchor.y) < 1);
  assert.equal(after.pending, null);
  assert.equal(await count(), 0);
  await pinch(0.5);
  assert.ok(Math.abs((await scene(() => window.__pontifex.camera.zoom)) / zoom - 1) < 0.03);
  assert.equal(await count(), 0);
  console.log('✔ mobile : zoom, dézoom et déplacement à deux doigts, sans poutre accidentelle');
  await pinch(4);
  await pinch(2);
  assert.ok(Math.abs((await scene(() => window.__pontifex.camera.zoom)) / zoom - 4) < 0.03);
  await pinch(0.1);
  assert.ok(Math.abs((await scene(() => window.__pontifex.camera.zoom)) / zoom - 0.5) < 0.03);


  // Le pincement en mode effacement ne supprime rien, et un tap normal reste utilisable.
  await reset();
  await tap(await worldPoint(340, 340));
  await tap(await worldPoint(460, 340));
  await scene(() => window.__pontifex.setTool('delete'));
  await pinch(1.5, 0, (await worldPoint(400, 340)).y);
  assert.equal(await count(), 1);
  await tap(await worldPoint(400, 340));
  assert.equal(await count(), 0);
  await scene(() => window.__pontifex.setTool('road'));
  await tap(await worldPoint(340, 340));
  await tap(await worldPoint(460, 340));
  assert.equal(await count(), 1);
  console.log('✔ mobile : effacement et construction utilisables après le pincement');

  // Les outils de l’éditeur attendent la fin d’un tap, jamais le premier doigt d’un zoom.
  await scene(() => window.__pontifex.enterEditor(null));
  const draft = await scene(() => JSON.stringify(window.__pontifex.editor.draft));
  const editPoint = await worldPoint(400, 400);
  await touch('touchStart', [editPoint]);
  await touch('touchStart', [editPoint, { x: editPoint.x + 70, y: editPoint.y }]);
  await touch('touchMove', [{ x: editPoint.x - 15, y: editPoint.y }, { x: editPoint.x + 85, y: editPoint.y }]);
  await touch('touchEnd', []);
  assert.equal(await scene(() => JSON.stringify(window.__pontifex.editor.draft)), draft);
  console.log('✔ mobile : pincement dans l’éditeur sans modifier le niveau');
  await scene(() => { window.__pontifex.editing = false; window.__pontifex.loadLevel(0); });

  // Une interruption tactile ne laisse pas un départ actif.
  await reset();
  await touch('touchStart', [await worldPoint(340, 340)]);
  await touch('touchCancel', []);
  assert.equal(await scene(() => window.__pontifex.pendingStart ?? window.__pontifex.drag), null);
  assert.equal(await count(), 0);
  mkdirSync('e2e/out', { recursive: true });
  await page.screenshot({ path: 'e2e/out/mobile-build.png' });
  assert.deepEqual(errors, []);
  console.log('✔ mobile : annulation tactile propre');
} finally {
  await browser.close();
}
