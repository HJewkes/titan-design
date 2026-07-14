import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { FatigueMeter } from './FatigueMeter'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'

const { green, red } = WORKOUT_TOKENS.scale

describe('FatigueMeter', () => {
  it('renders the four fatigue zone bands', () => {
    render(<FatigueMeter value={0} />)
    expect(screen.getAllByTestId('zone-track-band')).toHaveLength(4)
  })

  it('colours the bands from the canonical effort scale', () => {
    render(<FatigueMeter value={0} />)
    const bands = screen.getAllByTestId('zone-track-band')
    expect(bands[0]).toHaveStyle({ backgroundColor: green })
    expect(bands[3]).toHaveStyle({ backgroundColor: red })
  })

  it('renders the default VL scale labels', () => {
    render(<FatigueMeter value={0} />)
    for (const label of ['fresh', 'VL10', 'VL20', 'VL30', 'stop']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('positions the needle at the value on the 0..40 loss scale', () => {
    render(<FatigueMeter value={20} />)
    expect(screen.getByTestId('zone-track-needle')).toHaveStyle({ left: '50%' })
  })

  it('clamps a value beyond the stop end to the track end', () => {
    render(<FatigueMeter value={60} />)
    expect(screen.getByTestId('zone-track-needle')).toHaveStyle({ left: '100%' })
  })

  it('reshapes the zones from custom thresholds + max', () => {
    render(<FatigueMeter value={5} max={20} thresholds={[5, 10, 15]} />)
    const bands = screen.getAllByTestId('zone-track-band')
    expect(bands[0]).toHaveStyle({ flexGrow: 5 })
    expect(bands[3]).toHaveStyle({ flexGrow: 5 })
  })

  it('honours custom labels', () => {
    render(<FatigueMeter value={5} labels={['A', 'B', 'C', 'D', 'E']} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('E')).toBeInTheDocument()
  })

  it('honours a needle colour override', () => {
    render(<FatigueMeter value={10} needleColor="#FF00FF" />)
    expect(screen.getByTestId('zone-track-needle')).toHaveStyle({ backgroundColor: '#FF00FF' })
  })

  // RNW does not map accessibilityValue → aria-valuenow under jsdom (gotcha #11), so the
  // loss value is verified via the needle position + the accessible name.
  it('exposes the progressbar role with the loss value in its accessible name', () => {
    render(<FatigueMeter value={17} />)
    expect(
      screen.getByRole('progressbar', { name: 'Fatigue: 17% velocity loss' })
    ).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<FatigueMeter value={21} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('FatigueMeter size="wall"', () => {
  it('passes wall density through to the composed ZoneTrack (thicker needle)', () => {
    render(<FatigueMeter value={20} size="wall" />)
    expect(screen.getByTestId('zone-track-needle')).toHaveStyle({ width: '7px' })
  })

  it('keeps the compact needle by default', () => {
    render(<FatigueMeter value={20} />)
    expect(screen.getByTestId('zone-track-needle')).toHaveStyle({ width: '4px' })
  })
})
