/**
 * TD-486 — the non-text contrast gate.
 *
 * Every declared pair (control boundary, tone mark, fill, track, separator) is
 * composited over the five planes in light and dark and held to 3:1, or to the
 * ΔL* 7 / 12 / 18 separator floors. Today's failures live in
 * `nontext-contrast.baseline.json`, which can only shrink: a new failing pair
 * fails here, and so does a baselined pair that now passes, so the value PR that
 * fixes a pair deletes its line in the same commit.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getSemanticColors } from '../tokens/semantic'
import { NON_TEXT_PAIRS, PLANES } from './pairs'
import { MODES, measurePair, type Measurement } from './measure'

const BASELINE = join(__dirname, 'nontext-contrast.baseline.json')
const baseline: string[] = JSON.parse(readFileSync(BASELINE, 'utf8'))

const measurements: Measurement[] = MODES.flatMap((mode) =>
  NON_TEXT_PAIRS.flatMap((pair) => PLANES.map((plane) => measurePair(pair, mode, plane)))
)
const byKey = new Map(measurements.map((m) => [m.key, m]))

describe('non-text contrast gate (TD-486)', () => {
  it('declares unique pair ids over tokens that exist in both themes', () => {
    const ids = NON_TEXT_PAIRS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const mode of MODES) {
      const colors = getSemanticColors(mode)
      for (const pair of NON_TEXT_PAIRS) {
        for (const token of [pair.token, pair.over ?? pair.token, ...PLANES]) {
          expect(colors, `${pair.id}: no '${token}' in ${mode}`).toHaveProperty(token)
        }
      }
    }
  })

  it('fails no pair that is not in the baseline', () => {
    const fresh = measurements.filter((m) => !m.passes && !baseline.includes(m.key))
    expect(
      fresh.map((m) => `${m.key} ${m.detail}`),
      'New failing pairs. Fix the token, or fix the pair; do not grow the baseline.'
    ).toEqual([])
  })

  it('baselines only pairs that still fail', () => {
    const stale = baseline.filter((key) => byKey.get(key)?.passes !== false)
    expect(
      stale,
      'Baselined pairs that now pass, or no longer exist. Delete these lines from the baseline.'
    ).toEqual([])
  })

  it('never prints a failing measurement at or above its floor', () => {
    const misprinted = measurements.filter((m) => {
      const numbers = (m.detail.match(/[\d.]+/g) ?? []).map(Number)
      return !m.passes && numbers[0] >= numbers[numbers.length - 1]
    })
    expect(misprinted.map((m) => `${m.key} ${m.detail}`)).toEqual([])
  })

  it('keeps the baseline sorted, one unique entry per line', () => {
    const lines = baseline.map((key) => `  ${JSON.stringify(key)}`).join(',\n')
    const canonical = baseline.length ? `[\n${lines}\n]\n` : '[]\n'
    expect(baseline).toEqual([...new Set(baseline)].sort())
    expect(readFileSync(BASELINE, 'utf8')).toBe(canonical)
  })
})
