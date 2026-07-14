import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  VelocityStrip,
  getVelocityZoneColor,
  getVelocityZoneName,
  calculateVelocityLoss,
  calculateMeanVelocity,
} from './VelocityStrip'

const sampleVelocities = [1.1, 0.95, 0.82, 0.68, 0.45]

describe('VelocityStrip expanded (framed chart)', () => {
  it('renders the open chart with bars, labels and info by default', () => {
    render(<VelocityStrip velocities={sampleVelocities} />)
    expect(screen.getByTestId('velocity-strip')).toBeInTheDocument()
    expect(screen.getByTestId('velocity-info-row')).toBeInTheDocument()
    for (let i = 0; i < sampleVelocities.length; i++) {
      expect(screen.getByTestId(`velocity-bar-${i}`)).toBeInTheDocument()
      expect(screen.getByTestId(`velocity-label-${i}`)).toBeInTheDocument()
    }
  })

  it('labels the open chart as tap-to-collapse (open by default)', () => {
    render(<VelocityStrip velocities={sampleVelocities} />)
    expect(
      screen.getByLabelText('Velocity chart for set, 5 reps, tap to collapse')
    ).toBeInTheDocument()
  })

  it('renders the 3px collapsed strip when expanded is false', () => {
    render(<VelocityStrip velocities={sampleVelocities} expanded={false} />)
    expect(
      screen.getByLabelText('Velocity chart for set, 5 reps, tap to expand')
    ).toBeInTheDocument()
    expect(screen.queryByTestId('velocity-info-row')).not.toBeInTheDocument()
  })

  it('fires onToggle on press', () => {
    const onToggle = vi.fn()
    render(<VelocityStrip velocities={sampleVelocities} onToggle={onToggle} />)
    fireEvent.click(screen.getByTestId('velocity-strip-pressable'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('fires onRepPress with the correct index when a bar is tapped', () => {
    const onRepPress = vi.fn()
    render(<VelocityStrip velocities={sampleVelocities} onRepPress={onRepPress} />)
    fireEvent.click(screen.getByTestId('velocity-bar-pressable-2'))
    expect(onRepPress).toHaveBeenCalledWith(2, 0.82)
  })

  describe('showInfo', () => {
    it('shows the info row by default', () => {
      render(<VelocityStrip velocities={sampleVelocities} />)
      expect(screen.getByTestId('velocity-info-row')).toBeInTheDocument()
    })

    it('hides the info row when showInfo is false', () => {
      render(<VelocityStrip velocities={sampleVelocities} showInfo={false} />)
      expect(screen.queryByTestId('velocity-info-row')).not.toBeInTheDocument()
    })
  })

  describe('showNumbers', () => {
    it('shows per-bar labels by default', () => {
      render(<VelocityStrip velocities={sampleVelocities} />)
      expect(screen.getByTestId('velocity-label-0')).toBeInTheDocument()
    })

    it('hides per-bar labels when showNumbers is false (but keeps the framed chart via showInfo)', () => {
      render(<VelocityStrip velocities={sampleVelocities} showNumbers={false} />)
      expect(screen.queryByTestId('velocity-label-0')).not.toBeInTheDocument()
      expect(screen.getByTestId('velocity-strip')).toBeInTheDocument()
      expect(screen.getByTestId('velocity-info-row')).toBeInTheDocument()
    })
  })

  describe('scale', () => {
    it('peak (default) scales the tallest rep to nearly full height', () => {
      // maxV=1.0 -> denom 1.06 (peak headroom) -> 1.0/1.06 = 94%.
      render(<VelocityStrip velocities={[1.0, 0.5]} showInfo={false} />)
      expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ height: '94%' })
    })

    it('fixed scales against the 1.15 ceiling regardless of the set max', () => {
      // fixed denom 1.15 -> 1.0/1.15 = 87%, 0.5/1.15 = 43%.
      render(<VelocityStrip velocities={[1.0, 0.5]} scale="fixed" showInfo={false} />)
      expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ height: '87%' })
      expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ height: '43%' })
    })
  })

  describe('accessibility', () => {
    it('has no violations (open, interactive)', async () => {
      const { container } = render(
        <VelocityStrip velocities={sampleVelocities} onToggle={() => {}} />
      )
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no violations with rep press', async () => {
      const { container } = render(
        <VelocityStrip velocities={sampleVelocities} onRepPress={() => {}} />
      )
      expect(await axe(container)).toHaveNoViolations()
    })

    it('rep pressables carry accessibility labels', () => {
      render(<VelocityStrip velocities={sampleVelocities} onRepPress={() => {}} />)
      expect(
        screen.getByLabelText('Rep 1: 1.10 meters per second, tap for details')
      ).toBeInTheDocument()
    })
  })
})

