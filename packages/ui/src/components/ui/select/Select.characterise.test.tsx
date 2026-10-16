import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react-vite'
import * as stories from './Select.stories'
import { Select } from './Select'
import { Surface } from '../surface'

const composed = Object.entries(composeStories(stories))
const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', isDisabled: true },
]

describe('Select characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe.each(['dark', 'light'] as const)('on a %s surface', (theme) => {
    it.each(composed)('renders the %s story closed', (_name, Story) => {
      const { container } = render(
        <Surface theme={theme}>
          <Story />
        </Surface>
      )
      expect(container).toMatchSnapshot()
    })

    it.each(composed)('renders the %s story open', (_name, Story) => {
      const { container } = render(
        <Surface theme={theme}>
          <Story />
        </Surface>
      )
      const trigger = screen.getAllByRole('combobox')[0]
      if (trigger.hasAttribute('disabled') || trigger.getAttribute('aria-disabled') === 'true') {
        return
      }
      fireEvent.click(trigger)
      expect(container).toMatchSnapshot()
    })

    it('renders the filled variant closed, open and invalid', () => {
      const { container, rerender } = render(
        <Surface theme={theme}>
          <Select variant="filled" options={options} value="b" />
        </Surface>
      )
      expect(container).toMatchSnapshot('closed')
      fireEvent.click(screen.getByRole('combobox'))
      expect(container).toMatchSnapshot('open')
      rerender(
        <Surface theme={theme}>
          <Select variant="filled" isInvalid options={options} />
        </Surface>
      )
      expect(container).toMatchSnapshot('invalid')
    })

    it('clears a preselected value', () => {
      const Story = composed.find(([name]) => name === 'WithPreselectedValue')![1]
      const { container } = render(
        <Surface theme={theme}>
          <Story />
        </Surface>
      )
      fireEvent.click(screen.getByLabelText('Clear selection'))
      expect(container).toMatchSnapshot()
    })
  })
})
