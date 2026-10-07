import { describe, expect, it } from 'vitest'
import { numberPalette, tempoColors } from './tempoDisplayModel'
import { primitiveRamps } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'

describe('tempoDisplayModel', () => {
  it('pins the eccentric and concentric phases to the magenta and cyan ramps', () => {
    const { phase } = tempoColors('dark')

    expect(phase.eccentric).toBe(primitiveRamps.magenta[400])
    expect(phase.concentric).toBe(primitiveRamps.cyan[300])
  })

  it.each(['light', 'dark'] as const)('reads text-secondary for the label in %s mode', (mode) => {
    expect(tempoColors(mode).label).toBe(getSemanticColors(mode)['text-secondary'])
  })

  it('keeps the pause and dash marks on result-neutral', () => {
    const neutral = getSemanticColors('light')['result-neutral']
    const { label, phase } = tempoColors('light')

    expect([phase.pauseBottom, phase.pauseTop, phase.dash]).toEqual([neutral, neutral, neutral])
    expect(label).not.toBe(neutral)
  })

  it('follows the theme mode for the chip surface', () => {
    const dark = tempoColors('dark').surface
    const light = tempoColors('light').surface

    expect(dark).toBe(getSemanticColors('dark')['surface-raised'])
    expect(light).toBe(getSemanticColors('light')['surface-raised'])
    expect(dark).not.toBe(light)
  })

  it('maps pacing tones onto the status colours', () => {
    const t = getSemanticColors('dark')

    expect(numberPalette('dark')).toEqual({
      ahead: t['status-warning'],
      onPace: t['status-success'],
      over: t['status-error'],
      noTarget: t['text-primary'],
    })
  })
})
