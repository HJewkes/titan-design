import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { fcAssert } from '../../../test/property'

import { nudgeTarget, resolveItemWidth, revealTarget, shelfGeometry } from './shelfMath'

describe('resolveItemWidth', () => {
  it('uses a plain number at every width', () => {
    expect(resolveItemWidth(240, 320)).toBe(240)
    expect(resolveItemWidth(240, 1400)).toBe(240)
  })

  it('takes the widest breakpoint the column reaches', () => {
    const map = { xs: 236, sm: 264, lg: 300 }

    expect(resolveItemWidth(map, 375)).toBe(236)
    expect(resolveItemWidth(map, 600)).toBe(264)
    expect(resolveItemWidth(map, 1100)).toBe(264)
    expect(resolveItemWidth(map, 1200)).toBe(300)
  })

  it('falls back to the narrowest entry when the column reaches none', () => {
    expect(resolveItemWidth({ md: 280, lg: 320 }, 400)).toBe(280)
  })

  it('is zero for an empty map', () => {
    expect(resolveItemWidth({}, 800)).toBe(0)
  })
})

describe('shelfGeometry', () => {
  it('overflows when the items and bleed are wider than the bled column', () => {
    const geometry = shelfGeometry({ column: 600, count: 4, itemWidth: 200, gap: 12, bleed: 16 })

    expect(geometry).toEqual({ viewport: 632, step: 212, maxOffset: 236, overflows: true })
  })

  it('does not overflow when every item fits', () => {
    const geometry = shelfGeometry({ column: 600, count: 2, itemWidth: 200, gap: 12, bleed: 0 })

    expect(geometry.overflows).toBe(false)
    expect(geometry.maxOffset).toBe(0)
  })
})

describe('nudgeTarget', () => {
  const geometry = shelfGeometry({ column: 700, count: 10, itemWidth: 200, gap: 12, bleed: 0 })

  it('moves forward by the whole items that fit in 0.8 of the column', () => {
    // 0.8 × 700 = 560 holds two 212px steps.
    expect(nudgeTarget(0, 1, geometry, 700)).toBe(424)
  })

  it('lands on an item start from a resting point between two', () => {
    expect(nudgeTarget(300, 1, geometry, 700)).toBe(212 * 3)
  })

  it('moves at least one item when an item is wider than 0.8 of the column', () => {
    const wide = shelfGeometry({ column: 300, count: 5, itemWidth: 280, gap: 12, bleed: 0 })

    expect(nudgeTarget(0, 1, wide, 300)).toBe(292)
  })

  it('stops at either end', () => {
    expect(nudgeTarget(geometry.maxOffset, 1, geometry, 700)).toBe(geometry.maxOffset)
    expect(nudgeTarget(212, -1, geometry, 700)).toBe(0)
  })

  it('steps back from the unaligned end onto an item start', () => {
    // maxOffset 1408 sits between item starts 1272 and 1484.
    expect(nudgeTarget(geometry.maxOffset, -1, geometry, 700)).toBe(212 * 5)
  })
})

describe('revealTarget', () => {
  const geometry = shelfGeometry({ column: 600, count: 8, itemWidth: 200, gap: 12, bleed: 16 })

  it('leaves an item that is already whole in the column alone', () => {
    expect(revealTarget(1, 0, geometry, 200, 16)).toBeNull()
  })

  it('scrolls a cut-off item onto its snap point', () => {
    expect(revealTarget(2, 0, geometry, 200, 16)).toBe(424)
  })

  it('scrolls back to an item that has left the leading edge', () => {
    expect(revealTarget(0, 212, geometry, 200, 16)).toBe(0)
  })

  it('never scrolls past the end for the last item', () => {
    expect(revealTarget(7, 0, geometry, 200, 16)).toBe(geometry.maxOffset)
  })
})

const shelves = fc.record({
  column: fc.integer({ min: 120, max: 2000 }),
  count: fc.integer({ min: 1, max: 40 }),
  itemWidth: fc.integer({ min: 80, max: 600 }),
  gap: fc.integer({ min: 0, max: 24 }),
  bleed: fc.constantFrom(0, 16, 24),
})

describe('shelf geometry properties', () => {
  it('lands every nudge inside the row, on an item start or the end', () => {
    fcAssert(
      fc.property(
        shelves,
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.constantFrom(1 as const, -1 as const),
        (input, at, direction) => {
          const geometry = shelfGeometry(input)
          const target = nudgeTarget(at * geometry.maxOffset, direction, geometry, input.column)

          expect(target).toBeGreaterThanOrEqual(0)
          expect(target).toBeLessThanOrEqual(geometry.maxOffset)
          const onStart =
            Math.abs(target / geometry.step - Math.round(target / geometry.step)) < 1e-9
          expect(onStart || target === geometry.maxOffset).toBe(true)
        }
      )
    )
  })

  it('leaves a revealed item whole inside the column when it fits', () => {
    fcAssert(
      fc.property(
        shelves,
        fc.nat(),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (input, pick, at) => {
          fc.pre(input.itemWidth <= input.column)
          const geometry = shelfGeometry(input)
          const index = pick % input.count
          const offset =
            revealTarget(index, at * geometry.maxOffset, geometry, input.itemWidth, input.bleed) ??
            at * geometry.maxOffset
          const start = input.bleed + index * geometry.step - offset

          expect(start).toBeGreaterThanOrEqual(input.bleed - 1e-9)
          expect(start + input.itemWidth).toBeLessThanOrEqual(input.bleed + input.column + 1e-9)
        }
      )
    )
  })
})
