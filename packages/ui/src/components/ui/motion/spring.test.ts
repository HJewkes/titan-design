import { describe, expect, it } from 'vitest'
import { spring, springEase, springSettleS, type SpringOptions } from './spring'

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

const lastUnsettledS = (options: SpringOptions) => {
  let last = 0
  for (let i = 0; i <= 50_000; i++) {
    if (Math.abs(spring(i / 10_000, options) - 1) > 1e-3) last = i / 10_000
  }
  return last
}

describe('springSettleS', () => {
  it.each([
    { stiffness: 100, damping: 10 },
    { stiffness: 200, damping: 15 },
    { stiffness: 100, damping: 20 },
    { stiffness: 100, damping: 40 },
  ])('is never early and within 20 % of the sampled settle for %o', (options) => {
    const sampled = lastUnsettledS(options)
    expect(springSettleS(options)).toBeGreaterThanOrEqual(sampled)
    expect(springSettleS(options)).toBeLessThanOrEqual(sampled * 1.2)
  })

  it('measures the threshold against the distance travelled', () => {
    expect(springSettleS({ from: 0, to: 10 })).toBeCloseTo(springSettleS(), 9)
    expect(springSettleS({}, 1e-2)).toBeLessThan(springSettleS())
  })

  it('is 0 for a spring already at rest', () => {
    expect(springSettleS({ from: 1, to: 1 })).toBe(0)
    expect(springSettleS({ from: 1, to: 1, damping: 20 })).toBe(0)
  })

  it('accounts for an initial velocity on a critically damped spring', () => {
    const pushed = { damping: 20, velocity: 40 }
    expect(springSettleS(pushed)).toBeGreaterThanOrEqual(lastUnsettledS(pushed))
  })

  it.each([19.9999, 20, 20.0001])(
    'stays within 20 %% of the sampled settle just around critical damping (%s)',
    (damping) => {
      const options = { stiffness: 100, damping }
      const sampled = lastUnsettledS(options)
      expect(springSettleS(options)).toBeGreaterThanOrEqual(sampled)
      expect(springSettleS(options)).toBeLessThanOrEqual(sampled * 1.2)
    }
  )

  it.each([
    { damping: 19.9999, velocity: 40 },
    { damping: 20.0001, velocity: 40 },
    { damping: 20.0001, velocity: -30 },
    { stiffness: 400, damping: 120, velocity: 40 },
  ])('is never early with an initial velocity near or above critical damping (%o)', (options) => {
    expect(springSettleS(options)).toBeGreaterThanOrEqual(lastUnsettledS(options))
  })

  it.each([0, -1, Number.NaN])('rejects damping %s, which never settles', (damping) => {
    expect(() => springSettleS({ damping })).toThrow(RangeError)
  })
})

describe('springEase', () => {
  it('is exactly 0 at 0 and exactly 1 at 1', () => {
    for (const options of [{}, { stiffness: 170, damping: 26 }, { damping: 40 }]) {
      const ease = springEase(options)
      expect([ease(0), ease(1)]).toEqual([0, 1])
    }
  })

  it('is monotone when the spring does not overshoot', () => {
    const ease = springEase({ stiffness: 100, damping: 20 })
    const values = Array.from({ length: 101 }, (_, i) => ease(i / 100))
    values.slice(1).forEach((v, i) => expect(v).toBeGreaterThanOrEqual(values[i] as number))
  })

  it('overshoots past 1 when the spring is underdamped', () => {
    const ease = springEase({ stiffness: 100, damping: 8 })
    expect(Math.max(...Array.from({ length: 101 }, (_, i) => ease(i / 100)))).toBeGreaterThan(1)
  })

  it('is continuous across the critical damping boundary', () => {
    const critical = springEase({ stiffness: 100, damping: 20 })(0.5)
    expect(springEase({ stiffness: 100, damping: 19.9999 })(0.5)).toBeCloseTo(critical, 3)
    expect(springEase({ stiffness: 100, damping: 20.0001 })(0.5)).toBeCloseTo(critical, 3)
  })

  it('rejects an undamped spring instead of returning NaN', () => {
    expect(() => springEase({ damping: 0 })).toThrow(RangeError)
  })
})