describe('VelocityStrip mini variant', () => {
  it('renders the flat mini strip', () => {
    render(<VelocityStrip velocities={sampleVelocities} variant="mini" />)
    expect(screen.getByTestId('velocity-strip-mini')).toBeInTheDocument()
  })

  it('does not respond to press', () => {
    render(<VelocityStrip velocities={sampleVelocities} variant="mini" onToggle={() => {}} />)
    expect(screen.queryByTestId('velocity-strip-pressable')).not.toBeInTheDocument()
  })

  it('renders one bar per rep', () => {
    render(<VelocityStrip velocities={sampleVelocities} variant="mini" />)
    for (let i = 0; i < sampleVelocities.length; i++) {
      expect(screen.getByTestId(`velocity-bar-${i}`)).toBeInTheDocument()
    }
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<VelocityStrip velocities={sampleVelocities} variant="mini" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('does not apply live marking', () => {
    render(<VelocityStrip velocities={sampleVelocities} liveRepIndex={0} variant="mini" />)
    expect(screen.queryByLabelText(/latest rep/)).not.toBeInTheDocument()
  })
})

describe('getVelocityZoneColor', () => {
  it('returns vel-green for velocities >= 1.0', () => {
    expect(getVelocityZoneColor(1.0)).toBe('vel-green')
    expect(getVelocityZoneColor(1.5)).toBe('vel-green')
  })

  it('returns vel-yellow for velocities >= 0.75 and < 1.0', () => {
    expect(getVelocityZoneColor(0.75)).toBe('vel-yellow')
    expect(getVelocityZoneColor(0.99)).toBe('vel-yellow')
  })

  it('returns vel-orange for velocities >= 0.50 and < 0.75', () => {
    expect(getVelocityZoneColor(0.5)).toBe('vel-orange')
    expect(getVelocityZoneColor(0.74)).toBe('vel-orange')
  })

  it('returns vel-red for velocities < 0.50', () => {
    expect(getVelocityZoneColor(0.49)).toBe('vel-red')
    expect(getVelocityZoneColor(0.1)).toBe('vel-red')
  })
})

describe('getVelocityZoneName', () => {
  it('returns correct zone names', () => {
    expect(getVelocityZoneName(1.2)).toBe('Speed')
    expect(getVelocityZoneName(0.85)).toBe('Power')
    expect(getVelocityZoneName(0.6)).toBe('Strength-Speed')
    expect(getVelocityZoneName(0.3)).toBe('Strength')
  })
})

describe('calculateVelocityLoss', () => {
  it('calculates percentage loss from running-best to last rep', () => {
    expect(calculateVelocityLoss([1.0, 0.8])).toBe(20)
  })

  it('uses the best rep (not the first) as the reference for non-monotonic sets', () => {
    expect(calculateVelocityLoss([0.8, 1.0, 0.6])).toBe(40)
  })

  it('clamps to 0 when the set ends on its best rep', () => {
    expect(calculateVelocityLoss([0.6, 0.8, 1.0])).toBe(0)
  })

  it('clamps to 0 when a later rep exceeds the first rep', () => {
    expect(calculateVelocityLoss([1.0, 0.9, 1.2])).toBe(0)
  })

  it('returns 0 for single rep', () => {
    expect(calculateVelocityLoss([1.0])).toBe(0)
  })

  it('returns 0 for empty array', () => {
    expect(calculateVelocityLoss([])).toBe(0)
  })

  it('returns 0 when the best rep is non-positive', () => {
    expect(calculateVelocityLoss([0, 0])).toBe(0)
  })
})

describe('calculateMeanVelocity', () => {
  it('calculates mean of velocities', () => {
    expect(calculateMeanVelocity([1.0, 0.8, 0.6])).toBeCloseTo(0.8)
  })

  it('returns 0 for empty array', () => {
    expect(calculateMeanVelocity([])).toBe(0)
  })
})

// WA-shaped 5-band zone set (compound movement-class defaults, mean m/s).
const compoundBands = [
  { id: 'grinding', label: 'Grinding', min: 0, max: 0.35 },
  { id: 'maximalStrength', label: 'Max Strength', min: 0.35, max: 0.5 },
  { id: 'strengthSpeed', label: 'Strength-Speed', min: 0.5, max: 0.75 },
  { id: 'power', label: 'Power', min: 0.75, max: 1.0 },
  { id: 'speed', label: 'Speed', min: 1.0, max: null },
] as const

describe('VelocityStrip zones prop', () => {
  it('colors bars from the supplied bands (mini)', () => {
    render(<VelocityStrip velocities={[1.1, 0.45]} zones={compoundBands} variant="mini" />)
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: '#2ED573' })
    expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ backgroundColor: '#D14343' })
  })

  it('gives grinding and maximalStrength DISTINCT reds (5-band, no collapse)', () => {
    render(<VelocityStrip velocities={[0.45, 0.2]} zones={compoundBands} variant="mini" />)
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: '#D14343' })
    expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ backgroundColor: '#A4221C' })
  })

  it('labels the info row with the band containing the mean velocity', () => {
    render(<VelocityStrip velocities={sampleVelocities} zones={compoundBands} />)
    expect(screen.getByTestId('velocity-info-row')).toHaveTextContent('Power')
  })

  it('falls back to the default scale when zones is absent', () => {
    render(<VelocityStrip velocities={[1.1]} variant="mini" />)
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: '#2ED573' })
  })
})

