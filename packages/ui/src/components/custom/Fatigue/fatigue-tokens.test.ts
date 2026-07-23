import { describe, it, expect } from 'vitest'
import { ghostLineColor, auraForVerdict, mixHex, clamp01, GRIND_THRESHOLD } from './fatigue-tokens'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

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

describe('ghostLineColor (control-aware)', () => {
  it('a controlled, on-tempo rep is bright green', () => {
    expect(ghostLineColor(0, 0.1).toLowerCase()).toBe(t['status-success'].toLowerCase())
  })
  it('a controlled but slow rep deepens the green (still not the warning colour)', () => {
    const deep = ghostLineColor(1, 0.1)
    expect(deep.toLowerCase()).not.toBe(t['status-success'].toLowerCase())
    expect(deep.toLowerCase()).not.toBe(t['status-warning'].toLowerCase())
  })
  it('null tempo deviation is treated as on-tempo (bright green)', () => {
    expect(ghostLineColor(null, 0.1).toLowerCase()).toBe(t['status-success'].toLowerCase())
  })
  it('at the grind threshold it warms to amber', () => {
    expect(ghostLineColor(0, GRIND_THRESHOLD).toLowerCase()).toBe(t['status-warning'].toLowerCase())
  })
  it('a full collapse is red', () => {
    expect(ghostLineColor(0, 1).toLowerCase()).toBe(t['status-error'].toLowerCase())
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
