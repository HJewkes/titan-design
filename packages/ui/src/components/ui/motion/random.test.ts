import { describe, expect, it } from 'vitest'
import { random, randomRange } from './random'

describe('random', () => {
  it('gives the same value for the same arguments, whatever is called in between', () => {
    const first = random(7, 1)
    random(7, 2)
    random('other', 1, 2, 3)
    expect(random(7, 1)).toBe(first)
  })

  it('spreads keys uniformly over [0, 1)', () => {
    const values = Array.from({ length: 10_000 }, (_, key) => random(42, key))
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...values)).toBeLessThan(1)
    expect(mean).toBeCloseTo(0.5, 1)
    expect(Math.abs(mean - 0.5)).toBeLessThan(0.02)
  })

  it('hashes string seeds by content, not length', () => {
    expect(random('a')).not.toBe(random('b'))
    expect(random('ab')).not.toBe(random('ba'))
  })

  it('tells numeric seeds and keys apart, including fractions and key order', () => {
    expect(random(1)).not.toBe(random(2))
    expect(random(0, 1)).not.toBe(random(0, 1.5))
    expect(random(0, 1, 2)).not.toBe(random(0, 2, 1))
    expect(random(0, -0)).toBe(random(0, 0))
  })
})

describe('randomRange', () => {
  it('maps the seeded value onto the range', () => {
    const value = randomRange('stage', [3], [10, 20])
    expect(value).toBeCloseTo(10 + random('stage', 3) * 10, 12)
    expect(value).toBeGreaterThanOrEqual(10)
    expect(value).toBeLessThan(20)
  })
})
