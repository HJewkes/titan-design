import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DualGhostSpark, mergePhaseSegments } from './DualGhostSpark'
import { buildMockModel } from './fatigue-mock'
import type { PhaseSegment, RepVelocityCurve } from './fatigue-model'

const CURVES = buildMockModel(5).velocityCurves

function scaled(curves: RepVelocityCurve[], factor: number): RepVelocityCurve[] {
  return curves.map((c) => ({
    ...c,
    samples: c.samples.map((s) => ({ ...s, velocityMps: s.velocityMps * factor })),
  }))
}

/** On-curve points of a smoothPath `d`: the `M` point then each cubic's endpoint. */
function anchors(d: string): Array<[number, number]> {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  const pairs: Array<[number, number]> = []
  for (let i = 0; i + 1 < nums.length; i += 2) pairs.push([nums[i], nums[i + 1]])
  return pairs.filter((_, i) => i === 0 || i % 3 === 0)
}

/** The current (tinted) line of one wing — the last path drawn in its group. */
function wingLine(container: HTMLElement, side: 'left' | 'right'): Array<[number, number]> {
  const paths = container.querySelectorAll(`[data-testid="dual-ghost-bloom-${side}"] path`)
  const d = paths[paths.length - 1].getAttribute('d') ?? ''
  return anchors(d)
}

const ySpan = (pts: Array<[number, number]>) =>
  Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]))
const xMax = (pts: Array<[number, number]>) => Math.max(...pts.map((p) => p[0]))

function renderDual(left: RepVelocityCurve[], right: RepVelocityCurve[]) {
  return render(<DualGhostSpark left={left} right={right} width={360} height={232} />)
}

describe('DualGhostSpark', () => {
  it('renders both device blooms for a populated dual set', () => {
    const { container } = renderDual(CURVES, CURVES)
    expect(screen.getByTestId('dual-ghost-spark')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="dual-ghost-bloom-left"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="dual-ghost-bloom-right"]')).toBeInTheDocument()
  })

  it('draws exactly ONE shared band for the two blooms', () => {
    const { container } = renderDual(CURVES, CURVES)
    expect(container.querySelectorAll('[data-testid="ghost-band-floor"]')).toHaveLength(1)
    expect(screen.getByText('ECC')).toBeInTheDocument()
    expect(screen.getByText('CON')).toBeInTheDocument()
  })

  it('mirrors the wings: the left bloom stays above the band, the right below', () => {
    const { container } = renderDual(CURVES, CURVES)
    const l = wingLine(container, 'left')
    const r = wingLine(container, 'right')
    expect(Math.max(...l.map((p) => p[1]))).toBeLessThan(Math.min(...r.map((p) => p[1])))
    // Each wing starts at zero velocity ON its baseline and grows away from the band.
    expect(l[0][1]).toBe(Math.max(...l.map((p) => p[1])))
    expect(r[0][1]).toBe(Math.min(...r.map((p) => p[1])))
  })

  it('gives matched devices identical bloom extents (one magnitude scale)', () => {
    const { container } = renderDual(CURVES, CURVES)
    expect(ySpan(wingLine(container, 'left'))).toBeCloseTo(ySpan(wingLine(container, 'right')), 1)
  })

  it('scales a weaker device DOWN instead of re-normalizing it to its own wing', () => {
    const { container } = renderDual(CURVES, scaled(CURVES, 0.5))
    const ratio = ySpan(wingLine(container, 'left')) / ySpan(wingLine(container, 'right'))
    expect(ratio).toBeGreaterThan(1.9)
    expect(ratio).toBeLessThan(2.1)
  })

  it('shares one time scale — a shorter side ends earlier, it is not stretched to full width', () => {
    const short = CURVES.map((c) => ({
      ...c,
      samples: c.samples.slice(0, Math.round(c.samples.length * 0.5)),
    }))
    const { container } = renderDual(CURVES, short)
    expect(xMax(wingLine(container, 'right'))).toBeLessThan(xMax(wingLine(container, 'left')) * 0.7)
  })

  it('draws no band furniture past the end of the phase runs', () => {
    const { container } = renderDual(CURVES, CURVES)
    const right = (r: Element) =>
      Number(r.getAttribute('x') ?? 0) + Number(r.getAttribute('width') ?? 0)
    const floor = container.querySelector('[data-testid="ghost-band-floor"]')!
    const rects = Array.from(container.querySelectorAll('rect'))
    expect(Math.max(...rects.map(right))).toBeCloseTo(right(floor), 1)
  })

  it('renders an empty box when neither device has reps', () => {
    const { container } = renderDual([], [])
    expect(screen.getByTestId('dual-ghost-spark')).toBeInTheDocument()
    expect(container.querySelectorAll('path')).toHaveLength(0)
  })

  it('renders the bound side alone when only one device has reps', () => {
    const { container } = renderDual(CURVES, [])
    expect(container.querySelector('[data-testid="dual-ghost-bloom-left"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="dual-ghost-bloom-right"]')).toBeNull()
  })
})

describe('mergePhaseSegments', () => {
  const a: PhaseSegment[] = [
    { phase: 'eccentric', startMs: 0, endMs: 1000 },
    { phase: 'concentric', startMs: 1000, endMs: 2000 },
  ]

  it('keeps a phase both devices agree on', () => {
    expect(mergePhaseSegments(a, a)).toEqual(a)
  })

  it('reads idle where the devices are in different phases', () => {
    const b: PhaseSegment[] = [
      { phase: 'eccentric', startMs: 0, endMs: 1400 },
      { phase: 'concentric', startMs: 1400, endMs: 2000 },
    ]
    expect(mergePhaseSegments(a, b)).toEqual([
      { phase: 'eccentric', startMs: 0, endMs: 1000 },
      { phase: 'idle', startMs: 1000, endMs: 1400 },
      { phase: 'concentric', startMs: 1400, endMs: 2000 },
    ])
  })

  it('lets the covered side speak where the other has no stream yet', () => {
    const short: PhaseSegment[] = [{ phase: 'eccentric', startMs: 0, endMs: 1000 }]
    expect(mergePhaseSegments(a, short)).toEqual(a)
  })

  it('falls back to the only populated side', () => {
    expect(mergePhaseSegments(a, [])).toEqual(a)
    expect(mergePhaseSegments([], a)).toEqual(a)
  })
})
