import { describe, expect, it } from 'vitest'
import { linear, poly } from './easing'
import { interpolate, interpolateScale, keyframes } from './interpolate'

describe('interpolate', () => {
  it.each([
    { t: 0.5, input: [0, 1], output: [0, 100], clamp: true, expected: 50 },
    { t: 0, input: [0, 1], output: [0, 100], clamp: true, expected: 0 },
    { t: 1, input: [0, 1], output: [0, 100], clamp: true, expected: 100 },
    { t: -1, input: [0, 1], output: [0, 100], clamp: true, expected: 0 },
    { t: 2, input: [0, 1], output: [0, 100], clamp: true, expected: 100 },
    { t: 2, input: [0, 1], output: [0, 100], clamp: false, expected: 200 },
    { t: 3, input: [2, 4], output: [10, 0], clamp: true, expected: 5 },
    { t: 1, input: [2, 2], output: [0, 1], clamp: true, expected: 0 },
    { t: 2, input: [2, 2], output: [0, 1], clamp: true, expected: 1 },
  ] as const)(
    'maps $t over $input to $output (clamp $clamp) as $expected',
    ({ t, input, output, clamp, expected }) => {
      expect(interpolate(t, input, output, { clamp })).toBeCloseTo(expected, 10)
    }
  )

  it('clamps by default', () => {
    expect(interpolate(2, [0, 1], [0, 100])).toBe(100)
  })

  it('applies the easing to the normalised progress', () => {
    expect(interpolate(0.5, [0, 1], [0, 10], { ease: (p) => p * p })).toBeCloseTo(2.5, 10)
  })
})

describe('keyframes', () => {
  const stops = [
    [1, 0],
    [2, 10, { connectedRight: false }],
    [3, 20],
    [4, 0],
  ] as const

  it.each([
    { t: 0, expected: 0 },
    { t: 1, expected: 0 },
    { t: 1.5, expected: 5 },
    { t: 2.5, expected: 10 },
    { t: 3, expected: 20 },
    { t: 3.5, expected: 10 },
    { t: 4, expected: 0 },
    { t: 9, expected: 0 },
  ])(
    'at $t is $expected, holding the ends and stepping where a stop disconnects',
    ({ t, expected }) => {
      expect(keyframes(t, stops)).toBeCloseTo(expected, 10)
    }
  )

  it('eases within each segment', () => {
    expect(keyframes(1.5, stops, { ease: (p) => p * p })).toBeCloseTo(2.5, 10)
  })

  it('is 0 with no stops', () => {
    expect(keyframes(1, [])).toBe(0)
  })
})

describe('keyframes with one easing per segment', () => {
  const stops = [
    [0, 0],
    [1, 10],
    [2, 20],
    [3, 30],
  ] as const
  const ease = [linear, poly(2), linear]

  it('applies each easing to its own segment only', () => {
    expect(keyframes(0.5, stops, { ease })).toBe(5)
    expect(keyframes(1.5, stops, { ease })).toBe(12.5)
    expect(keyframes(2.5, stops, { ease })).toBe(25)
  })

  it('throws when there are fewer easings than segments', () => {
    expect(() => keyframes(0.5, stops, { ease: [linear, linear] })).toThrow(RangeError)
  })

  it('keeps each easing on its segment when an earlier stop holds', () => {
    const held = [
      [0, 0, { holdS: 0.5 }],
      [1, 10],
      [2, 20],
      [3, 30],
    ] as const
    expect(keyframes(1.5, held, { ease })).toBe(12.5)
    expect(keyframes(0.75, held, { ease })).toBe(5)
  })
})

describe('keyframes holds and steps', () => {
  it.each([
    { t: 0.5, expected: 0 },
    { t: 1, expected: 0 },
    { t: 1.5, expected: 5 },
    { t: 2, expected: 10 },
  ])(
    'holds the first value for holdS, then eases over the rest: $expected at $t',
    ({ t, expected }) => {
      expect(
        keyframes(t, [
          [0, 0, { holdS: 1 }],
          [2, 10],
        ])
      ).toBeCloseTo(expected, 10)
    }
  )

  it('allows holds on the first and the last stop', () => {
    const stops = [
      [1, 5, { holdS: 1 }],
      [3, 7],
      [4, 9, { holdS: 2 }],
    ] as const
    expect(keyframes(0, stops)).toBe(5)
    expect(keyframes(2, stops)).toBe(5)
    expect(keyframes(4, stops)).toBe(9)
    expect(keyframes(7, stops)).toBe(9)
  })

  it('holds a disconnected stop until the next one, then steps', () => {
    const stops = [
      [0, 0, { connectedRight: false }],
      [2, 10],
    ] as const
    expect(keyframes(1.999, stops)).toBe(0)
    expect(keyframes(2, stops)).toBe(10)
  })

  it('allows connectedRight false on the last stop', () => {
    expect(
      keyframes(3, [
        [0, 0],
        [2, 10, { connectedRight: false }],
      ])
    ).toBe(10)
  })

  it.each([
    { name: 'a non-finite value', stops: [[0, NaN]] },
    { name: 'a non-finite t', stops: [[Infinity, 0]] },
    {
      name: 'unsorted stops',
      stops: [
        [2, 0],
        [1, 1],
      ],
    },
    {
      name: 'two stops at one t',
      stops: [
        [1, 0],
        [1, 5],
      ],
    },
    {
      name: 'a negative hold',
      stops: [
        [0, 0, { holdS: -1 }],
        [2, 1],
      ],
    },
    { name: 'a non-finite hold', stops: [[0, 0, { holdS: NaN }]] },
    {
      name: 'a hold past the next stop',
      stops: [
        [0, 0, { holdS: 3 }],
        [2, 1],
      ],
    },
  ] as const)('throws a RangeError for $name', ({ stops }) => {
    expect(() => keyframes(0, stops)).toThrow(RangeError)
  })
})

describe('interpolateScale', () => {
  it('grows by area, so the midpoint of 0 to 1 is sqrt(0.5)', () => {
    expect(interpolateScale(0.5, [0, 1], [0, 1])).toBeCloseTo(Math.sqrt(0.5), 12)
    expect(interpolateScale(1, [0, 1], [0, 1])).toBe(1)
  })

  it('keeps the sign through a flip from 1 to -1', () => {
    expect(interpolateScale(0.5, [0, 1], [1, -1])).toBe(0)
    expect(interpolateScale(0.25, [0, 1], [1, -1])).toBeCloseTo(Math.sqrt(0.5), 12)
    expect(interpolateScale(0.75, [0, 1], [1, -1])).toBeCloseTo(-Math.sqrt(0.5), 12)
  })

  it('passes ease and clamp through', () => {
    expect(interpolateScale(2, [0, 1], [0, 1], { clamp: false })).toBeCloseTo(Math.sqrt(2), 12)
    expect(interpolateScale(0.5, [0, 1], [0, 1], { ease: poly(2) })).toBe(0.5)
  })
})
