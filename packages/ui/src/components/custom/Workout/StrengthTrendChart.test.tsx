import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { StrengthTrendChart } from './StrengthTrendChart'
import type { StrengthTrendDataPoint } from './StrengthTrendChart'

const data: StrengthTrendDataPoint[] = [
  { date: '2026-01-06', e1rm: 215, sessionLabel: 'Jan 6' },
  { date: '2026-02-03', e1rm: 228, isPR: true, sessionLabel: 'Feb 3' },
  { date: '2026-03-17', e1rm: 244, isPR: true, sessionLabel: 'Mar 17' },
]

const projection: StrengthTrendDataPoint[] = [
  { date: '2026-03-17', e1rm: 244 },
  { date: '2026-04-14', e1rm: 261 },
]

const mesoBoundaries = [
  { date: '2026-02-03', label: 'Intensify' },
  { date: '2026-03-17', label: 'Peak' },
]

const baseProps = {
  data,
  width: 340,
  height: 150,
  unit: 'lbs' as const,
  animateOnMount: false,
}

describe('StrengthTrendChart', () => {
  describe('rendering', () => {
    it('renders the chart container and labelled canvas', () => {
      render(<StrengthTrendChart {...baseProps} />)
      expect(screen.getByTestId('strength-trend-chart')).toBeInTheDocument()
      expect(screen.getByTestId('strength-trend-chart-canvas')).toBeInTheDocument()
    })

    it('renders a pressable point per actual data point', () => {
      render(<StrengthTrendChart {...baseProps} />)
      expect(screen.getAllByTestId('strength-trend-chart-point')).toHaveLength(3)
    })

    it('renders the actual line as connecting segments', () => {
      render(<StrengthTrendChart {...baseProps} />)
      // Two segments connect three points.
      expect(
        screen.getAllByTestId('strength-trend-chart-actual-segment'),
      ).toHaveLength(2)
    })

    it('renders subtle horizontal gridlines', () => {
      render(<StrengthTrendChart {...baseProps} />)
      const grid = screen.getAllByTestId('strength-trend-chart-gridline')
      expect(grid.length).toBeGreaterThanOrEqual(2)
      expect(grid.length).toBeLessThanOrEqual(3)
    })

    it('renders a star marker for each PR point', () => {
      render(<StrengthTrendChart {...baseProps} />)
      expect(screen.getAllByTestId('strength-trend-chart-pr-star')).toHaveLength(2)
    })

    it('renders an Actual / Projected / PR legend', () => {
      render(<StrengthTrendChart {...baseProps} />)
      const legend = screen.getByTestId('strength-trend-chart-legend')
      expect(legend).toHaveTextContent('Actual')
      expect(legend).toHaveTextContent('Projected')
      expect(legend).toHaveTextContent('PR')
    })
  })

  describe('projection and meso boundaries', () => {
    it('renders dashed projection segments when projection is provided', () => {
      render(<StrengthTrendChart {...baseProps} projection={projection} />)
      expect(
        screen.getAllByTestId('strength-trend-chart-projection-segment'),
      ).toHaveLength(1)
    })

    it('omits projection segments when none provided', () => {
      render(<StrengthTrendChart {...baseProps} />)
      expect(
        screen.queryByTestId('strength-trend-chart-projection-segment'),
      ).not.toBeInTheDocument()
    })

    it('renders a boundary marker and axis label per meso boundary', () => {
      render(<StrengthTrendChart {...baseProps} mesoBoundaries={mesoBoundaries} />)
      expect(
        screen.getAllByTestId('strength-trend-chart-meso-boundary'),
      ).toHaveLength(2)
      expect(
        screen.getAllByTestId('strength-trend-chart-axis-label'),
      ).toHaveLength(2)
    })
  })

  describe('trend pill', () => {
    it('shows a positive percentage for an improving series', () => {
      render(<StrengthTrendChart {...baseProps} />)
      const pill = screen.getByTestId('strength-trend-chart-trend-pill')
      expect(pill).toHaveTextContent('this meso')
      expect(pill.textContent?.startsWith('+')).toBe(true)
    })

    it('shows a negative percentage for a declining series', () => {
      render(
        <StrengthTrendChart
          {...baseProps}
          data={[
            { date: '2026-03-03', e1rm: 248 },
            { date: '2026-03-17', e1rm: 235 },
          ]}
        />,
      )
      const pill = screen.getByTestId('strength-trend-chart-trend-pill')
      expect(pill.textContent?.startsWith('-')).toBe(true)
    })
  })

  describe('interaction', () => {
    it('fires onPointPress with the tapped point', () => {
      const onPointPress = vi.fn()
      render(<StrengthTrendChart {...baseProps} onPointPress={onPointPress} />)
      fireEvent.click(screen.getAllByTestId('strength-trend-chart-point')[1])
      expect(onPointPress).toHaveBeenCalledWith(
        expect.objectContaining({ e1rm: 228 }),
      )
    })

    it('shows a tooltip with value and unit after a point is tapped', () => {
      render(<StrengthTrendChart {...baseProps} />)
      expect(
        screen.queryByTestId('strength-trend-chart-tooltip'),
      ).not.toBeInTheDocument()
      fireEvent.click(screen.getAllByTestId('strength-trend-chart-point')[2])
      const tooltip = screen.getByTestId('strength-trend-chart-tooltip')
      expect(tooltip).toHaveTextContent('244 lbs')
    })
  })

  describe('empty state', () => {
    it('renders an empty placeholder when there is no data', () => {
      render(<StrengthTrendChart {...baseProps} data={[]} />)
      expect(
        screen.getByTestId('strength-trend-chart-empty'),
      ).toBeInTheDocument()
      expect(
        screen.queryByTestId('strength-trend-chart-canvas'),
      ).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('labels the chart as an image with current value and trend', () => {
      render(<StrengthTrendChart {...baseProps} />)
      const canvas = screen.getByTestId('strength-trend-chart-canvas')
      expect(canvas).toHaveAttribute('role', 'img')
      expect(canvas.getAttribute('aria-label')).toContain('Current: 244 lbs')
      expect(canvas.getAttribute('aria-label')).toContain('Trend:')
    })

    it('labels the empty state accessibly', () => {
      render(<StrengthTrendChart {...baseProps} data={[]} />)
      expect(
        screen.getByLabelText('Strength trend chart, no data'),
      ).toBeInTheDocument()
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<StrengthTrendChart {...baseProps} />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations with all features enabled', async () => {
      const { container } = render(
        <StrengthTrendChart
          {...baseProps}
          projection={projection}
          mesoBoundaries={mesoBoundaries}
          onPointPress={vi.fn()}
          unit="kg"
        />,
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
