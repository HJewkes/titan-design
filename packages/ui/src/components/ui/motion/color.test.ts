import { describe, expect, it } from 'vitest'
import { poly } from './easing'
import { interpolateColor } from './color'

describe('interpolateColor', () => {
  it('returns the endpoints at the ends of the input range', () => {
    expect(interpolateColor(0, [0, 1], ['#336699', '#cc9933'])).toBe('#336699')
    expect(interpolateColor(1, [0, 1], ['#336699', '#cc9933'])).toBe('#cc9933')
  })

  it('mixes in Oklab, so black to white passes mid-grey above the sRGB average', () => {
    expect(interpolateColor(0.5, [0, 1], ['#000000', '#ffffff'])).toBe('#636363')
  })

  it('keeps a red-to-blue midpoint saturated rather than the sRGB average', () => {
    expect(interpolateColor(0.5, [0, 1], ['#ff0000', '#0000ff'])).toBe('#8c53a2')
  })

  it('reads short and alpha forms and writes alpha only when translucent', () => {
    expect(interpolateColor(0, [0, 1], ['#f00', '#00f'])).toBe('#ff0000')
    expect(interpolateColor(0.5, [0, 1], ['#ffffff00', '#ffffffff'])).toBe('#ffffff80')
    expect(interpolateColor(0, [0, 1], ['#fff8', '#000'])).toBe('#ffffff88')
  })

  it('passes ease and clamp through to the progress', () => {
    const grey = interpolateColor(0.5, [0, 1], ['#000000', '#ffffff'])
    expect(interpolateColor(Math.SQRT1_2, [0, 1], ['#000000', '#ffffff'], { ease: poly(2) })).toBe(
      grey
    )
    expect(interpolateColor(5, [0, 1], ['#000000', '#ffffff'])).toBe('#ffffff')
  })

  it('throws on an unresolved token value', () => {
    expect(() => interpolateColor(0, [0, 1], ['var(--color-brand-primary)', '#000000'])).toThrow(
      /resolve tokens first/
    )
  })
})
