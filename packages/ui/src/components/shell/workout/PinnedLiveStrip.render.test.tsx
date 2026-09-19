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

  it('has no accessibility violations', async () => {
    const { container } = render(ticking(47_000))
    expect(await axe(container)).toHaveNoViolations()
  })
})
