import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import {
  ENTRANCE,
  drawStyle,
  fadeStyle,
  popStyle,
  useTrajectoryEntrance,
} from './goalTrajectoryMotion'
import { GoalTrajectoryChart } from './GoalTrajectoryChart'

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

const chartProps = {
  expected: [
    { weekIndex: 1, low: 175, high: 175 },
    { weekIndex: 6, low: 185, high: 195 },
  ],
  committed: 185,
  stretch: 195,
  actuals: [
    { weekIndex: 1, value: 175 },
    { weekIndex: 3, value: 181, isPR: true },
  ],
  weeks: [{ index: 1 }, { index: 6 }],
  status: 'on_track' as const,
  width: 1200,
  height: 340,
}

describe('useTrajectoryEntrance', () => {
  it('starts undrawn and plays after the next frames', () => {
    const { result } = renderHook(() => useTrajectoryEntrance(true))
    expect(result.current).toEqual({ enabled: true, played: false })
    flushFrames()
    expect(result.current).toEqual({ enabled: true, played: true })
  })

  it('renders the final state at once when motion is off', () => {
    const { result } = renderHook(() => useTrajectoryEntrance(false))
    expect(result.current).toEqual({ enabled: false, played: true })
    expect(frames).toHaveLength(0)
  })

  it('renders the final state at once under reduced motion', () => {
    stubReducedMotion(true)
    const { result } = renderHook(() => useTrajectoryEntrance(true))
    expect(result.current).toEqual({ enabled: false, played: true })
  })
})

describe('entrance styles', () => {
  const before = { enabled: true, played: false }
  const after = { enabled: true, played: true }
  const off = { enabled: false, played: true }

  it('draws the line from a full dash offset to none over 1000ms with the house ease-out', () => {
    expect(drawStyle(before)).toMatchObject({ strokeDasharray: 1, strokeDashoffset: 1 })
    expect(drawStyle(after)).toMatchObject({ strokeDashoffset: 0 })
    expect(drawStyle(after).transition).toBe(
      'stroke-dashoffset 1000ms cubic-bezier(0.22, 1, 0.36, 1)'
    )
  })

  it('fades the shadow in over 500ms once the draw has finished', () => {
    expect(fadeStyle(before, ENTRANCE.shadow)).toMatchObject({ opacity: 0 })
    expect(fadeStyle(after, ENTRANCE.shadow)).toMatchObject({
      opacity: 1,
      transition: 'opacity 500ms ease-out 1000ms',
    })
  })

  it('pops the points in over 250ms from 900ms', () => {
    expect(popStyle(before)).toMatchObject({ opacity: 0, transform: 'scale(0.6)' })
    expect(popStyle(after)).toMatchObject({ opacity: 1, transform: 'scale(1)' })
    expect(popStyle(after).transition).toContain('250ms ease-out 900ms')
  })

  it('adds no motion styles at all when the entrance is off', () => {
    expect(drawStyle(off)).toEqual({})
    expect(fadeStyle(off, ENTRANCE.shadow)).toEqual({})
    expect(popStyle(off)).toEqual({})
  })
})

describe('GoalTrajectoryChart entrance', () => {
  const lineStyle = (): string =>
    screen.getByTestId('goal-trajectory-chart-actual-line').getAttribute('style') ?? ''

  it('holds the line undrawn on the first frame, band and rules already present', () => {
    render(<GoalTrajectoryChart {...chartProps} />)
    expect(lineStyle()).toContain('stroke-dashoffset: 1')
    expect(screen.getByTestId('goal-trajectory-chart-band').getAttribute('style')).toBeNull()
    expect(screen.getByTestId('goal-trajectory-chart-committed-line')).toBeInTheDocument()
  })

  it('draws the line once the frames run', () => {
    render(<GoalTrajectoryChart {...chartProps} />)
    flushFrames()
    expect(lineStyle()).toContain('stroke-dashoffset: 0')
  })

  it('renders the final, unanimated frame with animate off', () => {
    render(<GoalTrajectoryChart {...chartProps} animate={false} />)
    expect(lineStyle()).toBe('')
  })
})
