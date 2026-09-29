import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { computeWindow } from './fixed-window'

const base = { offset: 0, viewport: 100, itemSize: 10, count: 50, overscan: 0 }

const inputs = fc.record({
  offset: fc.integer({ min: -500, max: 2000 }),
  viewport: fc.integer({ min: 0, max: 1000 }),
  itemSize: fc.integer({ min: 1, max: 100 }),
  count: fc.integer({ min: 0, max: 200 }),
  overscan: fc.integer({ min: 0, max: 20 }),
})

describe('computeWindow properties', () => {
  it('keeps 0 <= start <= end <= count', () => {
    fc.assert(
      fc.property(inputs, (input) => {
        const { start, end } = computeWindow(input)
        expect(start).toBeGreaterThanOrEqual(0)
        expect(start).toBeLessThanOrEqual(end)
        expect(end).toBeLessThanOrEqual(input.count)
      })
    )
  })

  it('makes padding plus rendered size equal count * itemSize', () => {
    fc.assert(
      fc.property(inputs, (input) => {
        const { start, end, padBefore, padAfter } = computeWindow(input)
        expect(padBefore + (end - start) * input.itemSize + padAfter).toBe(
          input.count * input.itemSize
        )
      })
    )
  })

  it('includes every index intersecting the viewport', () => {
    fc.assert(
      fc.property(inputs, (input) => {
        const { start, end } = computeWindow(input)
        const { offset, viewport, itemSize, count } = input
        for (let i = 0; i < count; i++) {
          const intersects = i * itemSize < offset + viewport && (i + 1) * itemSize > offset
          if (intersects) {
            expect(i).toBeGreaterThanOrEqual(start)
            expect(i).toBeLessThan(end)
          }
        }
      })
    )
  })

  it('never adds more than overscan items per side', () => {
    fc.assert(
      fc.property(inputs, (input) => {
        const bare = computeWindow({ ...input, overscan: 0 })
        const padded = computeWindow(input)
        expect(bare.start - padded.start).toBeLessThanOrEqual(input.overscan)
        expect(padded.end - bare.end).toBeLessThanOrEqual(input.overscan)
        expect(padded.start).toBeLessThanOrEqual(bare.start)
        expect(padded.end).toBeGreaterThanOrEqual(bare.end)
      })
    )
  })
})

describe('computeWindow examples', () => {
  it('returns the visible range and paddings mid-list', () => {
    expect(computeWindow({ ...base, offset: 25, viewport: 30 })).toEqual({
      start: 2,
      end: 6,
      padBefore: 20,
      padAfter: 440,
    })
  })

  it('adds overscan on both sides', () => {
    const w = computeWindow({ ...base, offset: 200, overscan: 3 })
    expect([w.start, w.end]).toEqual([17, 33])
  })

  it('clamps overscan at both ends of the list', () => {
    expect(computeWindow({ ...base, overscan: 5 }).start).toBe(0)
    expect(computeWindow({ ...base, offset: 400, overscan: 5 }).end).toBe(50)
  })

  it('returns an empty window for a count of 0', () => {
    expect(computeWindow({ ...base, count: 0, overscan: 4 })).toEqual({
      start: 0,
      end: 0,
      padBefore: 0,
      padAfter: 0,
    })
  })

  it('selects nothing for a zero viewport on an item boundary', () => {
    const { start, end } = computeWindow({ ...base, offset: 30, viewport: 0 })
    expect(end - start).toBe(0)
  })

  it('selects the containing item for a zero viewport inside an item', () => {
    const { start, end } = computeWindow({ ...base, offset: 35, viewport: 0 })
    expect([start, end]).toEqual([3, 4])
  })

  it('clamps a negative offset to the list start', () => {
    expect(computeWindow({ ...base, offset: -1000, viewport: 50 })).toMatchObject({
      start: 0,
      end: 0,
    })
    expect(computeWindow({ ...base, offset: -20, viewport: 50 })).toMatchObject({
      start: 0,
      end: 3,
    })
  })

  it('clamps an offset past the end to an empty window at the end', () => {
    expect(computeWindow({ ...base, offset: 9999 })).toEqual({
      start: 50,
      end: 50,
      padBefore: 500,
      padAfter: 0,
    })
  })

  it('handles fractional offsets and item sizes', () => {
    const { start, end } = computeWindow({ ...base, offset: 12.5, viewport: 10, itemSize: 2.5 })
    expect([start, end]).toEqual([5, 9])
  })
})

describe('computeWindow input validation', () => {
  it.each([
    ['offset', { offset: NaN }],
    ['offset', { offset: Infinity }],
    ['viewport', { viewport: NaN }],
    ['viewport', { viewport: -1 }],
    ['itemSize', { itemSize: 0 }],
    ['itemSize', { itemSize: -5 }],
    ['itemSize', { itemSize: Infinity }],
    ['count', { count: -1 }],
    ['count', { count: 1.5 }],
    ['count', { count: NaN }],
    ['overscan', { overscan: -1 }],
    ['overscan', { overscan: 0.5 }],
    ['overscan', { overscan: Infinity }],
  ])('throws a RangeError naming %s', (field, patch) => {
    const call = () => computeWindow({ ...base, ...patch })
    expect(call).toThrow(RangeError)
    expect(call).toThrow(field)
  })
})
