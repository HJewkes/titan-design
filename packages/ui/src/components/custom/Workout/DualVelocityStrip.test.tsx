import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DualVelocityStrip } from './VelocityStrip'

// Literal-hex zone colours (must match the component's tokens exactly — same as the
// single-strip suite): the default effort scale and the WA 5-band mapping.
const GREEN = '#2ED573' // speed / ≥1.0
const RED = '#D14343' // maximalStrength / <0.5
const DISTINCT_RED = '#A4221C' // grinding (5th band, no collapse)
const VARIABLE_CYAN = '#0B3149' // range variable window
const CONTINUE_OUTLINE = '#22465F' // amrap / open-myo continue

const barsMatching = (re: RegExp) => screen.queryAllByTestId(re)
const LEFT_BARS = /^dual-velocity-bar-L-\d+$/
const RIGHT_BARS = /^dual-velocity-bar-R-\d+$/

// WA-shaped 5-band zone set (compound movement-class defaults, mean m/s).
const compoundBands = [
  { id: 'grinding', label: 'Grinding', min: 0, max: 0.35 },
  { id: 'maximalStrength', label: 'Max Strength', min: 0.35, max: 0.5 },
  { id: 'strengthSpeed', label: 'Strength-Speed', min: 0.5, max: 0.75 },
  { id: 'power', label: 'Power', min: 0.75, max: 1.0 },
  { id: 'speed', label: 'Speed', min: 1.0, max: null },
] as const

describe('DualVelocityStrip structure', () => {
  it('renders one bar per performed rep on each side (columns = max of the two)', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85, 0.8] }}
        right={{ velocities: [0.82, 0.74] }}
      />
    )
    expect(screen.getByTestId('dual-velocity-strip')).toBeInTheDocument()
    expect(barsMatching(LEFT_BARS)).toHaveLength(3)
    expect(barsMatching(RIGHT_BARS)).toHaveLength(2)
  })

  it('renders the shared centre axis splitting the two wings', () => {
    render(<DualVelocityStrip left={{ velocities: [0.9] }} right={{ velocities: [0.8] }} />)
    expect(screen.getByTestId('dual-velocity-axis')).toBeInTheDocument()
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
    expect(screen.getByTestId('dual-velocity-label-L-0')).toHaveTextContent('0.90')
    expect(screen.getByTestId('dual-velocity-label-R-0')).toHaveTextContent('0.82')
  })
})

describe('DualVelocityStrip diverging orientation', () => {
  // LEFT reps grow UP → rounded on the TOP (away-from-axis) end; RIGHT reps grow DOWN →
  // rounded on the BOTTOM. The mirrored radius is how the diverging silhouette reads.
  it('rounds the LEFT (up) bar on top and the RIGHT (down) bar on the bottom', () => {
    render(<DualVelocityStrip left={{ velocities: [0.9] }} right={{ velocities: [0.8] }} />)
    const leftBar = screen.getByTestId('dual-velocity-bar-L-0')
    const rightBar = screen.getByTestId('dual-velocity-bar-R-0')
    expect(leftBar).toHaveStyle({ borderTopLeftRadius: '5px' })
    expect(leftBar).not.toHaveStyle({ borderBottomLeftRadius: '5px' })
    expect(rightBar).toHaveStyle({ borderBottomLeftRadius: '5px' })
    expect(rightBar).not.toHaveStyle({ borderTopLeftRadius: '5px' })
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
    expect(screen.getByTestId('dual-velocity-reference-L')).toBeInTheDocument()
    expect(screen.getByTestId('dual-velocity-reference-R')).toBeInTheDocument()
  })

  it('omits both reference lines at rail scale', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85] }}
        right={{ velocities: [0.82, 0.74] }}
        variant="rail"
      />
    )
    expect(screen.queryByTestId('dual-velocity-reference-L')).not.toBeInTheDocument()
    expect(screen.queryByTestId('dual-velocity-reference-R')).not.toBeInTheDocument()
  })

  it('omits a side’s reference line when that side has no positive velocity', () => {
    render(<DualVelocityStrip left={{ velocities: [0.9] }} right={{ velocities: [] }} />)
    expect(screen.getByTestId('dual-velocity-reference-L')).toBeInTheDocument()
    expect(screen.queryByTestId('dual-velocity-reference-R')).not.toBeInTheDocument()
  })
})

