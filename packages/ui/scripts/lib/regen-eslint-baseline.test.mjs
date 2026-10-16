import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { formatRaised, regenEslintBaseline } from './regen-eslint-baseline.mjs'

const RULE_ID = 'titan/test-rule'

let pkgDir
let baselinePath

beforeEach(() => {
  pkgDir = mkdtempSync(path.join(tmpdir(), 'regen-baseline-'))
  baselinePath = path.join(pkgDir, 'baseline.json')
})

afterEach(() => rmSync(pkgDir, { recursive: true, force: true }))

const writeBaseline = (baseline) =>
  writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n')

const readBaseline = () => JSON.parse(readFileSync(baselinePath, 'utf8'))

/** A fake lint: each file lists the keys its messages are reported for. */
const lintReporting = (keysByFile) => async () =>
  Object.entries(keysByFile).map(([file, keys]) => ({
    filePath: path.join(pkgDir, file),
    messages: keys.map((key) => ({ ruleId: RULE_ID, messageId: key })),
  }))

const regen = (keysByFile, options = {}) =>
  regenEslintBaseline(
    { pkgDir, baselinePath, ruleId: RULE_ID, label: 'test', keysOf: (m) => [m.messageId] },
    { lint: lintReporting(keysByFile), ...options }
  )

describe('regenEslintBaseline', () => {
  it('refuses a swap of one grandfathered key for another and names the raised key', async () => {
    writeBaseline({ 'src/a.ts': { red: 1, blue: 1 } })
    const before = readFileSync(baselinePath, 'utf8')

    const outcome = await regen({ 'src/a.ts': ['red', 'green'] })

    expect(outcome.ok).toBe(false)
    expect(outcome.raised.map(formatRaised)).toEqual(['  src/a.ts green: 0 -> 1'])
    expect(readFileSync(baselinePath, 'utf8')).toBe(before)
  })

  it('writes a sorted baseline when every key shrinks or holds', async () => {
    writeBaseline({ 'src/b.ts': { red: 2 }, 'src/a.ts': { red: 1, blue: 1 } })

    const outcome = await regen({ 'src/b.ts': ['red'], 'src/a.ts': ['red', 'blue'] })

    expect(outcome.ok).toBe(true)
    expect(readFileSync(baselinePath, 'utf8')).toBe(
      JSON.stringify({ 'src/a.ts': { blue: 1, red: 1 }, 'src/b.ts': { red: 1 } }, null, 2) + '\n'
    )
  })

  it('writes a rise when increases are allowed', async () => {
    writeBaseline({ 'src/a.ts': { red: 1 } })

    const outcome = await regen({ 'src/a.ts': ['red', 'red'] }, { allowIncrease: true })

    expect(outcome.ok).toBe(true)
    expect(readBaseline()).toEqual({ 'src/a.ts': { red: 2 } })
  })

  it('refuses a file that had no allowance and now has violations', async () => {
    writeBaseline({ 'src/a.ts': { red: 1 } })

    const outcome = await regen({ 'src/a.ts': ['red'], 'src/new.ts': ['blue'] })

    expect(outcome.ok).toBe(false)
    expect(outcome.raised.map(formatRaised)).toEqual(['  src/new.ts blue: 0 -> 1'])
    expect(readBaseline()).toEqual({ 'src/a.ts': { red: 1 } })
  })

  it('puts the baseline back when the lint crashes', async () => {
    writeBaseline({ 'src/a.ts': { red: 1 } })
    const before = readFileSync(baselinePath, 'utf8')
    const lint = async () => {
      throw new Error('lint crashed')
    }

    await expect(regen({}, { lint })).rejects.toThrow('lint crashed')
    expect(readFileSync(baselinePath, 'utf8')).toBe(before)
  })

  it('refuses and leaves the baseline untouched when ESLint hit a fatal error on a file', async () => {
    writeBaseline({ 'src/a.ts': { red: 1 }, 'src/broken.ts': { red: 1 } })
    const before = readFileSync(baselinePath, 'utf8')
    const lint = async () => [
      { filePath: path.join(pkgDir, 'src/a.ts'), messages: [], fatalErrorCount: 0 },
      { filePath: path.join(pkgDir, 'src/broken.ts'), messages: [], fatalErrorCount: 1 },
    ]

    const outcome = await regen({}, { lint })

    expect(outcome.ok).toBe(false)
    expect(outcome.fatal).toEqual(['src/broken.ts'])
    expect(readFileSync(baselinePath, 'utf8')).toBe(before)
  })

  it('treats a constructor key as new rather than reading it off the prototype', async () => {
    writeBaseline({ 'src/a.ts': { red: 1 } })

    const outcome = await regen({ 'src/a.ts': ['constructor'] })

    expect(outcome.ok).toBe(false)
    expect(outcome.raised.map(formatRaised)).toEqual(['  src/a.ts constructor: 0 -> 1'])
  })
})
