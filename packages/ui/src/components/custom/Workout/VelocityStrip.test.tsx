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

describe('VelocityStrip', () => {
  it('renders correct number of segments', () => {
    render(<VelocityStrip velocities={sampleVelocities} />)
    for (let i = 0; i < sampleVelocities.length; i++) {
      expect(screen.getByTestId(`velocity-bar-${i}`)).toBeInTheDocument()
    }
  })

  it('renders with expanded state', () => {
    render(<VelocityStrip velocities={sampleVelocities} expanded />)
    expect(screen.getByTestId('velocity-strip')).toBeInTheDocument()
    expect(screen.getByTestId('velocity-info-row')).toBeInTheDocument()
  })

  it('shows velocity labels when expanded', () => {
    render(<VelocityStrip velocities={sampleVelocities} expanded />)
    for (let i = 0; i < sampleVelocities.length; i++) {
      expect(screen.getByTestId(`velocity-label-${i}`)).toBeInTheDocument()
    }
  })

  it('fires onToggle on press', () => {
    const onToggle = vi.fn()
    render(
      <VelocityStrip velocities={sampleVelocities} onToggle={onToggle} />,
    )
    const pressable = screen.getByTestId('velocity-strip-pressable')
    fireEvent.click(pressable)
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('fires onRepPress with correct index when bar is tapped', () => {
    const onRepPress = vi.fn()
    render(
      <VelocityStrip
        velocities={sampleVelocities}
        expanded
        onRepPress={onRepPress}
      />,
    )
    const bar = screen.getByTestId('velocity-bar-pressable-2')
    fireEvent.click(bar)
    expect(onRepPress).toHaveBeenCalledWith(2, 0.82)
  })

  it('sets accessibility role and label', () => {
    render(<VelocityStrip velocities={sampleVelocities} />)
    expect(
      screen.getByLabelText(
        'Velocity chart for set, 5 reps, tap to expand',
      ),
    ).toBeInTheDocument()
  })

  it('sets expanded accessibility label when expanded', () => {
    render(<VelocityStrip velocities={sampleVelocities} expanded />)
    expect(
      screen.getByLabelText(
        'Velocity chart for set, 5 reps, tap to collapse',
      ),
    ).toBeInTheDocument()
  })

  describe('showInfo prop', () => {
    it('shows info row when expanded and showInfo is true (default)', () => {
      render(<VelocityStrip velocities={sampleVelocities} expanded />)
      expect(screen.getByTestId('velocity-info-row')).toBeInTheDocument()
    })

    it('hides info row when expanded and showInfo is false', () => {
      render(<VelocityStrip velocities={sampleVelocities} expanded showInfo={false} />)
      expect(screen.queryByTestId('velocity-info-row')).not.toBeInTheDocument()
    })

    it('does not show info row when collapsed regardless of showInfo', () => {
      render(<VelocityStrip velocities={sampleVelocities} showInfo />)
      expect(screen.queryByTestId('velocity-info-row')).not.toBeInTheDocument()
    })
  })

  describe('mini variant', () => {
    it('renders mini strip', () => {
      render(<VelocityStrip velocities={sampleVelocities} variant="mini" />)
      expect(screen.getByTestId('velocity-strip-mini')).toBeInTheDocument()
    })

    it('does not respond to press', () => {
      const onToggle = vi.fn()
      render(
        <VelocityStrip
          velocities={sampleVelocities}
          variant="mini"
          onToggle={onToggle}
        />,
      )
      expect(
        screen.queryByTestId('velocity-strip-pressable'),
      ).not.toBeInTheDocument()
    })

    it('renders correct number of segments', () => {
      render(<VelocityStrip velocities={sampleVelocities} variant="mini" />)
      for (let i = 0; i < sampleVelocities.length; i++) {
        expect(screen.getByTestId(`velocity-bar-${i}`)).toBeInTheDocument()
      }
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <VelocityStrip velocities={sampleVelocities} onToggle={() => {}} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when expanded', async () => {
      const { container } = render(
        <VelocityStrip velocities={sampleVelocities} expanded onToggle={() => {}} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when expanded with rep press', async () => {
      const { container } = render(
        <VelocityStrip
          velocities={sampleVelocities}
          expanded
          onRepPress={() => {}}
        />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations in mini variant', async () => {
      const { container } = render(
        <VelocityStrip velocities={sampleVelocities} variant="mini" />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('outer pressable has accessibility label when onToggle provided', () => {
      render(<VelocityStrip velocities={sampleVelocities} onToggle={() => {}} />)
      expect(
        screen.getByLabelText('Velocity chart for set, 5 reps, tap to expand'),
      ).toBeInTheDocument()
    })

    it('rep pressables have accessibility labels when expanded with onRepPress', () => {
      render(
        <VelocityStrip
          velocities={sampleVelocities}
          expanded
          onRepPress={() => {}}
        />,
      )
      expect(
        screen.getByLabelText('Rep 1: 1.10 meters per second, tap for details'),
      ).toBeInTheDocument()
    })
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
    // Best is the first rep here, so best->last matches the legacy result.
    expect(calculateVelocityLoss([1.0, 0.8])).toBe(20)
  })

  it('uses the best rep (not the first) as the reference for non-monotonic sets', () => {
    // best = 1.0 (rep 2), last = 0.6 -> (1.0 - 0.6) / 1.0 = 40%.
    // Legacy first->last would have been (0.8 - 0.6) / 0.8 = 25%.
    expect(calculateVelocityLoss([0.8, 1.0, 0.6])).toBe(40)
  })

  it('clamps to 0 when the set ends on its best rep', () => {
    expect(calculateVelocityLoss([0.6, 0.8, 1.0])).toBe(0)
  })

  it('clamps to 0 when a later rep exceeds the first rep', () => {
    // best = 1.2 (last), so loss is negative pre-clamp -> 0.
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
    // 1.1 -> speed -> green; 0.45 -> maximalStrength -> red-600.
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: '#2ED573' })
    expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ backgroundColor: '#D14343' })
  })

  it('gives grinding and maximalStrength DISTINCT reds (5-band, no collapse)', () => {
    // The 5-band taxonomy samples 5 stops of the effort ramp: maximalStrength =
    // red-600 (#D14343), grinding = red-700 (#A4221C). They no longer share one red.
    render(<VelocityStrip velocities={[0.45, 0.2]} zones={compoundBands} variant="mini" />)
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: '#D14343' }) // maximalStrength
    expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ backgroundColor: '#A4221C' }) // grinding
  })

  it('labels the summary row with the band containing the mean velocity', () => {
    // mean of the sample = 0.80 -> power band.
    render(<VelocityStrip velocities={sampleVelocities} zones={compoundBands} expanded />)
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
    render(<VelocityStrip velocities={sampleVelocities} liveRepIndex={3} expanded />)
    expect(
      screen.getByLabelText(/Rep 4: 0\.68 meters per second, latest rep$/),
    ).toBeInTheDocument()
  })

  it('flags a new set peak on the latest bar', () => {
    render(<VelocityStrip velocities={sampleVelocities} liveRepIndex={0} expanded />)
    expect(
      screen.getByLabelText(/Rep 1: 1\.10 meters per second, latest rep, new set peak$/),
    ).toBeInTheDocument()
  })

  it('renders without animation when prefers-reduced-motion is set', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia
    render(<VelocityStrip velocities={sampleVelocities} liveRepIndex={0} expanded />)
    expect(screen.getByTestId('velocity-bar-0')).toBeInTheDocument()
  })

  it('does not apply live marking in the mini variant', () => {
    render(<VelocityStrip velocities={sampleVelocities} liveRepIndex={0} variant="mini" />)
    expect(screen.queryByLabelText(/latest rep/)).not.toBeInTheDocument()
  })
})

