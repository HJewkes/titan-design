import { afterEach, describe, it, expect, vi } from 'vitest'
import { stubReducedMotion } from '../../../../test/reduced-motion-stub'
import { render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { axe } from 'jest-axe'
import { capturedByNode } from '../../../../test/classname-capture'
import { contrast, compositeOver } from '../../../../theme/color-checks'
import { getSemanticColors, type ThemeMode } from '../../../../theme/tokens/semantic'
import { SurfaceContext } from '../../surface'
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
    expect(screen.getByTestId('gauge-value')).toHaveStyle({ color: '#E05254' })
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

  describe.each<[ThemeMode, 'border-input' | 'border-prominent']>([
    ['light', 'border-input'],
    ['dark', 'border-prominent'],
  ])('unfilled ticks in %s mode', (mode, trackToken) => {
    const sem = getSemanticColors(mode)
    const renderIn = () =>
      render(
        <SurfaceContext.Provider value={{ mode, level: 'base' }}>
          <Gauge value={null} />
        </SurfaceContext.Provider>
      )

    it(`paints every unfilled tick with the ${trackToken} track token`, () => {
      renderIn()

      for (const segment of screen.getAllByTestId('gauge-segment')) {
        expect(segment).toHaveStyle({ backgroundColor: sem[trackToken] })
      }
    })

    it('keeps the unfilled ticks visible against the base surface', () => {
      renderIn()

      const painted = screen.getAllByTestId('gauge-segment')[0].style.backgroundColor
      const base = sem['surface-base']
      expect(contrast(compositeOver(painted, base), base)).toBeGreaterThan(2.5)
    })
  })

  describe('no value', () => {
    it.each([null, Number.NaN, Number.POSITIVE_INFINITY])(
      'draws the unfilled track and the "No data" placeholder for %s',
      (value) => {
        render(<Gauge value={value} unit="%" label="Health" />)

        const filled = screen
          .getAllByTestId('gauge-segment')
          .map((segment) => segment.style.backgroundColor)
        expect(new Set(filled).size).toBe(1)
        expect(screen.getByTestId('gauge-empty')).toHaveTextContent('No data')
        expect(screen.queryByTestId('gauge-value')).not.toBeInTheDocument()
        expect(screen.queryByText('—')).not.toBeInTheDocument()
        expect(screen.queryByText('%')).not.toBeInTheDocument()
        expect(screen.getByTestId('gauge').getAttribute('aria-label')).toBe('Health: no value')
      }
    )

    it('shows the consumer emptyState in place of the readout', () => {
      render(<Gauge value={null} label="Health" emptyState={<Text>Not scored</Text>} />)

      expect(screen.getByText('Not scored')).toBeInTheDocument()
      expect(screen.queryByTestId('gauge-empty')).not.toBeInTheDocument()
      expect(screen.queryByText('No data')).not.toBeInTheDocument()
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

describe('Gauge with progress', () => {
  afterEach(() => vi.unstubAllGlobals())
  // Normalised through the DOM, which reports colours as rgb() whatever the hex they were set as.
  const probe = document.createElement('div')
  probe.style.backgroundColor = getSemanticColors('dark')['border-prominent']
  const track = probe.style.backgroundColor
  const filled = () =>
    screen.getAllByTestId('gauge-segment').filter((s) => s.style.backgroundColor !== track).length
  const shown = () => screen.getByTestId('gauge-value').textContent
  const valueClasses = () => capturedByNode.get(screen.getByTestId('gauge-value'))?.split(' ') ?? []

  it.each([
    [0, '0.0', 0],
    [0.5, '61.9', 25],
    [1, '82.5', 33],
  ])('at progress %s shows %s with %s segments filled', (progress, text, segments) => {
    render(<Gauge value={82.5} progress={progress} />)
    expect(shown()).toBe(text)
    expect(filled()).toBe(segments)
  })

  it('counts up from min', () => {
    render(<Gauge value={80} min={20} progress={0} />)
    expect(shown()).toBe('20')
  })

  it('draws the counting number in tabular digits', () => {
    render(<Gauge value={82.5} progress={0.5} />)
    expect(valueClasses()).toContain('tabular-nums')
  })

  it('shows the final value and fill when the reader prefers reduced motion', () => {
    stubReducedMotion(true)
    render(<Gauge value={82.5} progress={0.2} />)
    expect(shown()).toBe('82.5')
    expect(filled()).toBe(33)
  })

  it('labels the final value for assistive tech mid-count', () => {
    render(<Gauge value={82.5} unit="%" progress={0.2} />)
    expect(screen.getByLabelText('82.5% of 100')).toBeInTheDocument()
  })

  it('keeps proportional digits with no progress', () => {
    render(<Gauge value={82.5} />)
    expect(shown()).toBe('82.5')
    expect(valueClasses()).not.toContain('tabular-nums')
    expect(filled()).toBe(33)
  })
})
