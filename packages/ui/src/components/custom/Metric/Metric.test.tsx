import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Metric, MetricGroup } from './Metric'

describe('Metric', () => {
  it('renders value and label', () => {
    render(<Metric value="42" label="Reps" />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Reps')).toBeInTheDocument()
  })

  it('renders unit when provided', () => {
    render(<Metric value="1.2" label="Peak Velocity" unit="m/s" />)
    expect(screen.getByText('m/s')).toBeInTheDocument()
  })

  it('does not render unit when omitted', () => {
    render(<Metric value="10" label="Sets" />)
    expect(screen.queryByText('m/s')).not.toBeInTheDocument()
  })

  it('renders trend arrow when provided', () => {
    render(<Metric value="85" label="Score" trend="up" />)
    expect(screen.getByText('\u2191')).toBeInTheDocument()
  })

  it('renders down trend arrow', () => {
    render(<Metric value="60" label="Score" trend="down" />)
    expect(screen.getByText('\u2193')).toBeInTheDocument()
  })

  it('renders neutral trend arrow', () => {
    render(<Metric value="70" label="Score" trend="neutral" />)
    expect(screen.getByText('\u2192')).toBeInTheDocument()
  })

  it('does not render trend when omitted', () => {
    render(<Metric value="50" label="Weight" />)
    expect(screen.queryByText('\u2191')).not.toBeInTheDocument()
    expect(screen.queryByText('\u2193')).not.toBeInTheDocument()
    expect(screen.queryByText('\u2192')).not.toBeInTheDocument()
  })

  it('defaults to md size', () => {
    const { container } = render(<Metric value="10" label="Reps" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('accepts all size variants without error', () => {
    const { rerender } = render(<Metric value="10" label="Reps" size="sm" />)
    expect(screen.getByText('10')).toBeInTheDocument()

    rerender(<Metric value="10" label="Reps" size="md" />)
    expect(screen.getByText('10')).toBeInTheDocument()

    rerender(<Metric value="10" label="Reps" size="lg" />)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Metric value="42" label="Reps" unit="reps" trend="up" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('MetricGroup', () => {
  it('renders all child metrics', () => {
    render(
      <MetricGroup>
        <Metric value="10" label="Sets" />
        <Metric value="42" label="Reps" />
        <Metric value="1.2" label="Velocity" unit="m/s" />
      </MetricGroup>
    )
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('1.2')).toBeInTheDocument()
  })

  it('renders dividers between metrics', () => {
    render(
      <MetricGroup>
        <Metric value="10" label="Sets" />
        <Metric value="42" label="Reps" />
        <Metric value="1.2" label="Velocity" />
      </MetricGroup>
    )
    const dividers = screen.getAllByTestId('metric-divider')
    expect(dividers).toHaveLength(2)
  })

  it('renders no dividers for a single metric', () => {
    render(
      <MetricGroup>
        <Metric value="10" label="Sets" />
      </MetricGroup>
    )
    const dividers = screen.queryAllByTestId('metric-divider')
    expect(dividers).toHaveLength(0)
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <MetricGroup>
          <Metric value="10" label="Sets" />
          <Metric value="42" label="Reps" />
        </MetricGroup>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
