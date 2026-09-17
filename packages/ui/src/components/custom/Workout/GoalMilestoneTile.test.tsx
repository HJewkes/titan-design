import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'

import {
  GoalMilestoneTile,
  milestoneToneToken,
  type GoalMilestoneTileProps,
} from './GoalMilestoneTile'

const base: GoalMilestoneTileProps = {
  target: { metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' },
  weekCount: 6,
  currentWeek: 4,
  latest: { reps: 8, load: 100 },
  status: 'on_track',
  weeks: [
    { outcome: 'on_track', reading: { reps: 8, load: 95 } },
    { outcome: 'ahead', reading: { reps: 8, load: 100 } },
    { outcome: 'missed', reading: { reps: 6, load: 97.5 } },
  ],
  scale: 'wall',
}

const hero = () => screen.getByTestId('goal-milestone-hero')
const summary = () => screen.getByTestId('goal-milestone-summary')

describe('GoalMilestoneTile', () => {
  it('leads with the shortfall', () => {
    render(<GoalMilestoneTile {...base} />)

    expect(hero()).toHaveTextContent('5 lb')
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

  it('shows the target itself before any set has matched', () => {
    render(<GoalMilestoneTile {...base} latest={undefined} />)

    expect(hero()).toHaveTextContent('8 x 105 lb')
  })

  it('names the week count once, on the summary line', () => {
    render(<GoalMilestoneTile {...base} />)

    expect(summary()).toHaveTextContent('week 4 of 6')
    expect(screen.queryByText(/by week/)).toBeNull()
  })

  describe('the consolidated line', () => {
    it('carries best, goal and the week count as one sentence', () => {
      render(<GoalMilestoneTile {...base} summaryStyle="sentence" />)

      expect(summary()).toHaveTextContent('Best 8 x 100 lb · goal 8 x 105 lb · week 4 of 6')
    })

    it('carries the same three facts as metric cells', () => {
      render(<GoalMilestoneTile {...base} summaryStyle="metrics" />)

      expect(summary()).toHaveTextContent('BEST')
      expect(summary()).toHaveTextContent('8 x 100 lb')
      expect(summary()).toHaveTextContent('GOAL')
      expect(summary()).toHaveTextContent('week 4 of 6')
    })

    it('carries the same three facts stacked', () => {
      render(<GoalMilestoneTile {...base} summaryStyle="stacked" />)

      expect(summary()).toHaveTextContent('Best 8 x 100 lb')
      expect(summary()).toHaveTextContent('Goal 8 x 105 lb · week 4 of 6')
    })

    it('says so when nothing has matched yet', () => {
      render(<GoalMilestoneTile {...base} latest={undefined} />)

      expect(summary()).toHaveTextContent('No matched set')
    })
  })

  describe('once hit', () => {
    it('makes the target the hero and marks it', () => {
      render(<GoalMilestoneTile {...base} latest={{ reps: 8, load: 107.5 }} />)

      expect(hero()).toHaveTextContent('8 x 105 lb')
      expect(screen.getByTestId('goal-milestone-state')).toHaveTextContent('Hit')
    })
  })

  describe('once missed', () => {
    it('keeps the shortfall and marks it', () => {
      render(<GoalMilestoneTile {...base} currentWeek={7} latest={{ reps: 8, load: 102.5 }} />)

      expect(hero()).toHaveTextContent('2.5 lb')
      expect(screen.getByTestId('goal-milestone-state')).toHaveTextContent('Missed')
    })

    it('counts the block weeks rather than a week within it', () => {
      render(<GoalMilestoneTile {...base} currentWeek={7} />)

      expect(summary()).toHaveTextContent('6 weeks')
    })
  })

  it('reads a loss goal in its own words', () => {
    render(
      <GoalMilestoneTile
        {...base}
        target={{ metric: 'bodyweight', value: 189, unit: 'lb' }}
        latest={{ value: 192.4 }}
        direction="down"
        weekCount={12}
        currentWeek={7}
      />
    )

    expect(hero()).toHaveTextContent('3.4 lb')
    expect(summary()).toHaveTextContent('goal 189 lb bodyweight')
  })

  describe('the week cells', () => {
    it('draws one cell per week of the block', () => {
      render(<GoalMilestoneTile {...base} />)

      expect(screen.getAllByTestId(/^goal-milestone-week-\d+$/)).toHaveLength(6)
    })

    it('carries no week labels', () => {
      render(<GoalMilestoneTile {...base} />)

      expect(screen.queryByText('w1')).toBeNull()
      expect(screen.queryByText('w6')).toBeNull()
    })

    it('names each week and its verdict for assistive tech', () => {
      render(<GoalMilestoneTile {...base} />)

      expect(screen.getByTestId('goal-milestone-week-2')).toHaveAttribute(
        'aria-label',
        'Week 2, Ahead'
      )
      expect(screen.getByTestId('goal-milestone-week-5')).toHaveAttribute(
        'aria-label',
        'Week 5, No data'
      )
    })

    it('opens a tip card on hover, with that week reading and verdict', () => {
      render(<GoalMilestoneTile {...base} />)

      fireEvent.mouseEnter(screen.getByTestId('goal-milestone-week-2'))

      expect(screen.getByText('8 x 100 lb')).toBeInTheDocument()
      expect(screen.getByText('Ahead')).toBeInTheDocument()
    })

    it('opens the tip card on keyboard focus too', () => {
      render(<GoalMilestoneTile {...base} />)

      fireEvent.focus(screen.getByTestId('goal-milestone-week-1'))

      expect(screen.getByText('On track')).toBeInTheDocument()
    })

    it('closes the tip card when the pointer leaves', () => {
      render(<GoalMilestoneTile {...base} />)
      const cell = screen.getByTestId('goal-milestone-week-1')

      fireEvent.mouseEnter(cell)
      fireEvent.mouseLeave(cell)

      expect(screen.queryByText('On track')).toBeNull()
    })

    it('stacks the tip card when asked', () => {
      render(<GoalMilestoneTile {...base} tipStyle="stacked" />)

      fireEvent.mouseEnter(screen.getByTestId('goal-milestone-week-3'))

      expect(screen.getByText('Week 3')).toBeInTheDocument()
      expect(screen.getByText('Missed')).toBeInTheDocument()
    })

    it('says a week has no matched set when the read model sent none', () => {
      render(<GoalMilestoneTile {...base} weeks={[{ outcome: 'none' }]} />)

      fireEvent.mouseEnter(screen.getByTestId('goal-milestone-week-1'))

      expect(screen.getByText('No matched set')).toBeInTheDocument()
    })

    it('can be left out of a compact tile', () => {
      render(<GoalMilestoneTile {...base} layout="compact" showWeeks={false} />)

      expect(screen.queryByTestId('goal-milestone-week-strip')).toBeNull()
    })
  })

  describe('the compact layout', () => {
    it('keeps the hero, the line and the cells, and drops the header', () => {
      render(<GoalMilestoneTile {...base} layout="compact" />)

      expect(hero()).toHaveTextContent('5 lb')
      expect(summary()).toBeInTheDocument()
      expect(screen.getByTestId('goal-milestone-week-strip')).toBeInTheDocument()
      expect(screen.queryByText('Meso target')).toBeNull()
    })
  })

  it('takes a candidate tone when the decision story overrides it', () => {
    render(<GoalMilestoneTile {...base} toneColor="rgb(1, 2, 3)" />)

    expect(hero()).toHaveStyle({ color: 'rgb(1, 2, 3)' })
  })

  it('summarises target, week and distance for assistive tech', () => {
    render(<GoalMilestoneTile {...base} />)

    expect(screen.getByRole('article')).toHaveAttribute(
      'aria-label',
      'Meso target 8 x 105 lb, week 4 of 6, 5 lb to go'
    )
  })

  it.each([
    ['sentence', {}],
    ['metrics', { summaryStyle: 'metrics' as const }],
    ['stacked', { summaryStyle: 'stacked' as const }],
    ['compact', { layout: 'compact' as const }],
  ])('has no accessibility violations (%s)', async (_name, extra) => {
    const { container } = render(<GoalMilestoneTile {...base} {...extra} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('meso target tone', () => {
  it('takes the pace colour while open, as the chart line does', () => {
    expect(milestoneToneToken('upcoming', 'ahead')).toBe('status-info')
    expect(milestoneToneToken('upcoming', 'behind')).toBe('status-warning')
  })

  it('never paints an open target in the brand orange the chart dropped', () => {
    expect(milestoneToneToken('upcoming', 'ahead')).not.toBe('brand-primary')
  })

  it('is success once hit, whatever the pace', () => {
    expect(milestoneToneToken('hit', 'stalled')).toBe('status-success')
  })

  it('is muted, never an error colour, once missed', () => {
    expect(milestoneToneToken('missed', 'stalled')).toBe('text-tertiary')
  })
})
