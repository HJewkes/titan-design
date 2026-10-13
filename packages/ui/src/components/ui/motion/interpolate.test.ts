import { describe, expect, it } from 'vitest'
import { interpolate, keyframes } from './interpolate'

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
    [2, 10],
    [2, 20],
    [4, 0],
  ] as const

  it.each([
    { t: 0, expected: 0 },
    { t: 1, expected: 0 },
    { t: 1.5, expected: 5 },
    { t: 2, expected: 20 },
    { t: 3, expected: 10 },
    { t: 4, expected: 0 },
    { t: 9, expected: 0 },
  ])(
    'at $t is $expected, holding the ends and jumping on a zero-length segment',
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
