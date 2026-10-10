import { describe, expect, it } from 'vitest'
import { greyRamp, primitiveRamps } from '../../../../theme/tokens/primitives'
import { DRIFT_GREY, RED_DEEP, RED_LIGHT, RED_MID, RED_PALE, SILVER, silverRed } from './silverRed'

describe('silver/red scheme', () => {
  it('reads every tone from the grey and red ramps', () => {
    expect(SILVER).toBe(greyRamp[200])
    expect(DRIFT_GREY).toBe(greyRamp[700])
    expect([RED_PALE, RED_LIGHT, RED_MID, RED_DEEP]).toEqual([
      primitiveRamps.red[300],
      primitiveRamps.red[400],
      primitiveRamps.red[600],
      primitiveRamps.red[800],
    ])
  })

  it('gives dark a silver neutral, the pale red for near and the light red for over', () => {
    expect(silverRed('dark')).toEqual({
      neutral: greyRamp[200],
      near: primitiveRamps.red[300],
      over: primitiveRamps.red[400],
    })
  })

  it('gives light the TD-789 3b steps: grey[700], red[600] for near, red[700] for over', () => {
    expect(silverRed('light')).toEqual({
      neutral: greyRamp[700],
      near: primitiveRamps.red[600],
      over: primitiveRamps.red[700],
    })
  })

  it('never paints a neutral mark red or a flagged mark grey, and keeps near and over apart', () => {
    for (const mode of ['dark', 'light'] as const) {
      const { neutral, near, over } = silverRed(mode)
      expect(Object.values(greyRamp)).toContain(neutral)
      expect(Object.values(primitiveRamps.red)).toContain(near)
      expect(Object.values(primitiveRamps.red)).toContain(over)
      expect(near).not.toBe(over)
    }
  })
})
