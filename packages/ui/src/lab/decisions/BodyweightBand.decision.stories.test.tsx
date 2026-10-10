import { render, screen, within } from '@testing-library/react'
import { composeStories } from '@storybook/react-vite'
import { describe, expect, it } from 'vitest'
import * as stories from './BodyweightBand.decision.stories'
import { BAND_OPTIONS, readBand } from './bodyweight-band'

const { Default } = composeStories(stories)

describe('Bodyweight Band decision story', () => {
  it.each(BAND_OPTIONS.flatMap((o) => (['dark', 'light'] as const).map((m) => [o, m] as const)))(
    'paints a visible band in the %s option colour (%#)',
    (option, mode) => {
      render(<Default />)
      const unit = screen.getByTestId(`band-${option.key}-${mode}`)
      const band = within(unit).getByTestId('zone-track-band-highlight')
      const style = band.getAttribute('style') ?? ''
      const width = parseFloat(/(?:^|; )width: ([\d.]+)%/.exec(style)?.[1] ?? '0')
      expect(width).toBeGreaterThan(0)
      expect(style).toContain(readBand(option, mode).color.replace(/,\s*/g, ', '))
      const track = within(unit).getByTestId('zone-track-track')
      const layers = Array.from(track.children)
      const above = layers.slice(layers.indexOf(band) + 1)
      expect(above.map((el) => el.getAttribute('data-testid'))).not.toContain('zone-track-unfilled')
    }
  )
})
