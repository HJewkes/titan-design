import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { IntensityBar } from './IntensityBar'

const AT_TARGET_GLOW = '0 0 5px 1px rgba(33, 150, 243, 0.35), 0 0 10px 3px rgba(33, 150, 243, 0.15)'

describe('IntensityBar', () => {
  it('renders the bar', () => {
    render(<IntensityBar level={0.5} />)
    expect(screen.getByTestId('intensity-bar')).toBeInTheDocument()
  })

  it('renders fill element', () => {
    render(<IntensityBar level={0.5} />)
    expect(screen.getByTestId('intensity-fill')).toBeInTheDocument()
  })

  it('has correct accessibility role', () => {
    render(<IntensityBar level={0.5} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  describe('numeric percentage label', () => {
    it('renders the level as a percentage under the bar', () => {
      render(<IntensityBar level={0.2} />)
      expect(screen.getByTestId('intensity-label')).toHaveTextContent('20%')
    })

    it('renders over-target percentages above 100', () => {
      render(<IntensityBar level={1.3} />)
      expect(screen.getByTestId('intensity-label')).toHaveTextContent('130%')
    })

    it('mirrors the label in the accessibility value', () => {
      render(<IntensityBar level={1.1} />)
      expect(screen.getByLabelText('Intensity level: 110%')).toBeInTheDocument()
    })

    it('floors a negative level to 0%', () => {
      render(<IntensityBar level={-0.5} />)
      expect(screen.getByTestId('intensity-label')).toHaveTextContent('0%')
    })
  })

  describe('zone colors graded by true percentage', () => {
    it('renders teal below the target ramp (< 75%)', () => {
      render(<IntensityBar level={0.2} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#14B8A6' })
    })

    it('stays teal just under the amber boundary', () => {
      render(<IntensityBar level={0.74} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#14B8A6' })
    })

    it('renders amber approaching the target (75-99%)', () => {
      render(<IntensityBar level={0.75} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#FFB020' })
    })

    it('renders the brand target color exactly at 100%', () => {
      render(<IntensityBar level={1} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#FF7900' })
    })

    it('renders over-1 red just past target (110%)', () => {
      render(<IntensityBar level={1.1} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#D14343' })
    })

    it('renders over-2 deep red at 120%', () => {
      render(<IntensityBar level={1.2} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#A62626' })
    })

    it('renders over-3 darkest red at 130%', () => {
      render(<IntensityBar level={1.3} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ backgroundColor: '#7A1C1C' })
    })
  })

  describe('over-target bulge', () => {
    it('renders a bulge when the level exceeds target', () => {
      render(<IntensityBar level={1.1} />)
      expect(screen.getByTestId('intensity-bulge')).toBeInTheDocument()
    })

    it('colors the bulge to match the over-target zone', () => {
      render(<IntensityBar level={1.2} />)
      expect(screen.getByTestId('intensity-bulge')).toHaveStyle({ backgroundColor: '#A62626' })
    })

    it('does not render a bulge at or below target', () => {
      render(<IntensityBar level={1} />)
      expect(screen.queryByTestId('intensity-bulge')).not.toBeInTheDocument()
    })
  })

  describe('target line', () => {
    it('renders the target line when threshold is provided', () => {
      render(<IntensityBar level={0.5} threshold={0.5} />)
      expect(screen.getByTestId('intensity-target')).toBeInTheDocument()
    })

    it('does not render the target line when threshold is omitted', () => {
      render(<IntensityBar level={0.5} />)
      expect(screen.queryByTestId('intensity-target')).not.toBeInTheDocument()
    })
  })

  describe('at-target glow', () => {
    it('applies the blue glow when the level rests on the target', () => {
      render(<IntensityBar level={0.5} threshold={0.5} />)
      expect(screen.getByTestId('intensity-fill')).toHaveStyle({ boxShadow: AT_TARGET_GLOW })
    })

    it('does not glow when the level is away from the target', () => {
      render(<IntensityBar level={0.2} threshold={0.85} />)
      expect(screen.getByTestId('intensity-fill')).not.toHaveStyle({ boxShadow: AT_TARGET_GLOW })
    })

    it('does not glow when no threshold is provided', () => {
      render(<IntensityBar level={0.5} />)
      expect(screen.getByTestId('intensity-fill')).not.toHaveStyle({ boxShadow: AT_TARGET_GLOW })
    })
  })

  describe('MRV threshold label', () => {
    it('shows MRV when showThresholdLabel is true and threshold set', () => {
      render(<IntensityBar level={0.6} threshold={0.85} showThresholdLabel />)
      expect(screen.getByText('MRV')).toBeInTheDocument()
    })

    it('hides MRV when showThresholdLabel is false', () => {
      render(<IntensityBar level={0.6} threshold={0.85} />)
      expect(screen.queryByTestId('intensity-threshold-label')).not.toBeInTheDocument()
    })

    it('hides MRV when threshold is omitted even if showThresholdLabel is true', () => {
      render(<IntensityBar level={0.6} showThresholdLabel />)
      expect(screen.queryByTestId('intensity-threshold-label')).not.toBeInTheDocument()
    })
  })

  describe('geometry', () => {
    it('renders horizontal orientation', () => {
      render(<IntensityBar level={0.5} orientation="horizontal" />)
      expect(screen.getByTestId('intensity-fill')).toBeInTheDocument()
    })

    it('accepts custom size and thickness', () => {
      render(<IntensityBar level={0.5} size={36} thickness={8} />)
      expect(screen.getByTestId('intensity-bar')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<IntensityBar level={0.5} threshold={0.85} showThresholdLabel />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
