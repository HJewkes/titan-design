import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'
import type {
  GoalActualPoint,
  GoalExpectedPoint,
  GoalTrajectoryStatus,
  GoalTrajectoryWeek,
} from './GoalTrajectoryChart'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const dark = getSemanticColors('dark')

const expected: GoalExpectedPoint[] = [
  { weekIndex: 1, low: 175, high: 175 },
  { weekIndex: 2, low: 177, high: 179 },
  { weekIndex: 3, low: 179, high: 183 },
  { weekIndex: 4, low: 181, high: 187 },
  { weekIndex: 5, low: 183, high: 191 },
  { weekIndex: 6, low: 185, high: 195 },
]

const weeks: GoalTrajectoryWeek[] = [
  { index: 1 },
  { index: 2 },
  { index: 3 },
  { index: 4 },
  { index: 5, isDeload: true },
  { index: 6 },
]

const actuals: GoalActualPoint[] = [
  { weekIndex: 1, value: 175 },
  { weekIndex: 2, value: 178 },
  { weekIndex: 3, value: 183, isPR: true },
  { weekIndex: 4, value: 185 },
]

const baseProps = {
  expected,
  committed: 185,
  stretch: 195,
  actuals,
  weeks,
  mesoBoundaries: [6],
  width: 600,
  height: 300,
  metricLabel: 'Bench top load',
}

/** The inline `style` prop, flattened to the DOM string react-native-web emits. */
function styleOf(element: HTMLElement): CSSStyleDeclaration {
  return element.style
}

/** jsdom normalises an inline hex to `rgb(r, g, b)`; compare tokens in that form. */
function rgbOf(hex: string): string {
  const h = hex.replace('#', '')
  const part = (i: number): number => parseInt(h.slice(i * 2, i * 2 + 2), 16)
  return `rgb(${String(part(0))}, ${String(part(1))}, ${String(part(2))})`
}

