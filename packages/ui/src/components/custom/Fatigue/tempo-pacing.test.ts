import { describe, it, expect } from 'vitest'
import { phaseFillFraction, pacingTone, phaseTargetsMs, ON_TARGET_MS } from './tempo-pacing'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import type { SamplePhase } from './fatigue-model'

const t = getSemanticColors('dark')
const TEMPO: [number, number, number, number] = [2.6, 0.4, 0.95, 0.28]

describe('phaseFillFraction', () => {
  it('is the elapsed share of the target', () => {
    expect(phaseFillFraction(500, 1000)).toBeCloseTo(0.5, 5)
  })

  it('CAPS at full so an over-long phase does not overflow its run', () => {
    expect(phaseFillFraction(4000, 1000)).toBe(1)
  })

  it('reads complete when there is no target to pace against', () => {
    expect(phaseFillFraction(500, null)).toBe(1)
    expect(phaseFillFraction(500, 0)).toBe(1)
  })
})

describe('pacingTone', () => {
  it('warns while still short of target', () => {
    expect(pacingTone(500, 2000)).toBe(t['status-warning'])
  })

  it('succeeds within the on-target window either side', () => {
    expect(pacingTone(2000, 2000)).toBe(t['status-success'])
    expect(pacingTone(2000 - ON_TARGET_MS, 2000)).toBe(t['status-success'])
    expect(pacingTone(2000 + ON_TARGET_MS, 2000)).toBe(t['status-success'])
  })

  it('errors once past the window', () => {
    expect(pacingTone(2000 + ON_TARGET_MS + 1, 2000)).toBe(t['status-error'])
  })

  it('stays neutral with no target', () => {
    expect(pacingTone(500, null)).toBe(t['text-primary'])
  })
})

describe('phaseTargetsMs', () => {
  it('maps a hold to BOTTOM before the concentric and TOP after it', () => {
    const phases: SamplePhase[] = ['eccentric', 'hold', 'concentric', 'hold']
    expect(phaseTargetsMs(phases, TEMPO)).toEqual([2600, 400, 950, 280])
  })

  it('gives idle no target — dead time never paces', () => {
    const phases: SamplePhase[] = ['eccentric', 'idle', 'concentric']
    expect(phaseTargetsMs(phases, TEMPO)[1]).toBeNull()
  })

  it('targets nothing at all when no tempo is prescribed', () => {
    const phases: SamplePhase[] = ['eccentric', 'hold', 'concentric']
    expect(phaseTargetsMs(phases, null)).toEqual([null, null, null])
  })

  it('treats a rep that opens on the concentric as having a TOP hold after it', () => {
    const phases: SamplePhase[] = ['concentric', 'hold']
    expect(phaseTargetsMs(phases, TEMPO)).toEqual([950, 280])
  })
})
