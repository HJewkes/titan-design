import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { Platform } from 'react-native'

import { MOTION } from '../../motion/tokens'
import {
  CHART_ENTRANCE,
  drawStyle,
  entranceAt,
  fadeStyle,
  markGrowthAt,
  popStyle,
  useChartEntrance,
  type EntranceState,
} from './chartEntrance'

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
    expect(drawStyle(after).transition).toBe('stroke-dashoffset 1000ms var(--ease-out) 0ms')
  })

  it('takes a caller timing for the draw', () => {
    expect(drawStyle(after, { duration: 600, delay: 200 }).transition).toBe(
      'stroke-dashoffset 600ms var(--ease-out) 200ms'
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

describe.each(['ios', 'android'] as const)('entrance styles on %s', (os) => {
  const originalOS = Platform.OS
  beforeEach(() => {
    Platform.OS = os
  })
  afterEach(() => {
    Platform.OS = originalOS
  })

  it('returns empty styles, so the final state renders with no entrance', () => {
    expect(drawStyle(before)).toEqual({})
    expect(fadeStyle(before)).toEqual({})
    expect(popStyle(before)).toEqual({})
  })
})

describe('entranceAt', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows nothing at 0 and the whole entrance once every window has ended', () => {
    expect(entranceAt(0, { marks: 2 })).toEqual({
      progress: 0,
      draw: 0,
      fade: 0,
      points: 0,
      marks: [0, 0],
    })
    expect(entranceAt(10, { marks: 2 })).toEqual({
      progress: 1,
      draw: 1,
      fade: 1,
      points: 1,
      marks: [1, 1],
    })
  })

  it('places each layer and each staggered mark at 0.5 s', () => {
    const stagger = MOTION.staggerEachS(3)
    const frame = entranceAt(0.5, { marks: 3 })
    expect(frame.progress).toBeCloseTo(0.5 / 1.5)
    expect(frame.draw).toBeCloseTo(0.5)
    expect(frame.fade).toBe(0)
    expect(frame.points).toBe(0)
    expect(frame.marks[0]).toBeCloseTo(0.5)
    expect(frame.marks[2]).toBeCloseTo(0.5 - 2 * stagger)
  })

  it('reads time from t alone, so the wall clock moving changes no frame', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const first = entranceAt(0.5, { marks: 3 })
    vi.setSystemTime(60_000)
    expect(entranceAt(0.5, { marks: 3 })).toEqual(first)
    expect(first.draw).toBeCloseTo(0.5)
  })

  it('eases each mark with the house ease-out and paints a missing mark in full', () => {
    const frame = entranceAt(0.5, { marks: 1 })
    expect(markGrowthAt(frame, 0)).toBeCloseTo(MOTION.ease.out(0.5))
    expect(markGrowthAt(frame, 5)).toBe(1)
  })
})

describe('seeked entrance', () => {
  const stylesOf = (entrance: EntranceState) => ({
    draw: drawStyle(entrance),
    fade: fadeStyle(entrance),
    pop: popStyle(entrance),
  })

  it('takes its frame from t, with no animation frame requested', () => {
    const { result } = renderHook(() => useChartEntrance(true, 0.5))
    expect(result.current).toEqual({ enabled: true, played: true, t: 0.5 })
    expect(frames).toHaveLength(0)
  })

  it('paints the frame at t with no CSS transition', () => {
    const at = { enabled: true, played: true, t: 0.5 }
    expect(drawStyle(at)).toEqual({
      strokeDasharray: 1,
      strokeDashoffset: 1 - MOTION.ease.out(0.5),
    })
    expect(fadeStyle(at)).toEqual({ opacity: 0 })
    expect(popStyle(at, { duration: 250, delay: 375 })).toMatchObject({
      transform: `scale(${String(0.6 + 0.4 * MOTION.ease.out(0.5))})`,
    })
    expect(popStyle(at)).not.toHaveProperty('transition')
  })

  it('renders the same frame at 0.5 s whether played up to it or seeked cold', () => {
    const played = renderHook(({ t }) => useChartEntrance(true, t), { initialProps: { t: 0 } })
    played.rerender({ t: 0.25 })
    played.rerender({ t: 0.5 })
    const cold = renderHook(() => useChartEntrance(true, 0.5))
    expect(stylesOf(played.result.current)).toEqual(stylesOf(cold.result.current))
    expect(stylesOf(cold.result.current).draw.strokeDashoffset).toBeCloseTo(
      1 - MOTION.ease.out(0.5)
    )
  })

  it('still runs under reduced motion, since a seeked render is a video frame', () => {
    stubReducedMotion(true)
    const { result } = renderHook(() => useChartEntrance(true, 0.5))
    expect(result.current.enabled).toBe(true)
  })

  it('renders the final state with animate false', () => {
    const { result } = renderHook(() => useChartEntrance(false, 0.5))
    expect(result.current).toEqual({ enabled: false, played: true })
    expect(drawStyle(result.current)).toEqual({})
  })
})
