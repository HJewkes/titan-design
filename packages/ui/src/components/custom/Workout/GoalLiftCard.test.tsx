import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'

import { GoalLiftCard, goalLiftStatusLabel, type GoalLiftCardProps } from './GoalLiftCard'

const baseProps: GoalLiftCardProps = {
  name: 'BENCH PRESS',
  status: 'on_track',
  milestone: { reps: 8, load: 105, unit: 'lb', goalWeek: 8 },
  committed: 102.5,
  stretch: 110,
  actuals: [
    { weekIndex: 1, value: 92.5 },
    { weekIndex: 3, value: 95 },
    { weekIndex: 5, value: 100 },
  ],
}

describe('GoalLiftCard', () => {
  it('leads with the meso target block, not a hand-rolled hero', () => {
    render(<GoalLiftCard {...baseProps} />)
    const summary = screen.getByTestId('goal-milestone-summary')
    expect(within(summary).getByTestId('goal-milestone-hero')).toHaveTextContent('5 lb')
    expect(screen.queryByTestId('goal-lift-card-hero')).toBeNull()
    expect(screen.queryByTestId('goal-lift-card-due')).toBeNull()
  })

  it('reads the block off the props the card already had', () => {
    render(<GoalLiftCard {...baseProps} />)
    const summary = screen.getByTestId('goal-milestone-summary')
    // Week 5 is the last reading's week, 8 the milestone's due week.
    expect(within(summary).getByTestId('goal-milestone-week-count')).toHaveTextContent(
      'Week 5 of 8'
    )
    // The facts row lays out a hidden measuring copy beside the visible one.
    expect(within(summary).getAllByText('8 x 100 lb').length).toBeGreaterThan(0)
    expect(within(summary).getAllByText('8 x 105 lb').length).toBeGreaterThan(0)
  })

  it('carries a week cell per week of the block, on the chart it sits over', () => {
    // The cells belong to the compact chart now, which needs a measured width.
    render(<GoalLiftCard {...baseProps} chartWidth={408} />)
    expect(screen.getAllByTestId(/goal-milestone-week-fill-/)).toHaveLength(8)
    expect(screen.getByTestId('goal-week-columns-chart')).toBeInTheDocument()
    // One row of cells, not two: the summary above hands them to the chart.
    expect(screen.getAllByTestId('goal-milestone-week-strip')).toHaveLength(1)
  })

  it('takes an explicit best set over the one derived from the readings', () => {
    render(<GoalLiftCard {...baseProps} latest={{ reps: 6, load: 102.5 }} />)
    expect(screen.getAllByText('6 x 102.5 lb').length).toBeGreaterThan(0)
  })

  it('renders the exercise name', () => {
    render(<GoalLiftCard {...baseProps} />)
    expect(screen.getByTestId('goal-card-title')).toHaveTextContent('BENCH PRESS')
  })

  describe('the PR mark', () => {
    it('renders when the target holds a record', () => {
      render(<GoalLiftCard {...baseProps} isPR />)
      expect(screen.getByTestId('pr-badge-star')).toBeInTheDocument()
    })

    it('is absent by default', () => {
      render(<GoalLiftCard {...baseProps} />)
      expect(screen.queryByTestId('pr-badge-star')).toBeNull()
    })

    /**
     * The star sits in the title row beside the status affordance now that the
     * hero it used to hang over is gone, so it no longer needs to be taken out
     * of flow: nothing below it can be displaced by it.
     */
    it('sits in the title row, beside the status affordance', () => {
      render(<GoalLiftCard {...baseProps} isPR statusForm="pill" />)
      const row = screen.getByTestId('pr-badge-star').parentElement
      expect(row).toContainElement(screen.getByTestId('goal-card-status'))
    })
  })

  describe('the status affordance', () => {
    it('is a pill at a comfortable width', () => {
      render(<GoalLiftCard {...baseProps} statusForm="pill" />)
      expect(screen.getByTestId('goal-card-status')).toHaveTextContent('On track')
      expect(screen.queryByTestId('goal-card-status-light')).toBeNull()
    })

    it('collapses to its light below the collapse width', () => {
      render(<GoalLiftCard {...baseProps} statusForm="dot" />)
      expect(screen.getByTestId('goal-card-status-light')).toBeInTheDocument()
      expect(screen.queryByTestId('goal-card-status')).toBeNull()
    })

    it('collapses at the compact density without being asked', () => {
      render(<GoalLiftCard {...baseProps} density="compact" />)
      expect(screen.getByTestId('goal-card-status-light')).toBeInTheDocument()
    })

    it('never disappears — the collapsed form keeps an accessible name', () => {
      render(<GoalLiftCard {...baseProps} statusForm="dot" />)
      expect(screen.getByLabelText('On track')).toBeInTheDocument()
    })
  })

  describe('status vocabulary', () => {
    // `ahead` is info, never warning-amber (REJECTED.md, "Amber holds").
    const cases: [GoalLiftCardProps['status'], string][] = [
      ['on_track', 'On track'],
      ['ahead', 'Ahead'],
      ['behind', 'Behind'],
      ['tolerated', 'Tolerated'],
      ['deload_week', 'Deload week'],
      ['calibrating', 'Calibrating'],
      ['stalled', 'Stalled'],
    ]

    for (const [status, label] of cases) {
      it(`labels ${status} as "${label}"`, () => {
        render(<GoalLiftCard {...baseProps} status={status} statusForm="pill" />)
        expect(screen.getByTestId('goal-card-status')).toHaveTextContent(label)
        expect(goalLiftStatusLabel(status)).toBe(label)
      })
    }
  })

  describe('the trend', () => {
    it('renders a chart box', () => {
      render(<GoalLiftCard {...baseProps} />)
      expect(screen.getByTestId('goal-card-trend')).toBeInTheDocument()
    })

    it('renders nothing inside it with no readings', () => {
      // `onLayout` never fires under jsdom (gotcha #6), so the Sparkline is
      // absent here regardless; this pins the empty-actuals path explicitly.
      render(<GoalLiftCard {...baseProps} actuals={[]} />)
      expect(screen.queryByTestId('sparkline')).toBeNull()
    })
  })

  it('says the same thing in the badge as in the hero', () => {
    // The band's committed edge (102.5) is not the block's target (105): the
    // badge follows the target, so it cannot read "Hit" over "5 lb to goal".
    render(<GoalLiftCard {...baseProps} />)
    expect(screen.getByTestId('goal-card-status')).toHaveTextContent('On track')

    render(<GoalLiftCard {...baseProps} latest={{ reps: 8, load: 110 }} />)
    expect(screen.getAllByTestId('goal-card-status')[1]).toHaveTextContent('Beyond goal')
  })

  it('names itself for assistive tech', () => {
    render(<GoalLiftCard {...baseProps} />)
    expect(screen.getByLabelText('BENCH PRESS goal, On track')).toBeInTheDocument()
  })

  /**
   * The wrap itself is NOT assertable here — jsdom has no layout engine, so
   * every rect is zero and a rendered line count cannot be read. This pins the
   * mechanism that permits the wrap; the `Widths` story at 200px is where the
   * result is verified.
   */
  it('leaves a long name unclamped, so it can wrap rather than truncate', () => {
    render(<GoalLiftCard {...baseProps} name="SINGLE-ARM DUMBBELL ROW" />)
    const name = screen.getByTestId('goal-card-title')
    expect(name).toHaveTextContent('SINGLE-ARM DUMBBELL ROW')
    expect(name.getAttribute('style') ?? '').not.toContain('line-clamp')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<GoalLiftCard {...baseProps} isPR statusForm="pill" />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations in the collapsed form', async () => {
      const { container } = render(<GoalLiftCard {...baseProps} statusForm="dot" />)
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
