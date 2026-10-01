import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { composeStories } from '@storybook/react-vite'
import preview from '../../../../.storybook/preview'
import { DualPinnedLiveStrip } from './DualPinnedLiveStrip'
import { DUAL_STRIP_SCENARIOS as S } from './dualPinnedLiveStrip-fixture'
import * as stories from './DualPinnedLiveStrip.decision.stories'

const composed = composeStories(stories, { decorators: preview.decorators })

const strips = () => screen.queryAllByTestId(/^(dual-)?pinned-live-strip$/)

describe('DualPinnedLiveStrip round 1 stories', () => {
  it.each(Object.entries(composed))('%s renders its strips', (_name, Story) => {
    render(<Story />)
    expect(strips().length).toBeGreaterThanOrEqual(2)
  })

  it('falls back to the single strip of the side left when D1 drops the right Voltra', () => {
    const { DropFallsBackToSingle } = composed
    render(<DropFallsBackToSingle />)
    expect(screen.getAllByTestId('dual-pinned-live-strip')).toHaveLength(1)
    expect(screen.getAllByTestId('pinned-live-strip')).toHaveLength(1)
  })
})

describe('DualPinnedLiveStrip round 1 specimen', () => {
  it('draws each side under the name the lifter gave it, with its own load', () => {
    render(<DualPinnedLiveStrip {...S.set} layout="wall" />)
    expect(screen.getByTestId('dual-strip-name-left')).toHaveTextContent('Left arm')
    expect(screen.getByTestId('dual-strip-name-left')).toHaveTextContent('145 lb')
    expect(screen.getByTestId('dual-strip-name-right')).toHaveTextContent('140 lb')
  })

  it('falls back to the side when no name was set', () => {
    render(<DualPinnedLiveStrip {...S.noNames} layout="wall" />)
    expect(screen.getByTestId('dual-strip-name-left')).toHaveTextContent('Left')
    expect(screen.getByTestId('dual-strip-name-right')).toHaveTextContent('Right')
  })

  it('says which side fatigued in its accessible name', () => {
    render(<DualPinnedLiveStrip {...S.fatigueRight} layout="wall" />)
    const name = screen.getByTestId('dual-pinned-live-strip').getAttribute('aria-label')
    expect(name).toMatch(/Henry R 140 lb 5 of 8 reps last rep 0\.55 m\/s fatigued/)
    expect(name).not.toMatch(/Henry L[^,]*fatigued/)
  })

  it('keeps a dropped side in D2 and names it disconnected', () => {
    render(<DualPinnedLiveStrip {...S.rightDropped} dropMode="dimmed" layout="wall" />)
    expect(screen.getByTestId('dual-strip-dimmed-wing')).toBeInTheDocument()
    expect(screen.getByTestId('dual-pinned-live-strip').getAttribute('aria-label')).toMatch(
      /Henry R .*disconnected/
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<DualPinnedLiveStrip {...S.rest} layout="phone" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
