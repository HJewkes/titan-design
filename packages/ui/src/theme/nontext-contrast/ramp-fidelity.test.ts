/**
 * TD-486 — ramp fidelity. Every semantic colour value, in both themes, is a
 * primitive ramp step or sits on `ramp-allowlist.json` with a one-line reason.
 * The allowlist is shrink-only: a new off-ramp value fails here, and so does an
 * entry whose token now resolves to a ramp step, so a snapping PR deletes its
 * lines. Alpha values are measured by composition, not by hex, so they are
 * allowlisted as a class of token rather than hidden from the test.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { greyRamp, primitiveColors, primitiveRamps } from '../tokens/primitives'
import { getSemanticColors } from '../tokens/semantic'
import { MODES } from './measure'

const ALLOWLIST = join(__dirname, 'ramp-allowlist.json')
const allowlist: Record<string, string> = JSON.parse(readFileSync(ALLOWLIST, 'utf8'))

const rampSteps = new Set(
  [
    ...Object.values(primitiveColors),
    ...Object.values(greyRamp),
    ...Object.values(primitiveRamps).flatMap((hue) => Object.values(hue)),
  ].map((v) => v.toLowerCase())
)

const offRamp = MODES.flatMap((mode) =>
  Object.entries(getSemanticColors(mode) as Record<string, string>)
    .filter(([, value]) => !rampSteps.has(value.toLowerCase()))
    .map(([token]) => `${mode}:${token}`)
)

describe('semantic colour ramp fidelity (TD-486)', () => {
  it('has no off-ramp value outside the allowlist', () => {
    expect(
      offRamp.filter((key) => !(key in allowlist)),
      'Off-ramp semantic values. Use a ramp step, or allowlist the token with a reason.'
    ).toEqual([])
  })

  it('allowlists only tokens that are still off-ramp', () => {
    expect(
      Object.keys(allowlist).filter((key) => !offRamp.includes(key)),
      'Allowlisted tokens that now resolve to a ramp step, or are gone. Delete these lines.'
    ).toEqual([])
  })

  it('gives every entry a reason, sorted one per line', () => {
    const keys = Object.keys(allowlist)
    expect(keys).toEqual([...keys].sort())
    for (const [key, reason] of Object.entries(allowlist)) {
      expect(reason.trim().length, `${key} needs a reason`).toBeGreaterThan(10)
    }
    const lines = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(allowlist[k])}`)
    expect(readFileSync(ALLOWLIST, 'utf8')).toBe(`{\n${lines.join(',\n')}\n}\n`)
  })
})
