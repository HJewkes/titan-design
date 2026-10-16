import { describe, expect, it } from 'vitest'
import {
  back,
  cubicBezier,
  easeIn,
  easeInOut,
  easeOut,
  linear,
  poly,
  smootherstep,
  smoothstep,
} from './easing'

describe('linear', () => {
  it('returns progress unchanged', () => {
    expect([0, 0.25, 1].map(linear)).toEqual([0, 0.25, 1])
  })
})

describe('cubicBezier', () => {
  it('is the identity for the linear control points', () => {
    const ease = cubicBezier(0, 0, 1, 1)
    for (const p of [0, 0.1, 0.33, 0.5, 0.9, 1]) expect(ease(p)).toBeCloseTo(p, 5)
  })

  it('pins the endpoints and overshoots for spring-like control points', () => {
    const ease = cubicBezier(0.34, 1.56, 0.64, 1)
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(Math.max(...[0.5, 0.6, 0.7, 0.8].map(ease))).toBeGreaterThan(1)
  })

  it('holds the endpoints outside [0, 1]', () => {
    const ease = cubicBezier(0.25, 0.1, 0.25, 1)
    expect([ease(-1), ease(2)]).toEqual([0, 1])
  })

  it('matches the CSS ease curve at the midpoint', () => {
    expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(0.8024, 3)
  })

  it('stays monotonic where Newton steps meet a flat slope', () => {
    const ease = cubicBezier(0, 1, 1, 0)
    const samples = Array.from({ length: 101 }, (_, i) => ease(i / 100))
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual((samples[i - 1] as number) - 1e-6)
    }
  })

  it.each([
    [1.1, 0, 0, 1],
    [0, 0, -0.1, 1],
    [NaN, 0, 0, 1],
    [0, Infinity, 0, 1],
    [0, 0, 0, NaN],
  ])('refuses cubicBezier(%s, %s, %s, %s) as CSS does', (x1, y1, x2, y2) => {
    expect(() => cubicBezier(x1, y1, x2, y2)).toThrow(RangeError)
  })

  it('accepts x at the ends of [0, 1] and y outside it', () => {
    expect(cubicBezier(0, -2, 1, 3)(0.5)).toBeCloseTo(0.5, 3)
  })
})

describe('easing combinators', () => {
  const quad = poly(2)

  it('reflects a curve through the centre with easeOut', () => {
    expect(easeOut(quad)(0.25)).toBeCloseTo(1 - 0.75 ** 2, 12)
    expect(easeIn(quad)(0.25)).toBe(quad(0.25))
  })

  it('meets at the midpoint and is point-symmetric with easeInOut', () => {
    const inOut = easeInOut(poly(3))
    expect(inOut(0.5)).toBe(0.5)
    for (const p of [0.1, 0.3, 0.45]) expect(inOut(1 - p)).toBeCloseTo(1 - inOut(p), 12)
    expect(inOut(0.25)).toBeCloseTo(0.0625, 12)
  })

  it('raises progress to the power n with poly', () => {
    expect(poly(3)(0.5)).toBe(0.125)
  })

  it('dips below 0 before ending at 1 with back', () => {
    expect(back()(0.2)).toBeLessThan(0)
    expect(back()(0.42)).toBeCloseTo(-0.1, 2)
    expect(back()(1)).toBe(1)
    expect(back(0)(0.5)).toBe(0.125)
  })

  it.each([
    ['smoothstep', smoothstep, 0.15625],
    ['smootherstep', smootherstep, 0.103515625],
  ])('%s runs 0 to 1 through the midpoint with flat ends', (_, curve, atQuarter) => {
    expect([curve(0), curve(0.5), curve(1)]).toEqual([0, 0.5, 1])
    expect(curve(0.25)).toBeCloseTo(atQuarter, 12)
    expect(curve(1e-4) / 1e-4).toBeLessThan(1e-3)
  })
})
