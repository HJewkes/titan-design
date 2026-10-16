import { describe, it, expect } from 'vitest'
import { cvdDelta, minAdjacent, minPairwise, simulateCvd, deltaE } from './color-checks'
import { categoricalPalette, CATEGORICAL_CVD_SAFE_MAX } from './tokens/primitives'
import { getSemanticColors, type ThemeMode } from './tokens/semantic'
import cvdBaseline from './tokens/cvd-baseline.json'

// Floors recorded in components/custom/charts/DatavizLightPalette.candidates.ts: categorical
// all-pairs CVD ΔE 8 through the safe max, and the 6 WARN floor for adjacent steps ("below the 6
// WARN floor" marks a BROKEN candidate). Deutan and protan gate; tritan is only printed (TD-30 O4).
const CATEGORICAL_ALL_PAIRS_FLOOR = 8
const ADJACENT_FLOOR = 6
const MODES: ThemeMode[] = ['dark', 'light']
const SCALES = [
  { name: 'diverging', length: 5 },
  { name: 'sequential', length: 6 },
] as const

const tritanDelta = (a: string, b: string) =>
  deltaE(simulateCvd(a, 'tritan'), simulateCvd(b, 'tritan'))

function allPairsViolations(colors: readonly string[], floor: number): string[] {
  const out: string[] = []
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const cvd = cvdDelta(colors[i], colors[j])
      if (cvd < floor) out.push(describePair(i, j, colors, cvd, floor))
    }
  }
  return out
}

function adjacentViolations(colors: readonly string[], floor: number): string[] {
  const out: string[] = []
  for (let i = 1; i < colors.length; i++) {
    const cvd = cvdDelta(colors[i - 1], colors[i])
    if (cvd < floor) out.push(describePair(i - 1, i, colors, cvd, floor))
  }
  return out
}

function describePair(i: number, j: number, colors: readonly string[], cvd: number, floor: number) {
  const tritan = tritanDelta(colors[i], colors[j]).toFixed(1)
  return `${i}↔${j} ${colors[i]} ${colors[j]}: deutan/protan ΔE ${cvd.toFixed(1)} < ${floor} (tritan ${tritan}, not gated)`
}

const scaleColors = (mode: ThemeMode, name: string, length: number) => {
  const colors = getSemanticColors(mode) as Record<string, string>
  return Array.from({ length }, (_, i) => colors[`dataviz-${name}-${i}`])
}

const categoricalRoles = (mode: ThemeMode) =>
  scaleColors(mode, 'categorical', CATEGORICAL_CVD_SAFE_MAX)

describe('categorical palette under colour-vision deficiency', () => {
  for (const variant of ['default', 'dark'] as const) {
    it(`${variant}: holds deutan/protan ΔE >= 8 across the CVD-safe range`, () => {
      const colors = categoricalPalette[variant].slice(0, CATEGORICAL_CVD_SAFE_MAX)

      expect(allPairsViolations(colors, CATEGORICAL_ALL_PAIRS_FLOOR)).toEqual([])
      expect(minPairwise(colors), `${variant} min CVD ΔE`).toBeGreaterThanOrEqual(
        CATEGORICAL_ALL_PAIRS_FLOOR
      )
    })
  }
})

function collidingRolePairs(mode: ThemeMode): string[] {
  const colors = categoricalRoles(mode)
  const out: string[] = []
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      if (cvdDelta(colors[i], colors[j]) < CATEGORICAL_ALL_PAIRS_FLOOR) {
        out.push(`dataviz-categorical-${i} | dataviz-categorical-${j}`)
      }
    }
  }
  return out
}

// TD-756 D6: the semantic roles, not only the primitive arrays, hold the all-pairs floor
// in both modes. The light block carries its own steps; the pairs that miss today are
// recorded in tokens/cvd-baseline.json, which only shrinks.
describe('dataviz-categorical roles under colour-vision deficiency', () => {
  for (const mode of MODES) {
    it(`${mode}: only baselined dataviz-categorical-0..${CATEGORICAL_CVD_SAFE_MAX - 1} pairs fall below deutan/protan ΔE ${CATEGORICAL_ALL_PAIRS_FLOOR}`, () => {
      const recorded: readonly string[] = cvdBaseline[mode]
      const added = collidingRolePairs(mode).filter((pair) => !recorded.includes(pair))

      expect(
        added,
        `New CVD collision(s) in ${mode}:\n` +
          allPairsViolations(categoricalRoles(mode), CATEGORICAL_ALL_PAIRS_FLOOR).join('\n') +
          '\nPick distinct steps; the baseline only shrinks.'
      ).toEqual([])
    })

    it(`${mode}: the CVD baseline lists no pair that now clears the floor`, () => {
      const found = collidingRolePairs(mode)
      const stale = cvdBaseline[mode].filter((pair) => !found.includes(pair))

      expect(
        stale,
        `Stale baseline entr(ies) in ${mode}: remove them from theme/tokens/cvd-baseline.json.`
      ).toEqual([])
    })
  }
})

describe('dataviz scales under colour-vision deficiency', () => {
  for (const mode of MODES) {
    for (const { name, length } of SCALES) {
      it(`${mode}: dataviz-${name}-* adjacent steps hold deutan/protan ΔE >= ${ADJACENT_FLOOR}`, () => {
        const colors = scaleColors(mode, name, length)

        expect(adjacentViolations(colors, ADJACENT_FLOOR)).toEqual([])
        expect(minAdjacent(colors)).toBeGreaterThanOrEqual(ADJACENT_FLOOR)
      })
    }
  }
})

describe('CVD gate catches a collision', () => {
  // red[600] and green[600]-like hues collapse for red-green viewers while staying far apart
  // for normal vision.
  const collidingPalette = ['#D14343', '#6B8E23', '#2F6FED']

  it('flags a palette whose adjacent steps collide for deutan viewers', () => {
    const violations = adjacentViolations(collidingPalette, ADJACENT_FLOOR)

    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('0↔1')
    expect(violations[0]).toContain('tritan')
  })

  it('flags the same fixture in the all-pairs check', () => {
    expect(
      allPairsViolations(collidingPalette, CATEGORICAL_ALL_PAIRS_FLOOR).length
    ).toBeGreaterThan(0)
  })
})
