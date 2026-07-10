import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer, formatDuration } from './useTimer'

describe('formatDuration', () => {
  it('formats zero as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('pads seconds with a leading zero', () => {
    expect(formatDuration(65000)).toBe('1:05')
  })

  it('rounds partial seconds up', () => {
    expect(formatDuration(4500)).toBe('0:05')
  })

  it('clamps negative input to 0:00', () => {
    expect(formatDuration(-1000)).toBe('0:00')
  })

  it('formats multi-minute durations', () => {
    expect(formatDuration(150000)).toBe('2:30')
  })
})

describe('useTimer (controlled, down)', () => {
  it('derives remaining, progress, and label from elapsedMs', () => {
    const { result } = renderHook(() =>
      useTimer({ mode: 'down', durationMs: 100000, elapsedMs: 30000 })
    )
    expect(result.current.remainingMs).toBe(70000)
    expect(result.current.progress).toBeCloseTo(0.3)
    expect(result.current.label).toBe('1:10')
    expect(result.current.done).toBe(false)
  })

  it('clamps remaining to 0 and progress to 1 when elapsed exceeds duration', () => {
    const { result } = renderHook(() =>
      useTimer({ mode: 'down', durationMs: 100000, elapsedMs: 200000 })
    )
    expect(result.current.remainingMs).toBe(0)
    expect(result.current.progress).toBe(1)
    expect(result.current.label).toBe('0:00')
    expect(result.current.done).toBe(true)
  })

  it('reports progress 1 and done for a zero-duration countdown', () => {
    const { result } = renderHook(() => useTimer({ mode: 'down', durationMs: 0, elapsedMs: 0 }))
    expect(result.current.progress).toBe(1)
    expect(result.current.done).toBe(true)
    expect(result.current.label).toBe('0:00')
  })
})

describe('useTimer (controlled, up)', () => {
  it('counts elapsed upward and computes progress against duration', () => {
    const { result } = renderHook(() =>
      useTimer({ mode: 'up', durationMs: 120000, elapsedMs: 30000 })
    )
    expect(result.current.elapsedMs).toBe(30000)
    expect(result.current.progress).toBeCloseTo(0.25)
    expect(result.current.label).toBe('0:30')
  })

  it('reports progress 0 and never done without a duration', () => {
    const { result } = renderHook(() => useTimer({ mode: 'up', elapsedMs: 45000 }))
    expect(result.current.progress).toBe(0)
    expect(result.current.done).toBe(false)
    expect(result.current.label).toBe('0:45')
  })
})

describe('useTimer (self-ticking)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('advances elapsed on each interval while running', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useTimer({ mode: 'up', autoTick: true, running: true, tickMs: 1000 })
    )
    expect(result.current.elapsedMs).toBe(0)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.elapsedMs).toBe(3000)
  })

  it('counts a down-timer toward 0 and reports done', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useTimer({ mode: 'down', durationMs: 3000, autoTick: true, running: true })
    )
    expect(result.current.label).toBe('0:03')
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.remainingMs).toBe(0)
    expect(result.current.label).toBe('0:00')
    expect(result.current.done).toBe(true)
  })

  it('does not tick when not running', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTimer({ mode: 'up', autoTick: true, running: false }))
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.elapsedMs).toBe(0)
  })

  it('does not tick when a controlled elapsedMs is supplied', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useTimer({ mode: 'up', autoTick: true, running: true, elapsedMs: 10000 })
    )
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.elapsedMs).toBe(10000)
  })

  it('clears the interval on unmount', () => {
    vi.useFakeTimers()
    const clearSpy = vi.spyOn(global, 'clearInterval')
    const { unmount } = renderHook(() => useTimer({ mode: 'up', autoTick: true, running: true }))
    unmount()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it('stops ticking after running flips to false', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ running }) => useTimer({ mode: 'up', autoTick: true, running }),
      { initialProps: { running: true } }
    )
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.elapsedMs).toBe(2000)
    rerender({ running: false })
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.elapsedMs).toBe(2000)
  })
})
