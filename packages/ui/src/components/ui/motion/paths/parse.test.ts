import { describe, expect, it } from 'vitest'
import { parsePath } from './parse'

describe('parsePath', () => {
  it('resolves relative commands against the current point', () => {
    expect(parsePath('M10 10 l3 4 m1 1 l-2 0')).toEqual([
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 13, y: 14 },
      { type: 'M', x: 14, y: 15 },
      { type: 'L', x: 12, y: 15 },
    ])
  })

  it('turns extra moveto pairs into linetos of the same case', () => {
    expect(parsePath('m1 1 2 2 3 3')).toEqual([
      { type: 'M', x: 1, y: 1 },
      { type: 'L', x: 3, y: 3 },
      { type: 'L', x: 6, y: 6 },
    ])
  })

  it('expands H and V into lines that keep the other coordinate', () => {
    expect(parsePath('M1 2 H5 v3 h-1 V0')).toEqual([
      { type: 'M', x: 1, y: 2 },
      { type: 'L', x: 5, y: 2 },
      { type: 'L', x: 5, y: 5 },
      { type: 'L', x: 4, y: 5 },
      { type: 'L', x: 4, y: 0 },
    ])
  })

  it('reflects the previous cubic control point for S, and uses the current point after a non-curve', () => {
    const [, , s, , s2] = parsePath('M0 0 C0 8 12 8 12 0 S24 -8 24 0 L36 0 S48 8 48 0')
    expect(s).toEqual({ type: 'C', x1: 12, y1: -8, x2: 24, y2: -8, x: 24, y: 0 })
    expect(s2).toEqual({ type: 'C', x1: 36, y1: 0, x2: 48, y2: 8, x: 48, y: 0 })
  })

  it('reflects the previous quadratic control point for T', () => {
    const [, , t] = parsePath('M0 0 Q5 10 10 0 t10 0')
    expect(t).toEqual({ type: 'Q', x1: 15, y1: -10, x: 20, y: 0 })
  })

  it('reads compact arc flags written without separators', () => {
    expect(parsePath('M0 0A5 5 0 0110 0')[1]).toEqual({
      type: 'A',
      rx: 5,
      ry: 5,
      rotation: 0,
      largeArc: false,
      sweep: true,
      x: 10,
      y: 0,
    })
  })

  it('reads commas, signs, exponents and numbers that run together', () => {
    expect(parsePath('M-1,.5L1e1-2.5.5.5')).toEqual([
      { type: 'M', x: -1, y: 0.5 },
      { type: 'L', x: 10, y: -2.5 },
      { type: 'L', x: 0.5, y: 0.5 },
    ])
    expect(() => parsePath('M0 0 L1 .5.5')).toThrow(SyntaxError)
  })

  it('returns to the subpath start after Z', () => {
    const commands = parsePath('M5 5 l5 0 z l0 5')
    expect(commands[3]).toEqual({ type: 'L', x: 5, y: 10 })
  })

  it.each(['M0 0 L1', 'M0 0 X3', 'L'])('rejects malformed data %j', (d) => {
    expect(() => parsePath(d)).toThrow(SyntaxError)
  })
})
