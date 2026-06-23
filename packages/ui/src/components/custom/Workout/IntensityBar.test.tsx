import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { IntensityBar } from './IntensityBar'

describe('IntensityBar', () => {
  it('renders the bar', () => {
    render(<IntensityBar level={50} />)
    expect(screen.getByTestId('intensity-bar')).toBeInTheDocument()
  })

  it('renders fill element', () => {
    render(<IntensityBar level={50} />)
    expect(screen.getByTestId('intensity-fill')).toBeInTheDocument()
  })

  it('renders target line when target is provided', () => {
    render(<IntensityBar level={50} target={85} />)
    expect(screen.getByTestId('intensity-target')).toBeInTheDocument()
  })

  it('does not render target line when target is omitted', () => {
    render(<IntensityBar level={50} />)
    expect(screen.queryByTestId('intensity-target')).not.toBeInTheDocument()
  })

  it('shows percentage label when showLabel is true', () => {
    render(<IntensityBar level={60} showLabel />)
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('hides percentage label when showLabel is false', () => {
    render(<IntensityBar level={60} />)
    expect(screen.queryByTestId('intensity-label')).not.toBeInTheDocument()
  })

  it('shows correct label for over 100%', () => {
    render(<IntensityBar level={120} showLabel />)
    expect(screen.getByText('120%')).toBeInTheDocument()
  })

  it('renders bulge for level over 100', () => {
    render(<IntensityBar level={115} />)
    expect(screen.getByTestId('intensity-bulge')).toBeInTheDocument()
  })

  it('does not render bulge for level at or below 100', () => {
    render(<IntensityBar level={95} />)
    expect(screen.queryByTestId('intensity-bulge')).not.toBeInTheDocument()
  })

  it('has correct accessibility role', () => {
    render(<IntensityBar level={50} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('has correct accessibility label', () => {
    render(<IntensityBar level={75} />)
    expect(screen.getByLabelText('Intensity level: 75%')).toBeInTheDocument()
  })

  it('accepts custom height', () => {
    render(<IntensityBar level={50} height={32} />)
    expect(screen.getByTestId('intensity-bar')).toBeInTheDocument()
  })

  describe('fill zones', () => {
    it('renders building fill for low levels', () => {
      render(<IntensityBar level={50} />)
      expect(screen.getByTestId('intensity-fill')).toBeInTheDocument()
    })

    it('renders approaching fill for 75-95%', () => {
      render(<IntensityBar level={85} />)
      expect(screen.getByTestId('intensity-fill')).toBeInTheDocument()
    })

    it('renders target fill for 95-100%', () => {
      render(<IntensityBar level={97} />)
      expect(screen.getByTestId('intensity-fill')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<IntensityBar level={50} target={85} showLabel />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
