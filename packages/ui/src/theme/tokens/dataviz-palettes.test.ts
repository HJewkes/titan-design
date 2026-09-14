import { describe, it, expect } from 'vitest'
import { getSemanticColors, type ThemeMode } from './semantic'
import { divergingScale, sequentialEffort, categoricalPalette } from './primitives'

/**
 * VW-371 phase 1 pins: the three chart palettes are now semantic roles, and in
 * phase 1 they carry the primitives' values verbatim in BOTH modes.
 *
 * This is the guard that makes "no visual change" a checked property rather than
 * a claim. It also pins the ONE thing phase 2 is allowed to change and the one
 * it is not: light may diverge from dark, but the DARK column must keep tracking
 * the primitive arrays unless the primitives themselves move. A diff here is a
 * question — which mode moved, and was that the ticket?
 */
const MODES: ThemeMode[] = ['dark', 'light']

const PALETTES = [
  ['diverging', divergingScale],
  ['sequential', sequentialEffort],
  ['categorical', categoricalPalette.default],
] as const

describe('dataviz-* semantic roles (VW-371 phase 1)', () => {
  for (const mode of MODES) {
    for (const [name, palette] of PALETTES) {
      it(`${mode}: dataviz-${name}-* mirrors the primitive palette stop for stop`, () => {
        const colors = getSemanticColors(mode) as Record<string, string>
        const resolved = palette.map((_, i) => colors[`dataviz-${name}-${i}`])
        expect(resolved).toEqual([...palette])
      })
    }
  }

  it('light and dark hold identical values (phase 1 is plumbing only)', () => {
    const dark = getSemanticColors('dark') as Record<string, string>
    const light = getSemanticColors('light') as Record<string, string>
    const keys = Object.keys(dark).filter((k) => k.startsWith('dataviz-'))

    expect(keys.length, 'dataviz roles exist at all').toBe(18)
    for (const key of keys) {
      expect(
        light[key],
        `${key}: light diverged from dark, so this is phase 2 — delete this assertion ` +
          'deliberately, as part of that ticket, rather than to get to green. The heatmap ' +
          'path is ready for it (`getHeatmapColor` takes a required `mode`), but audit any ' +
          'consumer still reading the PRIMITIVE arrays first: those cannot follow the theme, ' +
          'so they will silently keep painting the dark values. See the follow-up list in the ' +
          'VW-371 PR — VelocityStrip, extracted-colors-{ui,dataviz}, FileActivityRow.'
      ).toBe(dark[key])
    }
  })

  it('the optimal centre is the diverging scale middle stop in both modes', () => {
    // Named explicitly because this is the stop the BodyMap heatmap glows on,
    // and the one the VW-371 mutation control moves to prove the pin bites.
    expect(getSemanticColors('dark')['dataviz-diverging-2']).toBe(divergingScale[2])
    expect(getSemanticColors('light')['dataviz-diverging-2']).toBe(divergingScale[2])
  })
})
