import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { composeStories } from '@storybook/react-vite'
import preview from '../../../../.storybook/preview'
import { contrast } from '../../../theme/color-story-kit'
import type { ThemeMode } from '../../../theme/tokens/semantic'
import { SurfaceContext } from '../../ui/surface/SurfaceContext'
import { DualPinnedLiveStrip } from './DualPinnedLiveStrip'
import { DUAL_STRIP_SCENARIOS as S } from './dualPinnedLiveStrip-fixture'
import * as stories from './DualPinnedLiveStrip.stories'

const charts = vi.hoisted(() => ({ count: 0 }))

vi.mock('../../custom/Workout/VelocityStrip', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../custom/Workout/VelocityStrip')>()
  return {
    ...actual,
    DualVelocityStrip: (props: Parameters<typeof actual.DualVelocityStrip>[0]) => {
      charts.count += 1
      return <actual.DualVelocityStrip {...props} />
    },
  }
})

const composed = composeStories(stories, { decorators: preview.decorators })
const nameOf = () => screen.getByTestId('dual-pinned-live-strip').getAttribute('aria-label')

describe('DualPinnedLiveStrip stories', () => {
  it.each(Object.entries(composed))('%s renders the strip', (_name, Story) => {
    render(<Story />)
    expect(screen.getByTestId('dual-pinned-live-strip')).toBeInTheDocument()
  })
})

describe('DualPinnedLiveStrip mid set', () => {
  it('draws the shared fields once and each side in its own lane', () => {
    render(<DualPinnedLiveStrip {...S.set} layout="wall" />)
    expect(screen.getAllByText('Cable Chest Press')).toHaveLength(1)
    expect(screen.getAllByText('Set 2 of 3')).toHaveLength(1)
    expect(screen.getByTestId('dual-strip-reps-left')).toHaveTextContent('5/8')
    expect(screen.getByTestId('dual-strip-reps-right')).toHaveTextContent('4/8')
    expect(screen.getByTestId('dual-strip-velocity-right')).toHaveTextContent('0.71 m/s')
  })

  it('names each side and its own load at the wall', () => {
    render(<DualPinnedLiveStrip {...S.set} layout="wall" />)
    expect(screen.getByTestId('dual-strip-name-left')).toHaveTextContent('Left arm · 145 lb')
    expect(screen.getByTestId('dual-strip-name-right')).toHaveTextContent('Right arm · 140 lb')
  })

  it('falls back to the side when no name was set', () => {
    render(<DualPinnedLiveStrip {...S.noNames} layout="wall" />)
    expect(screen.getByTestId('dual-strip-name-left')).toHaveTextContent('Left')
    expect(screen.getByTestId('dual-strip-name-right')).toHaveTextContent('Right')
  })

  it('drops the name and load on a phone, keeping them in the accessible name', () => {
    render(<DualPinnedLiveStrip {...S.set} layout="phone" />)
    expect(screen.queryByTestId('dual-strip-name-left')).not.toBeInTheDocument()
    expect(screen.queryByText(/145 lb/)).not.toBeInTheDocument()
    expect(nameOf()).toMatch(/Left arm 145 lb 5 of 8 reps/)
  })

  it('shows a side at zero reps with its count and no velocity', () => {
    render(<DualPinnedLiveStrip {...S.noNames} layout="wall" />)
    expect(screen.getByTestId('dual-strip-reps-right')).toHaveTextContent('0/8')
    expect(screen.queryByTestId('dual-strip-velocity-right')).not.toBeInTheDocument()
  })

  it('counts against a two-digit target', () => {
    render(<DualPinnedLiveStrip {...S.longNames} layout="phone" />)
    expect(screen.getByTestId('dual-strip-reps-left')).toHaveTextContent('11/12')
    expect(screen.getByTestId('dual-strip-reps-right')).toHaveTextContent('9/12')
  })
})

describe('DualPinnedLiveStrip in rest', () => {
  it.each(['wall', 'phone'] as const)(
    'draws one unlabelled countdown and only the chart beside it (%s)',
    (layout) => {
      render(<DualPinnedLiveStrip {...S.rest} layout={layout} />)
      expect(screen.getAllByTestId('live-strip-hero')).toHaveLength(1)
      expect(screen.getByTestId('live-strip-hero')).toHaveTextContent('47s')
      expect(screen.queryByText(/rest left/i)).not.toBeInTheDocument()
      expect(screen.queryByTestId('dual-strip-name-left')).not.toBeInTheDocument()
      expect(screen.queryByTestId('dual-strip-velocity-left')).not.toBeInTheDocument()
      expect(screen.queryByTestId('dual-strip-reps-left')).not.toBeInTheDocument()
      expect(screen.getByTestId('dual-velocity-strip')).toBeInTheDocument()
    }
  )

  it('reads the rest ceiling', () => {
    render(<DualPinnedLiveStrip {...S.longRest} layout="wall" />)
    expect(screen.getByTestId('live-strip-hero')).toHaveTextContent('999s')
    expect(nameOf()).toMatch(/999 seconds rest left/)
  })

  it('does not redraw the chart when only the countdown ticks', () => {
    const at = (ms: number) => (
      <DualPinnedLiveStrip
        {...S.rest}
        restRemainingMs={ms}
        lossThresholds={[10, 20, 30]}
        layout="wall"
      />
    )
    const { rerender } = render(at(47_000))
    const afterMount = charts.count
    rerender(at(46_000))
    rerender(at(45_000))
    expect(screen.getByTestId('live-strip-hero')).toHaveTextContent('45s')
    expect(charts.count).toBe(afterMount)
  })
})

