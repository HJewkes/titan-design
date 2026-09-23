import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { capturedClassNames } from '../../../test/classname-capture'
import { SessionsGoalCard } from './SessionsGoalCard'
import { FIGURE_LINE_TEXT } from './wholeBodyCardParts'
import { WHOLE_BODY_SESSIONS as S } from './wholeBody-fixture'

describe('SessionsGoalCard', () => {
  it('shows the count against the commitment', () => {
    render(<SessionsGoalCard goal={S.underPace} />)
    expect(screen.getByTestId('sessions-goal-value')).toHaveTextContent('9of 12')
  })

  it('counts the owner’s real history as one training day (F2)', () => {
    render(<SessionsGoalCard goal={S.realHistory} />)
    expect(screen.getByTestId('sessions-goal-value')).toHaveTextContent('1of 1')
  })

  describe('the caption beside the count', () => {
    it('leads with what is due, as a muted word and a bold figure', () => {
      render(<SessionsGoalCard goal={S.underPace} />)
      expect(screen.getByTestId('sessions-goal-value-caption')).toHaveTextContent('Due by now: 10')
    })

    it('sets the label and the lead on one text size', () => {
      render(<SessionsGoalCard goal={S.underPace} scale="phone" />)
      expect(capturedClassNames.get('sessions-goal-value-label')).toContain(FIGURE_LINE_TEXT)
      expect(capturedClassNames.get('sessions-goal-value-caption')).toContain(FIGURE_LINE_TEXT)
    })

    it('sets the caption on normal leading, not the caption’s loose 24px', () => {
      render(<SessionsGoalCard goal={S.underPace} />)
      expect(capturedClassNames.get('sessions-goal-value-caption')).toContain('leading-normal')
    })

    it('holds the other lines in a pinned-open tip', () => {
      render(<SessionsGoalCard goal={S.underPace} isTipOpen />)
      expect(screen.getByText('3 leave this week')).toBeInTheDocument()
    })

    it('draws no tip when there is only one line', () => {
      render(<SessionsGoalCard goal={S.atCommitment} />)
      expect(screen.queryByTestId('sessions-goal-value-tip')).toBeNull()
    })
  })

  describe('the bar', () => {
    it('draws one cell per committed day', () => {
      render(<SessionsGoalCard goal={S.underPace} />)
      expect(screen.getAllByTestId('segmented-bar-segment')).toHaveLength(12)
    })

    it('appends a cell per day past the commitment', () => {
      render(<SessionsGoalCard goal={S.overCommitment} />)
      expect(screen.getAllByTestId('segmented-bar-segment')).toHaveLength(14)
    })

    it('marks where the count due by now falls', () => {
      render(<SessionsGoalCard goal={S.underPace} />)
      expect(screen.getByTestId('sessions-goal-track')).toHaveTextContent('due')
    })

    it('drops the due mark once the window is full', () => {
      render(<SessionsGoalCard goal={S.atCommitment} />)
      expect(screen.getByTestId('sessions-goal-track')).not.toHaveTextContent('due')
    })

    it('falls back to a plain bar past the segment limit (F5)', () => {
      render(<SessionsGoalCard goal={S.largeCommitment} />)
      expect(screen.queryByTestId('sessions-goal-segments')).toBeNull()
      expect(screen.getByTestId('sessions-goal-progress')).toBeInTheDocument()
    })
  })

  // Gate S6: the segmented bar had no name or role, and its "due" label read as stray text.
  it('names the segmented bar as a progressbar with its count and what is due', () => {
    render(<SessionsGoalCard goal={S.underPace} />)
    const bar = screen.getByRole('progressbar', {
      name: '9 of 12 training days, 10 due by now',
    })
    expect(bar).toHaveAttribute('aria-valuenow', '9')
    expect(bar).toHaveAttribute('aria-valuemax', '12')
    expect(screen.getByText('due').closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('names the fallback bar the same way', () => {
    render(<SessionsGoalCard goal={S.largeCommitment} />)
    expect(
      screen.getByRole('progressbar', { name: '25 of 28 training days, 24 due by now' })
    ).toBeInTheDocument()
  })

  it('tips the status pill with the basis', () => {
    const goal = { ...S.underPace, basis: 'Behind: 9 of the 10 due by now.' }
    render(<SessionsGoalCard goal={goal} />)
    fireEvent.focus(screen.getByRole('button', { name: 'Goal status: Behind' }))
    expect(screen.getByText('Behind: 9 of the 10 due by now.')).toBeInTheDocument()
  })

  it('keeps a plain status pill when there is no basis', () => {
    render(<SessionsGoalCard goal={S.underPace} />)
    expect(screen.queryByRole('button', { name: /^Goal status/ })).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<SessionsGoalCard goal={S.underPace} scale="wall" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no accessibility violations with the tip open', async () => {
    const { container } = render(<SessionsGoalCard goal={S.underPace} isTipOpen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
