import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type Listener = () => void

/** A matchMedia stand-in: jsdom has none, and the hook both reads and subscribes. */
function stubMatchMedia(initialMatches: boolean) {
  const listeners = new Set<Listener>()
  const mq = {
    matches: initialMatches,
    addEventListener: (_event: string, listener: Listener) => void listeners.add(listener),
    removeEventListener: (_event: string, listener: Listener) => void listeners.delete(listener),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mq)
  )
  return {
    setMatches(next: boolean) {
      mq.matches = next
      for (const listener of listeners) listener()
    },
    listenerCount: () => listeners.size,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('usePrefersReducedMotion', () => {
  it('reports the preference the platform already holds on first render', () => {
    stubMatchMedia(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('reports false when the platform does not ask for reduced motion', () => {
    stubMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('follows the preference when the user changes it mid-session', () => {
    const media = stubMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    act(() => media.setMatches(true))
    expect(result.current).toBe(true)
  })

  it('stops listening on unmount', () => {
    const media = stubMatchMedia(false)
    const { unmount } = renderHook(() => usePrefersReducedMotion())
    expect(media.listenerCount()).toBe(1)
    unmount()
    expect(media.listenerCount()).toBe(0)
  })

  it('falls back to false where matchMedia is absent (jsdom default, SSR)', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })
})
