import { describe, it, expect } from 'vitest'
import { getSemanticColors } from './semantic'
import { divergingScale, sequentialEffort, categoricalPalette } from './primitives'

/**
 * VW-371 pins for the three chart palettes as semantic roles.
 *
 * Phase 1 made them roles with both modes on the primitive arrays. Phase 2
 * (2026-09-17) gave LIGHT its own tuned steps; the DARK column must keep
 * tracking the primitive arrays unless the primitives themselves move. The
 * light values are pinned against the chosen decision sets by
 * `DatavizLightPalette.candidates.test.tsx`. A diff here is a question: which
 * mode moved, and was that the ticket?
 */
const PALETTES = [
  ['diverging', divergingScale],
  ['sequential', sequentialEffort],
  ['categorical', categoricalPalette.default],
] as const

const luminanceOf = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(1 + i, 3 + i), 16) / 255
    return c >= 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

describe('dataviz-* semantic roles (VW-371)', () => {
  for (const [name, palette] of PALETTES) {
    it(`dark: dataviz-${name}-* mirrors the primitive palette stop for stop`, () => {
      const colors = getSemanticColors('dark') as Record<string, string>
      const resolved = palette.map((_, i) => colors[`dataviz-${name}-${i}`])
      expect(resolved).toEqual([...palette])
    })
  }

  it('both modes expose the same 18 roles', () => {
    const roles = (mode: 'dark' | 'light') =>
      Object.keys(getSemanticColors(mode))
        .filter((k) => k.startsWith('dataviz-'))
        .sort()

    expect(roles('dark')).toHaveLength(18)
    expect(roles('light')).toEqual(roles('dark'))
  })

  it('light carries its own tuned values (phase 2), not a copy of dark', () => {
    const dark = getSemanticColors('dark') as Record<string, string>
    const light = getSemanticColors('light') as Record<string, string>
    const moved = Object.keys(dark).filter((k) => k.startsWith('dataviz-') && light[k] !== dark[k])

    expect(moved.length).toBeGreaterThan(0)
  })

  it('the optimal centre is the diverging scale middle stop on dark', () => {
    // Named explicitly because this is the stop the BodyMap heatmap glows on.
    expect(getSemanticColors('dark')['dataviz-diverging-2']).toBe(divergingScale[2])
  })

  it('the optimal centre is the lightest diverging stop in both modes', () => {
    for (const mode of ['dark', 'light'] as const) {
      const colors = getSemanticColors(mode)
      const stops = [0, 1, 2, 3, 4].map((i) =>
        luminanceOf(colors[`dataviz-diverging-${i}` as keyof typeof colors])
      )
      const arms = stops.filter((_, i) => i !== 2)
      expect(stops[2], mode).toBeGreaterThan(Math.max(...arms))
    }
  })
})
