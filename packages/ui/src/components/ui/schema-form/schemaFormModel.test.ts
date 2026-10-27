import { describe, expect, it } from 'vitest'
import { compareSchema, compareValue } from './fixtures'
import {
  addRow,
  canAddRow,
  controlOf,
  fieldsOf,
  idsIn,
  moveRow,
  removeRow,
  rowBounds,
  uniqueId,
  type ArrayControl,
  type Control,
} from './schemaFormModel'

const fieldOf = (name: string): Control => {
  const field = fieldsOf(compareSchema)?.find((each) => each.name === name)
  if (field === undefined) throw new Error(`no field ${name}`)
  return field.control
}
const rowsControl = (): ArrayControl => {
  const control = fieldOf('rows')
  if (control.kind !== 'array') throw new Error(`not an array: ${control.kind}`)
  return control
}
const ROWS = compareValue.rows as unknown[]

describe('a JSON Schema as form controls', () => {
  it('gives each node type its control, with length and row bounds', () => {
    expect(fieldOf('title')).toEqual({ kind: 'text', minLength: 1, maxLength: 24 })
    expect(fieldOf('tone')).toEqual({ kind: 'select', options: ['calm', 'bright', 'muted'] })
    expect(fieldOf('columns')).toEqual({ kind: 'number', integer: true })
    expect(controlOf({ type: 'number' })).toEqual({ kind: 'number', integer: false })
    expect(fieldOf('showLegend')).toEqual({ kind: 'boolean' })
    expect([rowsControl().minItems, rowsControl().maxItems]).toEqual([1, 3])
    expect(controlOf({ type: 'array', items: { type: 'string' } })).toMatchObject({
      minItems: 0,
      maxItems: Number.POSITIVE_INFINITY,
    })
  })

  it('names an array entry by its item title, else Row for objects and Item otherwise', () => {
    const titled = controlOf({
      type: 'array',
      items: { type: 'object', title: 'Pair', properties: {} },
    })
    const objects = controlOf({ type: 'array', items: { type: 'object', properties: {} } })
    const strings = controlOf({ type: 'array', items: { type: 'string' } })

    expect(
      [titled, objects, strings].map((control) => 'itemLabel' in control && control.itemLabel)
    ).toEqual(['Pair', 'Row', 'Item'])
  })

  it('labels a field by its title, falls back to its name and marks required ones', () => {
    const fields = fieldsOf({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string', title: 'Bee' } },
      required: ['b'],
    })
    expect(fields?.map((field) => [field.label, field.required])).toEqual([
      ['a', false],
      ['Bee', true],
    ])
  })

  it('marks a node it has no control for raw rather than guessing', () => {
    expect(fieldOf('range')).toEqual({ kind: 'raw' })
    expect(controlOf({ type: 'object', additionalProperties: { type: 'number' } })).toEqual({
      kind: 'raw',
    })
    expect(controlOf({ anyOf: [{ type: 'string' }, { type: 'null' }] })).toEqual({ kind: 'raw' })
    expect(controlOf({ enum: ['a', 1] })).toEqual({ kind: 'raw' })
  })
})

describe('array rows', () => {
  it('adds rows up to maxItems and no further', () => {
    let current: unknown[] = [...ROWS]
    for (let i = 0; i < 4; i += 1) current = addRow(current, rowsControl(), idsIn(current))

    expect(current).toHaveLength(3)
    expect(canAddRow(current, rowsControl())).toBe(false)
  })

  it('removes rows down to minItems and never a row holding a locked id', () => {
    const one = removeRow(ROWS, 1, rowsControl(), [])

    expect(one).toEqual([ROWS[0]])
    expect(removeRow(one, 0, rowsControl(), [])).toEqual(one)
    expect(removeRow(ROWS, 0, rowsControl(), ['speed'])).toEqual(ROWS)
  })

  it('gives a new row a kebab id no element already has, and only its required fields', () => {
    const rows = addRow(ROWS, rowsControl(), new Set(['row-1', 'row-2']))
    const added = rows[rows.length - 1]

    expect(added).toEqual({ id: 'row-3', left: '', right: '' })
    expect(uniqueId(new Set())).toBe('row-1')
  })

  it('finds every id however deeply it is nested', () => {
    expect(idsIn({ a: [{ id: 'x', b: { id: 'y' } }], id: 'z' })).toEqual(new Set(['x', 'y', 'z']))
  })

  it('moves a row within the list and leaves an out-of-range move alone', () => {
    expect(moveRow(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
    expect(moveRow(['a', 'b'], 1, 2)).toEqual(['a', 'b'])
    expect(moveRow(['a', 'b'], 0, -1)).toEqual(['a', 'b'])
  })

  it('states the row bounds, open-ended when there is no maxItems', () => {
    expect(rowBounds(2, rowsControl())).toBe('2 of 1–3 rows')
    expect(
      rowBounds(0, {
        kind: 'array',
        item: { kind: 'raw' },
        itemLabel: 'Item',
        minItems: 0,
        maxItems: Infinity,
      })
    ).toBe('0 rows, at least 0')
  })
})
