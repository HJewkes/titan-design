import { describe, expect, it } from 'vitest'
import { motion } from '../../../theme/tokens/semantic'
import { springSettleS } from './spring'
import { MOTION } from './tokens'

/**
 * ChipBand's `chipEntry` frames (TD-883) at a 1080 frame, as [index, count, seconds after the cue]:
 * the numbers it printed before the preset existed. `riseIn.video` must reproduce them bit for bit.
 */
const CHIP_BAND_FRAMES: [number, number, number, { opacity: number; translateY: number }][] = [
  [0, 3, 0, { opacity: 0, translateY: 40 }],
  [0, 3, 0.1, { opacity: 0.6739780744947794, translateY: 13.040877020208823 }],
  [1, 3, 0.25, { opacity: 0.9042286766239431, translateY: 3.830852935042275 }],
  [2, 3, 0.4, { opacity: 0.9766051867422363, translateY: 0.9357925303105485 }],
  [11, 12, 0.8, { opacity: 0.9836754011344189, translateY: 0.6529839546232452 }],
  [0, 1, 0.5, { opacity: 1, translateY: 0 }],
]

describe('MOTION.preset riseIn at the video tier', () => {
  // Mutation caught: a riseIn on `enter` (1 s) or another ease, a lerp written as from + (to - from) * e,
  // or a stagger without the staggerMax cap each moves at least one frame off ChipBand's.
  it.each(CHIP_BAND_FRAMES)('equals ChipBand item %i of %i at %f s', (index, count, t, frame) => {
    const rise = MOTION.preset('riseIn', 'video')
    expect(rise.at((t - rise.delayS(index, count)) / rise.durationS)).toStrictEqual(frame)
  })

  // Mutation caught: a tier that stops restating motion.video lets the two drift apart.
  it('restates the motion.video timings', () => {
    const { exit, exitScale, scaleFrom, ...shared } = motion.video
    expect(motion.tiers.video).toEqual(shared)
    expect([exit, exitScale, scaleFrom]).toEqual([850, 0.85, 0.97])
  })
})

describe('MOTION.preset riseIn at the app tier', () => {
  const rise = MOTION.preset('riseIn', 'app')

  // Mutation caught: the app tier reading the video rise (40 px) puts 40 here.
  it('rises 8 px', () => {
    expect(rise.at(0)).toStrictEqual({ opacity: 0, translateY: 8 })
    expect(rise.at(1)).toStrictEqual({ opacity: 1, translateY: 0 })
  })

  // Mutation caught: app durations or stagger copied from the video tier.
  it('runs 150 ms, staggers 40 ms and caps a cascade at 300 ms', () => {
    expect(rise.durationS).toBe(0.15)
    expect(rise.delayS(1, 3)).toBe(0.04)
    expect(rise.delayS(10, 11)).toBeCloseTo(0.3, 12)
    expect(rise.exitS).toBeCloseTo(0.1275, 12)
  })

  // Mutation caught: any app tier value moved off the UI scale (fast/normal/slow, 8 px, 40/300 ms).
  it('holds the app tier values', () => {
    expect(motion.tiers.app).toEqual({
      enter: 250,
      emphasis: 150,
      hero: 400,
      count: 600,
      rise: 8,
      staggerEach: 40,
      staggerMax: 300,
    })
  })
})

describe('reduced motion', () => {
  // Mutation caught: a fade that keeps translateY moves the item under reduced motion.
  it('fade gives opacity only', () => {
    const rise = MOTION.preset('riseIn', 'video')
    expect(rise.reduced).toBe('fade')
    expect(rise.reducedAt(0.2)).toStrictEqual({ opacity: rise.at(0.2).opacity })
  })

  // Mutation caught: a fade on the payoff spring's own curve pushes opacity past 1.
  it('fades a spring preset without overshoot', () => {
    const payoff = MOTION.preset('payoff', 'app')
    const opacities = [0.1, 0.3, 0.5, 0.7].map((p) => payoff.reducedAt(p).opacity ?? 0)
    expect(Math.max(...opacities)).toBeLessThanOrEqual(1)
    expect(Object.keys(payoff.reducedAt(0.5))).toEqual(['opacity'])
  })

  // Mutation caught: a jump that animates instead of showing the end value.
  it('jump shows the end state at once', () => {
    const count = MOTION.preset('countUp', 'app')
    expect(count.reducedAt(0, { from: 3, to: 12 })).toStrictEqual({ value: 12 })
  })
})

describe('countUp and payoff', () => {
  // Mutation caught: countUp on the wrong tier duration, or ignoring the caller's endpoints.
  it('counts between the caller values over the tier count duration', () => {
    const count = MOTION.preset('countUp', 'video')
    expect(count.durationS).toBe(1.5)
    expect(count.at(0, { from: 3, to: 12 }).value).toBe(3)
    expect(count.at(1, { from: 3, to: 12 }).value).toBe(12)
    expect(count.delayS(2, 3)).toBe(0)
  })

  // Mutation caught: payoff losing allowOvershoot (damped bouncy never passes 1).
  it('springs past full scale and settles on the bouncy settle time', () => {
    const payoff = MOTION.preset('payoff', 'video')
    const peak = Math.max(...Array.from({ length: 50 }, (_, i) => payoff.at(i / 50).scale))
    expect(peak).toBeGreaterThan(1)
    expect(payoff.durationS).toBe(
      springSettleS(MOTION.springPreset('bouncy', { allowOvershoot: true }))
    )
    expect(payoff.at(1).scale).toBe(1)
  })
})

describe('errors', () => {
  // Mutation caught: an unbound endpoint silently becoming NaN.
  it('throws for a caller endpoint with no value', () => {
    expect(() => MOTION.preset('countUp', 'app').at(0.5)).toThrow(RangeError)
  })

  // Mutation caught: an unknown name crashing with a TypeError instead of naming the input.
  it('throws for an unknown preset or tier', () => {
    expect(() => MOTION.preset('slideIn' as 'riseIn', 'app')).toThrow(/unknown preset 'slideIn'/)
    expect(() => MOTION.preset('riseIn', 'print' as 'app')).toThrow(RangeError)
  })
})
