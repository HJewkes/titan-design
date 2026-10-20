import { describe, expect, it } from 'vitest'
import { compositeOver, contrast } from '../../theme/color-checks'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import {
  ADJACENT_FLOOR,
  LIGHT_FADED_STEP,
  PALETTES,
  PLANE_FLOOR,
  fadedPalette,
  highlightZones,
  planeReadings,
  rampColor,
  rampLabel,
  scaleZones,
  stepDown,
  type PaletteId,
  type ScaleId,
} from './zone-fade'

const SCALE_IDS: ScaleId[] = ['effort', 'diverging']
const PALETTE_IDS: PaletteId[] = ['asBuilt', 'subtle']

function everyLitReading(palette: PaletteId, mode: ThemeMode) {
  return SCALE_IDS.flatMap((scale) =>
    scaleZones(scale, mode).map((zone, lit) => ({
      label: `${mode} ${scale} ${rampLabel(zone)} lit`,
      readings: highlightZones(palette, scale, mode, lit),
    }))
  )
}

describe('zone fade palettes', () => {
  it('marks the dark as built option as the one that ships, subtle as the alternative', () => {
    const shipping = PALETTE_IDS.filter((id) => PALETTES[id].title.includes('(ships)'))
    expect(shipping).toEqual(['asBuilt'])
    expect(PALETTES.subtle.title).toBe('Dark, subtle tokens (alternative)')
  })

  it('names every zone colour of both scales by its ramp step', () => {
    expect(scaleZones('effort', 'dark').map(rampLabel)).toEqual([
      'green 300',
      'amber 300',
      'orange 400',
      'red 600',
    ])
    expect(scaleZones('diverging', 'light').map(rampLabel)).toEqual([
      'blue 500',
      'cyan 400',
      'green 300',
      'amber 400',
      'red 600',
    ])
  })

  it('steps toward the dark plane in dark and toward the light plane in light', () => {
    const orange = rampColor('#FF7900')

    expect(rampLabel(stepDown(orange, 'dark', 2))).toBe('orange 600')
    expect(rampLabel(stepDown(orange, 'light', 2))).toBe('orange 200')
  })

  it('stops at the end of the ramp rather than leaving it', () => {
    const lightest = rampColor('#FFF4F4')

    expect(rampLabel(stepDown(lightest, 'light', 2))).toBe('red 50')
  })

  it('keeps only the landed zone at full colour', () => {
    const bright = scaleZones('effort', 'dark').map((z) => z.hex)

    const zones = highlightZones('asBuilt', 'effort', 'dark', 2)

    expect(zones[2].color.fill).toBe(bright[2])
    expect(zones.filter((z, i) => z.color.fill === bright[i])).toHaveLength(1)
  })

  it('separates every dark lit zone from both faded neighbours by the floor as built', () => {
    for (const { label, readings } of everyLitReading('asBuilt', 'dark')) {
      for (const { vsLit } of readings.filter((r) => r.vsLit != null)) {
        expect(vsLit, label).toBeGreaterThanOrEqual(ADJACENT_FLOOR)
      }
    }
  })

  it('keeps every dark faded zone as built visible on the plane', () => {
    for (const { label, readings } of everyLitReading('asBuilt', 'dark')) {
      for (const { vsPlane } of readings) expect(vsPlane, label).toBeGreaterThanOrEqual(PLANE_FLOOR)
    }
  })

  it('fades the zone the owner flagged past amber 500 beside a lit red 600', () => {
    const amber = fadedPalette('asBuilt', 'effort', 'dark')[1]

    expect(amber.label).not.toBe('amber 500')
  })

  it('fades every light zone to step 50, in both options', () => {
    expect(LIGHT_FADED_STEP).toBe(50)

    for (const palette of PALETTE_IDS) {
      expect(fadedPalette(palette, 'diverging', 'light').map(({ label }) => label)).toEqual([
        'blue 50',
        'cyan 50',
        'green 50',
        'amber 50',
        'red 50',
      ])
    }
  })

  it('keeps every light faded zone clear of the track and plane on planes 0 and -1', () => {
    for (const scale of SCALE_IDS) {
      for (const { level, zones } of planeReadings('asBuilt', scale, 'light')) {
        for (const { color, vsPlane, vsTrack } of zones) {
          const label = `light ${scale} plane ${level} ${color.label}`
          expect(vsPlane, label).toBeGreaterThanOrEqual(PLANE_FLOOR)
          expect(vsTrack, label).toBeGreaterThanOrEqual(PLANE_FLOOR)
        }
      }
    }
  })

  it('separates every light lit zone from both faded neighbours by the floor', () => {
    for (const { label, readings } of everyLitReading('asBuilt', 'light')) {
      for (const { vsLit } of readings.filter((r) => r.vsLit != null)) {
        expect(vsLit, label).toBeGreaterThanOrEqual(ADJACENT_FLOOR)
      }
    }
  })

  it('leaves the dark faded steps as built', () => {
    expect(fadedPalette('asBuilt', 'diverging', 'dark').map(({ label }) => label)).toEqual([
      'blue 700',
      'cyan 600',
      'green 500',
      'amber 700',
      'red 800',
    ])
  })

  it("paints each dark zone with its hue's subtle token in the subtle option", () => {
    const dark = getSemanticColors('dark')

    const faded = fadedPalette('subtle', 'effort', 'dark')

    expect(faded.map(({ label }) => label)).toEqual([
      'status-success-subtle',
      'status-warning-subtle',
      'brand-primary-subtle',
      'status-error-subtle',
    ])
    expect(faded[3].fill).toBe(dark['status-error-subtle'])
  })

  it('measures a translucent subtle fill as painted on each plane', () => {
    const dark = getSemanticColors('dark')

    const [base, background] = planeReadings('subtle', 'effort', 'dark')

    expect(base.plane).toBe(dark['surface-base'])
    expect(background.plane).toBe(dark['background-base'])
    expect(base.zones[0].painted).toBe(compositeOver(dark['status-success-subtle'], base.plane))
    expect(base.zones[0].vsPlane).toBeCloseTo(contrast(base.zones[0].painted, base.plane), 5)
    expect(background.track).toBe(compositeOver(dark['border-prominent'], background.plane))
  })
})
