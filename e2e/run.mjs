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
// `node --import tsx` plutôt que `npx tsx` : npx.cmd n'existe pas comme exécutable sous Windows
execFileSync(process.execPath, ['--import', 'tsx', 'e2e/dump-refs.ts', `${out}/refs.json`], { stdio: 'inherit' });
const refs = JSON.parse(readFileSync(`${out}/refs.json`, 'utf8'));
const chrome = process.env.CHROME
  ?? (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
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

// Chaque biome doit conserver des personnages articulés, avec les genoux liés aux cuisses.
for (let biome = 0; biome < 9; biome++) {
  await page.evaluate((biome) => {
    const scene = window.__pontifex;
    const random = Math.random;
    try {
      Math.random = () => (biome + 0.5) / 9;
      scene.loadLevel(3);
    } finally { Math.random = random; }
    const rigs = scene.layers.decor.children.flatMap((resident) => resident.children)
      .filter((rig) => rig.label === 'skeletal-walker' || rig.label === 'skeletal-cyclist');
    if (!rigs.some((rig) => rig.label === 'skeletal-walker')) throw new Error('Piétons sans squelette');
    if (!rigs.some((rig) => rig.label === 'skeletal-cyclist')) throw new Error('Cyclistes sans squelette');
    const wings = scene.layers.wildlife.children.flatMap((resident) => resident.children)
      .filter((part) => part.label === 'wing' || part.label === 'wing-back');
    if (scene.biome.flyingBirds.length && !wings.length) throw new Error('Oiseaux sans ailes déformables');
    const wingBefore = wings.map((wing) => ({
      positions: Array.from(wing.geometry.positions),
      uvs: Array.from(wing.geometry.getAttribute('aUV').buffer.data),
    }));
    const before = rigs.map((rig) => rig.part('leg-near').rotation);
    scene.population.update(0.093);
    for (const [index, wing] of wings.entries()) {
      if (!wing.geometry.positions.some((value, i) => value !== wingBefore[index].positions[i]))
        throw new Error('Aile immobile');
      for (let vertex = 0; vertex < wing.count; vertex++) {
        const rest = wing.restAt(vertex), current = wing.vertexAt(vertex);
        if (current.x !== rest.x || (rest.y >= 13 && current.y !== rest.y))
          throw new Error('Attache ou abscisse de l’aile déplacée');
      }
      const uvs = wing.geometry.getAttribute('aUV').buffer.data;
      if (uvs.some((value, i) => value !== wingBefore[index].uvs[i]) || wing.rotation !== 0)
        throw new Error('Texture ou rotation de l’aile modifiée');
    }
    for (const [index, rig] of rigs.entries()) {
      const thigh = rig.part('leg-near');
      const shin = rig.part('shin-near');
      if (thigh.rotation === before[index]) throw new Error('Jambe immobile');
      const length = rig.label === 'skeletal-walker' ? 17 : 19;
      const tipX = thigh.x + Math.cos(thigh.rotation) * length;
      const tipY = thigh.y + Math.sin(thigh.rotation) * length;
      if (Math.hypot(shin.x - tipX, shin.y - tipY) > 1e-7) throw new Error('Genou détaché');
    }
  }, biome);
}
console.log('✔ piétons, cyclistes et ailes déformables dans les neuf biomes');
await page.evaluate(() => window.__pontifex.loadLevel(0));


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sc = (fn, ...a) => page.evaluate(fn, ...a);
const w2s = (x, y) => sc((x, y) => { const p = window.__pontifex.world.toGlobal({ x, y }); return [p.x, p.y]; }, x, y);
const center = (name) => sc((n) => { const b = window.__pontifex[n]; const g = b.getGlobalPosition(); return [g.x + b.width / 2, g.y + b.height / 2]; }, name);
const click = async (name) => page.mouse.click(...(await center(name)));
const drag = async (a, b) => { const [ax, ay] = await w2s(...a), [bx, by] = await w2s(...b);
  await page.mouse.move(ax, ay); await page.mouse.down(); await page.mouse.move((ax + bx) / 2, (ay + by) / 2); await page.mouse.move(bx, by); await page.mouse.up(); };
const waitEnd = async () => { for (let i = 0; i < 60; i++) { await sleep(500); if (await sc(() => window.__pontifex.windows.top !== null)) return; } };
const check = (label, ok) => { console.log(ok ? '✔' : '✖', label); if (!ok) problems.push('échec : ' + label); };

// La souris peut aussi construire en deux clics, puis annuler une sélection avec Échap.
await page.mouse.click(...await w2s(340, 340));
check('premier clic : aucun élément créé', await sc(() => window.__pontifex.structure.beams.length === 0 && !!window.__pontifex.pendingStart));
await page.mouse.click(...await w2s(460, 340));
check('second clic : poutre créée', await sc(() => window.__pontifex.structure.beams.length === 1));
await sc(() => window.__pontifex.loadLevel(0));
await page.mouse.click(...await w2s(340, 340));
await page.keyboard.press('Escape');
check('Échap annule le départ sélectionné', await sc(() => window.__pontifex.pendingStart === null));
await sc(() => window.__pontifex.loadLevel(0));

// 1. niveau 1 (chaussée seule) : trois tronçons à la souris
await sc(() => window.__pontifex.matButtons.get('road').onClick.dispatch());
await drag([340, 340], [460, 340]);
check('niveau 1 : une poutre posée à la souris entre les 2 points', (await sc(() => window.__pontifex.structure.beams.length)) === 1);
check('niveau 1 : seule la chaussée est proposée', JSON.stringify(await sc(() => [...window.__pontifex.matButtons].filter(([, b]) => b.visible).map(([k]) => k))) === JSON.stringify(['road', 'delete']));
await page.screenshot({ path: `${out}/1-niveau1.png` });
await click('btnTest'); await waitEnd(); await page.screenshot({ path: `${out}/1b-resultat.png` });
check('niveau 1 réussi', (await sc(() => window.__pontifex.sim.status)) === 'won');

// 1bis. niveau 1bis : poinçon en chaussée + bois, à la souris
await sc(() => { const s = window.__pontifex; s.windows.closeAll(); s.loadLevel(1); });
await sc(() => window.__pontifex.matButtons.get('road').onClick.dispatch());
await drag([280, 340], [400, 340]); await drag([400, 340], [520, 340]);
await sc(() => window.__pontifex.matButtons.get('wood').onClick.dispatch());
await drag([280, 340], [400, 380]); await drag([400, 380], [520, 340]); await drag([400, 340], [400, 380]);
await page.screenshot({ path: `${out}/1c-niveau1bis.png` });
await click('btnTest'); await waitEnd();
check('niveau 1bis réussi', (await sc(() => window.__pontifex.sim.status)) === 'won');

// 2. niveau 2 : treillis en chaussée + bois, à la souris
await sc(() => { const s = window.__pontifex; s.windows.closeAll(); s.stopSim(); s.loadLevel(2); });
await sc(() => window.__pontifex.matButtons.get('road').onClick.dispatch());
const roadX = [160, 280, 400, 520, 640];
for (let i = 0; i < 4; i++) await drag([roadX[i], 340], [roadX[i + 1], 340]);
await sc(() => window.__pontifex.matButtons.get('wood').onClick.dispatch());
for (const [a, b, c, d] of [[160,340,240,420],[240,420,280,340],[280,340,340,420],[340,420,400,340],[400,340,460,420],[460,420,520,340],[520,340,560,420],[560,420,640,340],[240,420,340,420],[340,420,460,420],[460,420,560,420]]) await drag([a, b], [c, d]);
check('niveau 2 : 15 poutres posées à la souris', (await sc(() => window.__pontifex.structure.beams.length)) === 15);
check('niveau 2 : quatre tronçons plats de 12 m relient les rives', await sc(() => {
  const { structure, level } = window.__pontifex;
  const roads = structure.beams.filter((beam) => beam.mat === 'road');
  return level.x1 - level.x0 === 480 && roads.length === 4 && roads.every((beam) => {
    const a = structure.nodes[beam.a], b = structure.nodes[beam.b];
    return a.y === level.deckY && b.y === level.deckY && Math.abs(b.x - a.x) === 120;
  });
}));
await click('btnTest'); await sleep(3500); await page.screenshot({ path: `${out}/2-simulation.png` });
await waitEnd(); check('niveau 2 réussi', (await sc(() => window.__pontifex.sim.status)) === 'won');

// 3. niveaux 3 à 7 : ponts de référence
for (const i of [3, 4, 5, 6, 7]) {
  await sc((i, st) => { const s = window.__pontifex; s.windows.closeAll(); s.stopSim(); s.loadLevel(i); s.structure = st; s.refreshHud(); s.toggleSim(); s.speed = 2; }, i, refs[i]);
  await sleep(4000); await page.screenshot({ path: `${out}/niveau${i + 1}.png` });
  await waitEnd();
  check(`niveau ${await sc(() => window.__pontifex.level.label)} réussi`, (await sc(() => window.__pontifex.sim.status)) === 'won');
}

// 3b. câble porteur : accrocher une suspente à la souris au milieu d'un câble
await sc((st) => { const s = window.__pontifex; s.windows.closeAll(); s.stopSim(); s.loadLevel(7); s.structure = { nodes: st.nodes, beams: st.beams.filter((b) => b.mat !== 'cable') }; s.refreshHud(); }, refs[7]);
const nb = await sc(() => [window.__pontifex.structure.nodes.length, window.__pontifex.structure.beams.length]);
await sc(() => window.__pontifex.matButtons.get('cable').onClick.dispatch());
await drag([370, 260], [400, 340]);
const na = await sc(() => [window.__pontifex.structure.nodes.length, window.__pontifex.structure.beams.length]);
check('suspente accrochée au câble porteur (+1 nœud, +2 poutres)', na[0] === nb[0] + 1 && na[1] === nb[1] + 2);
await page.screenshot({ path: `${out}/6-suspente.png` });

// 4. échec : un pont trop mince (niveau 2)
await sc(() => { const s = window.__pontifex; s.windows.closeAll(); s.loadLevel(2); });
await sc(() => window.__pontifex.matButtons.get('road').onClick.dispatch());
await drag([180, 340], [280, 340]); await drag([280, 340], [400, 340]);
await click('btnTest'); await waitEnd(); await page.screenshot({ path: `${out}/4-echec.png` });
check('pont trop mince : effondrement', (await sc(() => window.__pontifex.sim.status)) === 'failed');

// 6. éditeur de niveaux : outils à la souris, essai, validation, enregistrement, import, rejeu
await sc(() => { const s = window.__pontifex; s.windows.closeAll(); s.stopSim(); s.enterEditor(null); });
await sleep(400); // un rendu pour que les boutons de l'éditeur aient leur position
check('éditeur ouvert', await sc(() => window.__pontifex.editing));
const clickEd = async (t) => { const pos = await sc((t) => { const b = window.__pontifex.editor.items.find((i) => i.children.some((c) => c.text?.includes?.(t)));
  const g = b.getGlobalPosition(); return [g.x + b.width / 2, g.y + b.height / 2]; }, t); await page.mouse.click(...pos); };
const draft = () => sc(() => JSON.parse(JSON.stringify(window.__pontifex.editor.draft)));
await clickEd('Écart +'); check('écart + : 18 cases', ((d) => (d.x1 - d.x0) / 20 === 18)(await draft()));
await clickEd('Îlot'); { const [x, y] = await w2s(400, 440); await page.mouse.click(x, y); }
check('îlot posé à la souris (+1 ancrage)', ((d) => d.islands.length === 1 && d.anchors.length === 3)(await draft()));
await clickEd('Pylône'); { const [x, y] = await w2s(200, 160); await page.mouse.click(x, y); }
check('pylône posé à la souris', ((d) => d.towers.length === 1)(await draft()));
await page.screenshot({ path: `${out}/7-editeur.png` });
{ const [x, y] = await w2s(400, 440); await clickEd('Îlot'); await page.mouse.click(x, y); }
{ const [x, y] = await w2s(200, 160); await clickEd('Pylône'); await page.mouse.click(x, y); }
await clickEd('Écart −');
check('retour à 12 cases sans îlot ni pylône', ((d) => (d.x1 - d.x0) / 20 === 12 && d.islands.length === 0 && d.towers.length === 0 && d.anchors.length === 2)(await draft()));
await clickEd('Budget +'); await clickEd('Bois');
check('bois retiré puis…', ((d) => !d.materials.includes('wood'))(await draft()));
await clickEd('Bois');
check('…remis', ((d) => d.materials.includes('wood'))(await draft()));
await clickEd('Tester');
check('essai du brouillon : niveau chargé', await sc(() => window.__pontifex.testingSpec !== null && !window.__pontifex.editing));
await sc(() => window.__pontifex.matButtons.get('road').onClick.dispatch());
await drag([280, 340], [400, 340]); await drag([400, 340], [520, 340]);
await sc(() => window.__pontifex.matButtons.get('wood').onClick.dispatch());
await drag([280, 340], [400, 380]); await drag([400, 380], [520, 340]); await drag([400, 340], [400, 380]);
await click('btnTest'); await waitEnd(); await page.screenshot({ path: `${out}/8-essai.png` });
check('essai réussi : la solution est validée', (await sc(() => window.__pontifex.sim.status)) === 'won' && (await sc(() => !!window.__pontifex.testingSpec.solution)));
await sc(() => { window.__pontifex.windows.closeAll(); window.__pontifex.backToEditor(); });
await sleep(400);
check('retour à l’éditeur avec la solution', (await sc(() => window.__pontifex.editor.status())).includes('solution ✔'));
await clickEd('Enregistrer');
check('niveau enregistré', (await sc(() => window.__pontifex.customs.length)) === 1);
const exported = await sc(() => JSON.stringify(window.__pontifex.editor.draft));
await sc((t) => window.__pontifex.importText(t), exported.replace('Nouveau niveau', 'Copie importée'));
check('import d’un niveau exporté', (await sc(() => window.__pontifex.customs.map((c) => c.name))).join('|') === 'Nouveau niveau|Copie importée');
await sc(() => window.__pontifex.importText('{"name":"x"}'));
check('import invalide refusé', (await sc(() => window.__pontifex.customs.length)) === 2);
await page.screenshot({ path: `${out}/9-liste.png` });
await clickEd('Quitter');
await sc(() => { const s = window.__pontifex; s.windows.closeAll(); s.loadLevel(s.builtinCount); s.structure = JSON.parse(JSON.stringify(s.customs[0].solution)); s.refreshHud(); s.toggleSim(); s.speed = 2; });
await waitEnd();
check('niveau personnalisé rejoué avec sa solution', (await sc(() => window.__pontifex.sim.status)) === 'won');
await sc(() => { window.__pontifex.windows.closeAll(); window.__pontifex.stopSim(); window.__pontifex.loadLevel(0); });

// 5. Échap ferme une fenêtre
await sc(() => { const s = window.__pontifex; s.windows.closeAll(); s.stopSim(); s.loadLevel(0); s.showLevels(); });
await sleep(300); await page.screenshot({ path: `${out}/5-niveaux.png` });
await page.keyboard.press('Escape'); await sleep(300);
check('Échap ferme la fenêtre des niveaux', await sc(() => window.__pontifex.windows.isEmpty));

await browser.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('e2e OK — captures dans e2e/out/');
