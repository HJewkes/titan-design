import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import { fcAssert } from '../test/property'

import { nextCell } from './grid-navigation'

const SIZE = { rows: 5, cols: 5 }
const move = (key: string, row: number, col: number, ctrlKey = false, pageRows = 2) =>
  nextCell({ key, ctrlKey, position: { row, col }, size: SIZE, pageRows })

describe('nextCell', () => {
  it('stays put on ArrowRight in the last column and ArrowDown in the last row', () => {
    expect(move('ArrowRight', 2, 4)).toEqual({ row: 2, col: 4 })
    expect(move('ArrowDown', 4, 1)).toEqual({ row: 4, col: 1 })
    expect(move('ArrowLeft', 2, 0)).toEqual({ row: 2, col: 0 })
  })

  it('moves Home and End within the row', () => {
    expect(move('Home', 3, 2)).toEqual({ row: 3, col: 0 })
    expect(move('End', 3, 2)).toEqual({ row: 3, col: 4 })
  })

  it('reaches the corners with Control+Home and Control+End', () => {
    expect(move('Home', 3, 2, true)).toEqual({ row: 0, col: 0 })
    expect(move('End', 1, 2, true)).toEqual({ row: 4, col: 4 })
  })

  it('moves by page rows and clamps at the edges', () => {
    expect(move('PageDown', 1, 3)).toEqual({ row: 3, col: 3 })
    expect(move('PageDown', 3, 3)).toEqual({ row: 4, col: 3 })
    expect(move('PageUp', 1, 3)).toEqual({ row: 0, col: 3 })
  })

  it('answers null for a key the grid does not handle', () => {
    expect(move('a', 1, 1)).toBeNull()
  })

  it('never leaves the matrix for any key sequence', () => {
    const key = fc.constantFrom(
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown'
    )
    fcAssert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        fc.array(fc.tuple(key, fc.boolean()), { maxLength: 40 }),
        fc.integer({ min: -3, max: 60 }),
        (rows, cols, keys, pageRows) => {
          let position = { row: 0, col: 0 }
          for (const [k, ctrlKey] of keys) {
            position =
              nextCell({ key: k, ctrlKey, position, size: { rows, cols }, pageRows }) ?? position
            expect(position.row).toBeGreaterThanOrEqual(0)
            expect(position.row).toBeLessThan(rows)
            expect(position.col).toBeGreaterThanOrEqual(0)
            expect(position.col).toBeLessThan(cols)
          }
        }
      )
    )
  })

  it('clamps a hostile starting position into the matrix', () => {
    const position = { row: Number.NaN, col: 99 }

    expect(nextCell({ key: 'ArrowUp', position, size: SIZE, pageRows: 2 })).toEqual({
      row: 0,
      col: 4,
    })
  })
})
