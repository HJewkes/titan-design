import { describe, expect, it } from 'vitest'
import { semanticColorsDark as dark } from '../../../theme/tokens/semantic'
import { FILL_END, stateChipColor, stateChipLabelColor, stateChipLook } from './stateChipTimeline'

const steps = Array.from({ length: 101 }, (_, i) => i / 100)

// Test oracle: Oklab lightness and hue of a hex colour (Björn Ottosson's matrices).
function oklch(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const x = parseInt(hex.slice(i, i + 2), 16) / 255
    return x >= 0.04045 ? ((x + 0.055) / 1.055) ** 2.4 : x / 12.92
  })
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  return { L, hue: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 }
}

describe('stateChipLook', () => {
  it('fills monotonically within [0, 1] and turns only after the fill completes when entering met', () => {
    const looks = steps.map((p) => stateChipLook('met', 'unmet', p))

    looks.forEach((look, i) => {
      expect(look.fill).toBeGreaterThanOrEqual(0)
      expect(look.fill).toBeLessThanOrEqual(1)
      expect(look.tint).toBeLessThanOrEqual(1)
      if (steps[i] <= FILL_END) expect(look.tint).toBe(0)
      if (i > 0) {
        expect(look.fill).toBeGreaterThanOrEqual(looks[i - 1].fill)
        expect(look.tint).toBeGreaterThanOrEqual(looks[i - 1].tint)
      }
    })
  })

  it('is fully filled and not yet turned at FILL_END, and fully turned at 1', () => {
    const atFillEnd = stateChipLook('met', 'unmet', FILL_END)
    const atEnd = stateChipLook('met', 'unmet', 1)

    expect([atFillEnd.fill, atFillEnd.tint]).toEqual([1, 0])
    expect([atEnd.tint, atEnd.settled]).toEqual([1, true])
  })

  it('resets from met to unmet with no fill, ending dashed', () => {
    const looks = steps.map((p) => stateChipLook('unmet', 'met', p))

    expect(looks.every((look) => look.fill === 0)).toBe(true)
    expect(looks[0].border).toBe('solid')
    expect(looks[100].border).toBe('dashed')
  })

  it('treats a chip with no from as settled in its own state', () => {
    expect(stateChipLook('unmet', undefined, 0)).toEqual({
      fill: 0,
      tint: 1,
      settled: true,
      border: 'dashed',
    })
  })
})

describe('stateChipColor', () => {
  it('turns amber to green along the short hue arc, with lightness inside the endpoints', () => {
    const { 'status-warning': amber, 'status-success': green } = dark
    const [a, g, mid] = [amber, green, stateChipColor(0.5, [amber, green])].map(oklch)

    expect(mid.hue).toBeGreaterThan(Math.min(a.hue, g.hue))
    expect(mid.hue).toBeLessThan(Math.max(a.hue, g.hue))
    expect(mid.L).toBeGreaterThanOrEqual(Math.min(a.L, g.L))
    expect(mid.L).toBeLessThanOrEqual(Math.max(a.L, g.L))
  })
})

describe('stateChipLabelColor', () => {
  const [neutral, warning, success] = [
    dark['text-primary'],
    dark['on-status-warning-subtle'],
    dark['on-status-success-subtle'],
  ]
  const stops = [neutral, warning, success] as const

  it('reaches the warning label at the end of the fill and the target label at the end of the turn', () => {
    expect(stateChipLabelColor(stateChipLook('met', 'unmet', FILL_END), stops)).toBe(
      warning.toLowerCase()
    )
    expect(stateChipLabelColor(stateChipLook('met', 'unmet', 1), stops)).toBe(success.toLowerCase())
  })

  it('skips the warning label on a reset', () => {
    const half = stateChipLabelColor(stateChipLook('unmet', 'met', 0.5), stops)

    expect(half).toBe(stateChipColor(0.5, [neutral, success]))
  })
})
