// Convert an exported player level into Pontifex MWL content.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { compile } from '@datamoc/mwg/mwl';
import { BUILTIN_SPECS } from '../src/levels.ts';
import { parseSpec } from '../src/level.ts';
import { schemas } from './mwl-schema.ts';

const usage = 'Usage: npm run level:convert -- player.json --id 9 [--label 8] [--output content/player.mwl]';
try {
  const { values, positionals } = parseArgs({ options: {
    id: { type: 'string' }, label: { type: 'string' }, output: { type: 'string', short: 'o' }, help: { type: 'boolean', short: 'h' },
  }, allowPositionals: true });
  if (values.help) {
    console.log(usage);
  } else {
    if (positionals.length !== 1 || !values.id) throw new Error(usage);
    const id = Number(values.id);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('--id must be a positive safe integer');
    if (BUILTIN_SPECS.some(level => level.id === id)) throw new Error(`Level id ${id} is already in use; choose a new id`);
    const raw: unknown = JSON.parse(readFileSync(positionals[0], 'utf8'));
    const parsed = parseSpec(raw);
    if ('error' in parsed) throw new Error(parsed.error);
    const { anchors, towers, islands, materials, solution, ...attributes } = parsed.spec;
    const view = (raw as Record<string, unknown>).view;
    const node = { tag: 'bridge_level', ...attributes, id, label: values.label ?? String(id), materials: materials.join(','), children: [
      ...anchors.map(point => ({ tag: 'anchor', ...point })),
      ...towers.map(point => ({ tag: 'tower', ...point })),
      ...islands.map(point => ({ tag: 'island', ...point })),
      ...(view === undefined ? [] : [{ tag: 'view', ...validateView(view) }]),
      ...(solution ? [{ tag: 'bridge_solution', children: [
        ...solution.nodes.map(point => ({ tag: 'bridge_node', ...point })),
        ...solution.beams.map(beam => ({ tag: 'bridge_beam', ...beam })),
      ] }] : []),
    ] };
    const source = JSON.stringify([node], null, 2).replace(/"(name|hint)": ("(?:[^"\\]|\\.)*")/g, '"$1": _($2)') + '\n';
    compile(source, { schemas });
    if (values.output) {
      writeFileSync(values.output, source, { flag: 'wx' });
      console.error(`Converted ${positionals[0]} → ${values.output}. Run npm run content to include it.`);
    } else {
      process.stdout.write(source);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function validateView(value: unknown): { x: number; y: number; w: number; h: number } {
  if (!value || typeof value !== 'object') throw new Error('Invalid view');
  const view = value as Record<string, unknown>;
  for (const key of ['x', 'y', 'w', 'h']) {
    if (!Number.isSafeInteger(view[key])) throw new Error(`view.${key} must be an integer`);
  }
  if (Number(view.w) <= 0 || Number(view.h) <= 0) throw new Error('View dimensions must be positive');
  return { x: Number(view.x), y: Number(view.y), w: Number(view.w), h: Number(view.h) };
}
