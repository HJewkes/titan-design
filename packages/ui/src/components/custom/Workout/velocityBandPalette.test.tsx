import { describe, expect, it } from 'vitest'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { primitiveRamps as ramp } from '../../../theme/tokens/primitives'
import { EFFORT_BAND_PALETTE, paletteFor, slowingBandPalette } from './velocityBandPalette'

describe('effort band palettes (VW-448 round 1)', () => {
  it('pins tier a to blue 200, 400, 600 and 800, light to dark', () => {
    expect(slowingBandPalette()).toEqual([
      ramp.blue[200],
      ramp.blue[400],
      ramp.blue[600],
      ramp.blue[800],
    ])
  })

  it('reads tier a from the dataviz-slowing tokens of the theme it is given', () => {
    const light = getSemanticColors('light')
    expect(slowingBandPalette('light')).toEqual([
      light['dataviz-slowing-0'],
      light['dataviz-slowing-1'],
      light['dataviz-slowing-2'],
      light['dataviz-slowing-3'],
    ])
  })

  it('never colours tier a with the effort scale', () => {
    for (const colour of paletteFor('velocity_loss')) {
      expect(EFFORT_BAND_PALETTE).not.toContain(colour)
    }
  })

  it('colours tier b with the effort scale', () => {
    expect(paletteFor('effort')).toBe(EFFORT_BAND_PALETTE)
  })
})
