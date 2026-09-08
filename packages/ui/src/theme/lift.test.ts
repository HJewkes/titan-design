import { describe, it, expect } from 'vitest'
import { liftShadow, liftStyle, LIFT_RIM_ALPHA, FLOATING_LIFT_MIN } from './lift'

describe('liftShadow', () => {
  it('leads with the wall-calibrated rim on dark', () => {
    expect(liftShadow(1, 'dark')).toMatch(/^inset 0 1px 0 rgba\(255,255,255,0\.20\)/)
    expect(LIFT_RIM_ALPHA.dark).toBe(0.2)
  })

  it('omits the rim when asked, keeping the ambient layers', () => {
    const shadow = liftShadow(2, 'dark', { rim: 0 })
    expect(shadow).not.toContain('inset')
    expect(shadow.split(', ').length).toBe(2)
  })

  it('honours a rim override', () => {
    expect(liftShadow(2, 'dark', { rim: 0.12 })).toContain('rgba(255,255,255,0.12)')
  })

  it('casts a lighter shadow on a light surface, same geometry', () => {
    const dark = liftShadow(3, 'dark', { rim: 0 }).split(', ')
    const light = liftShadow(3, 'light', { rim: 0 }).split(', ')
    expect(light.length).toBe(dark.length)
    const alpha = (layer: string) => Number(/rgba\(0,0,0,([\d.]+)\)/.exec(layer)![1])
    for (let i = 0; i < dark.length; i++) expect(alpha(light[i])).toBeLessThan(alpha(dark[i]))
  })

  it('uses three ambient layers from the floating threshold up', () => {
    expect(liftShadow(FLOATING_LIFT_MIN, 'dark', { rim: 0 }).split(', ').length).toBe(3)
    expect(liftShadow(3, 'dark', { rim: 0 }).split(', ').length).toBe(2)
  })
})

describe('liftStyle', () => {
  it('returns a web boxShadow under the RNW alias', () => {
    const style = liftStyle(2) as { boxShadow?: string }
    expect(style.boxShadow).toContain('inset 0 1px 0')
  })
})
