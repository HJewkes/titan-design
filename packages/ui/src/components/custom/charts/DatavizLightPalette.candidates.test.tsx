import { describe, it, expect } from 'vitest'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import {
  LIGHT_CANDIDATE_SETS,
  chosenSet,
  type DatavizPalette,
} from './DatavizLightPalette.candidates'

const PALETTES: DatavizPalette[] = ['diverging', 'sequential', 'categorical']

/** The decision record is about the light column only. */
const MODE: ThemeMode = 'light'

describe('VW-371 light dataviz decision record', () => {
  it.each(PALETTES)('%s: the light tokens are exactly the chosen set', (palette) => {
    const light = getSemanticColors(MODE) as Record<string, string>
    const chosen = chosenSet(palette)

    expect(chosen.steps.map((step) => light[step.key])).toEqual(
      chosen.steps.map((step) => step.value)
    )
  })

  it.each(PALETTES)('%s: exactly one candidate set is chosen', (palette) => {
    expect(LIGHT_CANDIDATE_SETS[palette].filter((set) => set.chosen)).toHaveLength(1)
  })

  it.each(PALETTES)('%s: the chosen set covers every role in the palette', (palette) => {
    const roles = Object.keys(getSemanticColors(MODE)).filter((k) =>
      k.startsWith(`dataviz-${palette}-`)
    )

    expect(chosenSet(palette).steps.map((step) => step.key)).toEqual(roles)
  })
})
