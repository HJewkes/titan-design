import { describe, expect, it } from 'vitest'
import { pathLength, pointAtLength } from './paths'
import { roughEllipse, roughLine } from './rough'

const from = { x: 0, y: 0 }
const to = { x: 120, y: 0 }

describe('roughLine', () => {
  // Mutation caught: drawing jitter from Math.random() instead of random(seed, key, slot).
  it('draws identical path data for equal arguments', () => {
    expect(roughLine(7, 0, from, to).d).toBe(roughLine(7, 0, from, to).d)
  })

  // Mutation caught: ignoring the seed or the key when hashing the jitter.
  it('draws a different stroke for another seed or key', () => {
    const base = roughLine(7, 0, from, to).d
    expect(roughLine(8, 0, from, to).d).not.toBe(base)
    expect(roughLine(7, 1, from, to).d).not.toBe(base)
  })

  // Mutation caught: an endpoint jitter range not scaled by roughness.
  it('runs exactly along the chord at roughness 0', () => {
    const line = roughLine(7, 0, from, to, { roughness: 0 })
    expect(line.length).toBeCloseTo(120, 6)
    expect(pointAtLength(line, 60).y).toBeCloseTo(0, 9)
  })

  // Mutation caught: an endpoint jitter of the full line length instead of at most 2 px.
  it('keeps its ends within 2 px of the requested points', () => {
    for (let seed = 0; seed < 20; seed++) {
      const line = roughLine(seed, 0, from, to)
      const start = pointAtLength(line, 0)
      const end = pointAtLength(line, line.length)
      expect(Math.hypot(start.x - from.x, start.y - from.y)).toBeLessThanOrEqual(2 * Math.SQRT2)
      expect(Math.hypot(end.x - to.x, end.y - to.y)).toBeLessThanOrEqual(2 * Math.SQRT2)
    }
  })

  // Mutation caught: a model length that disagrees with its own path data.
  it('measures the same length as its path data', () => {
    const line = roughLine(3, 2, from, { x: 80, y: 45 })
    expect(line.length).toBeCloseTo(pathLength(line.d), 6)
  })
})

describe('roughEllipse', () => {
  const center = { x: 50, y: 20 }

  // Mutation caught: jitter that depends on call order rather than (seed, key).
  it('draws identical path data for equal arguments', () => {
    roughEllipse(1, 0, center, [60, 25])
    expect(roughEllipse(4, 0, center, [60, 25]).d).toBe(roughEllipse(4, 0, center, [60, 25]).d)
  })

  // Mutation caught: a sweep of exactly one lap, so the pen stops where it began.
  it('carries on past its start rather than closing', () => {
    const ring = roughEllipse(4, 0, center, [60, 25], { roughness: 0 })
    const lap = 2 * Math.PI * Math.sqrt((60 ** 2 + 25 ** 2) / 2)
    expect(ring.length).toBeGreaterThan(lap)
    const start = pointAtLength(ring, 0)
    const end = pointAtLength(ring, ring.length)
    expect(Math.hypot(end.x - start.x, end.y - start.y)).toBeGreaterThan(5)
  })

  // Mutation caught: swapping rx and ry, or centring on the origin.
  it('rings the centre with the given radii', () => {
    const ring = roughEllipse(4, 0, center, [60, 25], { roughness: 0 })
    const xs = Array.from({ length: 64 }, (_, i) => pointAtLength(ring, (i / 64) * ring.length).x)
    expect(Math.max(...xs)).toBeCloseTo(center.x + 60, 0)
    expect(Math.min(...xs)).toBeCloseTo(center.x - 60, 0)
  })
})
