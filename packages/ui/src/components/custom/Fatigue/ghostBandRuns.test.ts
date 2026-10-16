import { describe, it, expect } from 'vitest'
import { bandExtent, bandRuns, labelFits } from './ghostBandRuns'
import type { PhaseSegment } from './fatigue-model'

const x = (ms: number) => 10 + ms / 10
const TEMPO: [number, number, number, number] = [1, 0, 1, 0]

const segments: PhaseSegment[] = [
  { phase: 'eccentric', startMs: 0, endMs: 1000 },
  { phase: 'idle', startMs: 1100, endMs: 1200 },
  { phase: 'concentric', startMs: 1300, endMs: 2300 },
]

const runsFor = (overrides: Partial<Parameters<typeof bandRuns>[0]> = {}) => {
  const extent = bandExtent(segments, x)!
  return bandRuns({
    extent,
    x,
    targetTempoSeconds: null,
    prescribed: false,
    plainLabelColor: 'plain',
    ...overrides,
  })
}

describe('bandExtent', () => {
  it('is null when every run is zero-width', () => {
    expect(bandExtent([{ phase: 'idle', startMs: 500, endMs: 500 }], x)).toBeNull()
  })

  it('spans from the first start to the last end', () => {
    const extent = bandExtent(segments, x)!
    expect(extent.bandLeft).toBe(10)
    expect(extent.bandRight).toBe(240)
    expect(extent.bandW).toBe(230)
  })
})

describe('bandRuns', () => {
  it('butts each run against the next run start', () => {
    const [first, second] = runsFor()
    expect(first.left + first.width).toBe(second.left)
  })

  it('fills nothing for a prescribed band', () => {
    expect(
      runsFor({ prescribed: true, targetTempoSeconds: TEMPO }).map((r) => r.fillWidth)
    ).toEqual([0, 0, 0])
  })

  it('fills each run completely and keeps the plain tone without a tempo', () => {
    const runs = runsFor()
    expect(runs.map((r) => r.fillWidth)).toEqual(runs.map((r) => r.width))
    expect(runs.every((r) => r.labelTone === 'plain')).toBe(true)
  })

  it('fills a run partly when it is faster than the target tempo', () => {
    const fast: PhaseSegment[] = [{ phase: 'eccentric', startMs: 0, endMs: 500 }]
    const [run] = bandRuns({
      extent: bandExtent(fast, x)!,
      x,
      targetTempoSeconds: TEMPO,
      prescribed: false,
      plainLabelColor: 'plain',
    })
    expect(run.fillWidth).toBeLessThan(run.width)
    expect(run.labelTone).not.toBe('plain')
  })
})

describe('labelFits', () => {
  it('needs 27 px for ECC', () => {
    expect(labelFits('ECC', 27)).toBe(true)
    expect(labelFits('ECC', 26)).toBe(false)
  })
})
