import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Text } from 'react-native'
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
    expect(screen.getByTestId('gauge-value')).toHaveStyle({ color: '#F9B415' })
    rerender(<Gauge value={90} />)
    expect(screen.getByTestId('gauge-value')).toHaveStyle({ color: '#2ED573' })
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

  it('formats a non-integer value to 1 decimal place', () => {
    render(<Gauge value={81.7} unit="%" />)
    expect(screen.getByTestId('gauge-value')).toHaveTextContent('81.7')
  })

  it('respects custom thresholds', () => {
    render(
      <Gauge
        value={45}
        thresholds={[
          { value: 0, color: '#14B8A6' },
          { value: 50, color: '#D14343' },
        ]}
      />
    )
    expect(screen.getByTestId('gauge-value')).toHaveStyle({ color: '#14B8A6' })
  })

  describe('no value', () => {
    it.each([null, Number.NaN, Number.POSITIVE_INFINITY])(
      'draws the unfilled track and a dash readout for %s',
      (value) => {
        render(<Gauge value={value} unit="%" label="Health" />)

        const filled = screen
          .getAllByTestId('gauge-segment')
          .map((segment) => segment.style.backgroundColor)
        expect(new Set(filled).size).toBe(1)
        expect(screen.getByTestId('gauge-value')).toHaveTextContent('—')
        expect(screen.queryByText('%')).not.toBeInTheDocument()
        expect(screen.getByTestId('gauge').getAttribute('aria-label')).toBe('Health: no value')
      }
    )

    it('shows the consumer emptyState in place of the readout', () => {
      render(<Gauge value={null} label="Health" emptyState={<Text>Not scored</Text>} />)

      expect(screen.getByText('Not scored')).toBeInTheDocument()
      expect(screen.queryByTestId('gauge-value')).not.toBeInTheDocument()
      expect(screen.getByTestId('gauge-label')).toHaveTextContent('Health')
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<Gauge value={null} label="Health" />)

      expect(await axe(container)).toHaveNoViolations()
    })
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
