import { describe, expect, it } from 'vitest'
import { greyRamp, primitiveRamps } from '../../../../theme/tokens/primitives'
import { DRIFT_GREY, RED_DEEP, RED_LIGHT, RED_MID, SILVER, silverRed } from './silverRed'

describe('silver/red scheme', () => {
  it('reads every tone from the grey and red ramps', () => {
    expect(SILVER).toBe(greyRamp[200])
    expect(DRIFT_GREY).toBe(greyRamp[700])
    expect([RED_LIGHT, RED_MID, RED_DEEP]).toEqual([
      primitiveRamps.red[400],
      primitiveRamps.red[600],
      primitiveRamps.red[800],
    ])
  })

  it('gives dark a silver neutral and the light red as its flag', () => {
    expect(silverRed('dark')).toEqual({ neutral: greyRamp[200], flag: primitiveRamps.red[400] })
  })

  it('gives light the mirrored steps: a darker grey and the mid red', () => {
    expect(silverRed('light')).toEqual({ neutral: greyRamp[600], flag: primitiveRamps.red[600] })
  })

  it('never paints a neutral mark red or a flagged mark grey', () => {
    for (const mode of ['dark', 'light'] as const) {
      const { neutral, flag } = silverRed(mode)
      expect(Object.values(greyRamp)).toContain(neutral)
      expect(Object.values(primitiveRamps.red)).toContain(flag)
    }
  })
})
