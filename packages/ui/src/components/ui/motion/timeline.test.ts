import { describe, expect, it } from 'vitest'
import { sequence, stagger } from './timeline'

describe('stagger', () => {
  it.each([
    { index: 0, from: 0, expected: 0 },
    { index: 3, from: 0, expected: 0.3 },
    { index: 1, from: 3, expected: 0.2 },
    { index: 5, from: 3, expected: 0.2 },
  ])('delays item $index from $from by $expected', ({ index, from, expected }) => {
    expect(stagger(index, { each: 0.1, from })).toBeCloseTo(expected, 10)
  })

  it('radiates from index 0 by default', () => {
    expect(stagger(3, { each: 0.1 })).toBeCloseTo(0.3, 10)
  })
})

describe('sequence', () => {
  const phases = [
    { id: 'a', durationS: 1 },
    { id: 'b', durationS: 2 },
    { id: 'c', durationS: 0.5 },
  ]

  it('abuts phases end to end by default, so none overlap', () => {
    const { items, totalS } = sequence(phases)
    expect(items.map((item) => item.startS)).toEqual([0, 1, 3])
    expect(totalS).toBe(3.5)
    for (let i = 1; i < items.length; i++) {
      const [previous, current] = [items[i - 1], items[i]] as const
      expect(current?.startS).toBeGreaterThanOrEqual(previous?.endS as number)
    }
  })

  it('keeps each item and its duration', () => {
    const { items } = sequence(phases, { overlapS: 0.25 })
    expect(items.map((item) => item.id)).toEqual(['a', 'b', 'c'])
    for (const item of items) expect(item.endS - item.startS).toBeCloseTo(item.durationS, 10)
  })

  it('starts each item overlapS before its predecessor ends', () => {
    const { items, totalS } = sequence(phases, { overlapS: 0.25 })
    expect(items.map((item) => item.startS)).toEqual([0, 0.75, 2.5])
    expect(totalS).toBe(3)
  })

  it('shifts every item by startS without changing the total', () => {
    const { items, totalS } = sequence(phases, { startS: 10 })
    expect(items.map((item) => item.startS)).toEqual([10, 11, 13])
    expect(totalS).toBe(3.5)
  })

  it('is empty with no items', () => {
    expect(sequence([])).toEqual({ items: [], totalS: 0 })
  })

  it.each([
    { name: 'the overlap exceeds a later neighbour', items: phases, overlapS: 0.75 },
    {
      name: 'the overlap exceeds an earlier neighbour',
      items: [{ durationS: 0.5 }, { durationS: 2 }],
      overlapS: 0.75,
    },
    { name: 'the overlap is negative', items: phases, overlapS: -0.1 },
    { name: 'a duration is negative', items: [{ durationS: 1 }, { durationS: -1 }], overlapS: 0 },
  ])('throws a RangeError when $name', ({ items, overlapS }) => {
    expect(() => sequence(items, { overlapS })).toThrow(RangeError)
  })
})
