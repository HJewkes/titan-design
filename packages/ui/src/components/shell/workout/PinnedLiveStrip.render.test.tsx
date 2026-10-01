/**
 * A consumer ticks `restRemainingMs` every second; only the numeral should redraw. The bar
 * plot is counted by wrapping SetBarChart, which leaves what it renders untouched.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { PinnedLiveStrip } from './PinnedLiveStrip'
import { LIVE_STRIP_SCENARIOS as S } from './pinnedLiveStrip-fixture'

const plots = vi.hoisted(() => ({ count: 0 }))

vi.mock('../../custom/charts/SetBarChart', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../custom/charts/SetBarChart')>()
  return {
    ...actual,
    SetBarChart: (props: Parameters<typeof actual.SetBarChart>[0]) => {
      plots.count += 1
      return <actual.SetBarChart {...props} />
    },
  }
})

function ticking(restRemainingMs: number, extra: object = {}) {
  // A fresh thresholds array each tick, as a consumer building props inline would pass.
  return (
    <PinnedLiveStrip
      {...S.rest}
      restRemainingMs={restRemainingMs}
      lossThresholds={[10, 20, 30]}
      layout="wall"
      {...extra}
    />
  )
}

describe('PinnedLiveStrip re-rendering', () => {
  it('does not redraw the bar plot when only the rest countdown ticks', () => {
    const { rerender } = render(ticking(47_000))
    const afterMount = plots.count
    rerender(ticking(46_000))
    rerender(ticking(45_000))
    expect(screen.getByTestId('live-strip-hero')).toHaveTextContent('45s')
    expect(plots.count).toBe(afterMount)
  })

  it('does not redraw the bar plot for a new reps array with the same reps', () => {
    const { rerender } = render(ticking(47_000))
    const afterMount = plots.count
    rerender(ticking(46_000, { reps: S.rest.reps.map((rep) => ({ ...rep })) }))
    expect(plots.count).toBe(afterMount)
  })

  it('redraws the bar plot when one rep changes its zone', () => {
    const { rerender } = render(ticking(47_000))
    const afterMount = plots.count
    const reps = S.rest.reps.map((rep, i) => (i === 0 ? { ...rep, zone: 'speed' as const } : rep))
    rerender(ticking(46_000, { reps }))
    expect(plots.count).toBe(afterMount + 1)
  })

  it('redraws the bar plot when the reps change', () => {
    const { rerender } = render(ticking(47_000))
    const afterMount = plots.count
    rerender(ticking(46_000, { reps: [...S.rest.reps, { velocity: 0.7 }] }))
    expect(plots.count).toBe(afterMount + 1)
  })

  it('redraws the bar plot when a threshold changes', () => {
    const { rerender } = render(ticking(47_000))
    const afterMount = plots.count
    rerender(ticking(46_000, { lossThresholds: [5, 20, 30] }))
    expect(plots.count).toBe(afterMount + 1)
  })

  it('relabels the set line, not the bar plot, when the target source changes', () => {
    const { rerender } = render(ticking(47_000))
    const afterMount = plots.count
    rerender(ticking(46_000, { targetSource: 'last-time' }))
    expect(screen.getByText('Next: set 3 of 3 · last time · 140 lb')).toBeInTheDocument()
    expect(screen.getByTestId('pinned-live-strip')).toHaveAccessibleName(
      /, targets from last time$/
    )
    expect(plots.count).toBe(afterMount)
  })

  it('renders "plan" byte for byte as an omitted target source', () => {
    const omitted = render(ticking(47_000)).container.innerHTML
    const plan = render(ticking(47_000, { targetSource: 'plan' })).container.innerHTML
    expect(plan).toBe(omitted)
  })

  it('has no accessibility violations with last-time targets', async () => {
    const { container } = render(ticking(47_000, { targetSource: 'last-time' }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(ticking(47_000))
    expect(await axe(container)).toHaveNoViolations()
  })
})
