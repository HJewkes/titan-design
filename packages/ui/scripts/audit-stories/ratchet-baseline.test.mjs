// Holds the committed ratchet baseline shrink-only. audit:stories needs a browser, so this compares
// the file with its copy at the merge base instead of re-measuring it.
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { BASELINE_PATH, BASELINE_SCHEMA, RATCHETED_KINDS } from './ratchet.mjs'

const REPO_PATH = 'packages/ui/scripts/audit-stories/ratchet-baseline.json'

const keyCount = (stories) => Object.values(stories).flat().length

/** Every way `next` grew past `previous`: a new kind, a higher ceiling or more keys. Pure. */
function growth(previous, next) {
  return Object.entries(next.kinds).flatMap(([kind, stories]) => {
    if (!(kind in previous.kinds)) return [`${kind}: kind added`]
    const problems = []
    if (next.ceiling[kind] > previous.ceiling[kind])
      problems.push(`${kind}: ceiling ${previous.ceiling[kind]} -> ${next.ceiling[kind]}`)
    const [before, after] = [keyCount(previous.kinds[kind]), keyCount(stories)]
    if (after > before) problems.push(`${kind}: keys ${before} -> ${after}`)
    return problems
  })
}

const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

/** The base copy: `{ sha, file }`, `file` null when the base has none, or `{ skip }` with why. */
function baseCopy() {
  let sha
  try {
    sha = git(['merge-base', 'HEAD', 'origin/main'])
  } catch {
    return { skip: 'git or origin/main is unavailable, so the merge base cannot be read' }
  }
  try {
    return { sha, file: JSON.parse(git(['show', `${sha}:${REPO_PATH}`])) }
  } catch {
    return { sha, file: null }
  }
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
const base = baseCopy()
if (base.skip) console.warn(`ratchet-baseline: skipping the merge-base check: ${base.skip}`)
else
  console.log(
    `ratchet-baseline: merge base ${base.sha}, base file ${base.file ? 'found' : 'absent'}`
  )

const isSorted = (values) => values.every((v, i) => i === 0 || values[i - 1] < v)

describe('the committed ratchet baseline', () => {
  it('is schema 1 and ratchets only known kinds', () => {
    expect(baseline.schema).toBe(BASELINE_SCHEMA)
    expect(RATCHETED_KINDS).toEqual(expect.arrayContaining(Object.keys(baseline.kinds)))
  })

  it('lists stories and selectors sorted, with no duplicates', () => {
    for (const stories of Object.values(baseline.kinds)) {
      expect(isSorted(Object.keys(stories))).toBe(true)
      for (const selectors of Object.values(stories)) expect(isSorted(selectors)).toBe(true)
    }
  })

  it('holds no more keys per kind than its ceiling', () => {
    for (const [kind, stories] of Object.entries(baseline.kinds))
      expect(keyCount(stories)).toBeLessThanOrEqual(baseline.ceiling[kind])
  })

  it.skipIf(Boolean(base.skip))(
    'has not grown since the merge base (vacuous when the base has no file, as in the seed PR)',
    () => {
      expect(base.file ? growth(base.file, baseline) : []).toEqual([])
    }
  )
})

describe('growth', () => {
  const file = (ceiling, stories) => ({
    ceiling: { 'text-floor': ceiling },
    kinds: { 'text-floor': stories },
  })

  it('reports nothing for an equal file', () => {
    expect(growth(file(1, { a: ['x'] }), file(1, { a: ['x'] }))).toEqual([])
  })

  it('reports one more key, even with the ceiling raised to match', () => {
    expect(growth(file(1, { a: ['x'] }), file(2, { a: ['x', 'y'] }))).toEqual([
      'text-floor: ceiling 1 -> 2',
      'text-floor: keys 1 -> 2',
    ])
  })

  it('accepts a selector moved at equal count', () => {
    expect(growth(file(1, { a: ['x'] }), file(1, { b: ['y'] }))).toEqual([])
  })

  it('reports a kind the base did not ratchet', () => {
    const next = { ...file(1, {}), kinds: { 'text-floor': {}, 'nested-lift': { a: ['x'] } } }

    expect(growth(file(1, {}), next)).toEqual(['nested-lift: kind added'])
  })
})
