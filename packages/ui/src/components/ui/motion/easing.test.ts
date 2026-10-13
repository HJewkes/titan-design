import { describe, expect, it } from 'vitest'
import { cubicBezier, linear } from './easing'

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
})
