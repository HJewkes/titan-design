import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DeviationBar } from './DeviationBar'
import { Surface } from '../../ui/surface'
import { greyRamp } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'

const t = getSemanticColors('dark')

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

  // A read-only meter: announcing a slider promises a control the user cannot move.
  it('is announced as a progressbar, never a slider', () => {
    render(<DeviationBar deviation={0.5} />)
    const bar = screen.getByRole('progressbar', { name: 'Session deviation: harder than planned' })
    expect(bar).toHaveAttribute('aria-valuenow', '50')
    expect(bar).toHaveAttribute('aria-valuemin', '-100')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.queryByRole('adjustable')).not.toBeInTheDocument()
  })

  it('renders an 8px dot with a text-primary border and a lift', () => {
    const { getByTestId } = render(<DeviationBar deviation={0} />)
    const dot = getByTestId('deviation-dot')
    expect(dot).toHaveStyle({ width: '8px', height: '8px' })
    expect(dot).toHaveStyle({ borderTopWidth: '1.5px', borderTopColor: greyRamp[50] })
    // The knob rests on the track: an ambient cast shadow, no rim (the ring is
    // already its edge) and never an inset.
    expect(dot.style.boxShadow).toContain('rgba(0,0,0')
    expect(dot.style.boxShadow).not.toContain('inset')
  })

  it('lifts the dot for the surface mode it sits on', () => {
    const { unmount } = render(<DeviationBar deviation={0} />)
    const darkShadow = screen.getByTestId('deviation-dot').style.boxShadow
    unmount()
    render(
      <Surface theme="light">
        <DeviationBar deviation={0} />
      </Surface>
    )
    expect(screen.getByTestId('deviation-dot').style.boxShadow).not.toBe(darkShadow)
  })

  it('renders the track with the deviation gradient background', () => {
    const { getByTestId } = render(<DeviationBar deviation={0} />)
    const bar = getByTestId('deviation-bar')
    const track = bar.firstElementChild as HTMLElement
    expect(track).toHaveStyle({
      backgroundImage: `linear-gradient(90deg, ${alpha(t['status-success'], 0.25)} 0%, ${alpha(t['result-neutral'], 0.15)} 50%, ${alpha(t['status-warning'], 0.25)} 100%)`,
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<DeviationBar deviation={0.3} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
