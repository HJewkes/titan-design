import { describe, expect, it } from 'vitest'
import { cropInset } from './crop'

describe('cropInset', () => {
  it('writes the edges in CSS order: top, right, bottom, left', () => {
    expect(cropInset({ right: 0.25 })).toBe('inset(0% 25% 0% 0%)')
    expect(cropInset({ top: 0.1, right: 0.2, bottom: 0.3, left: 0.4 })).toBe(
      'inset(10% 20% 30% 40%)'
    )
  })

  it('crops nothing by default', () => {
    expect(cropInset()).toBe('inset(0% 0% 0% 0%)')
  })

  it('clamps each edge to [0, 1] and drops float noise', () => {
    expect(cropInset({ top: -1, bottom: 2, left: 0.07 })).toBe('inset(0% 0% 100% 7%)')
  })
})
