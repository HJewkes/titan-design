import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  it('leads with the milestone as reps x load', () => {
    render(<GoalLiftCard {...baseProps} />)
    expect(screen.getByTestId('goal-lift-card-hero')).toHaveTextContent('8 x 105')
  })

  it('renders the unit and the due week', () => {
    render(<GoalLiftCard {...baseProps} />)
    expect(screen.getByText('lb')).toBeInTheDocument()
    expect(screen.getByTestId('goal-lift-card-due')).toHaveTextContent('in week 8')
  })

  it('renders the exercise name', () => {
    render(<GoalLiftCard {...baseProps} />)
    expect(screen.getByTestId('goal-lift-card-name')).toHaveTextContent('BENCH PRESS')
  })

  describe('the PR mark', () => {
    it('renders when the target holds a record', () => {
      render(<GoalLiftCard {...baseProps} isPR />)
      expect(screen.getByTestId('goal-lift-card-pr')).toBeInTheDocument()
    })

    it('is absent by default', () => {
      render(<GoalLiftCard {...baseProps} />)
      expect(screen.queryByTestId('goal-lift-card-pr')).toBeNull()
    })

    /**
     * NOT a layout assertion. jsdom has no layout engine, so this compares the
     * unit Text's OWN style and nothing about where it lands on screen. It
     * catches a regression that restyles the unit; it would NOT catch the star
     * being put back into normal flow, which is what actually pushed the unit
     * down. That invariant is pinned by the `Widths` story in the browser.
     */
    it('leaves the unit element unstyled by the presence of a PR', () => {
      const { rerender } = render(<GoalLiftCard {...baseProps} />)
      const withoutPR = screen.getByText('lb').getAttribute('style')
      rerender(<GoalLiftCard {...baseProps} isPR />)
      expect(screen.getByText('lb').getAttribute('style')).toBe(withoutPR)
    })

    it('takes the star out of flow, so it cannot displace the unit', () => {
      // The mechanism behind the alignment invariant above, which IS assertable:
      // absolute positioning is why a PR card and a non-PR card stay level.
      render(<GoalLiftCard {...baseProps} isPR />)
      expect(screen.getByTestId('goal-lift-card-pr')).toHaveStyle({ position: 'absolute' })
    })
  })

  describe('the status affordance', () => {
    it('is a pill at a comfortable width', () => {
      render(<GoalLiftCard {...baseProps} statusForm="pill" />)
      expect(screen.getByTestId('goal-lift-card-status-pill')).toHaveTextContent('On track')
      expect(screen.queryByTestId('goal-lift-card-status-dot')).toBeNull()
    })

    it('collapses to its light below the collapse width', () => {
      render(<GoalLiftCard {...baseProps} statusForm="dot" />)
      expect(screen.getByTestId('goal-lift-card-status-dot')).toBeInTheDocument()
      expect(screen.queryByTestId('goal-lift-card-status-pill')).toBeNull()
    })

    it('collapses at the compact density without being asked', () => {
      render(<GoalLiftCard {...baseProps} density="compact" />)
      expect(screen.getByTestId('goal-lift-card-status-dot')).toBeInTheDocument()
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
        expect(screen.getByTestId('goal-lift-card-status-pill')).toHaveTextContent(label)
        expect(goalLiftStatusLabel(status)).toBe(label)
      })
    }
  })

  describe('the trend', () => {
    it('renders a chart box', () => {
      render(<GoalLiftCard {...baseProps} />)
      expect(screen.getByTestId('goal-lift-card-trend')).toBeInTheDocument()
    })

    it('renders nothing inside it with no readings', () => {
      // `onLayout` never fires under jsdom (gotcha #6), so the Sparkline is
      // absent here regardless; this pins the empty-actuals path explicitly.
      render(<GoalLiftCard {...baseProps} actuals={[]} />)
      expect(screen.queryByTestId('sparkline')).toBeNull()
    })
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
    const name = screen.getByTestId('goal-lift-card-name')
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
