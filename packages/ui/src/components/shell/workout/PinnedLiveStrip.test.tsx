import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { resolveColor } from '../../../theme/resolve-color'
import { PinnedLiveStrip, type PinnedLiveStripProps } from './PinnedLiveStrip'
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
      expect(screen.getByTestId('live-strip-hero')).toHaveTextContent('0:47')
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
    it('signals fatigue with the strip colour: the error wash is on only when fatigued', () => {
      const { rerender } = render(<PinnedLiveStrip {...S.fatigue} layout="wall" />)
      expect(screen.getByTestId('live-strip-fatigue-wash')).toBeInTheDocument()
      rerender(<PinnedLiveStrip {...S.fatigue} isFatigued={false} layout="wall" />)
      expect(screen.queryByTestId('live-strip-fatigue-wash')).toBeNull()
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

    it('shows the next set during rest', () => {
      render(<PinnedLiveStrip {...S.rest} layout="phone" />)
      expect(screen.getByText('Next 3/3')).toBeInTheDocument()
      expect(screen.getByTestId('live-strip-hero')).toHaveTextContent('0:47')
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<PinnedLiveStrip {...S.rest} layout="wall" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
