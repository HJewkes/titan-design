import { describe, it, expect } from 'vitest'
import { getGlowShadow } from './elevation'

describe('getGlowShadow', () => {
  it('returns shadow style for valid hex color', () => {
    const style = getGlowShadow('#FF7900', 'medium')
    expect(style).toBeDefined()
    expect(Object.keys(style).length).toBeGreaterThan(0)
  })

  it('returns empty object for invalid color', () => {
    const style = getGlowShadow('not-a-color')
    expect(style).toEqual({})
  })

  it('scales intensity across levels', () => {
    const subtle = getGlowShadow('#FF7900', 'subtle')
    const strong = getGlowShadow('#FF7900', 'strong')
    expect(subtle).not.toEqual(strong)
  })

  it('defaults to medium intensity', () => {
    const defaultStyle = getGlowShadow('#FF7900')
    const mediumStyle = getGlowShadow('#FF7900', 'medium')
    expect(defaultStyle).toEqual(mediumStyle)
  })
})
