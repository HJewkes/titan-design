import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ZoneTrack, type ZoneTrackZone } from './ZoneTrack'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const { green, yellow, orange, red } = WORKOUT_TOKENS.scale
const t = getSemanticColors('dark')

const ZONES: ZoneTrackZone[] = [
  { upTo: 10, color: green },
  { upTo: 20, color: yellow },
  { upTo: 30, color: orange },
  { upTo: 40, color: red },
]

describe('ZoneTrack', () => {
  it('renders one band per zone', () => {
    render(<ZoneTrack zones={ZONES} max={40} />)
    expect(screen.getAllByTestId('zone-track-band')).toHaveLength(4)
  })

  it('colours each band from the supplied zone token (literal hex, not a var ref)', () => {
    render(<ZoneTrack zones={ZONES} max={40} />)
    const bands = screen.getAllByTestId('zone-track-band')
    expect(bands[0]).toHaveStyle({ backgroundColor: green })
    expect(bands[3]).toHaveStyle({ backgroundColor: red })
  })

  it('weights each band by its domain span', () => {
    render(
      <ZoneTrack
        zones={[
          { upTo: 30, color: green },
          { upTo: 40, color: red },
        ]}
        max={40}
      />
    )
    const bands = screen.getAllByTestId('zone-track-band')
    expect(bands[0]).toHaveStyle({ flexGrow: 30 })
    expect(bands[1]).toHaveStyle({ flexGrow: 10 })
  })

  it('renders no marker when none is supplied', () => {
    render(<ZoneTrack zones={ZONES} max={40} />)
    expect(screen.queryByTestId('zone-track-needle')).not.toBeInTheDocument()
    expect(screen.queryByTestId('zone-track-fill')).not.toBeInTheDocument()
    expect(screen.queryByTestId('zone-track-unfilled')).not.toBeInTheDocument()
  })

  it('positions a needle marker at the value fraction of the domain', () => {
    render(<ZoneTrack zones={ZONES} max={40} marker={{ type: 'needle', value: 10 }} />)
    expect(screen.getByTestId('zone-track-needle')).toHaveStyle({ left: '25%' })
  })

  it('clamps a needle past the max to the track end', () => {
    render(<ZoneTrack zones={ZONES} max={40} marker={{ type: 'needle', value: 100 }} />)
    expect(screen.getByTestId('zone-track-needle')).toHaveStyle({ left: '100%' })
  })

  it('clip-reveals the gradient for a fill marker without a colour', () => {
    render(<ZoneTrack zones={ZONES} max={40} marker={{ type: 'fill', value: 20 }} />)
    expect(screen.getByTestId('zone-track-unfilled')).toHaveStyle({ left: '50%' })
    expect(screen.queryByTestId('zone-track-fill')).not.toBeInTheDocument()
  })

  it('draws a solid trend fill when the fill marker has a colour', () => {
    render(<ZoneTrack zones={ZONES} max={40} marker={{ type: 'fill', value: 30, color: red }} />)
    const fill = screen.getByTestId('zone-track-fill')
    expect(fill).toHaveStyle({ width: '75%', backgroundColor: red })
  })

  it('renders a tick with its label per entry', () => {
    render(
      <ZoneTrack
        zones={ZONES}
        max={40}
        ticks={[
          { value: 0, label: 'fresh' },
          { value: 40, label: 'stop' },
        ]}
      />
    )
    expect(screen.getAllByTestId('zone-track-tick')).toHaveLength(2)
    expect(screen.getByText('fresh')).toBeInTheDocument()
    expect(screen.getByText('stop')).toBeInTheDocument()
  })

  it('draws a range highlight only when a band is supplied', () => {
    const { rerender } = render(<ZoneTrack zones={ZONES} max={40} />)
    expect(screen.queryByTestId('zone-track-band-highlight')).not.toBeInTheDocument()
    rerender(
      <ZoneTrack
        zones={ZONES}
        max={40}
        band={{ from: 10, to: 20, color: 'rgba(255,255,255,0.2)' }}
      />
    )
    expect(screen.getByTestId('zone-track-band-highlight')).toHaveStyle({
      left: '25%',
      width: '25%',
    })
  })

  // RNW does not map accessibilityValue → aria-valuenow under jsdom (gotcha #11), so the
  // value is verified via the marker position + the accessible name, not aria-valuenow.
  it('exposes the progressbar role with an accessible name', () => {
    render(
      <ZoneTrack
        zones={ZONES}
        max={40}
        marker={{ type: 'needle', value: 12 }}
        accessibilityLabel="Fatigue meter"
      />
    )
    expect(screen.getByRole('progressbar', { name: 'Fatigue meter' })).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <ZoneTrack
          zones={ZONES}
          max={40}
          marker={{ type: 'needle', value: 21 }}
          ticks={[
            { value: 0, label: 'fresh' },
            { value: 40, label: 'stop' },
          ]}
          accessibilityLabel="Fatigue meter"
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('glow', () => {
    it('haloes the track when the marker has glow', () => {
      render(
        <ZoneTrack
          zones={ZONES}
          max={40}
          marker={{ type: 'fill', value: 24, color: orange, glow: true }}
        />
      )
      expect((screen.getByTestId('zone-track-track') as HTMLElement).style.boxShadow).not.toBe('')
    })
    it('has no glow by default', () => {
      render(
        <ZoneTrack zones={ZONES} max={40} marker={{ type: 'fill', value: 24, color: orange }} />
      )
      expect((screen.getByTestId('zone-track-track') as HTMLElement).style.boxShadow).toBe('')
    })
  })

  describe('ticks (colored lines + labels + tooltip)', () => {
    it('renders a line and label per tick', () => {
      render(
        <ZoneTrack
          zones={ZONES}
          max={40}
          ticks={[
            { value: 10, label: 'A' },
            { value: 30, label: 'B' },
          ]}
        />
      )
      expect(screen.getAllByTestId('zone-track-tick-line')).toHaveLength(2)
      expect(screen.getAllByTestId('zone-track-tick-label').map((e) => e.textContent)).toEqual([
        'A',
        'B',
      ])
    })
    it('colours an emphasized tick line with the brand accent', () => {
      render(
        <ZoneTrack zones={ZONES} max={40} ticks={[{ value: 20, label: 'T', emphasized: true }]} />
      )
      expect(screen.getByTestId('zone-track-tick-line')).toHaveStyle({
        backgroundColor: t['brand-primary'],
      })
    })
    it('applies a per-tick color override to the line', () => {
      render(<ZoneTrack zones={ZONES} max={40} ticks={[{ value: 20, label: 'X', color: red }]} />)
      expect(screen.getByTestId('zone-track-tick-line')).toHaveStyle({ backgroundColor: red })
    })
    it('renders a tooltip label trigger', () => {
      render(
        <ZoneTrack
          zones={ZONES}
          max={40}
          ticks={[{ value: 20, label: 'MAV', tooltip: 'Maximum Adaptive Volume' }]}
        />
      )
      expect(screen.getByText('MAV')).toBeInTheDocument()
    })
  })
})

describe('ZoneTrack size="wall"', () => {
  const TICKS = [
    { value: 0, label: 'fresh' },
    { value: 40, label: 'stop' },
  ]

  it('scales the needle and tick labels up together', () => {
    render(
      <ZoneTrack
        zones={ZONES}
        max={40}
        size="wall"
        marker={{ type: 'needle', value: 20 }}
        ticks={TICKS}
      />
    )
    expect(screen.getByTestId('zone-track-needle')).toHaveStyle({ width: '7px' })
    expect(screen.getAllByTestId('zone-track-tick-label')[0]).toHaveStyle({ fontSize: 14 })
  })

  it('defaults to the compact scale (needle 4 / label 9) when size is omitted', () => {
    render(
      <ZoneTrack zones={ZONES} max={40} marker={{ type: 'needle', value: 20 }} ticks={TICKS} />
    )
    expect(screen.getByTestId('zone-track-needle')).toHaveStyle({ width: '4px' })
    expect(screen.getAllByTestId('zone-track-tick-label')[0]).toHaveStyle({ fontSize: 9 })
  })

  it('still lets an explicit trackHeight override the size default', () => {
    render(<ZoneTrack zones={ZONES} max={40} size="wall" trackHeight={30} />)
    expect(screen.getByTestId('zone-track-track')).toHaveStyle({ height: '30px' })
  })
})
