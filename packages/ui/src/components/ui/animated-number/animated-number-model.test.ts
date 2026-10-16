import { describe, expect, it } from 'vitest'
import { reelCells, valueAt } from './animated-number-model'

const digits = (text: string, current: number, settled: boolean) =>
  reelCells(text, current, settled).map((cell) => (cell.kind === 'digit' ? cell.digit : cell.glyph))

describe('valueAt', () => {
  it('returns the target itself once progress reaches 1', () => {
    expect(valueAt(1, 0, 1234.5)).toBe(1234.5)
    expect(valueAt(1.4, 0, 1234.5)).toBe(1234.5)
  })

  it('eases out quadratically: three quarters of the way at half progress', () => {
    expect(valueAt(0.5, 0, 100)).toBe(75)
  })

  it('starts at from and clamps below 0', () => {
    expect(valueAt(0, 40, 100)).toBe(40)
    expect(valueAt(-1, 40, 100)).toBe(40)
  })
})

describe('reelCells', () => {
  it('shows the final digits with no offset when settled', () => {
    const cells = reelCells('1,234.5', 1234.5, true)
    expect(digits('1,234.5', 1234.5, true)).toEqual([1, ',', 2, 3, 4, '.', 5])
    expect(cells.every((cell) => cell.kind === 'glyph' || cell.offset === 0)).toBe(true)
  })

  it('keys digit columns by place value, fraction digits included', () => {
    expect(reelCells('1,234.5', 0, false).map((cell) => cell.key)).toEqual([
      'p3',
      'g1',
      'p2',
      'p1',
      'p0',
      'g5',
      'p-1',
    ])
  })

  it('rolls each column by its own fractional position', () => {
    const [tens, ones] = reelCells('100', 37.5, false).slice(1)
    expect(tens).toMatchObject({ digit: 3, next: 4, offset: 0.75 })
    expect(ones).toMatchObject({ digit: 7, next: 8, offset: 0.5 })
  })

  it('wraps 9 to 0 on the wheel', () => {
    const ones = reelCells('10', 9.5, false)[1]
    expect(ones).toMatchObject({ digit: 9, next: 0 })
  })
})
