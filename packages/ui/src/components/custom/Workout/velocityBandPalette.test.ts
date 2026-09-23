import { describe, expect, it } from 'vitest'
import { primitiveRamps as ramp } from '../../../theme/tokens/primitives'
import { EFFORT_BAND_PALETTE, SLOWING_BAND_PALETTE, paletteFor } from './velocityBandPalette'

describe('effort band palettes (VW-448 round 1)', () => {
  it('pins tier a to blue 200, 400, 600 and 800, light to dark', () => {
    expect(SLOWING_BAND_PALETTE).toEqual([
      ramp.blue[200],
      ramp.blue[400],
      ramp.blue[600],
      ramp.blue[800],
    ])
  })

  it('never colours tier a with the effort scale', () => {
    expect(paletteFor('velocity_loss')).toBe(SLOWING_BAND_PALETTE)
    for (const colour of paletteFor('velocity_loss')) {
      expect(EFFORT_BAND_PALETTE).not.toContain(colour)
    }
  })

  it('colours tier b with the effort scale', () => {
    expect(paletteFor('effort')).toBe(EFFORT_BAND_PALETTE)
  })
})
