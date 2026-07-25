import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DualVelocityStrip } from './VelocityStrip'

// Literal-hex zone colours (must match the component's tokens exactly — same as the
// single-strip suite): the default effort scale and the WA 5-band mapping.
const GREEN = '#2ED573' // speed / ≥1.0
const RED = '#D14343' // maximalStrength / <0.5
const DISTINCT_RED = '#A4221C' // grinding (5th band, no collapse)

// The `hero` variant COMPOSES two single VelocityStrip heroes, one per wing, wrapped in
// `dual-velocity-wing-up` / `-down` so a test can scope to one side. Inside each wing the
// composed hero emits the SINGLE-strip testIDs: `velocity-bar-N`, `velocity-label-N`,
// `velocity-slot-todo`, `velocity-hero-reference`. The `rail` variant is a lean dedicated
// renderer that keeps the `dual-velocity-bar-L/R-N` testIDs.
const HERO_BARS = /^velocity-bar-\d+$/
const RAIL_LEFT_BARS = /^dual-velocity-bar-L-\d+$/
const RAIL_RIGHT_BARS = /^dual-velocity-bar-R-\d+$/
const wingUp = () => within(screen.getByTestId('dual-velocity-wing-up'))
const wingDown = () => within(screen.getByTestId('dual-velocity-wing-down'))

// WA-shaped 5-band zone set (compound movement-class defaults, mean m/s).
const compoundBands = [
  { id: 'grinding', label: 'Grinding', min: 0, max: 0.35 },
  { id: 'maximalStrength', label: 'Max Strength', min: 0.35, max: 0.5 },
  { id: 'strengthSpeed', label: 'Strength-Speed', min: 0.5, max: 0.75 },
  { id: 'power', label: 'Power', min: 0.75, max: 1.0 },
  { id: 'speed', label: 'Speed', min: 1.0, max: null },
] as const

describe('DualVelocityStrip composition', () => {
  it('composes an up wing and a down wing sharing one centre axis', () => {
    render(<DualVelocityStrip left={{ velocities: [0.9] }} right={{ velocities: [0.8] }} />)
    expect(screen.getByTestId('dual-velocity-strip')).toBeInTheDocument()
    expect(screen.getByTestId('dual-velocity-wing-up')).toBeInTheDocument()
    expect(screen.getByTestId('dual-velocity-wing-down')).toBeInTheDocument()
    // Exactly two composed single-strip heroes, one per wing.
    expect(screen.getAllByTestId('velocity-strip-hero')).toHaveLength(2)
    // ONE shared axis where the wings meet (not two abutting baselines).
    expect(screen.getByTestId('dual-velocity-axis')).toBeInTheDocument()
  })

  it('a 120px dual sizes each wing at 60px — NOT ballooned to 220 by the hero height sentinel', () => {
    // Regression: the single hero bumps an unset height (the 60px expanded default) to 220. A 120px
    // dual gives each wing exactly 60px, which collided with that sentinel and blew the wings up to
    // 220 (bars overflowing). The columnSlots (dual) path is exempt, so each wing renders at 60px.
    render(
      <DualVelocityStrip left={{ velocities: [0.9] }} right={{ velocities: [0.8] }} height={120} />
    )
    for (const wing of screen.getAllByTestId('velocity-strip-hero')) {
      expect(wing).toHaveStyle({ height: '60px' })
    }
  })

  it('renders one bar per performed rep on each side (each wing scoped independently)', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85, 0.8] }}
        right={{ velocities: [0.82, 0.74] }}
      />
    )
    expect(wingUp().queryAllByTestId(HERO_BARS)).toHaveLength(3)
    expect(wingDown().queryAllByTestId(HERO_BARS)).toHaveLength(2)
  })

  it('summarizes both sides’ reps done vs target in the container accessibility label', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85, 0.8] }}
        right={{ velocities: [0.82, 0.74] }}
        targetReps={8}
      />
    )
    expect(
      screen.getByLabelText('Dual velocity chart, left 3 of 8 reps, right 2 of 8 reps')
    ).toBeInTheDocument()
  })

  it('shows a per-rep value label per side at hero scale', () => {
    render(<DualVelocityStrip left={{ velocities: [0.9] }} right={{ velocities: [0.82] }} />)
    expect(wingUp().getByTestId('velocity-label-0')).toHaveTextContent('0.90')
    expect(wingDown().getByTestId('velocity-label-0')).toHaveTextContent('0.82')
  })
})

