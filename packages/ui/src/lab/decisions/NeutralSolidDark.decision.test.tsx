import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { composeStories } from '@storybook/react-vite'
import preview from '../../../.storybook/preview'
import * as stories from './NeutralSolidDark.decision.stories'
import {
  NEUTRAL_DARK_OPTIONS,
  NEUTRAL_DARK_PLANES,
  type NeutralDarkKey,
} from './neutral-solid-dark'

const composed = composeStories(stories, { decorators: preview.decorators })

/** TD-772 plan section 4: label ratio, fill-on-surface-base ratio. */
const PLAN: Record<NeutralDarkKey, { label: number; fill: number }> = {
  'nd-grey50-d': { label: 16.25, fill: 14.54 },
  'nd-grey100-d': { label: 14.6, fill: 13.07 },
  'nd-grey200-d': { label: 11.51, fill: 10.3 },
  'nd-grey300-d': { label: 9.06, fill: 8.11 },
  'nd-grey700-d': { label: 6.99, fill: 2.24 },
}

const printed = (text: string, name: 'label' | 'fill') =>
  Number(new RegExp(`${name} (\\d+\\.\\d+)`).exec(text)?.[1])

describe('Neutral Solid Dark decision', () => {
  it('prints every option on both planes with the plan ratios', () => {
    render(<composed.Default />)
    for (const option of NEUTRAL_DARK_OPTIONS) {
      expect(screen.getByTestId(`frame-${option.key}`)).toBeTruthy()
      const base = within(screen.getByTestId(`frame-${option.key}`)).getAllByTestId(
        `cell-${option.key}-surface-base`
      )
      expect(base).toHaveLength(5)
      for (const cell of base) {
        const text = cell.textContent ?? ''
        expect(Math.abs(printed(text, 'label') - PLAN[option.key].label)).toBeLessThanOrEqual(0.01)
        expect(Math.abs(printed(text, 'fill') - PLAN[option.key].fill)).toBeLessThanOrEqual(0.01)
      }
      for (const plane of NEUTRAL_DARK_PLANES) {
        expect(screen.getAllByTestId(`cell-${option.key}-${plane.token}`)).toHaveLength(5)
      }
    }
  })

  it('flags only the grey[700] fill as under 3:1', () => {
    render(<composed.Default />)
    const flagged = NEUTRAL_DARK_OPTIONS.filter(
      (o) => within(screen.getByTestId(`frame-${o.key}`)).queryAllByText(/under 3:1/).length > 0
    )
    expect(flagged.map((o) => o.key)).toEqual(['nd-grey700-d'])
  })
})
