import type { JsonSchema, SchemaFormValue } from './schemaFormModel'

/** A synthetic comparison card: every control kind SchemaForm renders, in zod `toJSONSchema` shape. */
export const compareSchema: JsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', title: 'Title', minLength: 1, maxLength: 24 },
    tone: { type: 'string', title: 'Tone', enum: ['calm', 'bright', 'muted'] },
    columns: { type: 'integer', title: 'Columns' },
    showLegend: { type: 'boolean', title: 'Show legend' },
    footer: {
      type: 'object',
      title: 'Footer',
      properties: {
        note: { type: 'string', title: 'Note', maxLength: 40 },
        align: { type: 'string', title: 'Align', enum: ['start', 'end'] },
      },
      required: ['note'],
    },
    rows: {
      type: 'array',
      title: 'Rows',
      minItems: 1,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', title: 'Id' },
          left: { type: 'string', title: 'Left', maxLength: 16 },
          right: { type: 'string', title: 'Right', maxLength: 16 },
        },
        required: ['id', 'left', 'right'],
      },
    },
    range: { type: 'array', title: 'Range', prefixItems: [{ type: 'number' }, { type: 'number' }] },
  },
  required: ['title', 'rows'],
}

export const compareValue: SchemaFormValue = {
  title: 'Alpha vs beta',
  tone: 'calm',
  columns: 2,
  showLegend: true,
  footer: { note: 'Synthetic sample', align: 'start' },
  rows: [
    { id: 'speed', left: 'Fast', right: 'Steady' },
    { id: 'cost', left: 'Low', right: 'High' },
  ],
  range: [0, 10],
}

export const emptySchema: JsonSchema = { type: 'object', properties: {} }
