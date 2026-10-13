// Vérification visuelle : roues qui tournent + effets de crash (capot, flamme, explosion)
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

const refs = JSON.parse(readFileSync('e2e/out/refs.json', 'utf8'));
const chrome = process.env.CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', defaultViewport: { width: 1000, height: 640 } });
const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text().slice(0, 200)); });
await page.goto(pathToFileURL('dist/standalone.html').href + '#debug');
await page.waitForFunction('window.__pontifex', { timeout: 15000 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sc = (fn, ...a) => page.evaluate(fn, ...a);

// 1. roues : deux captures rapprochées pendant la traversée du niveau 2
await sc(() => window.__pontifex.loadLevel(2));
await sc((st) => { const s = window.__pontifex; s.structure = st; s.refreshHud(); s.toggleSim(); }, refs[2]);
await sleep(2600);
const rot1 = await sc(() => window.__pontifex.car.wheels.map((w) => w.rotation));
await page.screenshot({ path: 'e2e/out/x-roues-1.png' });
await sleep(200);
const rot2 = await sc(() => window.__pontifex.car.wheels.map((w) => w.rotation));
await page.screenshot({ path: 'e2e/out/x-roues-2.png' });
console.log('roues tournent :', rot1.map((r, i) => (rot2[i] - r).toFixed(3)).join(' '));

// 2. crash : pont trop mince au niveau 2, capture à l'instant du choc
await sc(() => { const s = window.__pontifex; s.windows.closeAll(); s.stopSim(); s.loadLevel(2); });
await sc(() => { const s = window.__pontifex; s.structure = { nodes: [{ x: 180, y: 340, fixed: true }, { x: 280, y: 340, fixed: false }, { x: 400, y: 340, fixed: false }, { x: 620, y: 340, fixed: true }], beams: [{ a: 0, b: 1, mat: 'road' }, { a: 1, b: 2, mat: 'road' }, { a: 2, b: 3, mat: 'road' }] }; s.refreshHud(); s.toggleSim(); });
for (let i = 0; i < 60; i++) { await sleep(80); if (await sc(() => window.__pontifex.sim?.crashed)) break; }
await sleep(120);
await page.screenshot({ path: 'e2e/out/x-crash-1.png' });
const st1 = await sc(() => ({ state: window.__pontifex.carState, hood: window.__pontifex.car.hood?.rotation, blast: window.__pontifex.car.blast.visible, flame: window.__pontifex.car.flame.visible }));
await sleep(400);
await page.screenshot({ path: 'e2e/out/x-crash-2.png' });
console.log('crash :', JSON.stringify(st1));
console.log('problèmes :', problems);
await browser.close();