describe('VelocityStrip live mode', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    if (originalMatchMedia) window.matchMedia = originalMatchMedia
    else delete (window as { matchMedia?: unknown }).matchMedia
  })

  it('marks the latest rep bar in its accessibility label', () => {
    render(<VelocityStrip velocities={sampleVelocities} liveRepIndex={3} />)
    expect(screen.getByLabelText(/Rep 4: 0\.68 meters per second, latest rep$/)).toBeInTheDocument()
  })

  it('flags a new set peak on the latest bar', () => {
    render(<VelocityStrip velocities={sampleVelocities} liveRepIndex={0} />)
    expect(
      screen.getByLabelText(/Rep 1: 1\.10 meters per second, latest rep, new set peak$/)
    ).toBeInTheDocument()
  })

  it('renders without animation when prefers-reduced-motion is set', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia
    render(<VelocityStrip velocities={sampleVelocities} liveRepIndex={0} />)
    expect(screen.getByTestId('velocity-bar-0')).toBeInTheDocument()
  })
})

describe('VelocityStrip all-zero velocities (NaN guard)', () => {
  it('emits a valid 0% bar height (not NaN) when every velocity is zero', () => {
    render(<VelocityStrip velocities={[0, 0, 0]} showInfo={false} />)
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ height: '0%' })
    expect(screen.getByTestId('velocity-bar-2')).toHaveStyle({ height: '0%' })
  })
})

// Literal-hex slot colors (must match the component's tokens exactly).
const TODO_GREY = '#2C2C2C'
const VARIABLE_CYAN = '#0B3149'
const CONTINUE_OUTLINE = '#22465F'
const CONTAINER_GAP_PX = '2px'
const REP_SLOT_ML = '0px'
const WIDE_SLOT_ML = '6px'

