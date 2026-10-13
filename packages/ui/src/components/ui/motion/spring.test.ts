import { describe, expect, it } from 'vitest'
import { spring, type SpringOptions } from './spring'

const samples = (options: SpringOptions) =>
  Array.from({ length: 300 }, (_, i) => spring(i / 100, options))

describe('spring', () => {
  it('starts at from and settles to to within 1e-3', () => {
    expect(spring(0)).toBe(0)
    expect(spring(-1, { from: 3 })).toBe(3)
    expect(Math.abs(spring(1e3) - 1)).toBeLessThan(1e-3)
    expect(Math.abs(spring(60, { to: 9, stiffness: 120, damping: 18 }) - 9)).toBeLessThan(1e-3)
  })

  it('overshoots when underdamped and never overshoots when critically or over damped', () => {
    expect(Math.max(...samples({ stiffness: 100, damping: 5 }))).toBeGreaterThan(1)
    expect(Math.max(...samples({ stiffness: 100, damping: 20 }))).toBeLessThanOrEqual(1)
    expect(Math.max(...samples({ stiffness: 100, damping: 40 }))).toBeLessThanOrEqual(1)
  })

  it('is continuous across the critical damping boundary', () => {
    const critical = spring(0.3, { stiffness: 100, damping: 20 })
    expect(spring(0.3, { stiffness: 100, damping: 19.999 })).toBeCloseTo(critical, 3)
    expect(spring(0.3, { stiffness: 100, damping: 20.001 })).toBeCloseTo(critical, 3)
  })

  it('carries an initial velocity in every damping regime', () => {
    for (const damping of [5, 20, 40]) {
      const pushed = spring(0.01, { stiffness: 100, damping, velocity: 50 })
      expect(pushed).toBeGreaterThan(spring(0.01, { stiffness: 100, damping }))
    }
  })
})
