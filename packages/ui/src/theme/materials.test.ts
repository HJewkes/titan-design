/**
 * Surface materials — the properties that make paper read as ONE material.
 *
 * These treatments are subtle by design (grain is a whisper at dark tones, the
 * rim is one pixel), which makes them exactly the kind of thing that can be
 * broken without anyone noticing until it looks wrong on the wall. So the
 * numbers that define them are asserted rather than left as comments.
 *
 * The `tonal fill` and `dither` blocks that used to lead this file went with
 * `tonalFill` and `ditherTile` in VW-99: the wall found the ΔL* 3 gradient
 * indiscernible, and then found that this render path does not band at all, so
 * the anti-banding layer was mitigating nothing. See the materials.ts header.
 */
import { describe, it, expect } from 'vitest'
import { grainOpacityForTone, grainForTone, paperSheet, insetWell, barPaper } from './materials'
import { greyRamp } from './tokens/primitives'

const styleOf = (s: Record<string, unknown>) => s as { backgroundImage?: string; boxShadow?: string; backgroundColor?: string }

describe('grain', () => {
  it('scales opacity with the tone it sits on', () => {
    // A fixed opacity reads hot on a dark plane and vanishes on a bright one.
    const dark = grainOpacityForTone(greyRamp[975])
    const mid = grainOpacityForTone(greyRamp[500])
    const light = grainOpacityForTone(greyRamp[200])
    expect(dark).toBeLessThan(mid)
    expect(mid).toBeLessThan(light)
  })

  it('stays inside the band where grain reads matte rather than dirty', () => {
    for (const step of Object.keys(greyRamp).map(Number)) {
      const op = grainOpacityForTone(greyRamp[step as keyof typeof greyRamp])
      expect(op, `grey-${step}`).toBeGreaterThanOrEqual(0.04)
      expect(op, `grey-${step}`).toBeLessThanOrEqual(0.24)
    }
  })

  it('survives malformed input instead of emitting NaN into a style', () => {
    expect(grainOpacityForTone('not-a-colour')).toBeGreaterThan(0)
    expect(grainForTone('not-a-colour')).not.toContain('NaN')
  })
})

describe('paperSheet', () => {
  it('carries grain ALONE — no dither, no gradient', () => {
    const bg = styleOf(paperSheet(greyRamp[875])).backgroundImage!
    // Count data URIs, not 'url(' — each SVG tile contains a `filter='url(#n)'`
    // internally, so counting the token double-reports.
    //
    // Both of the layers this used to have were measured off the sheet in VW-99:
    // the tonal fill was indiscernible from flat, and the dither was mitigating
    // a banding artefact that a hand-drawn reference proved this render path
    // does not produce. Asserted rather than merely deleted, so putting either
    // back is a deliberate act with a wall run behind it, not a quiet revert.
    expect(bg.split('data:image/svg+xml').length - 1, 'grain only, no dither tile').toBe(1)
    expect(bg, 'the tonal fill was removed in VW-99').not.toContain('linear-gradient')
  })

  it('keeps a solid backgroundColor so native does not fall through', () => {
    // backgroundImage and multi-layer boxShadow are web-only. Without a real
    // fill underneath, a paper surface renders as nothing on native.
    expect(styleOf(paperSheet(greyRamp[875])).backgroundColor).toBe(greyRamp[875])
  })

  it('carries a top rim and one soft contact shadow', () => {
    const shadow = styleOf(paperSheet()).boxShadow!
    expect(shadow).toContain('inset 0 1px 0')
    expect(shadow.split(',').filter((s) => s.includes('px')).length).toBeGreaterThan(1)
  })
})

describe('insetWell', () => {
  it('cuts in from the top AND lights the floor', () => {
    // The floor rim is the load-bearing half — a dark inset alone just reads as
    // a darker rectangle. It is the light on the floor that says "below".
    const shadow = styleOf(insetWell(greyRamp[950])).boxShadow!
    expect(shadow).toContain('inset 0 2px')
    expect(shadow, 'missing the bottom floor rim').toContain('inset 0 -1px 0 rgba(255,255,255,0.12)')
  })

  it('is entirely inset — a well must not cast outward', () => {
    const shadow = styleOf(insetWell()).boxShadow!
    for (const layer of shadow.split(/,(?![^(]*\))/)) {
      expect(layer.trim().startsWith('inset'), `outward layer: ${layer.trim()}`).toBe(true)
    }
  })
})

describe('barPaper', () => {
  it('drops the rim light when mirrored', () => {
    // Mirrored, a top rim would land on the shared axis of a diverging chart.
    expect(styleOf(barPaper('#D14343', true)).boxShadow).not.toContain('inset')
    expect(styleOf(barPaper('#D14343', false)).boxShadow).toContain('inset')
  })

  it('throws its contact shadow away from the axis when mirrored', () => {
    expect(styleOf(barPaper('#D14343', true)).boxShadow).toContain('0 -6px')
    expect(styleOf(barPaper('#D14343', false)).boxShadow).toContain('0 6px')
  })

  it('shares the one grain curve with paperSheet', () => {
    // Same material, proportional texture — that is what makes a card and a bar
    // look like they belong to the same system.
    expect(styleOf(barPaper(greyRamp[500])).backgroundImage).toBe(grainForTone(greyRamp[500]))
  })
})
