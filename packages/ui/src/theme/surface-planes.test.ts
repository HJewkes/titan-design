import { describe, it, expect } from 'vitest'
import { PLANE_ORDER, pressedLevel, raisedLevel, surfaceBackground } from './surface-planes'
import { getSemanticColors } from './tokens/semantic'

describe('surface planes', () => {
  it('orders the six planes darkest first', () => {
    expect(PLANE_ORDER).toEqual(['frame', 'background', 'base', 'elevated', 'raised', 'overlay'])
  })

  it('resolves each plane to its semantic token, literal hex', () => {
    const dark = getSemanticColors('dark')
    expect(surfaceBackground('frame', 'dark')).toBe(dark['background-frame'])
    expect(surfaceBackground('base', 'dark')).toBe(dark['surface-base'])
    expect(surfaceBackground('overlay', 'dark')).toMatch(/^#[0-9A-F]{6}$/i)
  })

  it.each([
    ['base', 1, 'elevated'],
    ['base', 2, 'raised'],
    ['base', 3, 'overlay'],
    ['elevated', 2, 'overlay'],
    ['raised', 3, 'overlay'],
    ['overlay', 1, 'overlay'],
  ] as const)('raisedLevel(%s, %i) → %s, clamped at overlay', (from, steps, expected) => {
    expect(raisedLevel(from, steps)).toBe(expected)
  })

  it('raisedLevel with zero steps stays put', () => {
    expect(raisedLevel('raised', 0)).toBe('raised')
  })

  it('pressedLevel steps down and clamps at the frame', () => {
    expect(pressedLevel('base')).toBe('background')
    expect(pressedLevel('background')).toBe('frame')
    expect(pressedLevel('frame')).toBe('frame')
  })
})
