import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const chrome = process.env.CHROME ?? (process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  mkdirSync('e2e/out', { recursive: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('request', (request) => {
    if (!/^(file|data|blob):/.test(request.url())) errors.push(`External request: ${request.url()}`);
  });
  await page.goto('file://' + path.resolve('dist/standalone.html') + '#debug');
  await page.waitForFunction(() => window.__pontifex);
  assert.equal(await page.evaluate(() => window.__pontifex.music.context), null);
  assert.equal(await page.evaluate(() => window.__pontifex.speed), 0.5);
  assert.equal(await page.evaluate(() => { const s = window.__pontifex; s.btnSpeed.onClick.dispatch(); return s.speed; }), 1);
  assert.equal(await page.evaluate(() => { const s = window.__pontifex; s.btnSpeed.onClick.dispatch(); return s.speed; }), 0.5);
  console.log('✔ commandes Temps réel / Ralenti');
  await page.mouse.click(400, 250);
  for (const id of ['gymnopedie-1', 'meditation-thais', 'marche-turque', 'les-sauvages', 'beethoven-7-2', 'beethoven-5-1', 'ancient-mysteries', 'theme-song']) {
    await page.evaluate((id) => window.__pontifex.music.select(id), id);
    await page.waitForFunction(() => window.__pontifex.music.error || window.__pontifex.music.channel?.isPlaying, { timeout: 30000 });
    // D'abord l'ordonnanceur du nouveau morceau (l'analyseur rejoue l'ancien pendant ~40 ms).
    await page.waitForFunction(() => (window.__pontifex.music.channel?.scheduledTotal ?? 0) > 0, { timeout: 30000 });
    await page.waitForFunction(() => {
      const analyser = window.__pontifex.music.analyser;
      const data = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(data);
      return data.some((sample) => Math.abs(sample) > 0.005);
    }, { timeout: id === 'meditation-thais' ? 2000 : 20000 });
    const state = await page.evaluate(() => {
      const music = window.__pontifex.music;
      return { error: music.error, playing: music.channel?.isPlaying, context: music.context.state,
        duration: music.duration, position: music.position(), scheduled: music.scheduledTotal };
    });
    assert.equal(state.error, '');
    assert.equal(state.playing, true);
    assert.equal(state.context, 'running');
    assert.ok(state.duration > 30 && state.scheduled > 0 && state.position >= 0);
    if (id === 'meditation-thais') assert.ok(state.position >= 3.69 && state.duration > 270, 'THAIS.MID entier, sans silence initial');
    if (id === 'beethoven-7-2') assert.ok(state.duration > 430, 'mouvement entier');
    if (id === 'beethoven-5-1') assert.ok(state.duration > 310, 'mouvement entier');
    if (id === 'marche-turque') assert.ok(state.duration > 250, 'morceau entier');
    console.log(`✔ Musique ${id} : MIDI rendu par MWG, ${state.duration.toFixed(1)} s, ${state.scheduled} tampon en lecture`);
  }
  await page.evaluate(() => window.__pontifex.music.setEnabled(false));
  await page.waitForFunction(() => window.__pontifex.music.context.state === 'suspended');
  const before = await page.evaluate(() => window.__pontifex.music.channel.position());
  await page.evaluate(() => window.__pontifex.music.setEnabled(true));
  await page.waitForFunction(() => window.__pontifex.music.gain.gain.value > 0.2);
  assert.ok(await page.evaluate((before) => window.__pontifex.music.channel.position() >= before, before));
  console.log('✔ sourdine et reprise sans recommencer le morceau');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => window.__pontifex.music.context.state === 'suspended');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => window.__pontifex.music.context.state === 'running');
  console.log('✔ onglet masqué : suspension et reprise de l’horloge audio');
  await page.evaluate(() => window.__pontifex.btnMusicPause.onClick.dispatch());
  await page.waitForFunction(() => window.__pontifex.music.context.state === 'suspended');
  const pausePosition = await page.evaluate(() => window.__pontifex.music.channel.position());
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(await page.evaluate(() => window.__pontifex.music.channel.position()), pausePosition);
  await page.evaluate(() => window.__pontifex.btnMusicPause.onClick.dispatch());
  await page.waitForFunction(() => window.__pontifex.music.context.state === 'running');
  console.log('✔ bouton Pause / Reprendre : position conservée');
  const beforeEnd = await page.evaluate(() => window.__pontifex.music.selected);
  await page.evaluate(() => {
    const music = window.__pontifex.music;
    music.channel.seek(music.channel.duration - 0.05);
  });
  await page.waitForFunction((before) => window.__pontifex.music.selected !== before && window.__pontifex.music.channel?.isPlaying, { timeout: 30000 }, beforeEnd);
  console.log('✔ fin naturelle : tirage au sort du morceau suivant');
  const beforeNext = await page.evaluate(() => window.__pontifex.music.selected);
  await page.evaluate(() => window.__pontifex.btnMusicNext.onClick.dispatch());
  await page.waitForFunction((before) => window.__pontifex.music.selected !== before && window.__pontifex.music.channel?.isPlaying, { timeout: 30000 }, beforeNext);
  await page.evaluate(() => {
    const music = window.__pontifex.music;
    music.select('theme-song');
    music.select('ancient-mysteries');
    music.select('');
  });
  await page.waitForFunction(() => !window.__pontifex.music.loading);
  assert.equal(await page.evaluate(() => window.__pontifex.music.channel), null);
  assert.equal(await page.evaluate(() => window.__pontifex.music.error), '');
  console.log('✔ changements rapides : aucune lecture après Sans musique');
  await page.evaluate(() => window.__pontifex.showMusic());
  await page.screenshot({ path: 'e2e/out/music.png' });
  await page.evaluate(() => window.__pontifex.windows.closeAll());
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => { const s = window.__pontifex; s.resize(390, 844); s.showMusic(); });
  const scrollState = await page.evaluate(() => {
    const win = window.__pontifex.windows.top;
    const list = win.content.children.find((child) => typeof child.scrollBy === 'function');
    list.scrollTo(list.maxOffset);
    const last = list.content.children.find((child) => child.children.some((text) => text.text === 'Theme Song [8-bit]'));
    const point = last.toGlobal({ x: last.width / 2, y: last.height / 2 });
    return { x: point.x, y: point.y, width: win.width, height: win.height };
  });
  assert.ok(scrollState.width <= 390 && scrollState.height <= 844);
  await page.screenshot({ path: 'e2e/out/music-mobile.png' });
  await page.mouse.click(scrollState.x, scrollState.y);
  assert.equal(await page.evaluate(() => window.__pontifex.music.selected), 'theme-song');
  console.log('✔ liste des huit morceaux accessible sur écran étroit');
  assert.deepEqual(errors, []);
  console.log('✔ lecture locale sans requête réseau ni erreur navigateur');
} finally {
  await browser.close();
}
