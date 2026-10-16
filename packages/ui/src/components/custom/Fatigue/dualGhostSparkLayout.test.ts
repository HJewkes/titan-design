import { describe, it, expect } from 'vitest'
import { dualSparkLayout, sparkWing } from './dualGhostSparkLayout'
import { BAND_H } from './GhostBand'
import type { RepVelocityCurve } from './fatigue-model'

const curve = (peak: number, endMs: number): RepVelocityCurve => ({
  repNumber: 1,
  samples: [
    { tMs: 0, velocityMps: 0, phase: 'eccentric' },
    { tMs: endMs / 2, velocityMps: peak, phase: 'concentric' },
    { tMs: endMs, velocityMps: 0, phase: 'concentric' },
  ],
  phaseSegments: [],
  tempoDeviation: 0,
  grindSignature: 0,
})

const WIDTH = 360
const HEIGHT = 232

describe('dualSparkLayout', () => {
  const layout = dualSparkLayout([curve(0.5, 2000)], [curve(0.5, 2000)], WIDTH, HEIGHT)

  it('scales the peak velocity to the wing height over the headroom factor', () => {
    const wingH = layout.baseUp - layout.padTop
    expect(layout.mag(0.5)).toBeCloseTo(wingH / 1.06, 5)
  })

  it('places the last sample at 1/1.04 of the plot width', () => {
    const plot = WIDTH - 28
    expect(layout.x(2000)).toBeCloseTo(14 + plot / 1.04, 5)
  })

  it('centres the band on the plot midline', () => {
    const mid = layout.padTop + (HEIGHT - layout.padTop - layout.padBot) / 2
    expect(layout.bandTop + BAND_H / 2).toBe(mid)
  })
})

describe('sparkWing', () => {
  it('falls back to the given tint with no points when the side has no rep', () => {
    const layout = dualSparkLayout([], [], WIDTH, HEIGHT)
    const wing = sparkWing([], layout, 'fallback')
    expect(wing.tint).toBe('fallback')
    expect(wing.current).toEqual([])
    expect(wing.ghosts).toEqual([])
  })
})