describe('DualPinnedLiveStrip fatigue and drops', () => {
  it('reddens the whole strip and says which side fatigued', () => {
    render(<DualPinnedLiveStrip {...S.fatigueRight} layout="wall" />)
    expect(nameOf()).toMatch(/Bench R 140 lb 5 of 8 reps last rep 0\.55 m\/s fatigued/)
    expect(nameOf()).not.toMatch(/Bench L[^,]*fatigued/)
    expect(screen.getByTestId('live-strip-fatigue-wash')).toBeInTheDocument()
  })

  it('keeps a dropped side, fades only its wing and names it disconnected', () => {
    render(<DualPinnedLiveStrip {...S.rightDropped} layout="wall" />)
    expect(screen.getByTestId('dual-velocity-wing-down')).toHaveStyle({ opacity: '0.35' })
    expect(screen.getByTestId('dual-velocity-wing-up')).not.toHaveStyle({ opacity: '0.35' })
    expect(nameOf()).toMatch(/Bench R .*disconnected/)
  })
})

describe('DualPinnedLiveStrip unbound slots and bad velocity', () => {
  it.each(['left', 'right'] as const)(
    'draws an unbound %s slot as an empty side under its fallback name',
    (side) => {
      render(<DualPinnedLiveStrip {...S.set} {...{ [side]: undefined }} layout="wall" />)
      const fallback = side === 'left' ? 'Left' : 'Right'
      expect(screen.getByTestId(`dual-strip-name-${side}`)).toHaveTextContent(fallback)
      expect(screen.getByTestId(`dual-strip-reps-${side}`)).toHaveTextContent('0/8')
      expect(screen.queryByTestId(`dual-strip-velocity-${side}`)).not.toBeInTheDocument()
    }
  )

  it('reads a slot with no reps as zero reps', () => {
    render(<DualPinnedLiveStrip {...S.set} left={{}} right={{ label: 'Bench R' }} layout="phone" />)
    expect(screen.getByTestId('dual-strip-reps-left')).toHaveTextContent('0/8')
    expect(nameOf()).toMatch(/Left 0 of 8 reps, Bench R 0 of 8 reps$/)
  })

  it.each([NaN, Infinity, -Infinity])(
    'shows no last-rep velocity for %s, in the numeral or the name',
    (velocity) => {
      const reps = [...S.set.left!.reps!, { velocity, zone: 'power' as const }]
      render(<DualPinnedLiveStrip {...S.set} left={{ ...S.set.left, reps }} layout="wall" />)
      expect(screen.getByTestId('dual-strip-reps-left')).toHaveTextContent('6/8')
      expect(screen.queryByTestId('dual-strip-velocity-left')).not.toBeInTheDocument()
      expect(nameOf()).not.toMatch(/NaN|Infinity/)
      expect(nameOf()).toMatch(/Left arm 145 lb 6 of 8 reps, Right arm/)
    }
  )

  it('hides the chart from assistive tech so the strip is read once', () => {
    render(<DualPinnedLiveStrip {...S.set} layout="wall" />)
    expect(screen.getByTestId('dual-strip-bars-frame')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })
})

describe('DualPinnedLiveStrip roles', () => {
  it('renders nothing when idle', () => {
    render(<DualPinnedLiveStrip {...S.set} state="idle" layout="wall" />)
    expect(screen.queryByTestId('dual-pinned-live-strip')).not.toBeInTheDocument()
  })

  it('is a link back to live given onPress, and a summary without it', () => {
    const { rerender } = render(<DualPinnedLiveStrip {...S.set} layout="wall" onPress={() => {}} />)
    expect(screen.getByRole('link')).toHaveAccessibleName(
      /^Back to live: Live set, Cable Chest Press/
    )
    rerender(<DualPinnedLiveStrip {...S.set} layout="wall" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it.each(['set', 'rest'] as const)('has no accessibility violations (%s)', async (key) => {
    const { container } = render(
      <DualPinnedLiveStrip {...S[key]} layout="phone" onPress={() => {}} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

const hexOf = (css: string) =>
  '#' +
  (css.match(/\d+/g) ?? [])
    .slice(0, 3)
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('')

function renderIn(mode: ThemeMode) {
  render(
    <SurfaceContext.Provider value={{ mode, level: 'base' }}>
      <DualPinnedLiveStrip {...S.set} layout="phone" />
    </SurfaceContext.Provider>
  )
  return getComputedStyle(screen.getByTestId('live-strip-plane')).backgroundColor
}

// Owner Gate 2 round 1 (VW-877): the right arm's missed fifth rep was a near-white slot on white.
describe('DualPinnedLiveStrip missed rep', () => {
  it.each(['light', 'dark'] as const)('rings it at 3:1 against the card (%s)', (mode) => {
    const card = hexOf(renderIn(mode))
    const [missed] = screen.getAllByTestId('velocity-slot-empty')
    const ring = getComputedStyle(missed)
    expect(parseFloat(ring.borderTopWidth)).toBeGreaterThanOrEqual(1)
    expect(contrast(hexOf(ring.borderTopColor), card)).toBeGreaterThanOrEqual(3)
  })
})

describe('DualPinnedLiveStrip bar shadow', () => {
  const shadowOf = () => screen.getAllByTestId('velocity-bar-0')[0].style.boxShadow

  it('keeps only a contact shadow on a light card', () => {
    renderIn('light')
    expect(shadowOf()).toMatch(/^0 1px 2px rgba\(0, ?0, ?0, ?0\.12\)$/)
  })

  it('keeps the paper drop shadow on a dark card', () => {
    renderIn('dark')
    expect(shadowOf()).toContain('0 6px 16px rgba(0,0,0,0.45)')
  })
})
