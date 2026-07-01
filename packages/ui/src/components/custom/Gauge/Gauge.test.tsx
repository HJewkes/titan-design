import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Gauge } from './Gauge'

describe('Gauge', () => {
  it('renders the arc as a fixed set of segments', () => {
    render(<Gauge value={50} />)
    expect(screen.getAllByTestId('gauge-segment')).toHaveLength(40)
  })

  it('renders the value, unit, and label', () => {
    render(<Gauge value={82} unit="%" label="Health" />)
    expect(screen.getByTestId('gauge-value')).toHaveTextContent('82')
    expect(screen.getByTestId('gauge-label')).toHaveTextContent('Health')
    expect(screen.getByText('%')).toBeInTheDocument()
  })

  it('colors the value by the active status band', () => {
    const { rerender } = render(<Gauge value={30} />)
    expect(screen.getByTestId('gauge-value')).toHaveStyle({ color: '#D14343' })
    rerender(<Gauge value={70} />)
    expect(screen.getByTestId('gauge-value')).toHaveStyle({ color: '#FFB020' })
    rerender(<Gauge value={90} />)
    expect(screen.getByTestId('gauge-value')).toHaveStyle({ color: '#14B8A6' })
  })

  it('honors a single-color override over thresholds', () => {
    render(<Gauge value={10} color="#5B9BD5" />)
    expect(screen.getByTestId('gauge-value')).toHaveStyle({ color: '#5B9BD5' })
  })

  it('clamps an out-of-range value without crashing', () => {
    render(<Gauge value={150} unit="%" />)
    // Displayed value is verbatim; only the fill is clamped.
    expect(screen.getByTestId('gauge-value')).toHaveTextContent('150')
    expect(screen.getAllByTestId('gauge-segment')).toHaveLength(40)
  })

  it('supports an arbitrary min/max domain', () => {
    render(<Gauge value={5} min={0} max={10} label="Score" />)
    expect(screen.getByTestId('gauge-value')).toHaveTextContent('5')
  })

  it('respects custom thresholds', () => {
    render(
      <Gauge
        value={45}
        thresholds={[
          { value: 0, color: '#14B8A6' },
          { value: 50, color: '#D14343' },
        ]}
      />,
    )
    expect(screen.getByTestId('gauge-value')).toHaveStyle({ color: '#14B8A6' })
  })

  describe('accessibility', () => {
    it('exposes an image role with a descriptive label', () => {
      render(<Gauge value={82} unit="%" label="Health" />)
      const gauge = screen.getByTestId('gauge')
      expect(gauge).toHaveAttribute('role', 'img')
      expect(gauge.getAttribute('aria-label')).toContain('Health: 82% of 100')
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<Gauge value={82} unit="%" label="Health" />)
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
