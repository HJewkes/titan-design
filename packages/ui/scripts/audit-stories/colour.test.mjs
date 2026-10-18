// @vitest-environment node
import { describe, expect, it } from 'vitest'
import * as reference from '../../src/theme/color-checks.ts'
import { semanticColorsDark, semanticColorsLight } from '../../src/theme/tokens/semantic.ts'
import {
  compositeOver,
  deltaE,
  parseColour,
  parseShadow,
  toHex,
  toOklab,
  toOklch,
} from './colour.mjs'

const TOKEN_HEXES = [
  semanticColorsDark['brand-primary'],
  semanticColorsDark['status-success'],
  semanticColorsDark['status-info'],
  semanticColorsDark['text-primary'],
  semanticColorsDark['surface-base'],
  semanticColorsLight['surface-base'],
]
const PAIRS = TOKEN_HEXES.flatMap((a, i) => TOKEN_HEXES.slice(i + 1).map((b) => [a, b]))
const TOLERANCE = 1e-6

describe('colour parity with color-checks.ts', () => {
  it('samples six opaque token hexes', () => {
    expect(TOKEN_HEXES.every((hex) => /^#[\da-f]{6}$/i.test(hex))).toBe(true)
    expect(new Set(TOKEN_HEXES.map((h) => h.toLowerCase())).size).toBe(6)
  })

  it.each(TOKEN_HEXES)('gives the same OKLab for %s', (hex) => {
    const ours = toOklab(hex)
    reference.toOklab(hex).forEach((v, i) => expect(Math.abs(ours[i] - v)).toBeLessThan(TOLERANCE))
  })

  it.each(PAIRS)('gives the same deltaE for %s and %s', (a, b) => {
    expect(Math.abs(deltaE(a, b) - reference.deltaE(a, b))).toBeLessThan(TOLERANCE)
  })

  it.each(PAIRS)('composites a translucent %s over %s the same way', (top, base) => {
    const { r, g, b } = parseColour(top)
    for (const alpha of [0.1, 0.35, 0.5, 0.82]) {
      const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`
      expect(compositeOver(rgba, base)).toBe(reference.compositeOver(rgba, base).toLowerCase())
    }
  })
})

describe('parseColour', () => {
  it.each([
    ['rgb(16, 32, 48)', { r: 16, g: 32, b: 48, a: 1 }],
    ['rgba(16, 32, 48, 0.25)', { r: 16, g: 32, b: 48, a: 0.25 }],
    ['rgb(16 32 48 / 50%)', { r: 16, g: 32, b: 48, a: 0.5 }],
    ['#abc', { r: 170, g: 187, b: 204, a: 1 }],
    ['#10203080', { r: 16, g: 32, b: 48, a: 128 / 255 }],
    ['transparent', { r: 0, g: 0, b: 0, a: 0 }],
  ])('reads %s', (value, expected) => {
    expect(parseColour(value)).toEqual(expected)
  })

  it.each(['none', 'oklch(0.5 0.1 120)', 'rgb(1, 2)', '', undefined])('gives null for %j', (v) => {
    expect(parseColour(v)).toBeNull()
  })

  it('writes lowercase #rrggbb and drops alpha', () => {
    expect(toHex('rgba(255, 121, 0, 0.4)')).toBe('#ff7900')
  })
})

describe('toOklch', () => {
  it('puts a neutral grey at zero chroma', () => {
    expect(toOklch('#808080').C).toBeLessThan(TOLERANCE)
  })

  it('reports hue in degrees from 0 to 360', () => {
    const blue = toOklch('#0000ff')
    expect(blue.h).toBeGreaterThan(250)
    expect(blue.h).toBeLessThan(270)
    expect(toOklch('#ff00ff').h).toBeGreaterThan(0)
  })
})

describe('parseShadow', () => {
  it('reads every layer of a computed box-shadow, colour first', () => {
    const value = 'rgba(0, 0, 0, 0.5) 0px 1px 4px 0px, rgb(255, 121, 0) 0px 0px 0px 2px inset'

    expect(parseShadow(value)).toEqual([
      { inset: false, x: 0, y: 1, blur: 4, spread: 0, colour: { r: 0, g: 0, b: 0, a: 0.5 } },
      { inset: true, x: 0, y: 0, blur: 0, spread: 2, colour: { r: 255, g: 121, b: 0, a: 1 } },
    ])
  })

  it('gives no layers for none', () => {
    expect(parseShadow('none')).toEqual([])
  })
})