describe('DualVelocityStrip side labels', () => {
  it('renders each side’s slot name from its stream label (no hardcoded LEFT/RIGHT)', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9], label: 'Left Arm' }}
        right={{ velocities: [0.8], label: 'Right Arm' }}
      />
    )
    // The DATA keeps its casing (textContent is the original string); the label is
    // uppercased visually via the small-caps/eyebrow `textTransform`, not by mutating text.
    expect(screen.getByTestId('dual-velocity-side-label-L')).toHaveTextContent('Left Arm')
    expect(screen.getByTestId('dual-velocity-side-label-R')).toHaveTextContent('Right Arm')
    // The retired hardcoded copy is gone.
    expect(screen.queryByText('LEFT VOLTRA')).not.toBeInTheDocument()
    expect(screen.queryByText('RIGHT VOLTRA')).not.toBeInTheDocument()
  })

  it('renders the slot name in the uppercase small-caps label treatment', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9], label: 'Left Arm' }}
        right={{ velocities: [0.8], label: 'Right Arm' }}
      />
    )
    expect(screen.getByTestId('dual-velocity-side-label-L')).toHaveStyle({
      textTransform: 'uppercase',
    })
    expect(screen.getByTestId('dual-velocity-side-label-R')).toHaveStyle({
      textTransform: 'uppercase',
    })
  })

  it('omits a side’s label when its stream has no label (no left/right fallback)', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9], label: 'Left Arm' }}
        right={{ velocities: [0.8] }}
      />
    )
    expect(screen.getByTestId('dual-velocity-side-label-L')).toBeInTheDocument()
    expect(screen.queryByTestId('dual-velocity-side-label-R')).not.toBeInTheDocument()
  })

  it('renders no side label when neither stream carries one', () => {
    render(<DualVelocityStrip left={{ velocities: [0.9] }} right={{ velocities: [0.8] }} />)
    expect(screen.queryByTestId('dual-velocity-side-label-L')).not.toBeInTheDocument()
    expect(screen.queryByTestId('dual-velocity-side-label-R')).not.toBeInTheDocument()
  })

  it('treats an empty-string label as absent', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9], label: '' }}
        right={{ velocities: [0.8], label: '' }}
      />
    )
    expect(screen.queryByTestId('dual-velocity-side-label-L')).not.toBeInTheDocument()
  })

  it('renders slot names at rail scale too', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9], label: 'Left Arm' }}
        right={{ velocities: [0.8], label: 'Right Arm' }}
        variant="rail"
      />
    )
    expect(screen.getByTestId('dual-velocity-side-label-L')).toHaveTextContent('Left Arm')
    expect(screen.getByTestId('dual-velocity-side-label-R')).toHaveTextContent('Right Arm')
  })
})

describe('DualVelocityStrip diverging orientation', () => {
  // The up wing grows upright; the down wing is the SAME hero vertically mirrored (a scaleY(-1)
  // on the whole plot, NOT swapped radii — so both bars keep their DOM top-radius). The mirror is
  // observable via the down wing counter-flipping its value text to stay upright.
  it('grows the up wing upright and the down wing mirrored', () => {
    render(<DualVelocityStrip left={{ velocities: [0.9] }} right={{ velocities: [0.8] }} />)
    expect(wingUp().getByTestId('velocity-bar-0')).toHaveStyle({ borderTopLeftRadius: '5px' })
    // Up text upright (no transform); down text counter-flipped (has a transform) — proof the
    // down wing is the mirrored orientation.
    expect(wingUp().getByTestId('velocity-label-0').style.transform).toBeFalsy()
    expect(wingDown().getByTestId('velocity-label-0').style.transform).toBeTruthy()
  })
})

describe('DualVelocityStrip reference lines', () => {
  it('draws a per-side running-best reference line at hero scale', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85] }}
        right={{ velocities: [0.82, 0.74] }}
        variant="hero"
      />
    )
    expect(wingUp().getByTestId('velocity-hero-reference')).toBeInTheDocument()
    expect(wingDown().getByTestId('velocity-hero-reference')).toBeInTheDocument()
  })

  it('omits reference lines at rail scale', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85] }}
        right={{ velocities: [0.82, 0.74] }}
        variant="rail"
      />
    )
    expect(screen.queryByTestId('velocity-hero-reference')).not.toBeInTheDocument()
  })

  it('omits a side’s reference line when that side has no positive velocity', () => {
    render(<DualVelocityStrip left={{ velocities: [0.9] }} right={{ velocities: [] }} />)
    expect(wingUp().getByTestId('velocity-hero-reference')).toBeInTheDocument()
    expect(wingDown().queryByTestId('velocity-hero-reference')).not.toBeInTheDocument()
  })
})

