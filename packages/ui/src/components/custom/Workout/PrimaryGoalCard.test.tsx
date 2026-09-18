import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { axe } from 'jest-axe'

import { PrimaryGoalCard, goalStatusBadge, markSizeFor } from './PrimaryGoalCard'
import { trajectoryWeekScale } from './GoalTrajectoryChartGeometry'
import { CELL_GAP } from './GoalMilestoneWeekStrip'

/** The chart's own week scale for a scenario, at the width the card is given. */
function weekScaleOf(scenario: (typeof S)[keyof typeof S], width: number) {
  return trajectoryWeekScale({
    expected: scenario.goal.expected,
    weeks: scenario.goal.weeks,
    actuals: scenario.goal.actuals,
    ...(scenario.goal.nextTarget ? { nextTarget: scenario.goal.nextTarget } : {}),
    width,
  })
}
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const dark = getSemanticColors('dark')
/** `onLayout` never fires under jsdom, so the fill layout's width is pinned. */
const WALL = 1200

describe('PrimaryGoalCard', () => {
  describe('the captured wall payload', () => {
    it('renders the lift, its priority mark and its status', () => {
      render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
      expect(screen.getByTestId('goal-card-title')).toHaveTextContent('Cable chest press')
      expect(screen.getByRole('button', { name: 'Priority: Specialize' })).toBeInTheDocument()
      expect(screen.getByTestId('goal-card-status')).toHaveTextContent('Calibrating')
    })

    it('draws the chart and the meso target summary', () => {
      render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
      expect(screen.getByTestId('goal-trajectory-chart-canvas')).toBeInTheDocument()
      expect(screen.getByTestId('goal-milestone-summary')).toBeInTheDocument()
    })

    it('drops the old header block: no subtitle line, no metric cells', () => {
      render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
      expect(screen.queryByText(/Week 2 of 12 . specialize/)).toBeNull()
      expect(screen.queryByText('COMMITTED')).toBeNull()
      expect(screen.queryByText('STRETCH')).toBeNull()
    })

    it('leaves the week count to the folded summary, where it already lived', () => {
      render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
      const summary = screen.getByTestId('goal-milestone-summary')
      expect(within(summary).getAllByText('Week 2 of 12').length).toBeGreaterThan(0)
      expect(within(screen.getByTestId('goal-card-title')).queryByText(/Week/)).toBeNull()
    })

    it('moves the basis and its citation into the status tip', () => {
      render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
      expect(screen.queryByText(S.calibrating.basis)).toBeNull()

      fireEvent.mouseEnter(screen.getByTestId('goal-card-status-tip'))

      expect(screen.getByText(S.calibrating.basis)).toBeInTheDocument()
      expect(screen.getByText('rp:rp-s5-load-increment-by-exercise-type')).toBeInTheDocument()
    })

    it('replaces the next-target line with the marker on the chart', () => {
      render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
      expect(screen.queryByText(/105 x 8 in week 3/)).toBeNull()
      expect(screen.getByTestId('goal-trajectory-chart-next-target-dot')).toBeInTheDocument()
    })
  })

  describe('the goal verdict', () => {
    it('reads pace while every reading is short of the target', () => {
      expect(goalStatusBadge('behind', 'short')).toEqual({ label: 'Behind', tone: 'warning' })
    })

    it('is success green exactly at the goal and blue past it', () => {
      expect(goalStatusBadge('on_track', 'met')).toEqual({ label: 'Hit', tone: 'success' })
      expect(goalStatusBadge('behind', 'beyond')).toEqual({ label: 'Beyond goal', tone: 'info' })
    })

    it('paints the chart line blue for a card that beat its goal', () => {
      render(<PrimaryGoalCard {...S.beyondGoal} chartWidth={WALL} />)
      expect(screen.getByTestId('goal-card-status')).toHaveTextContent('Beyond goal')
      expect(screen.getByTestId('goal-trajectory-chart-actual-line')).toHaveAttribute(
        'stroke',
        dark['status-info']
      )
    })

    it('keeps success green for a card exactly on its goal', () => {
      render(<PrimaryGoalCard {...S.hitExact} chartWidth={WALL} />)
      expect(screen.getByTestId('goal-card-status')).toHaveTextContent('Hit')
      expect(screen.getByTestId('goal-trajectory-chart-actual-line')).toHaveAttribute(
        'stroke',
        dark['status-success']
      )
    })

    it('shows the PR badge only when a reading earned one', () => {
      const { unmount } = render(<PrimaryGoalCard {...S.onTrack} chartWidth={WALL} />)
      expect(screen.getByTestId('pr-badge-star')).toBeInTheDocument()
      unmount()

      render(<PrimaryGoalCard {...S.behind} chartWidth={WALL} />)
      expect(screen.queryByTestId('pr-badge-star')).toBeNull()
    })
  })

  describe('the fold', () => {
    it('is one card: the milestone content has no plane or frame of its own', () => {
      render(<PrimaryGoalCard {...S.onTrack} chartWidth={WALL} />)
      expect(screen.getByTestId('goal-milestone-summary')).toBeInTheDocument()
      expect(screen.queryByTestId('goal-milestone-tile')).toBeNull()
      expect(screen.queryByTestId('goal-milestone-plane')).toBeNull()
    })

    it('puts the summary above the chart', () => {
      render(<PrimaryGoalCard {...S.onTrack} chartWidth={WALL} />)
      const fold = screen.getByTestId('goal-card-fold')
      const summary = screen.getByTestId('goal-milestone-summary')
      const chart = screen.getByTestId('goal-trajectory-chart-canvas')
      expect(fold).toContainElement(summary)
      expect(fold).toContainElement(chart)
      expect(summary.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('leaves the week numbers to the cells: the axis does not repeat them', () => {
      render(<PrimaryGoalCard {...S.onTrack} chartWidth={WALL} />)
      expect(screen.queryAllByTestId('goal-trajectory-chart-week-label')).toHaveLength(0)
      expect(screen.getByTestId('goal-milestone-week-cell-1')).toBeInTheDocument()
    })

    it('fills the width it is given', () => {
      render(<PrimaryGoalCard {...S.onTrack} chartWidth={900} />)
      expect(screen.getByTestId('goal-trajectory-chart-canvas')).toHaveStyle({ width: '900px' })
    })

    it('draws nothing below the header until the card has been measured', () => {
      render(<PrimaryGoalCard {...S.onTrack} />)
      expect(screen.queryByTestId('goal-card-fold')).toBeNull()
      expect(screen.getByTestId('goal-card-title')).toBeInTheDocument()
    })

    it('sizes the header marks off the same density flag the chart uses', () => {
      expect(markSizeFor(1888)).toBe(20)
      expect(markSizeFor(360)).toBe(14)
      expect(markSizeFor(null)).toBe(14)
    })

    it('gives the wall a larger PR star than the phone', () => {
      const starSize = (width: number): string | null => {
        const { unmount } = render(<PrimaryGoalCard {...S.onTrack} chartWidth={width} />)
        const size = screen.getByTestId('pr-badge-star').querySelector('svg')?.getAttribute('width')
        unmount()
        return size ?? null
      }
      expect(starSize(1888)).toBe('20')
      expect(starSize(360)).toBe('14')
    })

    it('takes the phone chart height under the wall breakpoint', () => {
      render(<PrimaryGoalCard {...S.onTrack} chartWidth={360} />)
      expect(screen.getByTestId('goal-trajectory-chart-canvas')).toHaveStyle({ height: '220px' })
    })
  })

  describe('week cells stand on the chart columns', () => {
    /**
     * A cell's centre in the CHART's coordinates: the strip is inset to the plot,
     * so its own left edge is the plot's, and the cell's x adds back from there.
     */
    function cellCentre(week: number, plotLeft: number): number {
      const style = screen.getByTestId(`goal-milestone-week-cell-${week}`).style
      return plotLeft + parseFloat(style.left) + parseFloat(style.width) / 2
    }

    function expectAligned(width: number, scenario: typeof S.onTrack) {
      const { unmount } = render(<PrimaryGoalCard {...scenario} chartWidth={width} />)
      const scale = weekScaleOf(scenario, width)
      for (const week of scale.weeks) {
        expect(cellCentre(week, scale.plot.left)).toBeCloseTo(scale.toX(week), 3)
      }
      unmount()
    }

    it('lines every cell up with its week at 1920', () => {
      expectAligned(1888, S.onTrack)
    })

    it('lines every cell up with its week at 360', () => {
      expectAligned(328, S.onTrack)
    })

    it('holds for a twelve-week block whose marker runs past the readings', () => {
      expectAligned(1888, S.calibrating)
    })

    it('gives a cell its whole column, less the strip gap', () => {
      render(<PrimaryGoalCard {...S.onTrack} chartWidth={1888} />)
      const scale = weekScaleOf(S.onTrack, 1888)
      const width = parseFloat(screen.getByTestId('goal-milestone-week-cell-3').style.width)
      expect(width).toBeCloseTo(scale.span - CELL_GAP, 6)
    })

    it('leaves the first and last cells whole inside the plot', () => {
      render(<PrimaryGoalCard {...S.onTrack} chartWidth={1888} />)
      const scale = weekScaleOf(S.onTrack, 1888)
      const box = (week: number) => {
        const style = screen.getByTestId(`goal-milestone-week-cell-${week}`).style
        const left = parseFloat(style.left)
        return { left, right: left + parseFloat(style.width) }
      }
      expect(box(1).left).toBeGreaterThanOrEqual(0)
      expect(box(scale.weeks[scale.weeks.length - 1]).right).toBeLessThanOrEqual(
        scale.plot.right - scale.plot.left + 0.001
      )
    })

    it('keeps the current week taller than the weeks behind it', () => {
      render(<PrimaryGoalCard {...S.onTrack} chartWidth={WALL} />)
      const height = (week: number) =>
        parseFloat(screen.getByTestId(`goal-milestone-week-cell-${week}`).style.height)
      expect(height(4)).toBeGreaterThan(height(1))
    })

    it('still opens a week tip card', () => {
      render(<PrimaryGoalCard {...S.onTrack} chartWidth={WALL} />)

      fireEvent.mouseEnter(screen.getByTestId('goal-milestone-week-1'))

      expect(screen.getByText('Week 1')).toBeInTheDocument()
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
