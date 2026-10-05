import { afterEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AccessibilityInfo, Animated, Platform } from 'react-native'

import { TypingIndicator } from './TypingIndicator'
import { ATHLETE, COACH } from './coach-thread-fixture'

describe('TypingIndicator', () => {
  it('renders nothing while nobody is typing', () => {
    render(<TypingIndicator participants={[]} />)
    expect(screen.queryByTestId('chat-typing-indicator')).toBeNull()
  })

  it('names a single typist', () => {
    render(<TypingIndicator participants={[COACH]} />)
    expect(screen.getByText('Coach is typing')).toBeInTheDocument()
  })

  it('names two typists', () => {
    render(<TypingIndicator participants={[COACH, ATHLETE]} />)
    expect(screen.getByText('Coach and Alex Rivera are typing')).toBeInTheDocument()
  })

  it('counts three or more typists instead of listing them', () => {
    const third = { ...ATHLETE, id: 'third', displayName: 'Sam' }
    render(<TypingIndicator participants={[COACH, ATHLETE, third]} />)
    expect(screen.getByText('3 people are typing')).toBeInTheDocument()
  })

  it('keeps its polite live region mounted while nobody is typing', () => {
    const { rerender } = render(<TypingIndicator participants={[]} />)
    const region = screen.getByTestId('chat-typing-region')
    expect(region).toHaveAttribute('aria-live', 'polite')

    rerender(<TypingIndicator participants={[COACH]} />)
    expect(screen.getByTestId('chat-typing-region')).toBe(region)
    expect(region).toContainElement(screen.getByText('Coach is typing'))
  })

  describe('on iOS', () => {
    const originalOS = Platform.OS
    afterEach(() => {
      Platform.OS = originalOS
      vi.restoreAllMocks()
    })

    it('announces through AccessibilityInfo when someone starts typing', () => {
      Platform.OS = 'ios'
      const announce = vi
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => undefined)
      const { rerender } = render(<TypingIndicator participants={[]} />)
      rerender(<TypingIndicator participants={[COACH]} />)
      rerender(<TypingIndicator participants={[COACH]} />)
      rerender(<TypingIndicator participants={[]} />)
      expect(announce.mock.calls).toEqual([['Coach is typing']])
    })
  })

  describe('pulse and reduced motion', () => {
    const originalMatchMedia = window.matchMedia

    /** Returns a switch that flips the preference and fires the media query's change listeners. */
    function stubReducedMotion(matches: boolean) {
      const listeners = new Set<() => void>()
      const query = {
        matches,
        addEventListener: vi.fn((_: string, listener: () => void) => listeners.add(listener)),
        removeEventListener: vi.fn((_: string, listener: () => void) => listeners.delete(listener)),
      }
      window.matchMedia = vi.fn().mockReturnValue(query) as unknown as typeof window.matchMedia
      return (next: boolean) => {
        query.matches = next
        act(() => listeners.forEach((listener) => listener()))
      }
    }

    function spyOnLoopStops() {
      const realLoop = Animated.loop
      const stops: ReturnType<typeof vi.fn>[] = []
      vi.spyOn(Animated, 'loop').mockImplementation((...args) => {
        const loop = realLoop(...args)
        const stop = vi.fn(loop.stop)
        stops.push(stop)
        return { ...loop, stop }
      })
      return stops
    }

    afterEach(() => {
      vi.restoreAllMocks()
      if (originalMatchMedia) window.matchMedia = originalMatchMedia
      else delete (window as { matchMedia?: unknown }).matchMedia
    })

    it('holds every dot at opacity 1 and starts no loop under reduced motion', () => {
      stubReducedMotion(true)
      const loop = vi.spyOn(Animated, 'loop')
      render(<TypingIndicator participants={[COACH]} />)
      const dots = screen.getAllByTestId('chat-typing-dot')
      expect(dots).toHaveLength(3)
      for (const dot of dots) expect(dot).toHaveStyle({ opacity: 1 })
      expect(loop).not.toHaveBeenCalled()
    })

    it('starts one pulse loop per dot when reduced motion is off', () => {
      stubReducedMotion(false)
      const loop = vi.spyOn(Animated, 'loop')
      render(<TypingIndicator participants={[COACH]} />)
      expect(loop).toHaveBeenCalledTimes(3)
    })

    it('stops the running loops and settles every dot at opacity 1 when reduced motion turns on', () => {
      const setReducedMotion = stubReducedMotion(false)
      const stops = spyOnLoopStops()
      render(<TypingIndicator participants={[COACH]} />)
      expect(stops).toHaveLength(3)

      setReducedMotion(true)

      for (const stop of stops) expect(stop).toHaveBeenCalledTimes(1)
      expect(stops).toHaveLength(3)
      for (const dot of screen.getAllByTestId('chat-typing-dot')) {
        expect(dot).toHaveStyle({ opacity: 1 })
      }
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<TypingIndicator participants={[COACH]} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
