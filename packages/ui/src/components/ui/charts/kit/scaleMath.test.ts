import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { scaleLinear } from 'd3-scale'

import { fcAssert } from '../../../../test/property'

import { cappedTicks, linearDomain, timeDomain, type Domain } from './scaleMath'

const value = fc.double({ min: -1e9, max: 1e9, noNaN: true, noDefaultInfinity: true })
const values = fc.array(value, { minLength: 1, maxLength: 40 })
const axis = fc.record({
  extent: fc.integer({ min: 0, max: 4000 }),
  padding: fc.integer({ min: 0, max: 40 }),
})

// d3's own tick search overflows on subnormal spans, which no padded domain produces.
const span = fc.double({ min: 1e-3, max: 1e9, noNaN: true })

const strictlyInside = (domain: Domain, v: number) => domain.min < v && v < domain.max

describe('linearDomain', () => {
  it('always has min below max, every value strictly inside', () => {
    fcAssert(
      fc.property(values, axis, (vs, px) => {
        const domain = linearDomain({ values: vs, ...px })
        return domain.min < domain.max && vs.every((v) => strictlyInside(domain, v))
      })
    )
  })

  it('widens all-equal input, any length, around the shared value', () => {
    fcAssert(
      fc.property(value, fc.integer({ min: 1, max: 20 }), axis, (v, n, px) => {
        const domain = linearDomain({ values: Array<number>(n).fill(v), ...px })
        return domain.min < domain.max && strictlyInside(domain, v)
      })
    )
  })

  it('keeps zero inside when asked, even for all-positive data', () => {
    const positive = fc.array(fc.double({ min: 1, max: 1e9, noNaN: true }), { minLength: 1 })
    fcAssert(
      fc.property(positive, axis, (vs, px) =>
        strictlyInside(linearDomain({ values: vs, includeZero: true, ...px }), 0)
      )
    )
  })

  it('keeps every reference value inside', () => {
    fcAssert(
      fc.property(values, values, axis, (vs, refs, px) => {
        const domain = linearDomain({ values: vs, referenceValues: refs, ...px })
        return refs.every((r) => strictlyInside(domain, r))
      })
    )
  })

  it('pads the requested pixels at each end', () => {
    const domain = linearDomain({ values: [0, 100], extent: 120, padding: 10 })
    expect(domain.min).toBeCloseTo(-10)
    expect(domain.max).toBeCloseTo(110)
  })

  it('widens a lone value to 10% of itself', () => {
    const domain = linearDomain({ values: [200], extent: 100, padding: 1 })
    expect(domain.min).toBeLessThan(190)
    expect(domain.max).toBeGreaterThan(210)
  })

  it('falls back to [0, 1] with no finite value', () => {
    expect(linearDomain({ values: [Number.NaN, Infinity], extent: 100 })).toEqual({
      min: 0,
      max: 1,
    })
  })
})

describe('timeDomain', () => {
  it('centres a lone timestamp rather than pinning it to the left edge', () => {
    const t = Date.UTC(2026, 0, 15)
    const domain = timeDomain({ timestamps: [new Date(t)], extent: 300, padding: 10 })
    expect((domain.min + domain.max) / 2).toBeCloseTo(t, 3)
    expect(t - domain.min).toBeGreaterThan(86_400_000)
  })

  it('centres a lone timestamp for any half-width', () => {
    fcAssert(
      fc.property(
        fc.integer({ min: 0, max: 4e12 }),
        fc.integer({ min: 1, max: 1e10 }),
        axis,
        (t, half, px) => {
          const d = timeDomain({ timestamps: [t, t], loneHalfWidth: half, ...px })
          return Math.abs(d.max - t - (t - d.min)) <= 1e-3 && strictlyInside(d, t)
        }
      )
    )
  })

  it('keeps every timestamp strictly inside', () => {
    const t = Date.UTC(2026, 0, 1)
    const stamps = [t, t + 86_400_000, t + 7 * 86_400_000]
    const domain = timeDomain({ timestamps: stamps, extent: 400 })
    expect(stamps.every((s) => strictlyInside(domain, s))).toBe(true)
  })

  it('falls back to [0, 1] with no timestamp', () => {
    expect(timeDomain({ timestamps: [], extent: 100 })).toEqual({ min: 0, max: 1 })
  })
})

describe('cappedTicks', () => {
  it('widens the step rather than draw seven lines for five', () => {
    const d3Like = {
      ticks: (count: number) =>
        count >= 5 ? [186, 188, 190, 192, 194, 196, 198] : [185, 190, 195],
    }
    expect(cappedTicks(d3Like, 5)).toEqual([185, 190, 195])
  })

  it('keeps six lines at step 5 over a 25-unit span', () => {
    expect(cappedTicks(scaleLinear().domain([170, 196]), 5)).toEqual([170, 175, 180, 185, 190, 195])
  })

  it('never exceeds the target plus one', () => {
    fcAssert(
      fc.property(value, span, fc.integer({ min: 2, max: 12 }), (lo, width, target) => {
        return cappedTicks(scaleLinear().domain([lo, lo + width]), target).length <= target + 1
      })
    )
  })
})
