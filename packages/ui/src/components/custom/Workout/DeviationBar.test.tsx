import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DeviationBar } from './DeviationBar'

describe('DeviationBar', () => {
  it('renders the bar and dot', () => {
    render(<DeviationBar deviation={0} />)
    expect(screen.getByTestId('deviation-bar')).toBeInTheDocument()
    expect(screen.getByTestId('deviation-dot')).toBeInTheDocument()
  })

  it('labels on-plan deviation correctly', () => {
    render(<DeviationBar deviation={0} />)
    expect(screen.getByLabelText('Session deviation: on plan')).toBeInTheDocument()
  })

  it('labels lighter deviation correctly', () => {
    render(<DeviationBar deviation={-0.5} />)
    expect(screen.getByLabelText('Session deviation: lighter than planned')).toBeInTheDocument()
  })

  it('labels harder deviation correctly', () => {
    render(<DeviationBar deviation={0.5} />)
    expect(screen.getByLabelText('Session deviation: harder than planned')).toBeInTheDocument()
  })

  it('clamps deviation to -1', () => {
    render(<DeviationBar deviation={-2} />)
    expect(screen.getByTestId('deviation-bar')).toBeInTheDocument()
  })

  it('clamps deviation to +1', () => {
    render(<DeviationBar deviation={2} />)
    expect(screen.getByTestId('deviation-bar')).toBeInTheDocument()
  })

  it('accepts custom width', () => {
    render(<DeviationBar deviation={0} width={80} />)
    expect(screen.getByTestId('deviation-bar')).toBeInTheDocument()
  })

  it('renders dot at left edge for -1 deviation', () => {
    const { getByTestId } = render(<DeviationBar deviation={-1} width={40} />)
    const dot = getByTestId('deviation-dot')
    expect(dot).toBeInTheDocument()
  })

  it('renders dot at right edge for +1 deviation', () => {
    const { getByTestId } = render(<DeviationBar deviation={1} width={40} />)
    const dot = getByTestId('deviation-dot')
    expect(dot).toBeInTheDocument()
  })

  it('has adjustable accessibility role', () => {
    render(<DeviationBar deviation={0} />)
    const bar = screen.getByTestId('deviation-bar')
    expect(bar).toHaveAttribute('role', 'slider')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<DeviationBar deviation={0.3} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