describe('DualVelocityStrip planned stubs', () => {
  it('index-locks the columns: the lagging side fills its un-logged rep column as empty, not shifted', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85] }}
        right={{ velocities: [0.8] }}
        targetReps={4}
      />
    )
    // 4 shared columns. left logs reps 0–1 → cols 2,3 planned todo. right logs rep 0 → col 1 is its
    // un-logged rep column (EMPTY, index-locked under left's rep 1), cols 2,3 planned todo.
    expect(wingUp().queryAllByTestId('velocity-slot-todo')).toHaveLength(2)
    expect(wingUp().queryAllByTestId('velocity-slot-empty')).toHaveLength(0)
    expect(wingDown().queryAllByTestId('velocity-slot-todo')).toHaveLength(2)
    expect(wingDown().queryAllByTestId('velocity-slot-empty')).toHaveLength(1)
  })

  it('renders the planned stub as the solid to-do section (inherited hero styling, not dashed)', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9] }}
        right={{ velocities: [0.8] }}
        targetReps={2}
      />
    )
    const stub = wingUp().getAllByTestId('velocity-slot-todo')[0]
    // The hero (and the dual composing it) now use a solid surface-relative section, not a
    // dashed outline. ROM is the only consumer that keeps the dashed stub.
    expect(stub).not.toHaveStyle({ borderTopStyle: 'dashed' })
  })

  it('draws no stubs when the target is met', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85] }}
        right={{ velocities: [0.8, 0.7] }}
        targetReps={2}
      />
    )
    expect(screen.queryByTestId('velocity-slot-todo')).not.toBeInTheDocument()
  })

  it('renders both wings entirely as stubs for a planned-but-unstarted set', () => {
    render(
      <DualVelocityStrip left={{ velocities: [] }} right={{ velocities: [] }} targetReps={3} />
    )
    expect(wingUp().queryAllByTestId('velocity-slot-todo')).toHaveLength(3)
    expect(wingUp().queryAllByTestId(HERO_BARS)).toHaveLength(0)
  })

  it('symmetric index-lock: left logs 5, right logs 3 → 5 columns, right cols 3–4 aligned empty', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.88, 0.86, 0.84, 0.82] }}
        right={{ velocities: [0.85, 0.8, 0.75] }}
      />
    )
    // Both wings render 5 columns. Left: 5 rep bars. Right: 3 rep bars + cols 3,4 EMPTY (under
    // left's reps 3,4), no shift, no todo (no planned remainder).
    expect(wingUp().queryAllByTestId(HERO_BARS)).toHaveLength(5)
    expect(wingUp().queryAllByTestId('velocity-slot-empty')).toHaveLength(0)
    expect(wingDown().queryAllByTestId(HERO_BARS)).toHaveLength(3)
    expect(wingDown().queryAllByTestId('velocity-slot-empty')).toHaveLength(2)
  })
})

describe('DualVelocityStrip colour mapping', () => {
  it('zone mode colours reps from the absolute effort scale (side is position, not hue)', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [1.1] }}
        right={{ velocities: [0.4] }}
        barColor="zone"
      />
    )
    expect(wingUp().getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: GREEN })
    expect(wingDown().getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: RED })
  })

  it('zone mode colours both sides from supplied bands, with distinct 5-band reds', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [1.1, 0.45] }}
        right={{ velocities: [0.2] }}
        zones={compoundBands}
        barColor="zone"
      />
    )
    expect(wingUp().getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: GREEN })
    expect(wingUp().getByTestId('velocity-bar-1')).toHaveStyle({ backgroundColor: RED })
    expect(wingDown().getByTestId('velocity-bar-0')).toHaveStyle({ backgroundColor: DISTINCT_RED })
  })

  it('loss mode (default) colours each wing off its OWN best — per-wing fatigue, shared height', () => {
    // Left ends on its own best (loss 0 → green); right drops hard from its own best (→ red).
    // The shared height scale must NOT bleed the stronger arm's best into the weaker arm's colour.
    render(
      <DualVelocityStrip left={{ velocities: [0.9, 0.9] }} right={{ velocities: [0.9, 0.5] }} />
    )
    expect(wingUp().getByTestId('velocity-bar-1')).toHaveStyle({ backgroundColor: GREEN })
    expect(wingDown().getByTestId('velocity-bar-1')).toHaveStyle({ backgroundColor: RED })
  })
})

