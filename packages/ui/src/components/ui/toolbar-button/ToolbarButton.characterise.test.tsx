import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react-vite'
import { View } from 'react-native'
import * as stories from './ToolbarButton.stories'
import { ToolbarButton, type ToolbarButtonVariant } from './ToolbarButton'
import { Surface } from '../surface'

const composed = Object.entries(composeStories(stories))

const matrix = (['raised', 'default'] as ToolbarButtonVariant[]).flatMap((variant) =>
  [true, undefined, false].flatMap((isActive) =>
    [false, true].map((isDisabled) => ({ variant, isActive, isDisabled }))
  )
)

function hoverFill(theme: 'dark' | 'light', isActive: boolean, hovered: boolean): string {
  const { getByRole, unmount } = render(
    <Surface theme={theme}>
      <ToolbarButton label="Hover" icon={<View testID="i" />} isActive={isActive} />
    </Surface>
  )
  const trigger = getByRole('button', { name: 'Hover' })
  if (hovered) fireEvent.mouseEnter(trigger)
  const fill = getComputedStyle(trigger).backgroundColor
  unmount()
  return fill
}

describe('ToolbarButton characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe.each(['dark', 'light'] as const)('on a %s surface', (theme) => {
    it.each(composed)('renders the %s story unchanged', (_name, Story) => {
      const { container } = render(
        <Surface theme={theme}>
          <Story />
        </Surface>
      )
      expect(container).toMatchSnapshot()
    })

    it.each(matrix)(
      'renders variant=$variant isActive=$isActive isDisabled=$isDisabled unchanged',
      (props) => {
        const { container } = render(
          <Surface theme={theme}>
            <ToolbarButton label="Matrix" icon={<View testID="i" />} {...props} />
          </Surface>
        )
        expect(container).toMatchSnapshot()
      }
    )

    it('renders the open menu unchanged', () => {
      const { WithMenu } = composeStories(stories)
      const { container } = render(
        <Surface theme={theme}>
          <WithMenu />
        </Surface>
      )
      fireEvent.click(screen.getByRole('button', { name: 'View Options' }))
      expect(container).toMatchSnapshot()
    })

    it.each([false, true])('paints the hover fill when isActive=%s', (isActive) => {
      const rest = hoverFill(theme, isActive, false)
      const hovered = hoverFill(theme, isActive, true)
      expect(hovered).not.toBe(rest)
      expect({ rest, hovered }).toMatchSnapshot()
    })
  })
})
