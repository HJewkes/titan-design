import { describe, expect, it } from 'vitest'
import { getSemanticColors } from '../../theme/tokens/semantic'
import { primitiveRamps } from '../../theme/tokens/primitives'
import { BAND_OPTIONS, readBand } from './bodyweight-band'

const [today, oneStep, twoSteps] = BAND_OPTIONS

describe('bodyweight band options', () => {
  it('takes today from the cyan step brand-secondary resolves to in each mode', () => {
    for (const mode of ['dark', 'light'] as const) {
      expect(primitiveRamps.cyan[today.steps[mode]]).toBe(
        getSemanticColors(mode)['brand-secondary']
      )
    }
  })

  it('raises the band against the track with each step, in both modes', () => {
    for (const mode of ['dark', 'light'] as const) {
      const ratios = [today, oneStep, twoSteps].map((o) => readBand(o, mode).barVsTrack)
      expect(ratios[1]).toBeGreaterThan(ratios[0])
      expect(ratios[2]).toBeGreaterThan(ratios[1])
    }
  })

  it('names the ramp step it paints', () => {
    expect(readBand(oneStep, 'dark').stepLabel).toBe('cyan[400] at 28%')
    expect(readBand(oneStep, 'light').stepLabel).toBe('cyan[700] at 28%')
  })
})
