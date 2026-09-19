import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import {
  clampIndex,
  indexAtOffset,
  offsetForIndex,
  positionText,
  resolveActiveKey,
  slideGeometry,
  slideLabel,
  stepIndex,
} from './carouselMath'

const PHONE = { viewportWidth: 290, peek: 24, gap: 12 }

describe('slideGeometry', () => {
  it('leaves the peek and one gap for the next slide on a phone column', () => {
    const geometry = slideGeometry({ ...PHONE, count: 9 })

    expect(geometry.slideWidth).toBe(254)
    expect(geometry.step).toBe(266)
    expect(geometry.maxOffset).toBe(9 * 254 + 8 * 12 - 290)
  })

  it('gives a single slide the whole viewport and no scroll range', () => {
    expect(slideGeometry({ ...PHONE, count: 1 })).toEqual({
      slideWidth: 290,
      step: 302,
      maxOffset: 0,
    })
  })

  it('caps a slide on a wide column so more of the next one shows', () => {
    const geometry = slideGeometry({
      viewportWidth: 780,
      peek: 24,
      gap: 12,
      count: 3,
      maxSlideWidth: 480,
    })

    expect(geometry.slideWidth).toBe(480)
  })

  it('never produces a negative width for a viewport narrower than the peek', () => {
    expect(slideGeometry({ viewportWidth: 10, peek: 24, gap: 12, count: 2 }).slideWidth).toBe(0)
  })
})

describe('indexAtOffset and offsetForIndex', () => {
  const nine = slideGeometry({ ...PHONE, count: 9 })

  it('reads the nearest slide start mid-swipe', () => {
    expect(indexAtOffset(0, 9, nine)).toBe(0)
    expect(indexAtOffset(140, 9, nine)).toBe(1)
    expect(indexAtOffset(266 * 3 + 20, 9, nine)).toBe(3)
  })

  it('treats the end of the content as the last slide, which cannot reach the leading edge', () => {
    expect(offsetForIndex(8, 9, nine)).toBe(nine.maxOffset)
    expect(indexAtOffset(nine.maxOffset, 9, nine)).toBe(8)
  })

  it('collapses slides that cannot reach the leading edge onto the last one when capped', () => {
    const wide = slideGeometry({
      viewportWidth: 780,
      peek: 24,
      gap: 12,
      count: 3,
      maxSlideWidth: 300,
    })

    expect(offsetForIndex(1, 3, wide)).toBe(wide.maxOffset)
    expect(indexAtOffset(wide.maxOffset, 3, wide)).toBe(2)
  })

  it('always reads the first slide with one or no slides', () => {
    expect(indexAtOffset(500, 1, slideGeometry({ ...PHONE, count: 1 }))).toBe(0)
    expect(indexAtOffset(500, 0, slideGeometry({ ...PHONE, count: 0 }))).toBe(0)
  })
})

const phoneGeometry = fc.record({
  viewportWidth: fc.integer({ min: 200, max: 900 }),
  peek: fc.constantFrom(16, 24, 32),
  gap: fc.constantFrom(8, 12, 16),
  count: fc.integer({ min: 2, max: 40 }),
})

describe('properties', () => {
  it('an uncapped slide at its own offset reads back as itself', () => {
    fc.assert(
      fc.property(phoneGeometry, fc.nat(), (input, raw) => {
        const geometry = slideGeometry(input)
        const index = raw % input.count
        expect(
          indexAtOffset(offsetForIndex(index, input.count, geometry), input.count, geometry)
        ).toBe(index)
      })
    )
  })

  it('any offset, however hostile, reads as a slide that exists', () => {
    fc.assert(
      fc.property(phoneGeometry, fc.double({ noNaN: false }), (input, offset) => {
        const index = indexAtOffset(offset, input.count, slideGeometry(input))
        expect(index).toBeGreaterThanOrEqual(0)
        expect(index).toBeLessThan(input.count)
        expect(Number.isInteger(index)).toBe(true)
      })
    )
  })

  it('stepping never leaves the set and never wraps', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 40 }),
        fc.nat(),
        fc.integer({ min: -3, max: 3 }),
        (count, raw, delta) => {
          const index = raw % count
          const next = stepIndex(index, delta, count)
          expect(next).toBe(Math.min(count - 1, Math.max(0, index + delta)))
        }
      )
    )
  })

  it('the current key survives any change that keeps it', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
        fc.nat(),
        fc.nat(),
        (keys, pick, drop) => {
          const active = keys[pick % keys.length]
          const others = keys.filter((key) => key !== active)
          const kept = [...others.slice(0, drop % (others.length + 1)), active]
          expect(resolveActiveKey(kept, active, pick % keys.length)).toBe(active)
        }
      )
    )
  })

  it('a removed current key hands over to a slide within one position of where it was', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 20 }),
        fc.nat(),
        (keys, pick) => {
          const index = pick % keys.length
          const remaining = keys.filter((_, i) => i !== index)
          const next = resolveActiveKey(remaining, keys[index], index)
          expect(next).toBeDefined()
          expect(Math.abs(remaining.indexOf(next as string) - index)).toBeLessThanOrEqual(1)
        }
      )
    )
  })
})

describe('resolveActiveKey', () => {
  it('keeps the card in view when a card before it disappears', () => {
    expect(resolveActiveKey(['a', 'c', 'd', 'e'], 'd', 3)).toBe('d')
  })

  it('moves to the new last card when the current last card disappears', () => {
    expect(resolveActiveKey(['a', 'b'], 'c', 2)).toBe('b')
  })

  it('has nothing to show with no slides', () => {
    expect(resolveActiveKey([], 'a', 0)).toBeUndefined()
  })
})

describe('text', () => {
  it('prints the position between the arrows', () => {
    expect(positionText(1, 9)).toBe('2 of 9')
  })

  it('names a slide by position then label', () => {
    expect(slideLabel(0, 2, 'Bench press')).toBe('1 of 2: Bench press')
    expect(slideLabel(0, 2, '')).toBe('1 of 2')
  })

  it('clamps nonsense indexes rather than print a slide that does not exist', () => {
    expect(clampIndex(Number.NaN, 3)).toBe(0)
    expect(positionText(12, 3)).toBe('3 of 3')
  })
})
