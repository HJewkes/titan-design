import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SetStrip, velocityZoneColor, SET_STRIP_ZONES, type SetStripSet } from './SetStrip'

describe('SetStrip', () => {
  describe('velocityZoneColor', () => {
    it('maps velocity ratios to their zone pins', () => {
      expect(velocityZoneColor(0.4)).toBe(SET_STRIP_ZONES.slow)
      expect(velocityZoneColor(0.6)).toBe(SET_STRIP_ZONES.moderate)
      expect(velocityZoneColor(0.85)).toBe(SET_STRIP_ZONES.fast)
      expect(velocityZoneColor(1.2)).toBe(SET_STRIP_ZONES.fastest)
    })

    it('uses the real titan ramp pins (not ad-hoc hexes)', () => {
      expect(SET_STRIP_ZONES.slow).toBe('#D14343') // red 600
      expect(SET_STRIP_ZONES.moderate).toBe('#FF7900') // orange 400
      expect(SET_STRIP_ZONES.fast).toBe('#F9B415') // amber 300
      expect(SET_STRIP_ZONES.fastest).toBe('#2ED573') // green 300
    })
  })

  it('renders one bar per set', () => {
    const sets: SetStripSet[] = [
      { status: 'done', velocities: [1, 0.9] },
      { status: 'done', velocities: [0.8] },
    ]
    render(<SetStrip sets={sets} />)
    expect(screen.getAllByTestId('set-strip-set')).toHaveLength(2)
  })

  describe('set statuses', () => {
    it('done: one colored fill segment per rep, no empties, no pulse', () => {
      render(<SetStrip sets={[{ status: 'done', velocities: [1, 0.8, 0.6, 0.4] }]} />)
      expect(screen.getAllByTestId('set-strip-fill')).toHaveLength(4)
      expect(screen.queryByTestId('set-strip-empty')).not.toBeInTheDocument()
      expect(screen.queryByTestId('set-strip-pulse')).not.toBeInTheDocument()
    })

    it('active: performed reps pulse, the remainder is greyed', () => {
      render(<SetStrip sets={[{ status: 'active', velocities: [0.9, 0.7, 0.5], planned: 8 }]} />)
      expect(screen.getAllByTestId('set-strip-pulse')).toHaveLength(3)
      expect(screen.getAllByTestId('set-strip-empty')).toHaveLength(5)
    })

    it('todo: a single grey bar, no fills or pulses', () => {
      render(<SetStrip sets={[{ status: 'todo', planned: 10 }]} />)
      expect(screen.getAllByTestId('set-strip-empty')).toHaveLength(1)
      expect(screen.queryByTestId('set-strip-fill')).not.toBeInTheDocument()
      expect(screen.queryByTestId('set-strip-pulse')).not.toBeInTheDocument()
    })
  })

  it('defaults to an 8px height and honors the height prop', () => {
    const sets: SetStripSet[] = [{ status: 'todo', planned: 3 }]
    const { rerender } = render(<SetStrip sets={sets} />)
    expect(screen.getByTestId('set-strip')).toHaveStyle({ height: '8px' })
    rerender(<SetStrip sets={sets} height={4} />)
    expect(screen.getByTestId('set-strip')).toHaveStyle({ height: '4px' })
  })

  it('exposes a set-progress summary label', () => {
    const sets: SetStripSet[] = [
      { status: 'done', velocities: [1] },
      { status: 'active', velocities: [0.9], planned: 3 },
      { status: 'todo', planned: 3 },
    ]
    render(<SetStrip sets={sets} />)
    expect(
      screen.getByLabelText('Set progress: 1 done, 1 in progress, 1 upcoming')
    ).toBeInTheDocument()
  })

  it('categorises set-type variants in the progress summary', () => {
    // drop + myo read as done · a started range reads in progress · myo-upcoming reads upcoming
    const sets: SetStripSet[] = [
      { status: 'drop', subloads: [[0.8], [0.7]] },
      { status: 'myo', activation: [0.75], clusters: [[0.6]] },
      { status: 'range', floor: 15, max: 20, doneVels: [0.9, 0.85] },
      { status: 'myo-upcoming', activationLen: 12 },
    ]
    render(<SetStrip sets={sets} />)
    expect(
      screen.getByLabelText('Set progress: 2 done, 1 in progress, 1 upcoming')
    ).toBeInTheDocument()
  })

  it('renders one bar per set across mixed set-type variants', () => {
    const sets: SetStripSet[] = [
      { status: 'drop', subloads: [[0.8, 0.7], [0.6]] },
      { status: 'range', floor: 3, max: 5, doneVels: [] },
    ]
    render(<SetStrip sets={sets} />)
    expect(screen.getAllByTestId('set-strip-set')).toHaveLength(2)
  })

  describe('prescribed rep range (VMCP-03.04)', () => {
    it('todo: renders the range when both bounds are given', () => {
      render(<SetStrip sets={[{ status: 'todo', planned: 10, repsLow: 8, repsHigh: 12 }]} />)
      expect(screen.getByTestId('set-strip-reps-label')).toHaveTextContent('8–12')
    })

    it('active: renders a single number when the bounds are equal or only one is given', () => {
      const { rerender } = render(
        <SetStrip
          sets={[{ status: 'active', velocities: [0.9], planned: 8, repsLow: 8, repsHigh: 8 }]}
        />
      )
      expect(screen.getByTestId('set-strip-reps-label')).toHaveTextContent('8')
      rerender(
        <SetStrip sets={[{ status: 'active', velocities: [0.9], planned: 8, repsLow: 8 }]} />
      )
      expect(screen.getByTestId('set-strip-reps-label')).toHaveTextContent('8')
    })

    it('renders no label when neither bound is given', () => {
      render(<SetStrip sets={[{ status: 'todo', planned: 10 }]} />)
      expect(screen.queryByTestId('set-strip-reps-label')).not.toBeInTheDocument()
    })
  })

  describe('expected rep range (VW-301)', () => {
    it('prescribed-only: renders the prescribed label without an expected label', () => {
      render(<SetStrip sets={[{ status: 'todo', planned: 10, repsLow: 8, repsHigh: 12 }]} />)
      expect(screen.getByTestId('set-strip-reps-label')).toHaveTextContent('8–12')
      expect(screen.queryByTestId('set-strip-expected-label')).not.toBeInTheDocument()
    })

    it('expected-only: renders the expected label without a prescribed label', () => {
      render(
        <SetStrip
          sets={[{ status: 'todo', planned: 10, expectedRange: { low: 5, high: 15, n: 12 } }]}
        />
      )
      expect(screen.queryByTestId('set-strip-reps-label')).not.toBeInTheDocument()
      expect(screen.getByTestId('set-strip-expected-label')).toHaveTextContent('~5–15 expected')
    })

    it('both: renders the prescribed and expected labels side by side, visually distinct', () => {
      render(
        <SetStrip
          sets={[
            {
              status: 'active',
              velocities: [0.9],
              planned: 10,
              repsLow: 8,
              repsHigh: 12,
              expectedRange: { low: 5, high: 15, n: 12 },
            },
          ]}
        />
      )
      const prescribed = screen.getByTestId('set-strip-reps-label')
      const expected = screen.getByTestId('set-strip-expected-label')
      expect(prescribed).toHaveTextContent('8–12')
      expect(expected).toHaveTextContent('~5–15 expected')
      // Both render as separate elements (distinct testIDs) rather than one merged
      // string — the visual weight difference (2xs/secondary/semibold vs. 3xs/tertiary/
      // regular, see SetStrip's docblock) is a Storybook/visual concern; nativewind is
      // stubbed out under vitest (see vitest.config.ts), so className/style aren't
      // meaningful to assert on here.
      expect(prescribed).not.toBe(expected)
    })

    it('exposes the sample size to screen readers even though the visible label omits it', () => {
      render(
        <SetStrip
          sets={[{ status: 'todo', planned: 10, expectedRange: { low: 5, high: 15, n: 12 } }]}
        />
      )
      expect(screen.getByLabelText('Expected 5–15 reps, from 12 sets')).toBeInTheDocument()
    })

    it('renders no expected label when the set has no expectedRange', () => {
      render(<SetStrip sets={[{ status: 'todo', planned: 10 }]} />)
      expect(screen.queryByTestId('set-strip-expected-label')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const sets: SetStripSet[] = [
        { status: 'done', velocities: [1, 0.8] },
        { status: 'active', velocities: [0.9], planned: 3 },
        { status: 'todo', planned: 3 },
      ]
      const { container } = render(<SetStrip sets={sets} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
