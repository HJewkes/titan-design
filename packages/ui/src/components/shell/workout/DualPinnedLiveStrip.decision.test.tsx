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

describe('DualPinnedLiveStrip round 2 stories', () => {
  it.each(Object.entries(composed))('%s renders its strips', (_name, Story) => {
    render(<Story />)
    expect(strips().length).toBeGreaterThanOrEqual(3)
  })
})

describe('DualPinnedLiveStrip round 2 specimen', () => {
  it('draws each side under the name the lifter gave it, with its own load, at the wall', () => {
    render(<DualPinnedLiveStrip {...S.set} layout="wall" />)
    expect(screen.getByTestId('dual-strip-name-left')).toHaveTextContent('Left arm · 145 lb')
    expect(screen.getByTestId('dual-strip-name-right')).toHaveTextContent('Right arm · 140 lb')
  })

  it('falls back to the side when no name was set', () => {
    render(<DualPinnedLiveStrip {...S.noNames} layout="wall" />)
    expect(screen.getByTestId('dual-strip-name-left')).toHaveTextContent('Left')
    expect(screen.getByTestId('dual-strip-name-right')).toHaveTextContent('Right')
  })

  it('drops the name and load on a phone, keeping them in the accessible name', () => {
    render(<DualPinnedLiveStrip {...S.set} layout="phone" />)
    expect(screen.queryByTestId('dual-strip-name-left')).not.toBeInTheDocument()
    expect(screen.queryByText(/145 lb/)).not.toBeInTheDocument()
    expect(screen.getByTestId('dual-pinned-live-strip').getAttribute('aria-label')).toMatch(
      /Left arm 145 lb 5 of 8 reps/
    )
  })

  it('marks each phone lane with its side letter when asked', () => {
    render(<DualPinnedLiveStrip {...S.set} layout="phone" phoneMarker="letter" />)
    expect(screen.getByTestId('dual-strip-name-left')).toHaveTextContent(/^L$/)
    expect(screen.getByTestId('dual-strip-name-right')).toHaveTextContent(/^R$/)
  })

  it('says which side fatigued in its accessible name and reddens the whole strip', () => {
    render(<DualPinnedLiveStrip {...S.fatigueRight} layout="wall" />)
    const name = screen.getByTestId('dual-pinned-live-strip').getAttribute('aria-label')
    expect(name).toMatch(/Henry R 140 lb 5 of 8 reps last rep 0\.55 m\/s fatigued/)
    expect(name).not.toMatch(/Henry L[^,]*fatigued/)
    expect(screen.getByTestId('live-strip-fatigue-wash')).toBeInTheDocument()
  })

  it('keeps a dropped side, fades only its wing and names it disconnected', () => {
    render(<DualPinnedLiveStrip {...S.rightDropped} layout="wall" />)
    expect(screen.getByTestId('dual-velocity-wing-down')).toHaveStyle({ opacity: '0.35' })
    expect(screen.getByTestId('dual-velocity-wing-up')).not.toHaveStyle({ opacity: '0.35' })
    expect(screen.getByTestId('dual-pinned-live-strip').getAttribute('aria-label')).toMatch(
      /Henry R .*disconnected/
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<DualPinnedLiveStrip {...S.rest} layout="phone" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
