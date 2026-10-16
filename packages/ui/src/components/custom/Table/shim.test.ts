import { describe, expect, it } from 'vitest'
import * as root from '../../../index'
import * as moved from '../../ui/table'
import * as movedColumnFit from '../../ui/table/column-fit'
import * as legacy from '.'
import * as legacyColumnFit from './column-fit'

const TABLE_VALUES = [
  'Table',
  'TableHeader',
  'TableBody',
  'TableRow',
  'TableHeaderCell',
  'TableCell',
  'TablePagination',
  'useTable',
] as const
const COLUMN_FIT_VALUES = ['fitColumns', 'useColumnFit', 'useMeasuredWidth'] as const

describe('custom/Table migration shim (M4)', () => {
  it.each([...TABLE_VALUES, ...COLUMN_FIT_VALUES])(
    're-exports %s from custom/Table as the ui/table binding',
    (name) => {
      expect(legacy[name]).toBeDefined()
      expect(legacy[name]).toBe(moved[name])
    }
  )

  it.each(COLUMN_FIT_VALUES)('keeps the custom/Table/column-fit deep path for %s', (name) => {
    expect(legacyColumnFit[name]).toBeDefined()
    expect(legacyColumnFit[name]).toBe(movedColumnFit[name])
  })

  it.each([...TABLE_VALUES, ...COLUMN_FIT_VALUES])(
    'still exports %s from the package root',
    (name) => {
      expect(root[name]).toBe(moved[name])
    }
  )

  it('exports no value from custom/Table that ui/table lacks', () => {
    expect(Object.keys(legacy).sort()).toEqual([...TABLE_VALUES, ...COLUMN_FIT_VALUES].sort())
  })
})
