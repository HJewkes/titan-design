import { describe, it, expect } from 'vitest'
import { getGlowShadow, getElevationSurface, getElevationShadow, getBaseSurfaceColor, FLOATING_ELEVATION_MIN } from './elevation'

describe('getGlowShadow', () => {
  it('returns shadow style for valid hex color', () => {
    const style = getGlowShadow('#FF7900', 'medium')
    expect(style).toBeDefined()
    expect(Object.keys(style).length).toBeGreaterThan(0)
  })

  it('returns empty object for invalid color', () => {
    const style = getGlowShadow('not-a-color')
    expect(style).toEqual({})
  })

  it('scales intensity across levels', () => {
    const subtle = getGlowShadow('#FF7900', 'subtle')
    const strong = getGlowShadow('#FF7900', 'strong')
    expect(subtle).not.toEqual(strong)
  })

  it('defaults to medium intensity', () => {
    const defaultStyle = getGlowShadow('#FF7900')
    const mediumStyle = getGlowShadow('#FF7900', 'medium')
    expect(defaultStyle).toEqual(mediumStyle)
  })
})

// ── TD-07.16: the depth model ───────────────────────────────────────────────

describe('elevation depth model', () => {
  const hex2rgb = (h: string): [number, number, number] => {
    const n = parseInt(h.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const srgb2lin = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const fl = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const Lstar = (hex: string) => {
    const [r, g, b] = hex2rgb(hex).map(srgb2lin)
    return 116 * fl(r * 0.2126729 + g * 0.7151522 + b * 0.072175) - 16
  }

  const base = getBaseSurfaceColor('dark')

  /**
   * With drop-shadow gated off below FLOATING_ELEVATION_MIN, TONE is the only
   * thing separating levels 0-3. Level 1 previously moved 0.01 (~2 RGB), which
   * is under the perceptual floor — so the level existed in the type system and
   * nowhere on screen.
   */
  it('separates every adjacent content level by a visible tonal step', () => {
    const levels = [0, 1, 2, 3] as const
    for (let i = 1; i < levels.length; i++) {
      const prev = Lstar(getElevationSurface(base, levels[i - 1], 'dark'))
      const cur = Lstar(getElevationSurface(base, levels[i], 'dark'))
      const step = cur - prev
      expect(step, `L${levels[i - 1]}→L${levels[i]} moves ΔL* ${step.toFixed(2)}`).toBeGreaterThan(1)
    }
  })

  it('gets lighter as it rises, never darker', () => {
    const ls = ([0, 1, 2, 3, 4, 5] as const).map((lv) => Lstar(getElevationSurface(base, lv, 'dark')))
    for (let i = 1; i < ls.length; i++) expect(ls[i]).toBeGreaterThan(ls[i - 1])
  })

  it('casts NO outward shadow below the floating threshold', () => {
    // Dark-on-dark drop shadows are inert — they cost a composite layer and
    // show nothing. Inline hierarchy is the hairline's job.
    for (const lv of [1, 2, 3] as const) {
      expect(getElevationShadow(base, lv, 'dark'), `level ${lv}`).toEqual({})
    }
  })

  it('does cast one at and above the floating threshold', () => {
    for (const lv of [FLOATING_ELEVATION_MIN, 5] as const) {
      expect(Object.keys(getElevationShadow(base, lv, 'dark')).length, `level ${lv}`).toBeGreaterThan(0)
    }
  })

  it('keeps the recess on inset levels — a well is not a cast shadow', () => {
    for (const lv of [-1, -2] as const) {
      expect(Object.keys(getElevationShadow(base, lv, 'dark')).length, `level ${lv}`).toBeGreaterThan(0)
    }
  })
})
