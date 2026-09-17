import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import {
  GoalMilestoneTile,
  milestoneTone,
  type GoalMilestoneTileProps,
  type GoalMilestoneTileVariant,
} from './GoalMilestoneTile'
import { weekStripLabels } from './GoalMilestoneWeekStrip'

const base: GoalMilestoneTileProps = {
  milestone: { reps: 8, load: 105, unit: 'lb', goalWeek: 8 },
  current: { reps: 8, load: 100 },
  start: { reps: 8, load: 95 },
  currentWeek: 5,
  totalWeeks: 10,
}

const VARIANTS: GoalMilestoneTileVariant[] = ['numeric', 'progress', 'timeline', 'gap']

describe('GoalMilestoneTile', () => {
  it('leads with the target load, reps as the unit line', () => {
    render(<GoalMilestoneTile {...base} />)

    expect(screen.getByTestId('goal-milestone-load')).toHaveTextContent('105')
    expect(screen.getByText('lb')).toBeInTheDocument()
    expect(screen.getByTestId('goal-milestone-reps')).toHaveTextContent('x 8 reps')
  })

  it('says when the milestone is due relative to now', () => {
    render(<GoalMilestoneTile {...base} />)

    expect(screen.getByTestId('goal-milestone-when')).toHaveTextContent('Week 8 · in 3 weeks')
  })

  it('shows no state mark while the milestone is simply upcoming', () => {
    render(<GoalMilestoneTile {...base} />)

    expect(screen.queryByTestId('goal-milestone-state')).toBeNull()
  })

  it('marks a hit milestone', () => {
    render(<GoalMilestoneTile {...base} current={{ reps: 8, load: 105 }} />)

    expect(screen.getByTestId('goal-milestone-state')).toHaveTextContent('Hit')
  })

  it('stops counting down to a milestone already hit', () => {
    render(<GoalMilestoneTile {...base} current={{ reps: 8, load: 105 }} />)

    expect(screen.getByTestId('goal-milestone-when')).toHaveTextContent(/^Week 8$/)
  })

  it('marks a milestone missed once its week has passed', () => {
    render(<GoalMilestoneTile {...base} currentWeek={9} />)

    expect(screen.getByTestId('goal-milestone-state')).toHaveTextContent('Missed')
  })

  it('does not treat a missed milestone as hit because the read model said so', () => {
    render(<GoalMilestoneTile {...base} current={{ reps: 8, load: 105 }} state="missed" />)

    expect(screen.getByTestId('goal-milestone-state')).toHaveTextContent('Missed')
  })

  it('summarises target, timing, state and distance for assistive tech', () => {
    render(<GoalMilestoneTile {...base} currentWeek={8} />)

    expect(screen.getByRole('article')).toHaveAttribute(
      'aria-label',
      'Next milestone 8 reps at 105 lb, Week 8 · this week, Due this week, 5 lb to go'
    )
  })

  describe('the progress variant', () => {
    it('fills the share of the climb already made', () => {
      render(<GoalMilestoneTile {...base} variant="progress" />)

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
    })

    it('states the distance left', () => {
      render(<GoalMilestoneTile {...base} variant="progress" />)

      expect(screen.getByTestId('goal-milestone-gap')).toHaveTextContent('5 lb to go')
    })

    it('fills completely and drops the distance once hit', () => {
      render(<GoalMilestoneTile {...base} variant="progress" state="hit" />)

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
      expect(screen.queryByTestId('goal-milestone-gap')).toBeNull()
    })

    it('draws no bar without a starting set', () => {
      render(<GoalMilestoneTile {...base} variant="progress" start={undefined} />)

      expect(screen.queryByRole('progressbar')).toBeNull()
    })
  })

  describe('the gap variant', () => {
    it('makes the distance the hero and keeps the target beside it', () => {
      render(<GoalMilestoneTile {...base} variant="gap" current={{ reps: 6, load: 105 }} />)

      expect(screen.getByTestId('goal-milestone-gap')).toHaveTextContent('2 reps')
      expect(screen.getByText('to 8 x 105 lb')).toBeInTheDocument()
    })

    it('falls back to the target once nothing is left to close', () => {
      render(<GoalMilestoneTile {...base} variant="gap" current={{ reps: 8, load: 105 }} />)

      expect(screen.queryByTestId('goal-milestone-gap')).toBeNull()
      expect(screen.getByTestId('goal-milestone-load')).toHaveTextContent('105')
    })
  })

  describe('the timeline variant', () => {
    it('draws one cell per week on the axis', () => {
      render(<GoalMilestoneTile {...base} variant="timeline" />)

      expect(screen.getByTestId('goal-milestone-week-goal')).toBeInTheDocument()
      expect(screen.getAllByTestId(/^goal-milestone-week-\d+$/)).toHaveLength(9)
    })

    it('runs the axis to the current week when that is past the goal', () => {
      render(
        <GoalMilestoneTile {...base} variant="timeline" totalWeeks={undefined} currentWeek={11} />
      )

      expect(screen.getAllByTestId(/^goal-milestone-week-\d+$/)).toHaveLength(10)
    })
  })

  it('renders the lowered plane alone, with its header, when unframed', () => {
    render(<GoalMilestoneTile {...base} framed={false} current={{ reps: 8, load: 105 }} />)

    expect(screen.getByTestId('goal-milestone-plane')).toContainElement(
      screen.getByTestId('goal-milestone-state')
    )
  })

  it.each(VARIANTS)('has no accessibility violations as the %s variant', async (variant) => {
    const { container } = render(<GoalMilestoneTile {...base} variant={variant} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('milestone tone', () => {
  it('is success for a hit milestone whatever the pace', () => {
    expect(milestoneTone('hit', 'behind')).toBe('success')
  })

  it('is warning for a missed milestone', () => {
    expect(milestoneTone('missed', 'on_track')).toBe('warning')
  })

  it('follows the goal pace while open', () => {
    expect(milestoneTone('upcoming', 'behind')).toBe('warning')
    expect(milestoneTone('due_this_week', 'on_track')).toBe('success')
  })

  it('is info while open with no pace', () => {
    expect(milestoneTone('upcoming')).toBe('info')
  })
})

describe('week strip labels', () => {
  it('names the axis ends and the goal', () => {
    expect(weekStripLabels(10, 5)).toEqual([1, 5, 10])
  })

  it('drops an axis end that would crowd the goal label', () => {
    expect(weekStripLabels(10, 9)).toEqual([1, 9])
  })

  it('names a goal on the last week once', () => {
    expect(weekStripLabels(10, 10)).toEqual([1, 10])
  })
})
