import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { resolveColor } from '../../../theme/resolve-color'
import { PinnedLiveStrip, liveStripRestType, type PinnedLiveStripProps } from './PinnedLiveStrip'
import { LIVE_STRIP_ZONE_TOKEN, type LiveStripRep } from './liveStripModel'
import { LIVE_STRIP_SCENARIOS as S } from './pinnedLiveStrip-fixture'

function renderStrip(props: Partial<PinnedLiveStripProps> & Pick<PinnedLiveStripProps, 'state'>) {
  return render(<PinnedLiveStrip {...S.set} {...props} />)
}

describe('PinnedLiveStrip', () => {
  describe('set in progress', () => {
    it('shows the title, the set line and the rep count against target as the hero', () => {
      render(<PinnedLiveStrip {...S.set} layout="wall" />)
      expect(screen.getByTestId('live-strip-title')).toHaveTextContent('Cable Chest Press')
      expect(screen.getByText('Set 2 of 3 · 140 lb')).toBeInTheDocument()
      expect(screen.getByTestId('live-strip-hero')).toHaveTextContent('5/8')
      expect(screen.getByText('Live set')).toBeInTheDocument()
    })

    it('shows the last rep velocity and one bar per rep plus todo slots to the target', () => {
      render(<PinnedLiveStrip {...S.set} layout="wall" />)
      expect(screen.getByTestId('live-strip-velocity')).toHaveTextContent('0.74 m/s')
      expect(screen.getAllByTestId(/^live-strip-bar-\d+$/)).toHaveLength(5)
      expect(screen.getAllByTestId('live-strip-slot-todo')).toHaveLength(3)
    })

    it('offers a back-to-live affordance and navigates on press', () => {
      const onPress = vi.fn()
      render(<PinnedLiveStrip {...S.set} layout="wall" onPress={onPress} />)
      expect(screen.getByText('Back to live')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('link', { name: /Back to live: Cable Chest Press/ }))
      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('rest', () => {
    it('replaces the rep readout with the countdown and names the next set', () => {
      render(<PinnedLiveStrip {...S.rest} layout="wall" />)
      expect(screen.getByTestId('live-strip-hero')).toHaveTextContent('47s')
      expect(screen.getByText('Rest left')).toBeInTheDocument()
      expect(screen.getByText('Next: set 3 of 3 · 140 lb')).toBeInTheDocument()
      expect(screen.getByText('Last rep, set 2')).toBeInTheDocument()
      expect(screen.queryByText('Reps')).toBeNull()
    })

    it('runs a time-remaining bar along the bottom', () => {
      render(<PinnedLiveStrip {...S.rest} layout="wall" />)
      const bar = screen.getByRole('progressbar', { name: 'Rest remaining' })
      // 47 s left of 90 s: the fill is the remaining fraction.
      expect(bar.firstElementChild).toHaveStyle({ width: `${(47 / 90) * 100}%` })
    })

    it('has no time bar outside rest', () => {
      render(<PinnedLiveStrip {...S.set} layout="wall" />)
      expect(screen.queryByRole('progressbar')).toBeNull()
    })
  })

  describe('fatigue', () => {
    it('signals fatigue with the red edge and the red wash, only when fatigued', () => {
      const { rerender } = render(<PinnedLiveStrip {...S.fatigue} layout="wall" />)
      expect(screen.getByTestId('live-strip-plane')).toHaveStyle({
        borderLeftColor: resolveColor('status-error'),
      })
      expect(screen.getByTestId('live-strip-fatigue-wash')).toBeInTheDocument()

      rerender(<PinnedLiveStrip {...S.fatigue} isFatigued={false} layout="wall" />)
      expect(screen.getByTestId('live-strip-plane')).toHaveStyle({
        borderLeftColor: resolveColor('status-live'),
      })
      expect(screen.queryByTestId('live-strip-fatigue-wash')).toBeNull()
    })

    it('keeps the normal live tag: fatigue does not turn the tag red', () => {
      renderStrip({ ...S.fatigue, layout: 'wall' })
      expect(screen.getByText('Live set')).toHaveStyle({ color: resolveColor('status-success') })
      const dot = screen.getByTestId('live-strip-tag-dot').lastElementChild
      expect(dot).toHaveStyle({ backgroundColor: resolveColor('status-live') })
    })

    it.each(['wall', 'phone'] as const)(
      'title is never truncated by the fatigue state (%s): fatigue adds no text at all',
      (layout) => {
        const plain = renderStrip({ ...S.fatigue, isFatigued: false, layout })
        const plainText = plain.container.textContent
        const plainTitle = screen.getByTestId('live-strip-title').parentElement!.textContent
        plain.unmount()

        renderStrip({ ...S.fatigue, layout })
        expect(screen.getByTestId('live-strip-title')).toHaveTextContent('Cable Chest Press')
        expect(screen.getByTestId('live-strip-title').parentElement!.textContent).toBe(plainTitle)
        expect(document.body.textContent).toBe(plainText)
      }
    )
  })

  describe('idle', () => {
    it('renders nothing when the session is idle', () => {
      const { container } = render(<PinnedLiveStrip {...S.idle} />)
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('zone colour comes from props', () => {
    // A fast velocity tagged with the slowest zone: any velocity-derived colour would disagree.
    const reps: LiveStripRep[] = [
      { velocity: 1.2, zone: 'grinding' },
      { velocity: 0.3, zone: 'speed' },
    ]

    it('colours each bar by its rep zone, not by its velocity', () => {
      renderStrip({ state: 'set', reps, layout: 'wall' })
      expect(screen.getByTestId('live-strip-bar-0')).toHaveStyle({
        backgroundColor: resolveColor(LIVE_STRIP_ZONE_TOKEN.grinding),
      })
      expect(screen.getByTestId('live-strip-bar-1')).toHaveStyle({
        backgroundColor: resolveColor(LIVE_STRIP_ZONE_TOKEN.speed),
      })
    })

    it('colours the last-rep velocity by that rep zone', () => {
      renderStrip({ state: 'set', reps, layout: 'wall' })
      expect(screen.getByTestId('live-strip-velocity')).toHaveStyle({
        color: resolveColor(LIVE_STRIP_ZONE_TOKEN.speed),
      })
    })
  })

  describe('phone layout', () => {
    it('keeps the full title and the short set count on the first line', () => {
      render(<PinnedLiveStrip {...S.set} layout="phone" />)
      expect(screen.getByTestId('live-strip-title')).toHaveTextContent('Cable Chest Press')
      expect(screen.getByText('Set 2/3')).toBeInTheDocument()
      expect(screen.queryByText('Back to live')).toBeNull()
    })

    it.each([
      ['short', S.set],
      ['long', S.longName],
    ] as const)('keeps "Set 2/3" and the chevron pinned after a %s title', (_, scenario) => {
      render(<PinnedLiveStrip {...scenario} layout="phone" />)
      const row = screen.getByTestId('live-strip-title-row')
      const meta = screen.getByTestId('live-strip-meta')
      expect(row.lastElementChild).toBe(meta)
      expect(row.children).toHaveLength(2)
      expect(meta).toHaveTextContent('Set 2/3')
      expect(meta.querySelector('svg')).toBeInTheDocument()
    })

    it('wraps a long title to two lines instead of truncating it at one', () => {
      render(<PinnedLiveStrip {...S.longName} layout="phone" />)
      const title = screen.getByTestId('live-strip-title')
      expect(title).toHaveTextContent('Single-Arm Half-Kneeling Cable Row')
      expect(title).toHaveStyle({ WebkitLineClamp: '2' })
    })

    it('shows the next set during rest', () => {
      render(<PinnedLiveStrip {...S.rest} layout="phone" />)
      expect(screen.getByText('Next 3/3')).toBeInTheDocument()
      expect(screen.getByTestId('live-strip-hero')).toHaveTextContent('47s')
    })
  })

  describe('hero slot', () => {
    // jsdom has no layout, so the no-shift property is asserted on the slot width here and
    // measured in the Lab/Decisions RestPair* captures.
    it.each([
      ['a short rest', S.set, S.rest],
      ['a long rest', S.set, { ...S.rest, restRemainingMs: 150_000, restDurationMs: 180_000 }],
      ['the longest rest', S.set, { ...S.rest, restRemainingMs: 999_000, restDurationMs: 999_000 }],
      ['a 12-rep target', S.setTwoDigit, S.restTwoDigit],
    ] as const)('keeps one width from set to rest with %s', (_, set, rest) => {
      const first = render(<PinnedLiveStrip {...set} layout="wall" />)
      const setWidth = screen.getByTestId('live-strip-hero').style.width
      first.unmount()
      render(<PinnedLiveStrip {...rest} layout="wall" />)
      expect(screen.getByTestId('live-strip-hero').style.width).toBe(setWidth)
    })

    it('widens only for a two-digit rep target', () => {
      const one = render(<PinnedLiveStrip {...S.set} layout="phone" />)
      const oneDigit = parseFloat(screen.getByTestId('live-strip-hero').style.width)
      one.unmount()
      render(<PinnedLiveStrip {...S.setTwoDigit} layout="phone" />)
      expect(parseFloat(screen.getByTestId('live-strip-hero').style.width)).toBeGreaterThan(
        oneDigit
      )
    })

    it('reads a long rest in seconds, never m:ss', () => {
      render(<PinnedLiveStrip {...S.rest} restRemainingMs={150_000} layout="wall" />)
      expect(screen.getByTestId('live-strip-hero')).toHaveTextContent('150s')
    })
  })

  describe('rest type', () => {
    // The rule, value to size token; the fit and the centring are measured in the RestPair captures.
    it.each([
      ['wall', 47_000, 'text-4xl', 0],
      ['wall', 99_000, 'text-4xl', 0],
      ['wall', 150_000, 'text-3xl', 4.2],
      ['wall', 999_000, 'text-3xl', 4.2],
      ['phone', 47_000, 'text-3xl', 0],
      ['phone', 99_000, 'text-3xl', 0],
      ['phone', 150_000, 'text-2xl', 1.4],
      ['phone', 999_000, 'text-2xl', 1.4],
    ] as const)('%s at %ims reads at %s, raised %fpx', (layout, ms, size, raise) => {
      const type = liveStripRestType(layout, ms)
      expect(type.size).toBe(size)
      expect(type.raisePx).toBeCloseTo(raise)
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<PinnedLiveStrip {...S.rest} layout="wall" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