describe('DualVelocityStrip planned stubs', () => {
  it('draws a mirrored dashed todo stub per unperformed rep on both sides', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85] }}
        right={{ velocities: [0.8] }}
        targetReps={4}
      />
    )
    // left: 4 - 2 = 2 stubs; right: 4 - 1 = 3 stubs.
    expect(screen.queryAllByTestId(/^dual-velocity-bar-L-\d+-todo$/)).toHaveLength(2)
    expect(screen.queryAllByTestId(/^dual-velocity-bar-R-\d+-todo$/)).toHaveLength(3)
  })

  it('renders the planned stub as a dashed outline', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9] }}
        right={{ velocities: [0.8] }}
        targetReps={2}
      />
    )
    const stub = screen.getByTestId('dual-velocity-bar-L-1-todo')
    expect(stub).toHaveStyle({ borderTopStyle: 'dashed' })
    expect(stub).toHaveStyle({ borderTopWidth: '1px' })
  })

  it('draws no stubs when the target is met', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85] }}
        right={{ velocities: [0.8, 0.7] }}
        targetReps={2}
      />
    )
    expect(screen.queryByTestId(/^dual-velocity-bar-[LR]-\d+-todo$/)).not.toBeInTheDocument()
  })

  it('renders both wings entirely as stubs for a planned-but-unstarted set', () => {
    render(
      <DualVelocityStrip left={{ velocities: [] }} right={{ velocities: [] }} targetReps={3} />
    )
    expect(screen.queryAllByTestId(/^dual-velocity-bar-L-\d+-todo$/)).toHaveLength(3)
    expect(barsMatching(LEFT_BARS)).toHaveLength(0)
  })
})

describe('DualVelocityStrip colour mapping', () => {
  it('colours reps from the default effort scale (side is position, not hue)', () => {
    render(<DualVelocityStrip left={{ velocities: [1.1] }} right={{ velocities: [0.4] }} />)
    expect(screen.getByTestId('dual-velocity-bar-L-0')).toHaveStyle({ backgroundColor: GREEN })
    expect(screen.getByTestId('dual-velocity-bar-R-0')).toHaveStyle({ backgroundColor: RED })
  })

  it('colours both sides from supplied zone bands, with distinct 5-band reds', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [1.1, 0.45] }}
        right={{ velocities: [0.2] }}
        zones={compoundBands}
      />
    )
    expect(screen.getByTestId('dual-velocity-bar-L-0')).toHaveStyle({ backgroundColor: GREEN })
    expect(screen.getByTestId('dual-velocity-bar-L-1')).toHaveStyle({ backgroundColor: RED })
    expect(screen.getByTestId('dual-velocity-bar-R-0')).toHaveStyle({
      backgroundColor: DISTINCT_RED,
    })
  })
})

describe('DualVelocityStrip set-type slots', () => {
  it('range: renders a cyan variable window past the committed reps', () => {
    render(
      <DualVelocityStrip
        left={{ set: { type: 'range', velocities: [0.9, 0.85], floor: 3, max: 5 } }}
        right={{ velocities: [0.8] }}
      />
    )
    const variables = screen.getAllByTestId(/^dual-velocity-bar-L-\d+-variable$/)
    expect(variables.length).toBeGreaterThan(0)
    expect(variables[0]).toHaveStyle({ backgroundColor: VARIABLE_CYAN })
  })

  it('amrap: renders a trailing dashed cyan continue slot', () => {
    render(
      <DualVelocityStrip
        left={{ set: { type: 'amrap', velocities: [0.9, 0.85] } }}
        right={{ velocities: [0.8] }}
      />
    )
    const cont = screen.getByTestId(/^dual-velocity-bar-L-\d+-continue$/)
    expect(cont).toHaveStyle({ borderTopStyle: 'dashed' })
    expect(cont).toHaveStyle({ borderTopColor: CONTINUE_OUTLINE })
  })

  it('myo: renders each activation/cluster rep as a bar plus an open continue slot', () => {
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
    // 3 activation + 2 + 2 cluster reps = 7 filled bars, then a continue slot.
    expect(barsMatching(LEFT_BARS)).toHaveLength(7)
    expect(screen.getByTestId(/^dual-velocity-bar-L-\d+-continue$/)).toBeInTheDocument()
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
    expect(screen.getByTestId('dual-velocity-bar-L-2')).toBeInTheDocument()
    expect(screen.getByTestId('dual-velocity-bar-R-2')).toBeInTheDocument()
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
    expect(screen.getByTestId('dual-velocity-bar-L-0')).toBeInTheDocument()
  })
})

describe('DualVelocityStrip rail variant', () => {
  it('renders bars but no value labels or reference lines', () => {
    render(
      <DualVelocityStrip
        left={{ velocities: [0.9, 0.85] }}
        right={{ velocities: [0.82, 0.74] }}
        variant="rail"
      />
    )
    expect(barsMatching(LEFT_BARS)).toHaveLength(2)
    expect(screen.queryByTestId('dual-velocity-label-L-0')).not.toBeInTheDocument()
    expect(screen.queryByTestId('dual-velocity-reference-L')).not.toBeInTheDocument()
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
