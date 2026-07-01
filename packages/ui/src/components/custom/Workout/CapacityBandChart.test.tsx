import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { CapacityBandChart } from './CapacityBandChart'
import type {
  CapacityBandDataPoint,
  CapacityBandProjection,
  WorkoutDot,
} from './CapacityBandChart'

const band: CapacityBandDataPoint[] = [
  { date: '2026-06-01', bandLow: 40, bandHigh: 70 },
  { date: '2026-06-05', bandLow: 44, bandHigh: 74 },
  { date: '2026-06-09', bandLow: 50, bandHigh: 80 },
  { date: '2026-06-13', bandLow: 54, bandHigh: 86 },
]

const workouts: WorkoutDot[] = [
  { date: '2026-06-02', load: 58, status: 'within' },
  { date: '2026-06-06', load: 80, status: 'above' },
  { date: '2026-06-10', load: 48, status: 'below' },
]

const projection: CapacityBandProjection = {
  withTraining: [
    { date: '2026-06-15', bandLow: 56, bandHigh: 90 },
    { date: '2026-06-17', bandLow: 60, bandHigh: 96 },
  ],
  withRest: [
    { date: '2026-06-15', bandLow: 50, bandHigh: 80 },
    { date: '2026-06-17', bandLow: 44, bandHigh: 70 },
  ],
}

const baseProps = { band, workouts, width: 320, height: 200 }

describe('CapacityBandChart', () => {
  describe('rendering', () => {
    it('renders the chart container', () => {
      render(<CapacityBandChart {...baseProps} />)
      expect(screen.getByTestId('capacity-band-chart')).toBeInTheDocument()
    })

    it('renders the shaded band fill as column cells', () => {
      render(<CapacityBandChart {...baseProps} />)
      expect(screen.getByTestId('capacity-band-chart-band')).toBeInTheDocument()
      expect(
        screen.getAllByTestId('capacity-band-chart-band-cell').length,
      ).toBeGreaterThan(0)
    })

    it('renders the top and bottom band edge lines', () => {
      render(<CapacityBandChart {...baseProps} />)
      expect(
        screen.getAllByTestId('capacity-band-chart-edge-top').length,
      ).toBe(band.length - 1)
      expect(
        screen.getAllByTestId('capacity-band-chart-edge-bottom').length,
      ).toBe(band.length - 1)
    })

    it('renders a conceptual Load axis label with no numbers', () => {
      render(<CapacityBandChart {...baseProps} />)
      expect(
        screen.getByTestId('capacity-band-chart-y-axis-label'),
      ).toHaveTextContent('Load')
    })

    it('renders x-axis date labels', () => {
      render(<CapacityBandChart {...baseProps} />)
      expect(
        screen.getAllByTestId('capacity-band-chart-x-label').length,
      ).toBeGreaterThan(0)
    })

    it('renders the empty state when band has no data', () => {
      render(<CapacityBandChart band={[]} workouts={[]} width={320} height={200} />)
      expect(screen.getByTestId('capacity-band-chart-empty')).toBeInTheDocument()
      expect(
        screen.queryByTestId('capacity-band-chart-band'),
      ).not.toBeInTheDocument()
    })
  })

  describe('workout dots', () => {
    it('renders one dot per workout', () => {
      render(<CapacityBandChart {...baseProps} />)
      expect(screen.getAllByTestId('capacity-band-chart-dot')).toHaveLength(
        workouts.length,
      )
    })

    it('colors dots by status relative to the band', () => {
      render(<CapacityBandChart {...baseProps} />)
      const dots = screen.getAllByTestId('capacity-band-chart-dot')
      expect(dots[0]).toHaveStyle({ backgroundColor: '#14B8A6' }) // within
      expect(dots[1]).toHaveStyle({ backgroundColor: '#FFB020' }) // above
      expect(dots[2]).toHaveStyle({ backgroundColor: '#2196F3' }) // below
    })

    it('renders dots at the spec 8px size with a visible outline', () => {
      render(<CapacityBandChart {...baseProps} />)
      const dots = screen.getAllByTestId('capacity-band-chart-dot')
      expect(dots[0]).toHaveStyle({
        width: '8px',
        height: '8px',
        borderTopColor: '#F3F4F6',
      })
    })

    it('does not render dots as buttons without onWorkoutPress', () => {
      render(<CapacityBandChart {...baseProps} />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('fires onWorkoutPress with the tapped workout', () => {
      const onWorkoutPress = vi.fn()
      render(<CapacityBandChart {...baseProps} onWorkoutPress={onWorkoutPress} />)
      const dots = screen.getAllByTestId('capacity-band-chart-dot')
      fireEvent.click(dots[1])
      expect(onWorkoutPress).toHaveBeenCalledWith(workouts[1])
    })

    it('exposes dots as labeled buttons when interactive', () => {
      render(<CapacityBandChart {...baseProps} onWorkoutPress={vi.fn()} />)
      expect(
        screen.getByLabelText('Workout on 6/6, load 80, above range'),
      ).toHaveAttribute('role', 'button')
    })
  })

  describe('projection', () => {
    it('renders dashed diverging training and rest edges when provided', () => {
      render(<CapacityBandChart {...baseProps} projection={projection} />)
      expect(
        screen.getByTestId('capacity-band-chart-projection'),
      ).toBeInTheDocument()
      expect(
        screen.getAllByTestId('capacity-band-chart-projection-training').length,
      ).toBeGreaterThan(0)
      expect(
        screen.getAllByTestId('capacity-band-chart-projection-rest').length,
      ).toBeGreaterThan(0)
    })

    it('labels the training and rest projections', () => {
      render(<CapacityBandChart {...baseProps} projection={projection} />)
      expect(
        screen.getByTestId('capacity-band-chart-projection-training-label'),
      ).toHaveTextContent('Training')
      expect(
        screen.getByTestId('capacity-band-chart-projection-rest-label'),
      ).toHaveTextContent('Rest')
    })

    it('omits the projection layer when not provided', () => {
      render(<CapacityBandChart {...baseProps} />)
      expect(
        screen.queryByTestId('capacity-band-chart-projection'),
      ).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('exposes an image role with a descriptive label', () => {
      render(<CapacityBandChart {...baseProps} />)
      const chart = screen.getByTestId('capacity-band-chart')
      expect(chart).toHaveAttribute('role', 'img')
      expect(chart).toHaveAttribute(
        'aria-label',
        'Training capacity band chart. Current capacity: below range. 3 workouts shown.',
      )
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<CapacityBandChart {...baseProps} />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations with all features enabled', async () => {
      const { container } = render(
        <CapacityBandChart
          {...baseProps}
          projection={projection}
          onWorkoutPress={vi.fn()}
        />,
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
