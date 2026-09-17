import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { axe } from 'jest-axe'

import {
  PrimaryGoalCard,
  FIXED_CHART_WIDTH,
  chartWidthFor,
  goalStatusBadge,
  markSizeFor,
} from './PrimaryGoalCard'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const dark = getSemanticColors('dark')
/** `onLayout` never fires under jsdom, so the fill layout's width is pinned. */
const WALL = 1200

describe('PrimaryGoalCard', () => {
  describe('the captured wall payload', () => {
    it('renders the lift, its priority mark and its status', () => {
      render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
      expect(screen.getByTestId('primary-goal-card-title')).toHaveTextContent('Cable chest press')
      expect(screen.getByRole('button', { name: 'Priority: Specialize' })).toBeInTheDocument()
      expect(screen.getByTestId('primary-goal-card-status')).toHaveTextContent('Calibrating')
    })

    it('draws the chart and the meso target tile', () => {
      render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
      expect(screen.getByTestId('goal-trajectory-chart-canvas')).toBeInTheDocument()
      expect(screen.getByTestId('goal-milestone-tile')).toBeInTheDocument()
    })

    it('drops the old header block: no subtitle line, no metric cells', () => {
      render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
      expect(screen.queryByText(/Week 2 of 12 . specialize/)).toBeNull()
      expect(screen.queryByText('COMMITTED')).toBeNull()
      expect(screen.queryByText('STRETCH')).toBeNull()
    })

    it('leaves the week count to the milestone tile, where it already lived', () => {
      render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
      const tile = screen.getByTestId('goal-milestone-tile')
      expect(within(tile).getAllByText('Week 2 of 12').length).toBeGreaterThan(0)
      expect(within(screen.getByTestId('primary-goal-card-title')).queryByText(/Week/)).toBeNull()
    })

    it('moves the basis and its citation into the status tip', () => {
      render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
      expect(screen.queryByText(S.calibrating.basis)).toBeNull()

      fireEvent.mouseEnter(screen.getByTestId('primary-goal-card-status-tip'))

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
      expect(screen.getByTestId('primary-goal-card-status')).toHaveTextContent('Beyond goal')
      expect(screen.getByTestId('goal-trajectory-chart-actual-line')).toHaveAttribute(
        'stroke',
        dark['status-info']
      )
    })

    it('keeps success green for a card exactly on its goal', () => {
      render(<PrimaryGoalCard {...S.hitExact} chartWidth={WALL} />)
      expect(screen.getByTestId('primary-goal-card-status')).toHaveTextContent('Hit')
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

  describe('layout', () => {
    it('A fills the width it is given', () => {
      render(<PrimaryGoalCard {...S.onTrack} layout="fill" chartWidth={900} />)
      expect(screen.getByTestId('goal-trajectory-chart-canvas')).toHaveStyle({ width: '900px' })
    })

    it('B caps the chart at 1200 when the card is wider', () => {
      render(<PrimaryGoalCard {...S.onTrack} layout="fixed" chartWidth={1888} />)
      expect(screen.getByTestId('goal-trajectory-chart-canvas')).toHaveStyle({
        width: `${FIXED_CHART_WIDTH}px`,
      })
    })

    it('B is a cap, not a pin: a narrower card gets a chart that fits it', () => {
      expect(chartWidthFor('fixed', 900)).toBe(900)
      expect(chartWidthFor('fixed', 1888)).toBe(FIXED_CHART_WIDTH)
      expect(chartWidthFor('fill', 1888)).toBe(1888)
    })

    it('B renders inside a 360 card rather than overflowing it', () => {
      render(<PrimaryGoalCard {...S.onTrack} layout="fixed" chartWidth={360} />)
      expect(screen.getByTestId('goal-trajectory-chart-canvas')).toHaveStyle({ width: '360px' })
    })

    it('draws no chart until the fill layout has been measured', () => {
      render(<PrimaryGoalCard {...S.onTrack} layout="fill" />)
      expect(screen.queryByTestId('goal-trajectory-chart-canvas')).toBeNull()
      expect(screen.getByTestId('goal-milestone-tile')).toBeInTheDocument()
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
      render(<PrimaryGoalCard {...S.onTrack} layout="fill" chartWidth={360} />)
      expect(screen.getByTestId('goal-trajectory-chart-canvas')).toHaveStyle({ height: '220px' })
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<PrimaryGoalCard {...S.calibrating} chartWidth={WALL} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
