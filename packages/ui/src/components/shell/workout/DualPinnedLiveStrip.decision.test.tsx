import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react-vite'
import preview from '../../../../.storybook/preview'
import * as stories from './DualPinnedLiveStrip.decision.stories'

const composed = composeStories(stories, { decorators: preview.decorators })

describe('DualPinnedLiveStrip chosen record', () => {
  it.each(Object.entries(composed))('%s renders every strip it stacks', (_name, Story) => {
    render(<Story />)
    expect(screen.getAllByTestId('dual-pinned-live-strip').length).toBeGreaterThanOrEqual(3)
  })
})