describe('GoalTrajectoryChart', () => {
  describe('rendering', () => {
    it('renders the chart canvas', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(screen.getByTestId('goal-trajectory-chart-canvas')).toBeInTheDocument()
    })

    it('renders the expected band as fill columns with both edges', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(screen.getAllByTestId('goal-trajectory-chart-band-cell').length).toBeGreaterThan(0)
      expect(screen.getAllByTestId('goal-trajectory-chart-band-edge-top')).toHaveLength(
        expected.length - 1
      )
      expect(screen.getAllByTestId('goal-trajectory-chart-band-edge-bottom')).toHaveLength(
        expected.length - 1
      )
    })

    it('renders the committed and stretch rules with their values', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(screen.getByTestId('goal-trajectory-chart-committed-line')).toBeInTheDocument()
      expect(screen.getByTestId('goal-trajectory-chart-stretch-line')).toBeInTheDocument()
      expect(screen.getByText('Committed 185')).toBeInTheDocument()
      expect(screen.getByText('Stretch 195')).toBeInTheDocument()
    })

    it('renders the actual line, one dot per actual and a star per PR', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(screen.getAllByTestId('goal-trajectory-chart-actual-segment')).toHaveLength(
        actuals.length - 1
      )
      expect(screen.getAllByTestId('goal-trajectory-chart-actual-dot')).toHaveLength(actuals.length)
      expect(screen.getAllByTestId('goal-trajectory-chart-pr-star')).toHaveLength(1)
    })

    it('shades each deload week and rules each meso boundary', () => {
      render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(screen.getAllByTestId('goal-trajectory-chart-deload')).toHaveLength(1)
      expect(screen.getAllByTestId('goal-trajectory-chart-meso-boundary')).toHaveLength(1)
    })

    it('renders the calibrating placeholder when there is no band and no actuals', () => {
      render(
        <GoalTrajectoryChart
          {...baseProps}
          expected={[]}
          actuals={[]}
          weeks={[]}
          status="calibrating"
        />
      )
      expect(screen.getByTestId('goal-trajectory-chart-empty')).toBeInTheDocument()
      expect(screen.queryByTestId('goal-trajectory-chart-canvas')).not.toBeInTheDocument()
    })
  })

  describe('loss goals', () => {
    const lossExpected: GoalExpectedPoint[] = [
      { weekIndex: 1, low: 196, high: 196 },
      { weekIndex: 2, low: 195, high: 194 },
      { weekIndex: 3, low: 194, high: 192 },
      { weekIndex: 4, low: 193, high: 190 },
    ]

    it('draws a band when low is numerically greater than high', () => {
      render(
        <GoalTrajectoryChart
          {...baseProps}
          expected={lossExpected}
          weeks={[{ index: 1 }, { index: 2 }, { index: 3 }, { index: 4 }]}
          actuals={[
            { weekIndex: 1, value: 196 },
            { weekIndex: 3, value: 193 },
          ]}
          committed={193}
          stretch={190}
          direction="down"
          status="on_track"
          unit="lbs"
        />
      )
      expect(screen.getAllByTestId('goal-trajectory-chart-band-cell').length).toBeGreaterThan(0)
      expect(screen.getAllByTestId('goal-trajectory-chart-band-edge-top')).toHaveLength(
        lossExpected.length - 1
      )
    })

    it('labels the legend as a loss band', () => {
      render(<GoalTrajectoryChart {...baseProps} direction="down" status="on_track" />)
      expect(screen.getByText('Expected (loss)')).toBeInTheDocument()
    })
  })

  describe('status tone', () => {
    const toneOf = (status: GoalTrajectoryStatus): string => {
      const { unmount } = render(<GoalTrajectoryChart {...baseProps} status={status} />)
      const segment = screen.getAllByTestId('goal-trajectory-chart-actual-segment')[0]
      const tone = styleOf(segment).backgroundColor
      unmount()
      return tone
    }

    it('never paints "ahead" in warning-amber', () => {
      const ahead = toneOf('ahead')
      expect(ahead).not.toBe(toneOf('behind'))
      expect(ahead).not.toBe(rgbOf(dark['status-warning']))
    })

    it('paints "ahead" in the brand tone', () => {
      expect(toneOf('ahead')).toBe(rgbOf(dark['brand-primary']))
    })

    it('gives each status its own pill label', () => {
      const labels: Array<[GoalTrajectoryStatus, string]> = [
        ['on_track', 'On track'],
        ['ahead', 'Ahead'],
        ['behind', 'Behind'],
        ['tolerated', 'Tolerated'],
        ['deload_week', 'Deload week'],
        ['calibrating', 'Calibrating'],
        ['stalled', 'Stalled'],
      ]
      labels.forEach(([status, label]) => {
        const { unmount } = render(<GoalTrajectoryChart {...baseProps} status={status} />)
        expect(screen.getByText(label)).toBeInTheDocument()
        unmount()
      })
    })

    it('paints on_track, behind and stalled in three different tones', () => {
      const tones = new Set([toneOf('on_track'), toneOf('behind'), toneOf('stalled')])
      expect(tones.size).toBe(3)
    })
  })

  describe('density', () => {
    it('scales the stroke up at wall width', () => {
      const { unmount } = render(
        <GoalTrajectoryChart {...baseProps} width={360} status="on_track" />
      )
      const phone = styleOf(screen.getAllByTestId('goal-trajectory-chart-actual-segment')[0]).height
      unmount()
      render(<GoalTrajectoryChart {...baseProps} width={1200} status="on_track" />)
      const wall = styleOf(screen.getAllByTestId('goal-trajectory-chart-actual-segment')[0]).height
      expect(parseFloat(wall)).toBeGreaterThan(parseFloat(phone))
    })
  })

  describe('accessibility', () => {
    it('summarizes the status, targets and PR count in the image label', () => {
      render(<GoalTrajectoryChart {...baseProps} status="behind" unit="lbs" />)
      const canvas = screen.getByTestId('goal-trajectory-chart-canvas')
      const label = canvas.getAttribute('aria-label') ?? ''
      expect(label).toContain('Bench top load')
      expect(label).toContain('Status: Behind')
      expect(label).toContain('Committed 185 lbs')
      expect(label).toContain('1 personal record')
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<GoalTrajectoryChart {...baseProps} status="on_track" />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations in the calibrating empty state', async () => {
      const { container } = render(
        <GoalTrajectoryChart
          {...baseProps}
          expected={[]}
          actuals={[]}
          weeks={[]}
          status="calibrating"
        />
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
