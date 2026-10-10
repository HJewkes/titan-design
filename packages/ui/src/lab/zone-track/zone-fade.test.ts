import { describe, expect, it } from 'vitest'
import type { ThemeMode } from '../../theme/tokens/semantic'
import {
  ADJACENT_FLOOR,
  PLANE_FLOOR,
  fadedPalette,
  highlightZones,
  rampColor,
  rampLabel,
  scaleZones,
  stepDown,
  type ScaleId,
} from './zone-fade'

const SCALE_IDS: ScaleId[] = ['effort', 'diverging']
const MODE_IDS: ThemeMode[] = ['dark', 'light']

function everyLitReading(palette: Parameters<typeof highlightZones>[0]) {
  return MODE_IDS.flatMap((mode) =>
    SCALE_IDS.flatMap((scale) =>
      scaleZones(scale, mode).map((zone, lit) => ({
        label: `${mode} ${scale} ${rampLabel(zone)} lit`,
        readings: highlightZones(palette, scale, mode, lit),
      }))
    )
  )
}

describe('zone fade palettes', () => {
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

    const zones = highlightZones('adjacentFloor', 'effort', 'dark', 2)

    expect(zones[2].color.hex).toBe(bright[2])
    expect(zones.filter((z, i) => z.color.hex === bright[i])).toHaveLength(1)
  })

  it('separates every lit zone from both faded neighbours by the floor in the chosen palette', () => {
    for (const { label, readings } of everyLitReading('adjacentFloor')) {
      for (const { vsLit } of readings.filter((r) => r.vsLit != null)) {
        expect(vsLit, label).toBeGreaterThanOrEqual(ADJACENT_FLOOR)
      }
    }
  })

  it('keeps every faded zone of the chosen palette visible on the plane', () => {
    for (const { label, readings } of everyLitReading('adjacentFloor')) {
      for (const { vsPlane } of readings) expect(vsPlane, label).toBeGreaterThanOrEqual(PLANE_FLOOR)
    }
  })

  it('fades the zone the owner flagged past amber 500 beside a lit red 600', () => {
    const amber = fadedPalette('adjacentFloor', 'effort', 'dark')[1]

    expect(rampLabel(amber)).not.toBe('amber 500')
  })

  it('never fades a zone less than palette B does', () => {
    for (const mode of MODE_IDS) {
      for (const scale of SCALE_IDS) {
        const zones = scaleZones(scale, mode)
        fadedPalette('adjacentFloor', scale, mode).forEach((faded, i) => {
          const paletteB = stepDown(zones[i], mode, 2)
          const further =
            mode === 'dark' ? faded.step >= paletteB.step : faded.step <= paletteB.step
          expect(further, `${mode} ${scale} ${rampLabel(faded)}`).toBe(true)
        })
      }
    }
  })

  it('moves only dark one more step in the dark alternative', () => {
    expect(fadedPalette('darkFurther', 'effort', 'dark').map(rampLabel)).toEqual([
      'green 600',
      'amber 600',
      'orange 700',
      'red 900',
    ])
    expect(fadedPalette('darkFurther', 'effort', 'light').map(rampLabel)).toEqual([
      'green 100',
      'amber 100',
      'orange 200',
      'red 400',
    ])
  })

  it('moves only light cyan and blue one more shade in the light alternative', () => {
    expect(fadedPalette('lightCoolFurther', 'diverging', 'light').map(rampLabel)).toEqual([
      'blue 200',
      'cyan 100',
      'green 100',
      'amber 200',
      'red 400',
    ])
    expect(fadedPalette('lightCoolFurther', 'diverging', 'dark').map(rampLabel)).toEqual([
      'blue 700',
      'cyan 500',
      'green 400',
      'amber 500',
      'red 800',
    ])
  })
})
