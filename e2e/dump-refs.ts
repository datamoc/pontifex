import { reference } from '../test/refs.ts';
import { writeFileSync } from 'node:fs';
writeFileSync(process.argv[2], JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7].map(reference)));
