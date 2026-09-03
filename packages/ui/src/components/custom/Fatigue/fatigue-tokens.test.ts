import { describe, it, expect } from 'vitest'
import {
  ghostLineColor,
  auraForVerdict,
  mixHex,
  clamp01,
  GRIND_THRESHOLD,
  SILVER,
  RED_LIGHT,
  RED_MID,
  RED_DEEP,
} from './fatigue-tokens'

describe('clamp01', () => {
  it('clamps to [0,1]', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(2)).toBe(1)
    expect(clamp01(0.4)).toBe(0.4)
  })
})

describe('mixHex', () => {
  it('returns the endpoints at 0 and 1', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff')
  })
  it('mixes at the midpoint', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080')
  })
  it('expands 3-digit hex', () => {
    expect(mixHex('#000', '#fff', 1)).toBe('#ffffff')
  })
})

describe('ghostLineColor (control-aware silver/red)', () => {
  const reds = [RED_LIGHT, RED_MID, RED_DEEP].map((c) => c.toLowerCase())

  it('a controlled, on-tempo rep is silver', () => {
    expect(ghostLineColor(0, 0.1).toLowerCase()).toBe(SILVER.toLowerCase())
  })
  it('a controlled but drifting rep dims toward grey — never a red', () => {
    const drift = ghostLineColor(1, 0.1).toLowerCase()
    expect(drift).not.toBe(SILVER.toLowerCase())
    expect(reds).not.toContain(drift)
  })
  it('null tempo deviation is treated as on-tempo (silver)', () => {
    expect(ghostLineColor(null, 0.1).toLowerCase()).toBe(SILVER.toLowerCase())
  })
  it('at the grind threshold it is light red', () => {
    expect(ghostLineColor(0, GRIND_THRESHOLD).toLowerCase()).toBe(RED_LIGHT.toLowerCase())
  })
  it('the mid-severity collapse is mid red', () => {
    // severity 0.5 ⇒ grind = threshold + 0.5·(1−threshold)
    const grind = GRIND_THRESHOLD + 0.5 * (1 - GRIND_THRESHOLD)
    expect(ghostLineColor(0, grind).toLowerCase()).toBe(RED_MID.toLowerCase())
  })
  it('a full collapse is deep red', () => {
    expect(ghostLineColor(0, 1).toLowerCase()).toBe(RED_DEEP.toLowerCase())
  })
})

describe('auraForVerdict', () => {
  it('maps good/null → productive, form-breakdown → stop, else threshold', () => {
    expect(auraForVerdict(null)).toBe('productive')
    expect(auraForVerdict('good')).toBe('productive')
    expect(auraForVerdict('slowing')).toBe('threshold')
    expect(auraForVerdict('grinding')).toBe('threshold')
    expect(auraForVerdict('form-breakdown')).toBe('stop')
  })
})
