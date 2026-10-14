import { describe, expect, it } from 'vitest'
import { randomRange } from './random'
import { all, chain, delay, lagged, sequence, span, stagger } from './timeline'
import { MOTION } from './tokens'

describe('stagger', () => {
  it.each([
    { index: 0, from: 0, expected: 0 },
    { index: 3, from: 0, expected: 0.3 },
    { index: 1, from: 3, expected: 0.2 },
    { index: 5, from: 3, expected: 0.2 },
  ])('delays item $index from $from by $expected', ({ index, from, expected }) => {
    expect(stagger(index, { count: 6, each: 0.1, from })).toBeCloseTo(expected, 10)
  })

  it('radiates from index 0 by default', () => {
    expect(stagger(3, { count: 4, each: 0.1 })).toBeCloseTo(0.3, 10)
  })

  it('caps a long cascade so the last item starts at staggerMax', () => {
    const last = stagger(19, { count: 20 })
    expect(last).toBeLessThanOrEqual(MOTION.video.staggerMax)
    expect(last).toBeCloseTo(MOTION.video.staggerMax, 10)
  })

  it('keeps a step that already fits under the cap', () => {
    expect(stagger(19, { count: 20, each: 0.01 })).toBeCloseTo(0.19, 10)
  })

  it('caps against the furthest distance from a middle origin', () => {
    const each = MOTION.video.staggerMax
    expect(stagger(0, { count: 5, from: 2, each })).toBeCloseTo(MOTION.video.staggerMax, 10)
    expect(stagger(4, { count: 5, from: 2, each })).toBeCloseTo(MOTION.video.staggerMax, 10)
  })

  it.each([{ index: 5 }, { index: -1 }])(
    'throws a RangeError for index $index of 5',
    ({ index }) => {
      expect(() => stagger(index, { count: 5 })).toThrow(RangeError)
    }
  )
})

describe('lagged', () => {
  it('fits every item into totalS, ending the last exactly there', () => {
    const { itemS, items } = lagged(5, { totalS: 2, lagRatio: 0.5 })
    expect(itemS).toBeCloseTo(2 / 3, 10)
    expect(items[0]?.startS).toBe(0)
    expect(items[4]?.endS).toBe(2)
  })

  it('never ends an item past totalS across a seeded sweep', () => {
    for (let k = 0; k < 500; k++) {
      const n = Math.floor(randomRange('lagged', [k, 0], [1, 41]))
      const lagRatio = randomRange('lagged', [k, 1], [0, 3])
      const totalS = randomRange('lagged', [k, 2], [0, 5])
      for (const { endS } of lagged(n, { totalS, lagRatio }).items) {
        expect(endS).toBeLessThanOrEqual(totalS)
      }
    }
  })

  it('starts every item together at lagRatio 0 and abuts them at 1', () => {
    expect(lagged(3, { totalS: 3, lagRatio: 0 }).items).toEqual([
      { startS: 0, endS: 3 },
      { startS: 0, endS: 3 },
      { startS: 0, endS: 3 },
    ])
    expect(lagged(3, { totalS: 3, lagRatio: 1 }).items).toEqual([
      { startS: 0, endS: 1 },
      { startS: 1, endS: 2 },
      { startS: 2, endS: 3 },
    ])
  })

  it('eases the group time, not each item', () => {
    const group = lagged(2, { totalS: 2, lagRatio: 0.5, ease: (p) => p * p })
    expect(group.progress(1, 1)).toBe(0)
    expect(group.progress(2, 1)).toBe(1)
    expect(group.progress(1, 0)).toBeCloseTo(0.5 / group.itemS, 10)
  })

  it('has no items for n 0 and one full-length item for n 1', () => {
    expect(lagged(0, { totalS: 2, lagRatio: 0.5 }).items).toEqual([])
    expect(lagged(1, { totalS: 2, lagRatio: 0.5 }).items).toEqual([{ startS: 0, endS: 2 }])
  })

  it.each([
    { n: 2.5, totalS: 1, lagRatio: 0.5 },
    { n: -1, totalS: 1, lagRatio: 0.5 },
    { n: 2, totalS: NaN, lagRatio: 0.5 },
    { n: 2, totalS: 1, lagRatio: -0.1 },
    { n: 2, totalS: 1, lagRatio: Infinity },
  ])(
    'throws a RangeError for n $n, totalS $totalS, lagRatio $lagRatio',
    ({ n, totalS, lagRatio }) => {
      expect(() => lagged(n, { totalS, lagRatio })).toThrow(RangeError)
    }
  )

  it('throws a RangeError for progress of an item it does not have', () => {
    expect(() => lagged(2, { totalS: 1, lagRatio: 0.5 }).progress(0, 2)).toThrow(RangeError)
  })
})

describe('spans', () => {
  it('chains spans end to end', () => {
    expect(chain(span(1), span(2))).toEqual({
      durationS: 3,
      windows: [
        { startS: 0, endS: 1 },
        { startS: 1, endS: 3 },
      ],
    })
  })

  it('starts all spans together and lasts the longest', () => {
    expect(all(span(1), span(2))).toEqual({
      durationS: 2,
      windows: [
        { startS: 0, endS: 1 },
        { startS: 0, endS: 2 },
      ],
    })
  })

  it('delays a span and adds the delay to its length', () => {
    expect(delay(0.5, span(1))).toEqual({ durationS: 1.5, windows: [{ startS: 0.5, endS: 1.5 }] })
  })

  it('shifts nested windows by where their span starts', () => {
    const { durationS, windows } = chain(span(1), all(span(1), delay(0.5, span(1))))
    expect(durationS).toBe(2.5)
    expect(windows).toEqual([
      { startS: 0, endS: 1 },
      { startS: 1, endS: 2 },
      { startS: 1.5, endS: 2.5 },
    ])
  })

  it('is empty for chain and all of nothing', () => {
    expect(chain()).toEqual({ durationS: 0, windows: [] })
    expect(all()).toEqual({ durationS: 0, windows: [] })
  })

  it.each([
    { name: 'span(-1)', make: () => span(-1) },
    { name: 'span(NaN)', make: () => span(NaN) },
    { name: 'span(Infinity)', make: () => span(Infinity) },
    { name: 'delay(-0.1, span(1))', make: () => delay(-0.1, span(1)) },
  ])('throws a RangeError for $name', ({ make }) => {
    expect(make).toThrow(RangeError)
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
