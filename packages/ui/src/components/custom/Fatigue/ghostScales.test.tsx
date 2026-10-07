import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { ghostScales } from './ghostScales'
import { dualSparkLayout } from './dualGhostSparkLayout'
import { GhostSpark } from './GhostSpark'
import { DualGhostSpark } from './DualGhostSpark'
import * as scalesModule from './ghostScales'
import { FATIGUE_STATES } from './fatigue-mock'

const curves = FATIGUE_STATES[3].model.velocityCurves

afterEach(() => vi.restoreAllMocks())

describe('ghostScales', () => {
  it('scales time over the longest curve and magnitude over the fastest sample', () => {
    const { x, mag } = ghostScales(curves, 300, 100, { left: 10, right: 10 })
    expect(x(0)).toBe(10)
    expect(mag(0)).toBe(0)
    expect(mag(100)).toBe(100)
  })

  it('gives the dual layout the same scales as the single call for one curve set', () => {
    const plotH = 80
    const single = ghostScales(curves, 300, plotH, { left: 14, right: 14 })
    const dual = dualSparkLayout(curves, [], 300, 232)
    const wingH = dual.mag(100)
    const same = ghostScales(curves, 300, wingH, { left: 14, right: 14 })
    for (const ms of [0, 250, 900, 2000]) expect(dual.x(ms)).toBeCloseTo(same.x(ms), 9)
    for (const v of [0, 0.2, 0.6, 1.1]) {
      expect(dual.mag(v) / wingH).toBeCloseTo(single.mag(v) / plotH, 9)
    }
  })

  it('is what both components call, with the curves they draw', () => {
    const spy = vi.spyOn(scalesModule, 'ghostScales')
    render(<GhostSpark curves={curves} width={300} />)
    render(<DualGhostSpark left={curves} right={[]} width={300} />)
    const [single, dual] = spy.mock.calls
    expect(single[0]).toEqual(curves)
    expect(dual[0]).toEqual(curves)
    expect(single[1]).toBe(300)
    expect(dual[1]).toBe(300)
  })
})
