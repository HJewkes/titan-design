import { describe, expect, it } from 'vitest'
import { contrast } from '../../theme/color-checks'
import { getSemanticColors } from '../../theme/tokens/semantic'
import {
  highlightZones,
  measureFade,
  rampColor,
  rampLabel,
  scaleZones,
  stepDown,
  type PaletteId,
  type ScaleId,
} from './zone-fade'

const RAMP_PALETTE_IDS: PaletteId[] = ['stepOne', 'stepTwo']
const SCALE_IDS: ScaleId[] = ['effort', 'diverging']

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

    const zones = highlightZones('stepOne', 'effort', 'dark', 2)

    expect(zones[2]).toBe(bright[2])
    expect(zones.filter((hex, i) => hex === bright[i])).toHaveLength(1)
  })

  it('moves every ramp-faded zone closer to the plane in both themes', () => {
    for (const mode of ['dark', 'light'] as const) {
      const plane = getSemanticColors(mode)['surface-base']
      for (const palette of RAMP_PALETTE_IDS) {
        for (const scale of SCALE_IDS) {
          for (const m of measureFade(palette, scale, mode)) {
            const label = `${palette} ${scale} ${mode} ${rampLabel(m.bright)}`
            expect(m.vsPlane, label).toBeLessThan(contrast(m.bright.hex, plane))
          }
        }
      }
    }
  })

  it('darkens away from the light plane under the scrim', () => {
    const plane = getSemanticColors('light')['surface-base']

    const faded = measureFade('scrim', 'effort', 'light')

    for (const m of faded) expect(m.vsPlane).toBeGreaterThan(contrast(m.bright.hex, plane))
  })
})