describe('DualVelocityStrip set-type streams (windows render on the composed hero)', () => {
  // Each side passes its `set` descriptor straight into the composed hero, which builds its own
  // typed slots — so the set-type WINDOWS (the range cyan variable window, the AMRAP/myo "continue")
  // render on the dual, not just the flattened reps. This is the set-type vocabulary regained.
  it('range set: renders the committed reps as bars AND the cyan variable window', () => {
    render(
      <DualVelocityStrip
        left={{ set: { type: 'range', velocities: [0.9, 0.85], floor: 3, max: 5 } }}
        right={{ velocities: [0.8] }}
      />
    )
    // floor 3 / max 5, 2 done → 2 rep bars, 1 todo (i<floor), 2 variable (floor..max).
    expect(wingUp().queryAllByTestId(HERO_BARS)).toHaveLength(2)
    expect(wingUp().queryAllByTestId('velocity-slot-variable')).toHaveLength(2)
  })

  it('amrap set: renders performed reps as bars AND the trailing continue window', () => {
    render(
      <DualVelocityStrip
        left={{ set: { type: 'amrap', velocities: [0.9, 0.85] } }}
        right={{ velocities: [0.8] }}
      />
    )
    expect(wingUp().queryAllByTestId(HERO_BARS)).toHaveLength(2)
    expect(wingUp().getByTestId('velocity-slot-continue')).toBeInTheDocument()
  })

  it('myo set: activation + clusters render one bar per rep plus the open continue window', () => {
    render(
      <DualVelocityStrip
        left={{
          set: {
            type: 'myo',
            activation: [0.95, 0.9, 0.85],
            clusters: [
              [0.78, 0.72],
              [0.68, 0.61],
            ],
            open: true,
          },
        }}
        right={{ velocities: [0.8] }}
      />
    )
    // 3 activation + 2 + 2 cluster reps = 7 filled bars, plus the open "continue" window.
    expect(wingUp().queryAllByTestId(HERO_BARS)).toHaveLength(7)
    expect(wingUp().getByTestId('velocity-slot-continue')).toBeInTheDocument()
  })
})

describe('DualVelocityStrip live mode', () => {
  const originalMatchMedia = window.matchMedia
  afterEach(() => {
    if (originalMatchMedia) window.matchMedia = originalMatchMedia
    else delete (window as { matchMedia?: unknown }).matchMedia
  })

  it('renders the live mirrored pair at the given index (hero)', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85, 0.8] }}
        right={{ velocities: [0.82, 0.78, 0.7] }}
        variant="hero"
        liveRepIndex={2}
      />
    )
    expect(wingUp().getByTestId('velocity-bar-2')).toBeInTheDocument()
    expect(wingDown().getByTestId('velocity-bar-2')).toBeInTheDocument()
  })

  it('renders stably with prefers-reduced-motion set', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia
    render(
      <DualVelocityStrip
        left={{ velocities: [1.1, 0.9] }}
        right={{ velocities: [0.8, 0.7] }}
        liveRepIndex={0}
      />
    )
    expect(wingUp().getByTestId('velocity-bar-0')).toBeInTheDocument()
  })
})

describe('DualVelocityStrip rail variant', () => {
  it('renders compact bars but no value labels or reference lines', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85] }}
        right={{ velocities: [0.82, 0.74] }}
        variant="rail"
      />
    )
    expect(screen.queryAllByTestId(RAIL_LEFT_BARS)).toHaveLength(2)
    expect(screen.queryAllByTestId(RAIL_RIGHT_BARS)).toHaveLength(2)
    expect(screen.queryByTestId(/^velocity-label-\d+$/)).not.toBeInTheDocument()
    expect(screen.queryByTestId('velocity-hero-reference')).not.toBeInTheDocument()
  })

  it('draws mirrored dashed todo stubs for unperformed reps', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9] }}
        right={{ velocities: [0.8] }}
        variant="rail"
        targetReps={2}
      />
    )
    expect(screen.queryAllByTestId(/^dual-velocity-bar-L-\d+-todo$/)).toHaveLength(1)
    expect(screen.queryAllByTestId(/^dual-velocity-bar-R-\d+-todo$/)).toHaveLength(1)
  })

  it('rounds the up (L) bar on top and the down (R) bar on the bottom', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9] }}
        right={{ velocities: [0.8] }}
        variant="rail"
      />
    )
    expect(screen.getByTestId('dual-velocity-bar-L-0')).toHaveStyle({ borderTopLeftRadius: '2px' })
    expect(screen.getByTestId('dual-velocity-bar-R-0')).toHaveStyle({
      borderBottomLeftRadius: '2px',
    })
  })
})

describe('DualVelocityStrip accessibility', () => {
  it('has no violations at hero scale with a live rep and planned stubs', async () => {
    const { container } = render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85, 0.8] }}
        right={{ velocities: [0.82, 0.74] }}
        targetReps={8}
        liveRepIndex={2}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no violations at rail scale', async () => {
    const { container } = render(
      <DualVelocityStrip
        left={{ velocities: [0.9] }}
        right={{ velocities: [0.8] }}
        variant="rail"
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
