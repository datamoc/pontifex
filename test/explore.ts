import { run, LEVELS } from './helpers.ts';
import { reference } from './refs.ts';
import { structureCost } from '../src/physics.ts';
for (let i = 0; i < LEVELS.length; i++) { const s = reference(i); console.log(i + 1, 'cost', structureCost(s).toFixed(0), 'budget', LEVELS[i].budget, JSON.stringify(run(LEVELS[i], s))); }
