import { describe, it, expect } from 'vitest'
import { LIVE_STRIP_REST_MAX_SECONDS, liveStripRestReadout } from './liveStripModel'

describe('liveStripRestReadout', () => {
  it.each([
    [47_000, 47, 'full'],
    [99_000, 99, 'full'],
    [99_001, 100, 'reduced'],
    [100_000, 100, 'reduced'],
    [150_000, 150, 'reduced'],
    [999_000, 999, 'reduced'],
  ] as const)('%ims left reads %is at the %s step', (ms, seconds, step) => {
    expect(liveStripRestReadout(ms)).toEqual({ seconds, step })
  })

  it('reads 0s at full size when the rest has run out', () => {
    expect(liveStripRestReadout(0)).toEqual({ seconds: 0, step: 'full' })
    expect(liveStripRestReadout(-500)).toEqual({ seconds: 0, step: 'full' })
  })

  it('holds at the longest supported rest instead of growing a fourth digit', () => {
    expect(liveStripRestReadout(1_500_000)).toEqual({
      seconds: LIVE_STRIP_REST_MAX_SECONDS,
      step: 'reduced',
    })
  })
})