describe('VelocityStrip set-type modes (mini)', () => {
  it('straight: done reps colored + grey todo remainder to the planned count', () => {
    render(
      <VelocityStrip
        set={{ type: 'straight', velocities: [1.1, 0.9, 0.8], planned: 5 }}
        variant="mini"
      />
    )
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(3)
    expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(2)
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: '#2ED573' })
    expect(screen.getAllByTestId('velocity-slot-todo')[0]).toHaveStyle({
      backgroundColor: TODO_GREY,
    })
  })

  it('range: committed grey todo + a cyan variable window floor..max', () => {
    render(
      <VelocityStrip
        set={{ type: 'range', velocities: [1.1, 1.0, 0.9, 0.85, 0.8, 0.7], floor: 8, max: 12 }}
        variant="mini"
      />
    )
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(6)
    expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(2)
    expect(screen.getAllByTestId('velocity-slot-variable')).toHaveLength(4)
    expect(screen.getAllByTestId('velocity-slot-variable')[0]).toHaveStyle({
      backgroundColor: VARIABLE_CYAN,
    })
  })

  it('amrap: done reps + one trailing outlined cyan continue slot', () => {
    render(<VelocityStrip set={{ type: 'amrap', velocities: [1.1, 1.0, 0.9] }} variant="mini" />)
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(3)
    const cont = screen.getByTestId('velocity-slot-continue')
    expect(cont).toHaveStyle({ backgroundColor: VARIABLE_CYAN })
    expect(cont).toHaveStyle({ borderTopColor: CONTINUE_OUTLINE })
  })

  it('drop: sub-loads split by a WIDE gap before each load after the first', () => {
    render(
      <VelocityStrip
        set={{
          type: 'drop',
          subloads: [
            [1.0, 0.9],
            [0.8, 0.7],
            [0.6, 0.5],
          ],
        }}
        variant="mini"
      />
    )
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(6)
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ marginLeft: '0px' })
    expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ marginLeft: REP_SLOT_ML })
    expect(screen.getByTestId('velocity-bar-2')).toHaveStyle({ marginLeft: WIDE_SLOT_ML })
    expect(screen.getByTestId('velocity-bar-4')).toHaveStyle({ marginLeft: WIDE_SLOT_ML })
  })

  it('myo: activation + clusters split by WIDE gaps, open adds a cyan continue', () => {
    render(
      <VelocityStrip
        set={{
          type: 'myo',
          activation: [1.0, 0.9, 0.8],
          clusters: [
            [0.7, 0.6],
            [0.6, 0.5],
          ],
          open: true,
        }}
        variant="mini"
      />
    )
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(7)
    expect(screen.getByTestId('velocity-bar-3')).toHaveStyle({ marginLeft: WIDE_SLOT_ML })
    expect(screen.getByTestId('velocity-bar-5')).toHaveStyle({ marginLeft: WIDE_SLOT_ML })
    expect(screen.getByTestId('velocity-slot-continue')).toBeInTheDocument()
  })

  it('cluster: fixed count grouped by WIDE intra-rest gaps, grey planned remainder', () => {
    render(
      <VelocityStrip
        set={{
          type: 'cluster',
          velocities: [1.0, 0.95, 0.9, 0.88, 0.85],
          groupSize: 2,
          planned: 8,
        }}
        variant="mini"
      />
    )
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(5)
    expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(3)
    expect(screen.getByTestId('velocity-bar-2')).toHaveStyle({ marginLeft: WIDE_SLOT_ML })
    expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ marginLeft: REP_SLOT_ML })
  })

  it('back-compat: a velocities-only mini strip is unchanged (rep colors, rep gaps only)', () => {
    render(<VelocityStrip velocities={sampleVelocities} variant="mini" />)
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(sampleVelocities.length)
    expect(screen.queryByTestId('velocity-slot-todo')).not.toBeInTheDocument()
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ marginLeft: '0px' })
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: '#2ED573' })
    expect(screen.getByTestId('velocity-strip-mini')).toHaveStyle({ gap: CONTAINER_GAP_PX })
  })

  it('derives the summary from a set descriptor (mean / loss info row)', () => {
    render(<VelocityStrip set={{ type: 'straight', velocities: [1.0, 0.8], planned: 5 }} />)
    expect(screen.getByTestId('velocity-info-row')).toHaveTextContent('Loss: 20%')
  })

  it('labels the strip per set type', () => {
    render(<VelocityStrip set={{ type: 'amrap', velocities: [1.0, 0.9] }} variant="mini" />)
    expect(
      screen.getByLabelText('Velocity strip, AMRAP set, 2 reps and counting')
    ).toBeInTheDocument()
  })

  it('renders nothing when neither velocities nor set is provided', () => {
    const { container } = render(<VelocityStrip variant="mini" />)
    expect(container.firstChild).toBeNull()
  })
})