describe('VelocityStrip all-zero velocities (NaN guard)', () => {
  it('emits a valid 0% bar height (not NaN) when every velocity is zero (expanded)', () => {
    render(<VelocityStrip velocities={[0, 0, 0]} expanded />)
    // Without the guard, 0 / (0 * 1.15) === NaN and the bar height becomes
    // 'NaN%' (dropped by jsdom, leaving no height); the guard flattens to '0%'.
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ height: '0%' })
    expect(screen.getByTestId('velocity-bar-2')).toHaveStyle({ height: '0%' })
  })
})

// Literal-hex slot colors (must match the component's tokens exactly; see
// SetBar's TODO_COLOR / SET_STRIP_VARIABLE_COLOR and the cyan-800 outline).
const TODO_GREY = '#2C2C2C'
const VARIABLE_CYAN = '#0B3149'
const CONTINUE_OUTLINE = '#22465F'
// The mini container carries a uniform 2px rep gap; per-slot marginLeft adds only
// the EXTRA for a wide chunk boundary (2px gap + 6px = 8px effective notch).
const CONTAINER_GAP_PX = '2px'
const REP_SLOT_ML = '0px' // a butted rep — no extra margin (the 2px gap is on the container)
const WIDE_SLOT_ML = '6px' // drop / myo / cluster chunk boundary — 2 + 6 = 8px effective

