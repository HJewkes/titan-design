import { afterEach, describe, expect, it, vi } from 'vitest'
import { noise2D } from './noise'

const grid = (seed: number | string, step: number) =>
  Array.from({ length: 100 * 100 }, (_, n) =>
    noise2D(seed, (n % 100) * step, Math.floor(n / 100) * step)
  )

describe('noise2D', () => {
  afterEach(() => vi.restoreAllMocks())

  it('stays within [-1, 1] and uses most of that range', () => {
    const values = grid(3, 0.37)
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-1)
    expect(Math.max(...values)).toBeLessThanOrEqual(1)
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(1)
  })

  it('gives equal fields for equal seeds and different fields for different seeds', () => {
    expect(grid('stage', 0.37)).toEqual(grid('stage', 0.37))
    const other = grid('other', 0.37)
    expect(grid('stage', 0.37).filter((value, n) => value !== other[n]).length).toBeGreaterThan(
      9_000
    )
  })

  it('is continuous: a 0.01 step moves the value by less than 0.1', () => {
    for (let n = 0; n < 2_000; n++) {
      const [x, y] = [(n % 50) * 0.13 - 3, Math.floor(n / 50) * 0.11 - 2]
      expect(Math.abs(noise2D(5, x + 0.01, y) - noise2D(5, x, y))).toBeLessThan(0.1)
      expect(Math.abs(noise2D(5, x, y + 0.01) - noise2D(5, x, y))).toBeLessThan(0.1)
    }
  })

  // Expected values come from simplex-noise 4.0.1's createNoise2D fed the same random('reference', i) sequence.
  it.each([
    [0.3, 0.7, -0.5206161344141521],
    [-4.2, 1.9, -0.22980281619874182],
    [12.5, -7.25, 0.21598488092041015],
    [100.1, 33.3, 0.7400318864537174],
  ])('matches the simplex-noise reference at (%f, %f)', (x, y, expected) => {
    expect(noise2D('reference', x, y)).toBeCloseTo(expected, 12)
  })

  it('builds its permutation without Math.random', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('noise2D must not read Math.random')
    })
    expect(() => noise2D('never-seen-before', 0.4, 0.6)).not.toThrow()
  })

  it('rebuilds the same field for a seed evicted from the cache', () => {
    const before = noise2D('evicted', 1.3, 2.7)
    for (let seed = 0; seed < 40; seed++) noise2D(seed, 0.5, 0.5)
    expect(noise2D('evicted', 1.3, 2.7)).toBe(before)
  })
})
