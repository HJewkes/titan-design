import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  CVD_MATRICES,
  contrast,
  cvdDelta,
  deltaE,
  minAdjacent,
  minPairwise,
  relativeLuminance,
  simulateCvd,
  toOklab,
} from './color-checks'
import { categoricalPalette, CATEGORICAL_CVD_SAFE_MAX } from './tokens/primitives'

/** Machado-2009, severity 1.0, as transcribed in the color-system-derivation skill's solver. */
const SKILL_SOLVER = join(homedir(), '.claude/skills/color-system-derivation/tools/cvd-solve.mjs')

function skillMatrix(name: 'DEUT' | 'PROT'): number[] | null {
  let source: string
  try {
    source = readFileSync(SKILL_SOLVER, 'utf8')
  } catch {
    return null
  }
  const match = source.match(new RegExp(`const ${name}=\\[([^\\]]+)\\]`))
  return match ? match[1].split(',').map(Number) : null
}

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
  it.each([
    ['deutan', 'DEUT'],
    ['protan', 'PROT'],
  ] as const)('keeps the %s matrix equal to the skill solver constants', (kind, name) => {
    const expected = skillMatrix(name)
    if (!expected) return // solver not installed on this machine (CI)
    expect([...CVD_MATRICES[kind]]).toEqual(expected)
  })

  it('keeps the matrices at their Machado-2009 values', () => {
    expect(CVD_MATRICES.deutan[0]).toBe(0.367322)
    expect(CVD_MATRICES.protan[4]).toBe(0.786281)
    expect(CVD_MATRICES.tritan[0]).toBe(1.255528)
  })

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
