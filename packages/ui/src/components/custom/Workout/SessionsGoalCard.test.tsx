import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { capturedClassNames } from '../../../test/classname-capture'
import { SessionsGoalCard } from './SessionsGoalCard'
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
      expect(screen.getByTestId('sessions-goal-value-caption')).toHaveTextContent('Due by now 10')
    })

    it('prints the whole sentence in the plain treatment', () => {
      render(<SessionsGoalCard goal={S.underPace} leadStyle="plain" />)
      expect(screen.getByTestId('sessions-goal-value-caption')).toHaveTextContent('10 due by now')
    })

    it('leads with what leaves the window when asked', () => {
      render(<SessionsGoalCard goal={S.underPace} lead="leaving" leadStyle="plain" />)
      expect(screen.getByTestId('sessions-goal-value-caption')).toHaveTextContent(
        '3 leave this week'
      )
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

    it('stops at the commitment when capped', () => {
      render(<SessionsGoalCard goal={S.overCommitment} pastCommitment="cap" />)
      expect(screen.getAllByTestId('segmented-bar-segment')).toHaveLength(12)
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

  it('has no accessibility violations', async () => {
    const { container } = render(<SessionsGoalCard goal={S.underPace} scale="wall" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no accessibility violations with the tip open', async () => {
    const { container } = render(<SessionsGoalCard goal={S.underPace} isTipOpen />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
