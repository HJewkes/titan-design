import { describe, expect, it } from 'vitest'
import { seededRandom } from './seededRandom'

const draw = (seed: number, count: number) => {
  const next = seededRandom(seed)
  return Array.from({ length: count }, next)
}

describe('seededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    expect(draw(7, 20)).toEqual(draw(7, 20))
  })

  it('gives different sequences for different seeds', () => {
    expect(draw(7, 5)).not.toEqual(draw(8, 5))
  })

  it('stays in [0, 1) over a long run', () => {
    for (const value of draw(42, 5000)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('pins the first draws so the fixtures built on it stay stable', () => {
    expect(draw(1, 2)).toEqual([(1664525 + 1013904223) / 4294967296, expect.any(Number)])
  })
})
