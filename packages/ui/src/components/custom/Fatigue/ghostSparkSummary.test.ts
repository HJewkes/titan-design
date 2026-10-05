import { describe, it, expect } from 'vitest'
import { ghostSparkSummary } from './ghostSparkSummary'
import { buildMockModel } from './fatigue-mock'
import type { RepVelocityCurve } from './fatigue-model'

const CURVES = buildMockModel(4).velocityCurves

function withPeak(curve: RepVelocityCurve, peak: number): RepVelocityCurve {
  return {
    ...curve,
    samples: [
      { tMs: 0, velocityMps: peak },
      { tMs: 100, velocityMps: 0.1 },
    ],
  }
}

describe('ghostSparkSummary', () => {
  it('names the current rep, the rep count and its peak for a single spark', () => {
    const curves = [...CURVES.slice(0, -1), withPeak(CURVES[CURVES.length - 1], 0.62)]
    expect(ghostSparkSummary({ curves })).toBe('Rep 5 of 5, peak 0.62 m/s')
  })

  it('reports each side for a dual spark', () => {
    const last = CURVES[CURVES.length - 1]
    const left = [...CURVES.slice(0, -1), withPeak(last, 0.62)]
    const right = [...CURVES.slice(0, -1), withPeak(last, 0.5)]
    expect(ghostSparkSummary({ left, right })).toBe(
      'Rep 5 of 5, left peak 0.62 m/s, right peak 0.50 m/s'
    )
  })

  it('reads as no data for empty input', () => {
    expect(ghostSparkSummary({ curves: [] })).toBe('No reps recorded yet')
    expect(ghostSparkSummary({ left: [], right: [] })).toBe('No reps recorded yet')
  })

  it('omits a missing velocity instead of printing NaN or undefined', () => {
    const last = CURVES[CURVES.length - 1]
    const blank = { ...last, samples: [] }
    const nan = { ...last, samples: [{ tMs: 0, velocityMps: Number.NaN }] }
    for (const label of [
      ghostSparkSummary({ curves: [blank] }),
      ghostSparkSummary({ curves: [nan] }),
      ghostSparkSummary({ left: [blank], right: [withPeak(last, 0.4)] }),
    ]) {
      expect(label).not.toMatch(/NaN|undefined/)
    }
    expect(ghostSparkSummary({ curves: [nan] })).toMatch(/^Rep \d+ of 1$/)
  })
})
