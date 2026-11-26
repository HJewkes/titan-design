import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { countAtOrBefore } from './count-at-or-before'

describe('countAtOrBefore', () => {
  it('equals a linear count for any ascending array with duplicates', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -20, max: 20 })),
        fc.integer({ min: -25, max: 25 }),
        (values, target) => {
          const ascending = [...values].sort((a, b) => a - b)
          expect(countAtOrBefore(ascending, target)).toBe(
            ascending.filter((v) => v <= target).length
          )
        }
      )
    )
  })

  it('counts every duplicate equal to the target', () => {
    expect(countAtOrBefore([1, 2, 2, 2, 3], 2)).toBe(4)
  })

  it('returns 0 for an empty array and for a NaN target', () => {
    expect(countAtOrBefore([], 5)).toBe(0)
    expect(countAtOrBefore([1, 2], Number.NaN)).toBe(0)
  })

  it('counts everything for an infinite target', () => {
    expect(countAtOrBefore([1, 2, 3], Infinity)).toBe(3)
  })
})
