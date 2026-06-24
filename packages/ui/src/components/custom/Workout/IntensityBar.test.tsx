import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { IntensityBar } from './IntensityBar'

describe('IntensityBar', () => {
  it('renders the bar', () => {
    render(<IntensityBar level={0.5} />)
    expect(screen.getByTestId('intensity-bar')).toBeInTheDocument()
  })

  it('renders fill element', () => {
    render(<IntensityBar level={0.5} />)
    expect(screen.getByTestId('intensity-fill')).toBeInTheDocument()
  })

  it('renders threshold line when threshold is provided', () => {
    render(<IntensityBar level={0.5} threshold={0.85} />)
    expect(screen.getByTestId('intensity-threshold')).toBeInTheDocument()
  })

  it('does not render threshold line when threshold is omitted', () => {
    render(<IntensityBar level={0.5} />)
    expect(screen.queryByTestId('intensity-threshold')).not.toBeInTheDocument()
  })

  it('shows MRV label when showThresholdLabel is true and threshold set', () => {
    render(<IntensityBar level={0.6} threshold={0.85} showThresholdLabel />)
    expect(screen.getByText('MRV')).toBeInTheDocument()
  })

  it('hides MRV label when showThresholdLabel is false', () => {
    render(<IntensityBar level={0.6} threshold={0.85} />)
    expect(screen.queryByTestId('intensity-threshold-label')).not.toBeInTheDocument()
  })

  it('hides MRV label when threshold is omitted even if showThresholdLabel is true', () => {
    render(<IntensityBar level={0.6} showThresholdLabel />)
    expect(screen.queryByTestId('intensity-threshold-label')).not.toBeInTheDocument()
  })

  it('has correct accessibility role', () => {
    render(<IntensityBar level={0.5} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('maps level 0-1 to percentage in accessibility label', () => {
    render(<IntensityBar level={0.75} />)
    expect(screen.getByLabelText('Intensity level: 75%')).toBeInTheDocument()
  })

  it('clamps level above 1 to 100%', () => {
    render(<IntensityBar level={1.5} />)
    expect(screen.getByLabelText('Intensity level: 100%')).toBeInTheDocument()
  })

  it('clamps level below 0 to 0%', () => {
    render(<IntensityBar level={-0.5} />)
    expect(screen.getByLabelText('Intensity level: 0%')).toBeInTheDocument()
  })

  it('renders horizontal orientation', () => {
    render(<IntensityBar level={0.5} orientation="horizontal" />)
    expect(screen.getByTestId('intensity-fill')).toBeInTheDocument()
  })

  it('accepts custom size and thickness', () => {
    render(<IntensityBar level={0.5} size={32} thickness={8} />)
    expect(screen.getByTestId('intensity-bar')).toBeInTheDocument()
  })

  describe('fill zones', () => {
    it('renders teal fill for low levels (0-0.4)', () => {
      render(<IntensityBar level={0.3} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#14B8A6' })
    })

    it('renders amber fill for moderate levels (0.4-0.7)', () => {
      render(<IntensityBar level={0.5} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#FFB020' })
    })

    it('renders red fill for high levels (0.7-1.0)', () => {
      render(<IntensityBar level={0.85} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#D14343' })
    })

    it('uses teal at the lower zone boundary', () => {
      render(<IntensityBar level={0.39} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#14B8A6' })
    })

    it('uses amber at the 0.4 boundary', () => {
      render(<IntensityBar level={0.4} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#FFB020' })
    })

    it('uses red at the 0.7 boundary', () => {
      render(<IntensityBar level={0.7} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#D14343' })
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <IntensityBar level={0.5} threshold={0.85} showThresholdLabel />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
