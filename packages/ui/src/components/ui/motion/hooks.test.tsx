import { act, render, renderHook } from '@testing-library/react'
import { useContext, type ReactNode } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { AccessibilityInfo, Platform } from 'react-native'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fakeRaf } from '../../../test/fake-raf'
import { REDUCED_MOTION_END_S, seekClock, type Clock } from './clocks'
import { localTime, useLocalTime, useMotionTime, useWaitUntil } from './hooks'
import { MotionContext, MotionProvider } from './MotionProvider'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, addEventListener: () => {}, removeEventListener: () => {} }))
  )
}

function withClock(clock: Clock) {
  return function Wrapper({ children }: { children?: ReactNode }) {
    return <MotionProvider clock={clock}>{children}</MotionProvider>
  }
}

function Progress({ startS = 0, durationS = 1 }: { startS?: number; durationS?: number }) {
  return <>{useLocalTime(startS, durationS).progress}</>
}

describe('localTime', () => {
  it.each([
    { raw: -0.5, durationS: 2, t: 0, progress: 0, phase: 'before' },
    { raw: -1e-9, durationS: 2, t: 0, progress: 0, phase: 'before' },
    { raw: 0, durationS: 2, t: 0, progress: 0, phase: 'during' },
    { raw: 1, durationS: 2, t: 1, progress: 0.5, phase: 'during' },
    { raw: 1.999, durationS: 2, t: 1.999, progress: 0.9995, phase: 'during' },
    { raw: 2, durationS: 2, t: 2, progress: 1, phase: 'after' },
    { raw: 7, durationS: 2, t: 2, progress: 1, phase: 'after' },
    { raw: -1, durationS: 0, t: 0, progress: 0, phase: 'before' },
    { raw: 0, durationS: 0, t: 0, progress: 1, phase: 'after' },
  ] as const)(
    'raw $raw of $durationS s is $phase at progress $progress',
    ({ raw, durationS, ...expected }) => {
      const result = localTime(raw, durationS)
      expect(result.phase).toBe(expected.phase)
      expect(result.t).toBeCloseTo(expected.t, 10)
      expect(result.progress).toBeCloseTo(expected.progress, 10)
    }
  )
})

describe('without a provider', () => {
  it('useMotionTime advances with requestAnimationFrame from mount', () => {
    const raf = fakeRaf()
    const { result } = renderHook(() => useMotionTime())
    act(() => raf.frame(1000))
    expect(result.current).toBe(0)
    act(() => raf.frame(1500))
    expect(result.current).toBe(0.5)
  })

  it('useLocalTime stops requesting frames once its window has ended', () => {
    const raf = fakeRaf()
    const { result } = renderHook(() => useLocalTime(0.2, 1))
    act(() => raf.frame(0))
    act(() => raf.frame(800))
    expect(result.current).toEqual({
      t: expect.closeTo(0.6, 10),
      progress: expect.closeTo(0.6, 10),
      phase: 'during',
    })
    expect(raf.pending()).toBe(1)
    act(() => raf.frame(1300))
    expect(result.current).toEqual({ t: 1, progress: 1, phase: 'after' })
    expect(raf.pending()).toBe(0)
  })

  it('jumps to the end under the web reduced-motion preference, requesting no frames', () => {
    stubReducedMotion(true)
    const raf = fakeRaf()
    const { result } = renderHook(() => useLocalTime(0, 1))
    expect(result.current.phase).toBe('after')
    expect(renderedMotionTime()).toBe(REDUCED_MOTION_END_S)
    expect(raf.pending()).toBe(0)
  })

  it('jumps to the end under the native reduced-motion setting', async () => {
    vi.stubGlobal('matchMedia', undefined)
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true)
    const raf = fakeRaf()
    const originalOS = Platform.OS
    Platform.OS = 'ios'
    try {
      const { result } = renderHook(() => useLocalTime(0, 1))
      await act(async () => {})
      expect(result.current).toEqual({ t: 1, progress: 1, phase: 'after' })
      expect(raf.pending()).toBe(0)
    } finally {
      Platform.OS = originalOS
    }
  })

  it('renders the end state on the server', () => {
    expect(renderToString(<Progress startS={0.5} durationS={2} />)).toBe('1')
  })

  it('keeps the end state after hydrating server HTML instead of replaying the entrance', () => {
    const raf = fakeRaf()
    const container = document.createElement('div')
    container.innerHTML = renderToString(<Progress />)
    document.body.append(container)
    let root: Root | undefined
    act(() => {
      root = hydrateRoot(container, <Progress />)
    })
    act(() => raf.frame(0))
    expect(container.textContent).toBe('1')
    expect(raf.pending()).toBe(0)
    act(() => root?.unmount())
    container.remove()
  })
})

/** The provider-less clock seconds under whatever globals the test stubbed. */
function renderedMotionTime(): number {
  return renderHook(() => useMotionTime()).result.current
}

describe('under a seek-clock provider', () => {
  it('reports the last seek, and requests no frames', () => {
    const raf = fakeRaf()
    const clock = seekClock()
    const { result } = renderHook(() => useLocalTime(1, 2), { wrapper: withClock(clock) })
    act(() => clock.seek(3))
    act(() => clock.seek(1.5))
    expect(result.current).toEqual({ t: 0.5, progress: 0.25, phase: 'during' })
    expect(raf.pending()).toBe(0)
  })

  it('ignores the reduced-motion preference, so a render is the same on every host', () => {
    stubReducedMotion(true)
    const { result } = renderHook(() => useLocalTime(0, 1), { wrapper: withClock(seekClock(0.25)) })
    expect(result.current.progress).toBe(0.25)
  })

  it('renders the seek time on the server', () => {
    const html = renderToString(
      <MotionProvider clock={seekClock(0.5)}>
        <Progress />
      </MotionProvider>
    )
    expect(html).toBe('0.5')
  })
})

describe('useWaitUntil', () => {
  function Waits({
    promise,
    onWaits,
  }: {
    promise: Promise<unknown>
    onWaits: (w: Set<Promise<unknown>>) => void
  }) {
    useWaitUntil(promise)
    const ctx = useContext(MotionContext)
    if (ctx) onWaits(ctx.waits)
    return null
  }

  it('holds the promise on the provider while mounted', () => {
    const promise = Promise.resolve()
    let waits = new Set<Promise<unknown>>()
    const { unmount } = render(
      <MotionProvider clock={seekClock()}>
        <Waits promise={promise} onWaits={(w) => (waits = w)} />
      </MotionProvider>
    )
    expect(waits.has(promise)).toBe(true)
    unmount()
    expect(waits.has(promise)).toBe(false)
  })

  it('does nothing without a provider', () => {
    expect(() => renderHook(() => useWaitUntil(Promise.resolve()))).not.toThrow()
  })
})
