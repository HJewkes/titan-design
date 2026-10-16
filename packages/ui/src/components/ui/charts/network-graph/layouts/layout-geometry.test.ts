import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fcAssert } from '../../../../../test/property'
import {
  LAYOUT_DEFAULTS,
  clampInt,
  frameLayout,
  packCircles,
  readingOrder,
  toSeed,
} from './layout-geometry'

const { PADDING, LABEL_ROOM, ROW_BAND } = LAYOUT_DEFAULTS

describe('toSeed', () => {
  it('maps NaN and Infinity to 1, 1.5 to 1, and -1 and 2 ** 40 to an unsigned 32-bit integer', () => {
    expect([Number.NaN, Infinity, -Infinity, undefined].map(toSeed)).toEqual([1, 1, 1, 1])
    expect(toSeed(1.5)).toBe(1)
    expect(toSeed(-1)).toBe(4294967295)
    expect(toSeed(2 ** 40)).toBe(0)
  })
})

describe('clampInt', () => {
  it('floors into the range and takes the fallback for NaN', () => {
    expect(clampInt(0, 1, 1000, 300)).toBe(1)
    expect(clampInt(1e9, 1, 1000, 300)).toBe(1000)
    expect(clampInt(Number.NaN, 1, 1000, 300)).toBe(300)
    expect(clampInt(2.9, 1, 1000, 300)).toBe(2)
    expect(clampInt(undefined, 1, 1000, 300)).toBe(300)
    expect([Infinity, -Infinity].map((v) => clampInt(v, 1, 1000, 300))).toEqual([1, 1000].reverse())
  })
})

describe('frameLayout', () => {
  const spread = { a: { x: -50, y: -20 }, b: { x: 100, y: 60 } }

  it('leaves every position at least the padding from the top and left, and the natural size holds every position plus label room', () => {
    const framed = frameLayout(spread, { width: 0, height: 0 })
    expect(framed.positions.a).toEqual({ x: PADDING, y: PADDING })
    expect(framed.positions.b).toEqual({ x: PADDING + 150, y: PADDING + 80 })
    expect(framed.width).toBe(150 + PADDING * 2 + LABEL_ROOM)
    expect(framed.height).toBe(80 + PADDING * 2)
  })

  it('centres a result smaller than the viewport and does not divide by a zero viewport', () => {
    const one = { a: { x: 7, y: 7 } }
    const centred = frameLayout(one, { width: 1000, height: 600 })
    const natural = PADDING * 2 + LABEL_ROOM
    expect(centred.positions.a?.x).toBe((1000 - natural) / 2 + PADDING)
    expect(centred.positions.a?.y).toBe((600 - PADDING * 2) / 2 + PADDING)
    expect([centred.width, centred.height]).toEqual([1000, 600])
    for (const viewport of [0, Number.NaN, -5]) {
      const framed = frameLayout(one, { width: viewport, height: viewport })
      expect(Number.isFinite(framed.positions.a?.x)).toBe(true)
      expect(framed.positions.a).toEqual({ x: PADDING, y: PADDING })
    }
  })

  it('rounds to 0.01 and returns an empty result for no positions', () => {
    expect(frameLayout({ a: { x: 1 / 3, y: 2 / 3 } }, { width: 0, height: 0 }).positions.a).toEqual(
      {
        x: PADDING + 0,
        y: PADDING + 0,
      }
    )
    const empty = frameLayout({}, { width: 0, height: 0 })
    expect(empty.positions).toEqual({})
    expect(empty.width).toBe(PADDING * 2 + LABEL_ROOM)
  })
})

describe('frameLayout bounds', () => {
  it('holds every bounds point inside the padded box and reports the translation as offset', () => {
    const framed = frameLayout({ a: { x: 0, y: 0 } }, { width: 0, height: 0 }, [
      { x: -100, y: -40 },
      { x: 100, y: 40 },
    ])
    expect(framed.offset).toEqual({ x: PADDING + 100, y: PADDING + 40 })
    expect(framed.positions.a).toEqual(framed.offset)
    expect([framed.width, framed.height]).toEqual([
      200 + PADDING * 2 + LABEL_ROOM,
      80 + PADDING * 2,
    ])
  })
})

describe('readingOrder', () => {
  it('sorts by band, then x, then id', () => {
    const order = readingOrder({
      d: { x: 10, y: 5 },
      c: { x: 10, y: 5 },
      b: { x: 90, y: ROW_BAND - 1 },
      a: { x: 200, y: 0 },
      e: { x: 0, y: ROW_BAND },
    })
    expect(order).toEqual(['c', 'd', 'b', 'a', 'e'])
  })
})

describe('packCircles', () => {
  const circles = fc.array(fc.integer({ min: 1, max: 60 }), { minLength: 1, maxLength: 20 })

  it('property: never overlaps two circles and wraps at the given width', () => {
    fcAssert(
      fc.property(
        circles,
        fc.integer({ min: 20, max: 400 }),
        fc.integer({ min: 0, max: 20 }),
        (radii, width, gap) => {
          const input = radii.map((radius, i) => ({ id: `c${i}`, radius }))
          const packed = packCircles(input, { width, gap }).circles
          for (const [i, a] of packed.entries()) {
            for (const b of packed.slice(i + 1)) {
              const distance = Math.hypot(a.cx - b.cx, a.cy - b.cy)
              expect(distance).toBeGreaterThanOrEqual(a.radius + b.radius + Math.min(gap, 0) - 1e-9)
            }
            const alone = packed.filter((other) => other.cy - other.radius === a.cy - a.radius)
            if (alone.length > 1) expect(a.cx + a.radius).toBeLessThanOrEqual(width + 1e-9)
          }
        }
      )
    )
  })

  it('keeps the gap between neighbours in a row and between rows', () => {
    const packed = packCircles(
      [
        { id: 'a', radius: 10 },
        { id: 'b', radius: 10 },
        { id: 'c', radius: 10 },
      ],
      { width: 50, gap: 5 }
    )
    expect(packed.circles.map((c) => [c.cx, c.cy])).toEqual([
      [10, 10],
      [35, 10],
      [10, 35],
    ])
    expect([packed.width, packed.height]).toEqual([45, 45])
  })

  it('keeps the headroom empty above every row', () => {
    const packed = packCircles(
      [
        { id: 'a', radius: 10 },
        { id: 'b', radius: 10 },
      ],
      { width: 20, gap: 5, headroom: 8 }
    )
    expect(packed.circles.map((c) => c.cy - c.radius)).toEqual([8, 41])
    expect(packed.height).toBe(61)
  })

  it('places a circle wider than the width on its own row', () => {
    const packed = packCircles(
      [
        { id: 'a', radius: 5 },
        { id: 'wide', radius: 100 },
        { id: 'b', radius: 5 },
      ],
      { width: 50, gap: 2 }
    )
    expect(packed.circles.map((c) => c.cy - c.radius)).toEqual([0, 12, 214])
    expect(packed.circles.map((c) => c.cx - c.radius)).toEqual([0, 0, 0])
  })
})