describe('VelocityStrip set-type modes (mini)', () => {
  it('straight: done reps colored + grey todo remainder to the planned count', () => {
    render(
      <VelocityStrip
        set={{ type: 'straight', velocities: [1.1, 0.9, 0.8], planned: 5 }}
        variant="mini"
      />,
    )
    // 3 done rep slots + 2 grey todo = 5 total.
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(3)
    expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(2)
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: '#2ED573' })
    expect(screen.getAllByTestId('velocity-slot-todo')[0]).toHaveStyle({ backgroundColor: TODO_GREY })
  })

  it('range: committed grey todo + a cyan variable window floor..max', () => {
    // floor 8, max 12, 6 done -> 6 rep + 2 grey (committed 6..8) + 4 cyan (8..12).
    render(
      <VelocityStrip
        set={{ type: 'range', velocities: [1.1, 1.0, 0.9, 0.85, 0.8, 0.7], floor: 8, max: 12 }}
        variant="mini"
      />,
    )
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(6)
    expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(2)
    expect(screen.getAllByTestId('velocity-slot-variable')).toHaveLength(4)
    expect(screen.getAllByTestId('velocity-slot-variable')[0]).toHaveStyle({
      backgroundColor: VARIABLE_CYAN,
    })
  })

  it('amrap: done reps + one trailing outlined cyan continue slot', () => {
    render(
      <VelocityStrip set={{ type: 'amrap', velocities: [1.1, 1.0, 0.9] }} variant="mini" />,
    )
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(3)
    const cont = screen.getByTestId('velocity-slot-continue')
    expect(cont).toHaveStyle({ backgroundColor: VARIABLE_CYAN })
    // RNW expands borderColor into per-side props; assert one side (cyan-800 outline).
    expect(cont).toHaveStyle({ borderTopColor: CONTINUE_OUTLINE })
  })

  it('drop: sub-loads split by a WIDE gap before each load after the first', () => {
    render(
      <VelocityStrip
        set={{ type: 'drop', subloads: [[1.0, 0.9], [0.8, 0.7], [0.6, 0.5]] }}
        variant="mini"
      />,
    )
    // 6 reps total; the first rep of each later sub-load carries the wide gap.
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
          clusters: [[0.7, 0.6], [0.6, 0.5]],
          open: true,
        }}
        variant="mini"
      />,
    )
    // activation 3 + cluster 2 + cluster 2 = 7 reps + a continue slot.
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(7)
    expect(screen.getByTestId('velocity-bar-3')).toHaveStyle({ marginLeft: WIDE_SLOT_ML })
    expect(screen.getByTestId('velocity-bar-5')).toHaveStyle({ marginLeft: WIDE_SLOT_ML })
    expect(screen.getByTestId('velocity-slot-continue')).toBeInTheDocument()
  })

  it('myo: closed (no open flag) has no continue slot', () => {
    render(
      <VelocityStrip
        set={{ type: 'myo', activation: [1.0, 0.9], clusters: [[0.7, 0.6]] }}
        variant="mini"
      />,
    )
    expect(screen.queryByTestId('velocity-slot-continue')).not.toBeInTheDocument()
  })

  it('cluster: fixed count grouped by WIDE intra-rest gaps, grey planned remainder', () => {
    // groupSize 2, planned 8, 5 done -> boundaries at 2/4/6, 3 grey todo, no cyan tail.
    render(
      <VelocityStrip
        set={{ type: 'cluster', velocities: [1.0, 0.95, 0.9, 0.88, 0.85], groupSize: 2, planned: 8 }}
        variant="mini"
      />,
    )
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(5)
    expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(3)
    expect(screen.queryByTestId('velocity-slot-continue')).not.toBeInTheDocument()
    expect(screen.getByTestId('velocity-bar-2')).toHaveStyle({ marginLeft: WIDE_SLOT_ML })
    expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ marginLeft: REP_SLOT_ML })
  })

  it('back-compat: a velocities-only mini strip is unchanged (rep colors, rep gaps only)', () => {
    render(<VelocityStrip velocities={sampleVelocities} variant="mini" />)
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(sampleVelocities.length)
    expect(screen.queryByTestId('velocity-slot-todo')).not.toBeInTheDocument()
    expect(screen.queryByTestId('velocity-slot-variable')).not.toBeInTheDocument()
    expect(screen.queryByTestId('velocity-slot-continue')).not.toBeInTheDocument()
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ marginLeft: '0px' })
    expect(screen.getByTestId('velocity-bar-1')).toHaveStyle({ marginLeft: REP_SLOT_ML })
    expect(screen.getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: '#2ED573' })
    // the 2px rep spacing lives on the container gap (preserving HTML-parity), not per-slot margins
    expect(screen.getByTestId('velocity-strip-mini')).toHaveStyle({ gap: CONTAINER_GAP_PX })
  })

  it('derives the summary from a set descriptor (mean / loss info row)', () => {
    render(<VelocityStrip set={{ type: 'straight', velocities: [1.0, 0.8], planned: 5 }} expanded />)
    // Loss uses the derived done velocities: (1.0 - 0.8) / 1.0 = 20%.
    expect(screen.getByTestId('velocity-info-row')).toHaveTextContent('Loss: 20%')
  })

  it('labels the strip per set type', () => {
    render(<VelocityStrip set={{ type: 'amrap', velocities: [1.0, 0.9] }} variant="mini" />)
    expect(
      screen.getByLabelText('Velocity strip, AMRAP set, 2 reps and counting'),
    ).toBeInTheDocument()
  })

  it('renders nothing when neither velocities nor set is provided', () => {
    const { container } = render(<VelocityStrip variant="mini" />)
    expect(container.firstChild).toBeNull()
  })
})

describe('VelocityStrip set-type modes (expanded)', () => {
  it('straight: velocity-height done reps + short grey planned stubs', () => {
    render(<VelocityStrip set={{ type: 'straight', velocities: [1.1, 0.8], planned: 4 }} expanded />)
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(2)
    expect(screen.getAllByTestId('velocity-slot-todo')).toHaveLength(2)
    expect(screen.getAllByTestId('velocity-slot-todo')[0]).toHaveStyle({ backgroundColor: TODO_GREY })
  })

  it('advanced types render their slot encoding in the expanded view', () => {
    render(
      <VelocityStrip
        set={{ type: 'drop', subloads: [[1.0, 0.9], [0.8, 0.7]] }}
        expanded
      />,
    )
    expect(screen.getAllByTestId(/^velocity-bar-\d+$/)).toHaveLength(4)
    expect(screen.getByTestId('velocity-bar-2')).toBeInTheDocument()
  })
})
