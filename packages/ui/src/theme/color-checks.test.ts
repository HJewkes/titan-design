import { describe, it, expect } from 'vitest'
import {
  CVD_MATRICES,
  compositeOver,
  contrast,
  cvdDelta,
  deltaE,
  minAdjacent,
  minPairwise,
  relativeLuminance,
  simulateCvd,
  toOklab,
} from './color-checks'
import { MACHADO_2009_SEVERITY_1 } from '../test/machado-2009'
import { categoricalPalette, CATEGORICAL_CVD_SAFE_MAX } from './tokens/primitives'

describe('contrast', () => {
  it('puts black on white at 21:1', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
  })

  it('puts #767676 on white at 4.54:1', () => {
    expect(contrast('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2)
  })

  it('is symmetric in its arguments', () => {
    expect(contrast('#FFFFFF', '#767676')).toBe(contrast('#767676', '#FFFFFF'))
  })

  it('takes the linear branch of the gamma curve for very dark channels', () => {
    expect(relativeLuminance('#0A0A0A')).toBeCloseTo(10 / 255 / 12.92, 6)
  })
})

describe('compositeOver', () => {
  it('returns an opaque hex colour unchanged', () => {
    expect(compositeOver('#336699', '#000000')).toBe('#336699')
  })

  it('blends a translucent colour halfway at alpha 0.5', () => {
    expect(compositeOver('rgba(255, 255, 255, 0.5)', '#000000')).toBe('#808080')
  })

  it('treats rgb() without alpha as opaque', () => {
    expect(compositeOver('rgb(0, 0, 0)', '#FFFFFF')).toBe('#000000')
  })

  it('refuses a colour it cannot parse rather than measuring black', () => {
    expect(() => compositeOver('var(--color-x)', '#FFFFFF')).toThrow(/expected/)
  })
})

describe('deltaE and toOklab', () => {
  it('places white at OKLab L = 1 with no chroma', () => {
    const [L, a, b] = toOklab('#FFFFFF')
    expect(L).toBeCloseTo(1, 4)
    expect(Math.hypot(a, b)).toBeLessThan(1e-3)
  })

  it('is zero for a colour against itself and symmetric otherwise', () => {
    expect(deltaE('#1C1916', '#1C1916')).toBe(0)
    expect(deltaE('#FF0000', '#00FF00')).toBe(deltaE('#00FF00', '#FF0000'))
  })
})

describe('CVD simulation', () => {
  it.each(['deutan', 'protan', 'tritan'] as const)(
    'keeps the %s matrix equal to Machado 2009 severity 1.0, element by element',
    (kind) => {
      const expected = MACHADO_2009_SEVERITY_1[kind]
      expect(CVD_MATRICES[kind]).toHaveLength(expected.length)
      expected.forEach((value, i) => expect(CVD_MATRICES[kind][i], `${kind}[${i}]`).toBe(value))
    }
  )

  it.each(['deutan', 'protan', 'tritan'] as const)(
    'keeps every %s matrix row summing to 1, so white stays white',
    (kind) => {
      const m = CVD_MATRICES[kind]
      for (const row of [0, 3, 6]) {
        expect(m[row] + m[row + 1] + m[row + 2], `row ${row / 3}`).toBeCloseTo(1, 5)
      }
    }
  )

  it('leaves greys unchanged under every dichromacy', () => {
    for (const kind of ['deutan', 'protan', 'tritan'] as const) {
      const out = simulateCvd('#808080', kind)
      expect(deltaE(out, '#808080'), kind).toBeLessThan(1)
    }
  })

  it('collapses red and green for deutan viewers more than for typical vision', () => {
    expect(deltaE(simulateCvd('#FF0000', 'deutan'), simulateCvd('#00FF00', 'deutan'))).toBeLessThan(
      deltaE('#FF0000', '#00FF00')
    )
  })
})

describe('cvdDelta', () => {
  it('is zero for a colour against itself', () => {
    expect(cvdDelta('#3B82F6', '#3B82F6')).toBe(0)
  })

  it('is the worse of deutan and protan, never above plain deltaE for red/green', () => {
    expect(cvdDelta('#FF0000', '#00FF00')).toBeLessThan(deltaE('#FF0000', '#00FF00'))
  })
})

describe('minPairwise and minAdjacent', () => {
  const metric = (a: string, b: string) => Math.abs(Number(a) - Number(b))

  it('finds the closest pair anywhere in the list', () => {
    expect(minPairwise(['1', '9', '4', '10'], metric)).toBe(1)
  })

  it('looks only at neighbours', () => {
    expect(minAdjacent(['1', '9', '4', '10'], metric)).toBe(5)
  })

  it('reproduces the categorical CVD floor the palette test asserts', () => {
    for (const variant of ['default', 'dark'] as const) {
      const colors = categoricalPalette[variant].slice(0, CATEGORICAL_CVD_SAFE_MAX)
      expect(minPairwise(colors), variant).toBeGreaterThanOrEqual(8)
    }
  })
})
