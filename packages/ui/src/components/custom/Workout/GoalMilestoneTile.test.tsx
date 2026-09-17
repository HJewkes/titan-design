import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import {
  GoalMilestoneTile,
  milestoneToneToken,
  type GoalMilestoneTileProps,
} from './GoalMilestoneTile'

const base: GoalMilestoneTileProps = {
  target: { metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' },
  goalWeek: 6,
  weekCount: 6,
  currentWeek: 4,
  latest: { reps: 8, load: 100 },
  start: { reps: 8, load: 95 },
  status: 'on_track',
  weekOutcomes: ['on_track', 'ahead', 'missed'],
  scale: 'wall',
}

const hero = () => screen.getByTestId('goal-milestone-hero')
const line = () => screen.getByTestId('goal-milestone-line')

describe('GoalMilestoneTile', () => {
  it('leads with the shortfall and names the target and its week', () => {
    render(<GoalMilestoneTile {...base} />)

    expect(hero()).toHaveTextContent('5 lb')
    expect(line()).toHaveTextContent('to 8 x 105 lb by week 6')
  })

  it('leads with reps for a reps-at-load goal', () => {
    render(
      <GoalMilestoneTile
        {...base}
        target={{ metric: 'reps_at_load', reps: 12, load: 185, unit: 'lb' }}
        latest={{ reps: 10, load: 180 }}
      />
    )

    expect(hero()).toHaveTextContent('2 reps')
  })

  it('shows the best set and where the lifter is in the block', () => {
    render(<GoalMilestoneTile {...base} />)

    expect(screen.getByTestId('goal-milestone-best')).toHaveTextContent(
      'Best 8 x 100 lb · week 4 of 6'
    )
  })

  it('shows the target itself before any set has matched', () => {
    render(<GoalMilestoneTile {...base} latest={undefined} />)

    expect(hero()).toHaveTextContent('8 x 105 lb')
    expect(screen.getByTestId('goal-milestone-best')).toHaveTextContent('No matched set yet')
  })

  it('fills the bar to the share of the climb already made', () => {
    render(<GoalMilestoneTile {...base} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('draws no bar without a starting reading', () => {
    render(<GoalMilestoneTile {...base} start={undefined} />)

    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  describe('once hit', () => {
    it('makes the target the hero, marks it, and fills the bar', () => {
      render(<GoalMilestoneTile {...base} latest={{ reps: 8, load: 107.5 }} />)

      expect(hero()).toHaveTextContent('8 x 105 lb')
      expect(line()).toHaveTextContent('Reached · best 8 x 107.5 lb')
      expect(screen.getByTestId('goal-milestone-state')).toHaveTextContent('Hit')
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    })

    it('does not repeat the best set in the caption', () => {
      render(<GoalMilestoneTile {...base} latest={{ reps: 8, load: 107.5 }} />)

      expect(screen.getByTestId('goal-milestone-best')).toHaveTextContent(/^Week 4 of 6$/)
    })
  })

  describe('once missed', () => {
    it('keeps the shortfall and says what it fell short of', () => {
      render(<GoalMilestoneTile {...base} currentWeek={7} latest={{ reps: 8, load: 102.5 }} />)

      expect(hero()).toHaveTextContent('2.5 lb')
      expect(line()).toHaveTextContent('short of 8 x 105 lb at week 6')
      expect(screen.getByTestId('goal-milestone-state')).toHaveTextContent('Missed')
    })

    it('drops the week-of count once the block is over', () => {
      render(<GoalMilestoneTile {...base} currentWeek={7} />)

      expect(screen.getByTestId('goal-milestone-best')).toHaveTextContent(/^Best 8 x 100 lb$/)
    })
  })

  it('reads a loss goal in its own words', () => {
    render(
      <GoalMilestoneTile
        {...base}
        target={{ metric: 'bodyweight', value: 189, unit: 'lb' }}
        latest={{ value: 192.4 }}
        start={{ value: 195 }}
        direction="down"
        goalWeek={12}
        weekCount={12}
      />
    )

    expect(hero()).toHaveTextContent('3.4 lb')
    expect(line()).toHaveTextContent('to 189 lb bodyweight by week 12')
  })

  describe('the week strip', () => {
    it('draws one cell per week of the block', () => {
      render(<GoalMilestoneTile {...base} />)

      expect(screen.getAllByTestId(/^goal-milestone-week-\d+$/)).toHaveLength(6)
    })

    it('summarises now and each past week for assistive tech', () => {
      render(<GoalMilestoneTile {...base} />)

      expect(screen.getByTestId('goal-milestone-week-strip')).toHaveAttribute(
        'aria-label',
        'Week 4 of 6, week 1 on track, week 2 ahead, week 3 missed'
      )
    })

    it('puts a dot under each past week with a verdict in the dots treatment', () => {
      render(
        <GoalMilestoneTile
          {...base}
          currentWeek={5}
          weekOutcomes={['on_track', 'ahead', 'missed', 'none']}
          outcomeStyle="dots"
        />
      )

      expect(screen.getByTestId('goal-milestone-dot-on_track')).toBeInTheDocument()
      expect(screen.getByTestId('goal-milestone-dot-ahead')).toBeInTheDocument()
      expect(screen.getByTestId('goal-milestone-dot-missed')).toBeInTheDocument()
      expect(screen.queryByTestId('goal-milestone-dot-none')).toBeNull()
    })

    it('draws no dots in the cells treatment', () => {
      render(<GoalMilestoneTile {...base} />)

      expect(screen.queryByTestId(/^goal-milestone-dot-/)).toBeNull()
    })
  })

  describe('the compact layout', () => {
    it('keeps the hero, the line and the bar, and drops the rest', () => {
      render(<GoalMilestoneTile {...base} layout="compact" />)

      expect(hero()).toHaveTextContent('5 lb')
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.queryByTestId('goal-milestone-week-strip')).toBeNull()
      expect(screen.queryByTestId('goal-milestone-best')).toBeNull()
      expect(screen.queryByText('Meso target')).toBeNull()
    })
  })

  it('summarises target, state and distance for assistive tech', () => {
    render(<GoalMilestoneTile {...base} />)

    expect(screen.getByRole('article')).toHaveAttribute(
      'aria-label',
      'Meso target 8 x 105 lb by week 6, 5 lb to go'
    )
  })

  it.each([
    ['full, cells', {}],
    ['full, dots', { outcomeStyle: 'dots' as const }],
    ['compact', { layout: 'compact' as const }],
    ['missed', { currentWeek: 7 }],
  ])('has no accessibility violations (%s)', async (_name, extra) => {
    const { container } = render(<GoalMilestoneTile {...base} {...extra} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('meso target tone', () => {
  it('takes the pace colour while open, as the chart line does', () => {
    expect(milestoneToneToken('upcoming', 'ahead')).toBe('brand-primary')
    expect(milestoneToneToken('upcoming', 'behind')).toBe('status-warning')
  })

  it('is success once hit, whatever the pace', () => {
    expect(milestoneToneToken('hit', 'stalled')).toBe('status-success')
  })

  it('is muted, never an error colour, once missed', () => {
    expect(milestoneToneToken('missed', 'stalled')).toBe('text-tertiary')
  })
})
