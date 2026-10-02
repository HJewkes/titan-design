import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { CHART_ENTRANCE, drawStyle, fadeStyle, popStyle, useChartEntrance } from './chartEntrance'

let frames: FrameRequestCallback[] = []

function flushFrames(): void {
  act(() => {
    while (frames.length > 0) {
      const pending = frames
      frames = []
      pending.forEach((frame) => frame(0))
    }
  })
}

function stubReducedMotion(reduce: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: reduce,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  )
}

beforeEach(() => {
  frames = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  stubReducedMotion(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const before = { enabled: true, played: false }
const after = { enabled: true, played: true }

describe('useChartEntrance', () => {
  it('starts unplayed and plays after two frames', () => {
    const { result } = renderHook(() => useChartEntrance(true))
    expect(result.current).toEqual({ enabled: true, played: false })
    flushFrames()
    expect(result.current).toEqual({ enabled: true, played: true })
  })

  it('is disabled, with empty styles, when animate is false', () => {
    const { result } = renderHook(() => useChartEntrance(false))
    expect(result.current).toEqual({ enabled: false, played: true })
    expect(frames).toHaveLength(0)
    expect(drawStyle(result.current)).toEqual({})
    expect(fadeStyle(result.current)).toEqual({})
    expect(popStyle(result.current)).toEqual({})
  })

  it('is disabled, with empty styles, under reduced motion', () => {
    stubReducedMotion(true)
    const { result } = renderHook(() => useChartEntrance(true))
    expect(result.current).toEqual({ enabled: false, played: true })
    expect(frames).toHaveLength(0)
    expect(drawStyle(result.current)).toEqual({})
    expect(popStyle(result.current)).toEqual({})
  })

  it('cancels its pending frames on unmount', () => {
    const { unmount } = renderHook(() => useChartEntrance(true))
    unmount()
    expect(cancelAnimationFrame).toHaveBeenCalled()
  })
})

describe('entrance styles', () => {
  it('draws from a full dash offset to none with the house ease-out', () => {
    expect(drawStyle(before)).toMatchObject({ strokeDasharray: 1, strokeDashoffset: 1 })
    expect(drawStyle(after)).toMatchObject({ strokeDashoffset: 0 })
    expect(drawStyle(after).transition).toBe(
      'stroke-dashoffset 1000ms cubic-bezier(0.22, 1, 0.36, 1) 0ms'
    )
  })

  it('takes a caller timing for the draw', () => {
    expect(drawStyle(after, { duration: 600, delay: 200 }).transition).toBe(
      'stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1) 200ms'
    )
  })

  it('fades in after the draw by default', () => {
    expect(fadeStyle(before)).toMatchObject({ opacity: 0 })
    expect(fadeStyle(after)).toMatchObject({
      opacity: 1,
      transition: 'opacity 500ms ease-out 1000ms',
    })
  })

  it('pops points in from a smaller scale on their own timing', () => {
    expect(popStyle(before)).toMatchObject({ opacity: 0, transform: 'scale(0.6)' })
    expect(popStyle(after)).toMatchObject({ opacity: 1, transform: 'scale(1)' })
    expect(popStyle(after).transition).toContain('250ms ease-out 900ms')
    expect(popStyle(after, { ...CHART_ENTRANCE.points, delay: 0 }).transition).toContain(
      '250ms ease-out 0ms'
    )
  })
})