describe('VelocityStrip set-type modes (expanded framed)', () => {
  it('straight: velocity-height done reps + short grey planned stubs', () => {
    render(<VelocityStrip set={{ type: 'straight', velocities: [1.1, 0.8], planned: 4 }} />)
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(2)
    expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(2)
    expect(screen.getAllByTestId('velocity-slot-todo')[0]).toHaveStyle({
      backgroundColor: TODO_GREY,
    })
  })

  it('advanced types render their slot encoding in the framed view', () => {
    render(
      <VelocityStrip
        set={{
          type: 'drop',
          subloads: [
            [1.0, 0.9],
            [0.8, 0.7],
          ],
        }}
      />
    )
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(4)
    expect(screen.getByTestId('velocity-bar-2')).toBeInTheDocument()
  })
})

describe('VelocityStrip expanded bare strip (spotlight: numbers + info off)', () => {
  const bareProps = { variant: 'expanded' as const, showNumbers: false, showInfo: false }

  it('renders the bare strip container (no framed chart, no mini)', () => {
    render(
      <VelocityStrip
        {...bareProps}
        set={{ type: 'straight', velocities: [1.0, 0.8], planned: 2 }}
      />
    )
    expect(screen.getByTestId('velocity-strip-compact')).toBeInTheDocument()
    expect(screen.queryByTestId('velocity-strip-mini')).not.toBeInTheDocument()
    expect(screen.queryByTestId('velocity-strip')).not.toBeInTheDocument()
  })

  it('scales bar height to velocity against the fixed ceiling at the given height', () => {
    render(
      <VelocityStrip
        {...bareProps}
        scale="fixed"
        height={24}
        set={{ type: 'straight', velocities: [1.15, 0.575], planned: 2 }}
      />
    )
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ height: '24px' })
    expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ height: '12px' })
  })

  it('honors height for the scaling', () => {
    render(
      <VelocityStrip
        {...bareProps}
        scale="fixed"
        height={40}
        set={{ type: 'straight', velocities: [1.15], planned: 1 }}
      />
    )
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ height: '40px' })
  })

  it('draws planned-but-undone reps as short grey todo stubs (set-type aware)', () => {
    render(
      <VelocityStrip
        {...bareProps}
        height={24}
        set={{ type: 'straight', velocities: [1.0], planned: 3 }}
      />
    )
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(1)
    const stubs = screen.getAllByTestId('velocity-slot-todo')
    expect(stubs).toHaveLength(2)
    expect(stubs[0]).toHaveStyle({ height: '3px', backgroundColor: TODO_GREY })
  })

  it('colors performed reps from the default effort scale', () => {
    render(
      <VelocityStrip
        {...bareProps}
        set={{ type: 'straight', velocities: [1.1, 0.45], planned: 2 }}
      />
    )
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: '#2ED573' })
    expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ backgroundColor: '#D14343' })
  })

  it('carries the set-type WIDE-gap chunk encoding (drop sub-loads)', () => {
    render(
      <VelocityStrip
        {...bareProps}
        set={{
          type: 'drop',
          subloads: [
            [1.0, 0.9],
            [0.8, 0.7],
          ],
        }}
      />
    )
    expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ marginLeft: REP_SLOT_ML })
    expect(screen.getByTestId('velocity-bar-2')).toHaveStyle({ marginLeft: WIDE_SLOT_ML })
  })

  it('has no chrome: no per-bar labels, no info row, no pressable', () => {
    render(
      <VelocityStrip
        {...bareProps}
        onToggle={() => {}}
        set={{ type: 'straight', velocities: [1.0, 0.8], planned: 3 }}
      />
    )
    expect(screen.queryByTestId('velocity-label-0')).not.toBeInTheDocument()
    expect(screen.queryByTestId('velocity-info-row')).not.toBeInTheDocument()
    expect(screen.queryByTestId('velocity-strip-pressable')).not.toBeInTheDocument()
  })

  it('labels the strip per set type for accessibility', () => {
    render(
      <VelocityStrip
        {...bareProps}
        set={{ type: 'straight', velocities: [1.0, 0.8], planned: 3 }}
      />
    )
    expect(screen.getByLabelText('Velocity strip, straight set, 2 reps')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <VelocityStrip
        {...bareProps}
        set={{ type: 'straight', velocities: [1.0, 0.8], planned: 3 }}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('VelocityStrip hero variant', () => {
  const heroSet = [0.9, 0.86, 0.82, 0.78]

  it('renders one bar per performed rep, each with a value label', () => {
    render(<VelocityStrip velocities={heroSet} variant="hero" targetReps={8} />)
    expect(screen.getByTestId('velocity-strip-hero')).toBeInTheDocument()
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(heroSet.length)
    expect(screen.getAllByTestId(/^velocity-label-\d+$/)).toHaveLength(heroSet.length)
    expect(screen.getByTestId('velocity-label-0')).toHaveTextContent('0.90')
  })

  it('draws a dashed placeholder for each rep still to come (target − done)', () => {
    render(<VelocityStrip velocities={heroSet} variant="hero" targetReps={8} />)
    expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(4)
  })

  it('draws no placeholders when the target is met exactly', () => {
    render(<VelocityStrip velocities={heroSet} variant="hero" targetReps={heroSet.length} />)
    expect(screen.queryByTestId('velocity-slot-todo')).not.toBeInTheDocument()
  })

  it('set expansion: reps beyond target render as bars with no negative placeholders', () => {
    const overflow = [0.9, 0.86, 0.82, 0.78, 0.74, 0.7, 0.66, 0.62, 0.58]
    render(<VelocityStrip velocities={overflow} variant="hero" targetReps={8} />)
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(overflow.length)
    expect(screen.queryByTestId('velocity-slot-todo')).not.toBeInTheDocument()
  })

  it('draws no placeholders when targetReps is omitted', () => {
    render(<VelocityStrip velocities={heroSet} variant="hero" />)
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(heroSet.length)
    expect(screen.queryByTestId('velocity-slot-todo')).not.toBeInTheDocument()
  })

  it('renders the running-best reference line when there is a positive best', () => {
    render(<VelocityStrip velocities={heroSet} variant="hero" targetReps={8} />)
    expect(screen.getByTestId('velocity-hero-reference')).toBeInTheDocument()
  })

  it('omits the reference line when every velocity is zero (NaN / no-best guard)', () => {
    render(<VelocityStrip velocities={[0, 0, 0]} variant="hero" targetReps={4} />)
    expect(screen.queryByTestId('velocity-hero-reference')).not.toBeInTheDocument()
  })

  it('summarizes reps done, target and best in the accessibility label', () => {
    render(<VelocityStrip velocities={heroSet} variant="hero" targetReps={8} />)
    expect(
      screen.getByLabelText('Velocity chart, 4 of 8 reps, best 0.90 meters per second')
    ).toBeInTheDocument()
  })

  it('renders nothing when neither velocities nor set is provided', () => {
    render(<VelocityStrip variant="hero" targetReps={8} />)
    expect(screen.queryByTestId('velocity-strip-hero')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <VelocityStrip velocities={heroSet} variant="hero" targetReps={8} liveRepIndex={3} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
