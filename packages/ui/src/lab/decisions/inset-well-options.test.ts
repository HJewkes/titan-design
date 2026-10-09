import { describe, expect, it } from 'vitest'
import { insetFieldFill } from '../../components/ui/surface/insetField'
import { MODES, PLANES, WELL_OPTIONS, measureWell, type WellOptionKey } from './inset-well-options'

// Wells as the story prints them, planes in the order background, base, elevated, raised, overlay.
const PINNED: Record<WellOptionKey, Record<'light' | 'dark', string[]>> = {
  asBuilt: {
    light: ['#A29F9D', '#EDEAE7', '#FFFFFF', '#F9F6F3', '#EDEAE7'],
    dark: ['#100D0A', '#1C1916', '#252321', '#2C2A28', '#31302F'],
  },
  planeColour: {
    light: ['#EDEAE7', '#FFFFFF', '#F9F6F3', '#EDEAE7', '#FFFFFF'],
    dark: ['#100D0A', '#1C1916', '#252321', '#2C2A28', '#31302F'],
  },
  raisedWell: {
    light: ['#F9F6F3', '#F9F6F3', '#F9F6F3', '#F9F6F3', '#F9F6F3'],
    dark: ['#2C2A28', '#2C2A28', '#2C2A28', '#2C2A28', '#2C2A28'],
  },
  rampStep: {
    light: ['#D4D1CE', '#F9F6F3', '#EDEAE7', '#D4D1CE', '#F9F6F3'],
    dark: ['#100D0A', '#1C1916', '#252321', '#2C2A28', '#31302F'],
  },
}

describe('inset well options', () => {
  it.each(WELL_OPTIONS.flatMap((option) => MODES.map((mode) => [option, mode] as const)))(
    'paints the pinned well on each plane (%#)',
    (option, mode) => {
      const wells = PLANES.map((plane) => measureWell(option, plane, mode).well)

      expect(wells).toEqual(PINNED[option.key][mode])
    }
  )

  it('ships option 1: the components paint the planeColour wells', () => {
    const planeColour = WELL_OPTIONS.find((o) => o.key === 'planeColour')!

    for (const mode of MODES) {
      expect(PLANES.map((p) => insetFieldFill(p, mode))).toEqual(
        PLANES.map((p) => planeColour.well(p, mode))
      )
    }
  })

  it('gives planes of one colour one well in every option but as built', () => {
    const sameColour = [
      ['background', 'raised'],
      ['base', 'overlay'],
    ] as const

    for (const option of WELL_OPTIONS.filter((o) => o.key !== 'asBuilt')) {
      for (const [a, b] of sameColour) {
        expect(option.well(a, 'light')).toBe(option.well(b, 'light'))
      }
    }
  })

  it('keeps every well legible: text-primary clears 4.5:1 on all of them', () => {
    for (const option of WELL_OPTIONS) {
      for (const mode of MODES) {
        for (const plane of PLANES) {
          expect(measureWell(option, plane, mode).text).toBeGreaterThan(4.5)
        }
      }
    }
  })
})
