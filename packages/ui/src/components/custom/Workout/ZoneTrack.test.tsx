import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ZoneTrack, type ZoneTrackZone } from './ZoneTrack'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { Surface } from '../../ui/surface'

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

describe('ZoneTrack onLayout', () => {
  afterEach(() => vi.unstubAllGlobals())

  function stubMeasuredWidth(width: number) {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly cb: (entries: { target: Element }[]) => void) {}
        observe(target: Element) {
          Object.defineProperty(target, 'offsetWidth', { configurable: true, value: width })
          this.cb([{ target }])
        }
        unobserve() {}
        disconnect() {}
      }
    )
  }

  const MANY_TICKS = Array.from({ length: 12 }, (_, i) => ({ value: i * 3, label: `t${i}` }))

  it('calls the consumer onLayout and still thins tick labels from the measured width', async () => {
    stubMeasuredWidth(100)
    const onLayout = vi.fn()
    render(<ZoneTrack zones={ZONES} max={40} ticks={MANY_TICKS} onLayout={onLayout} />)
    await waitFor(() => expect(onLayout).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(screen.getAllByTestId('zone-track-tick-label').length).toBeLessThan(MANY_TICKS.length)
    )
  })
})

describe('ZoneTrack un-reached track layers', () => {
  // Normalise through the DOM so hex, rgb() and rgba() compare as one form.
  function cssColor(color: string) {
    const probe = document.createElement('div')
    probe.style.backgroundColor = color
    return probe.style.backgroundColor
  }

  // react-native-web writes `transparent` as rgba(0, 0, 0, 0).
  const isPainted = (color: string) => color !== '' && !/^rgba\(.*,\s*0\)$/.test(color)

  const paintedLayers = () =>
    ['zone-track-track', 'zone-track-band', 'zone-track-unfilled']
      .map((id) => (screen.getByTestId(id) as HTMLElement).style.backgroundColor)
      .filter(isPainted)

  const FILL = { type: 'fill', value: 10, color: green } as const

  it.each(['dark', 'light'] as const)(
    'paints one %s border-prominent layer under the un-reached region of clear zones',
    (mode) => {
      render(
        <Surface theme={mode}>
          <ZoneTrack zones={[{ upTo: 40, color: 'transparent' }]} max={40} marker={FILL} />
        </Surface>
      )
      expect(paintedLayers()).toEqual([cssColor(getSemanticColors(mode)['border-prominent'])])
    }
  )

  it.each(['dark', 'light'] as const)(
    'paints one %s border-prominent layer when the zone already carries the track token',
    (mode) => {
      const track = getSemanticColors(mode)['border-prominent']
      render(
        <Surface theme={mode}>
          <ZoneTrack zones={[{ upTo: 40, color: track }]} max={40} marker={FILL} />
        </Surface>
      )
      expect(paintedLayers()).toEqual([cssColor(track)])
    }
  )
})
