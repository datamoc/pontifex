import { schema10 } from '@datamoc/mwg/mwl';
import type { MwlTagSchema } from '@datamoc/mwg/mwl';

export const schemas: Record<string, MwlTagSchema> = {
  ...schema10,
  bridge_level: {
    attributes: { id: 'integer', label: 'string', name: 'string', hint: 'string', budget: 'integer', materials: 'string', car: 'string', x0: 'integer', x1: 'integer', deckY: 'integer', waterY: 'integer' },
    required: ['id', 'label', 'name', 'hint', 'budget', 'materials', 'car', 'x0', 'x1', 'deckY', 'waterY'],
    children: ['anchor', 'tower', 'island', 'view', 'bridge_solution', 'event'],
    cardinality: { anchor: { min: 2, max: 24 }, view: { max: 1 }, bridge_solution: { max: 1 }, event: { max: 10 } },
  },
  event: {
    attributes: { type: 'string', time: 'number', shipType: 'string' },
    required: ['type', 'time', 'shipType'],
    children: []
  },
  bridge_solution: { children: ['bridge_node', 'bridge_beam'] },
  bridge_node: { attributes: { x: 'number', y: 'number', fixed: 'boolean' }, required: ['x', 'y', 'fixed'], children: [] },
  bridge_beam: { attributes: { a: 'integer', b: 'integer', mat: 'string' }, required: ['a', 'b', 'mat'], children: [] },
  anchor: { attributes: { x: 'integer', y: 'integer' }, required: ['x', 'y'], children: [] },
  tower: { attributes: { x: 'integer', top: 'integer' }, required: ['x', 'top'], children: [] },
  island: { attributes: { x: 'integer', top: 'integer' }, required: ['x', 'top'], children: [] },
  view: { attributes: { x: 'integer', y: 'integer', w: 'integer', h: 'integer' }, required: ['x', 'y', 'w', 'h'], children: [] },
};
