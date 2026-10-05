import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react'

// jsdom never lays out, so the slide geometry needs a pinned width.
vi.mock('../../../hooks/useMeasuredWidth', () => ({
  useMeasuredWidth: () => ({ width: 360, onLayout: () => undefined }),
}))

import * as stories from './Carousel.stories'
import * as interactionStories from './Carousel.interaction.stories'

const composed = [
  ...Object.entries(composeStories(stories)),
  ...Object.entries(composeStories(interactionStories)),
]

const matrix = [0, 1, 2, 9].flatMap((count) => [true, false].map((loop) => ({ count, loop })))

describe('Carousel characterisation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it.each(composed)('renders the %s story unchanged', (_name, Story) => {
    const { container } = render(<Story />)
    expect(container).toMatchSnapshot()
  })

  it.each(matrix)('renders Default with count=$count loop=$loop unchanged', (args) => {
    const { Default } = composeStories(stories)
    const { container } = render(<Default {...args} />)
    expect(container).toMatchSnapshot()
  })
})
