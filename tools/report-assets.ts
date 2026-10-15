import { mkdirSync, writeFileSync } from 'node:fs';
import { assetReport } from '@datamoc/mwg/tools/asset-report';
import { runtimeAssetFiles } from './runtime-assets.ts';

const report = await assetReport({ dist: 'dist', assets: 'assets' });
const selected = new Set(runtimeAssetFiles());
report.assets = report.assets.filter((asset) => selected.has(asset.path));
report.duplicates = report.duplicates.map((group) => group.filter((file) => selected.has(file)))
  .filter((group) => group.length > 1);
report.totals.assetFiles = report.assets.length;
report.totals.assetRaw = report.assets.reduce((sum, asset) => sum + asset.raw, 0);
mkdirSync('e2e/out', { recursive: true });
writeFileSync('e2e/out/assets-report.json', JSON.stringify(report, null, 2) + '\n');
for (const file of report.files) {
  console.log(`${file.path}: ${file.raw} octets, gzip ${file.gzip}, brotli ${file.brotli}`);
}
console.log(`${report.totals.assetFiles} assets embarqués ; ${report.duplicates.length} groupes de doublons.`);
console.log('Rapport : e2e/out/assets-report.json');
