import assert from 'node:assert/strict';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const chrome = process.env.CHROME ?? (process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  // Compte les lectures réellement démarrées : éléments Audio (effets MWG) ou nœuds Web Audio.
  await page.evaluateOnNewDocument(() => {
    window.__started = 0;
    for (const [proto, method] of [[AudioBufferSourceNode.prototype, "start"], [OscillatorNode.prototype, "start"], [HTMLMediaElement.prototype, "play"]]) {
      const original = proto[method];
      proto[method] = function (...args) { window.__started++; return original.apply(this, args); };
    }
  });
  await page.goto('file://' + path.resolve('dist/standalone.html') + '#debug');
  await page.waitForFunction(() => window.__pontifex);
  await page.mouse.click(400, 250);
  const effects = ['onBuild', 'onDelete', 'onBreak', 'onSplash', 'onClick', 'onWin', 'onShip'];
  for (const effect of effects) {
    const before = await page.evaluate(() => window.__started);
    await page.evaluate((name) => { window.__pontifex.sfx.enabled = true; window.__pontifex.sfx[name](); }, effect);
    await new Promise((resolve) => setTimeout(resolve, effect === 'onWin' ? 600 : 100));
    const after = await page.evaluate(() => window.__started);
    assert.ok(after > before, `bruitage ${effect} : aucune lecture démarrée`);
    console.log(`✔ bruitage ${effect}`);
  }
  const before = await page.evaluate(() => window.__started);
  await page.evaluate(() => { const sfx = window.__pontifex.sfx; sfx.enabled = false; sfx.onBuild(); sfx.onBreak(); });
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(await page.evaluate(() => window.__started), before, 'son coupé : rien ne doit jouer');
  console.log('✔ bruitages coupés avec « Son OFF »');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
