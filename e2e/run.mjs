// Test de bout en bout dans un vrai Chrome, depuis file:// : npm run e2e  (après npm run build)
// - aucune requête réseau (seulement file:, data:, blob:)
// - construction d'un pont à la souris (niveau 1), simulation, fenêtre de résultat
// - ponts de référence des niveaux 2 à 4 (injectés), chemin d'échec, Échap ferme une fenêtre
// Captures dans e2e/out/.
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const out = path.resolve('e2e/out');
mkdirSync(out, { recursive: true });
execFileSync('npx', ['tsx', 'e2e/dump-refs.ts', `${out}/refs.json`], { stdio: 'inherit' });
const refs = JSON.parse(readFileSync(`${out}/refs.json`, 'utf8'));
const chrome = process.env.CHROME ?? '/usr/bin/google-chrome';
const url = 'file://' + path.resolve('dist/standalone.html') + '#debug';

const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', defaultViewport: { width: 1280, height: 720 },
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const problems = [];
const page = await browser.newPage();
page.on('pageerror', (e) => problems.push('erreur page : ' + e));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('GL Driver')) problems.push('console : ' + m.text().slice(0, 160)); });
page.on('request', (r) => { if (!/^(file|data|blob):/.test(r.url())) problems.push('requête externe : ' + r.url()); });
await page.goto(url);
await page.waitForFunction('window.__pontifex', { timeout: 15000 });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sc = (fn, ...a) => page.evaluate(fn, ...a);
const w2s = (x, y) => sc((x, y) => { const p = window.__pontifex.world.toGlobal({ x, y }); return [p.x, p.y]; }, x, y);
const center = (name) => sc((n) => { const b = window.__pontifex[n]; const g = b.getGlobalPosition(); return [g.x + b.width / 2, g.y + b.height / 2]; }, name);
const click = async (name) => page.mouse.click(...(await center(name)));
const drag = async (a, b) => { const [ax, ay] = await w2s(...a), [bx, by] = await w2s(...b);
  await page.mouse.move(ax, ay); await page.mouse.down(); await page.mouse.move((ax + bx) / 2, (ay + by) / 2); await page.mouse.move(bx, by); await page.mouse.up(); };
const waitEnd = async () => { for (let i = 0; i < 60; i++) { await sleep(500); if (await sc(() => window.__pontifex.windows.top !== null)) return; } };
const check = (label, ok) => { console.log(ok ? '✔' : '✖', label); if (!ok) problems.push('échec : ' + label); };

// 1. niveau 1 : construction à la souris
const roadX = [180, 280, 400, 520, 620];
await sc(() => window.__pontifex.matButtons.get('road').onClick.dispatch());
for (let i = 0; i < 4; i++) await drag([roadX[i], 340], [roadX[i + 1], 340]);
await sc(() => window.__pontifex.matButtons.get('wood').onClick.dispatch());
for (const [a, b, c, d] of [[180,340,240,440],[240,440,280,340],[280,340,340,440],[340,440,400,340],[400,340,460,440],[460,440,520,340],[520,340,560,440],[560,440,620,340],[240,440,340,440],[340,440,460,440],[460,440,560,440]]) await drag([a, b], [c, d]);
check('15 poutes posées à la souris', (await sc(() => window.__pontifex.structure.beams.length)) === 15);
await page.screenshot({ path: `${out}/1-construit.png` });
await click('btnTest'); await sleep(3500); await page.screenshot({ path: `${out}/2-simulation.png` });
await waitEnd(); await page.screenshot({ path: `${out}/3-resultat.png` });
check('niveau 1 réussi', (await sc(() => window.__pontifex.sim.status)) === 'won');

// 2. niveaux 2 à 4 : ponts de référence
for (const i of [1, 2, 3]) {
  await sc((i, st) => { const s = window.__pontifex; s.loadLevel(i); s.structure = st; s.refreshHud(); s.toggleSim(); s.speed = 2; }, i, refs[i]);
  await sleep(4000); await page.screenshot({ path: `${out}/niveau${i + 1}.png` });
  await waitEnd();
  check(`niveau ${i + 1} réussi`, (await sc(() => window.__pontifex.sim.status)) === 'won');
}

// 3. échec : un pont trop mince
await sc(() => { const s = window.__pontifex; s.windows.closeAll(); s.loadLevel(0); });
await drag([180, 340], [280, 340]); await drag([280, 340], [400, 340]);
await click('btnTest'); await waitEnd(); await page.screenshot({ path: `${out}/4-echec.png` });
check('pont trop mince : effondrement', (await sc(() => window.__pontifex.sim.status)) === 'failed');

// 4. Échap ferme une fenêtre
await sc(() => { const s = window.__pontifex; s.windows.closeAll(); s.stopSim(); s.showLevels(); });
await sleep(300); await page.screenshot({ path: `${out}/5-niveaux.png` });
await page.keyboard.press('Escape'); await sleep(300);
check('Échap ferme la fenêtre des niveaux', await sc(() => window.__pontifex.windows.isEmpty));

await browser.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('e2e OK — captures dans e2e/out/');
