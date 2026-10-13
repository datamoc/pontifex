// Test rapide sous Windows (Node + Chrome Windows) : node e2e/win-smoke.mjs <pontifex.html> <capture.png>
// À lancer depuis Windows, ex. : powershell.exe -Command "node '\\wsl.localhost\...\e2e\win-smoke.mjs' C:\...\pontifex.html C:\...\win.png"
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
const [html, png] = process.argv.slice(2);
const chrome = process.env.CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', defaultViewport: { width: 1280, height: 720 }, userDataDir: process.env.TEMP + '\\pontifex-smoke' });
const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text().slice(0, 200)); });
page.on('request', (r) => { if (!/^(file|data|blob):/.test(r.url())) problems.push('requête externe : ' + r.url()); });
await page.goto(pathToFileURL(html).href);
await new Promise((r) => setTimeout(r, 4000));
await page.screenshot({ path: png });
console.log(await browser.version(), 'problèmes :', problems);
await browser.close();
