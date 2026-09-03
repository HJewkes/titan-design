import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MesoStatusCard, type MesoStatusCardProps } from './MesoStatusCard'

const baseProps: MesoStatusCardProps = {
  mesoName: 'Hypertrophy Block',
  mesoSubtitle: 'Week 6 of 8 · Upper/Lower',
  statusBadge: { label: 'On Track', variant: 'success' },
  metrics: [
    { label: 'Prescribed', value: '3×8 @ RPE 8' },
    { label: 'Actual', value: '3×8 @ 185 lbs' },
    { label: 'Volume', value: '+12% vs wk 1' },
    { label: 'e1RM', value: '232 lbs' },
  ],
  gauges: [
    { label: 'Intensity', level: 0.68, sublabel: 'Actual' },
    { label: 'Volume', level: 0.82, sublabel: 'vs MRV' },
  ],
  coaching: {
    text: 'Velocity is holding — add load next session.',
    highlights: ['add load'],
  },
  nextTarget: { icon: '→', text: 'Next: 190 lbs × 8' },
}

describe('MesoStatusCard', () => {
  describe('rendering', () => {
    it('renders the card, name, and subtitle', () => {
      render(<MesoStatusCard {...baseProps} />)
      expect(screen.getByTestId('meso-status-card')).toBeInTheDocument()
      expect(screen.getByTestId('meso-status-card-name')).toHaveTextContent('Hypertrophy Block')
      expect(screen.getByTestId('meso-status-card-subtitle')).toHaveTextContent(
        'Week 6 of 8 · Upper/Lower'
      )
    })

    it('renders the 3px gradient top accent', () => {
      render(<MesoStatusCard {...baseProps} />)
      expect(screen.getByTestId('meso-status-card-accent')).toBeInTheDocument()
    })

    it('renders the status badge with its label', () => {
      render(<MesoStatusCard {...baseProps} />)
      expect(screen.getByTestId('meso-status-card-badge')).toHaveTextContent('On Track')
    })
  })

  describe('metrics grid', () => {
    it('renders one cell per metric with label and value', () => {
      render(<MesoStatusCard {...baseProps} />)
      const cells = screen.getAllByTestId('meso-status-card-metric')
      expect(cells).toHaveLength(4)
      expect(screen.getByText('Prescribed')).toBeInTheDocument()
      expect(screen.getByText('3×8 @ 185 lbs')).toBeInTheDocument()
    })

    it('renders every metric cell even when labels repeat (stable unique keys)', () => {
      render(
        <MesoStatusCard
          {...baseProps}
          metrics={[
            { label: 'Set', value: '1' },
            { label: 'Set', value: '2' },
          ]}
        />
      )
      expect(screen.getAllByTestId('meso-status-card-metric')).toHaveLength(2)
    })

    it('does not render the metrics grid when empty', () => {
      render(<MesoStatusCard {...baseProps} metrics={[]} />)
      expect(screen.queryByTestId('meso-status-card-metrics')).not.toBeInTheDocument()
    })
  })

  describe('gauges', () => {
    it('renders one gauge per entry with a marker', () => {
      render(<MesoStatusCard {...baseProps} />)
      expect(screen.getAllByTestId('meso-status-card-gauge')).toHaveLength(2)
      expect(screen.getAllByTestId('meso-status-card-gauge-marker')).toHaveLength(2)
    })

    it('renders a 50% center line per gauge', () => {
      render(<MesoStatusCard {...baseProps} />)
      const center = screen.getAllByTestId('meso-status-card-gauge-center')[0]
      expect(center).toHaveStyle({ left: '50%' })
    })

    it('exposes gauge level via progressbar value', () => {
      render(<MesoStatusCard {...baseProps} gauges={[{ label: 'Intensity', level: 0.7 }]} />)
      const gauge = screen.getByLabelText('Intensity: 70%')
      expect(gauge).toHaveAttribute('role', 'progressbar')
      expect(gauge).toHaveAttribute('aria-valuenow', '70')
    })

    it('clamps out-of-range levels', () => {
      render(<MesoStatusCard {...baseProps} gauges={[{ label: 'Volume', level: 1.7 }]} />)
      expect(screen.getByLabelText('Volume: 100%')).toBeInTheDocument()
    })

    it('guards a non-finite level, rendering 0% instead of NaN%', () => {
      render(<MesoStatusCard {...baseProps} gauges={[{ label: 'Intensity', level: Number.NaN }]} />)
      expect(screen.getByLabelText('Intensity: 0%')).toBeInTheDocument()
      expect(screen.queryByLabelText('Intensity: NaN%')).not.toBeInTheDocument()
    })

    it('renders every gauge even when labels repeat (stable unique keys)', () => {
      render(
        <MesoStatusCard
          {...baseProps}
          gauges={[
            { label: 'Load', level: 0.3 },
            { label: 'Load', level: 0.6 },
          ]}
        />
      )
      expect(screen.getAllByTestId('meso-status-card-gauge')).toHaveLength(2)
    })
  })

  describe('coaching', () => {
    it('renders coaching copy with bolded highlights', () => {
      render(<MesoStatusCard {...baseProps} />)
      const box = screen.getByTestId('meso-status-card-coaching')
      expect(box).toHaveTextContent('Velocity is holding — add load next session.')
      expect(screen.getByText('add load')).toBeInTheDocument()
    })

    it('omits the coaching box when not provided', () => {
      render(<MesoStatusCard {...baseProps} coaching={undefined} />)
      expect(screen.queryByTestId('meso-status-card-coaching')).not.toBeInTheDocument()
    })
  })

  describe('next target', () => {
    it('renders the next-target box with icon and text', () => {
      render(<MesoStatusCard {...baseProps} />)
      const box = screen.getByTestId('meso-status-card-next-target')
      expect(box).toHaveTextContent('Next: 190 lbs × 8')
    })

    it('omits the next-target box when not provided', () => {
      render(<MesoStatusCard {...baseProps} nextTarget={undefined} />)
      expect(screen.queryByTestId('meso-status-card-next-target')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('exposes the card as an article with a descriptive label', () => {
      render(<MesoStatusCard {...baseProps} />)
      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('aria-label', 'Mesocycle status for Hypertrophy Block')
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<MesoStatusCard {...baseProps} />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations with all features and every badge variant', async () => {
      const { container } = render(
        <>
          <MesoStatusCard
            {...baseProps}
            statusBadge={{ label: 'Watch Fatigue', variant: 'warning' }}
          />
          <MesoStatusCard
            {...baseProps}
            statusBadge={{ label: 'Deload Soon', variant: 'error' }}
            coaching={undefined}
            nextTarget={undefined}
          />
        </>
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
