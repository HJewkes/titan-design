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

/**
 * 'check' with a merge base; without one, 'skip' locally but 'fail' in CI, where a skipped check
 * would silently stop holding the baseline shrink-only. A base with no readable copy also fails
 * in CI: main holds the baseline, so its absence means REPO_PATH or git broke. Pure.
 */
function mergeBaseMode(base, env) {
  const inCI = env.CI === 'true' || env.CI === '1'
  if (base.skip) return inCI ? 'fail' : 'skip'
  return inCI && base.file === null ? 'fail' : 'check'
}

/** Why a 'fail' mode fails. Pure. */
const failureReason = (base) =>
  base.skip
    ? `CI must fetch origin/main (fetch-depth: 0): ${base.skip}`
    : `merge base ${base.sha} has no readable ${REPO_PATH}; check REPO_PATH`

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
const base = baseCopy()
const mode = mergeBaseMode(base, process.env)
if (mode === 'check')
  console.log(
    `ratchet-baseline: merge base ${base.sha}, base file ${base.file ? 'found' : 'absent'}`
  )
else if (mode === 'skip')
  console.warn(`ratchet-baseline: skipping the merge-base check: ${base.skip}`)
else console.error(`ratchet-baseline: failing the merge-base check in CI: ${failureReason(base)}`)

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

  it.skipIf(mode === 'skip')(
    'has not grown since the merge base (vacuous outside CI when the base has no file)',
    () => {
      if (mode === 'fail') expect.fail(failureReason(base))
      expect(base.file ? growth(base.file, baseline) : []).toEqual([])
    }
  )
})

describe('mergeBaseMode', () => {
  const missing = { skip: 'git or origin/main is unavailable' }

  it('checks whenever a merge base and its copy were read, in CI or not', () => {
    expect(mergeBaseMode({ sha: 'abc', file: { kinds: {} } }, {})).toBe('check')
    expect(mergeBaseMode({ sha: 'abc', file: { kinds: {} } }, { CI: 'true' })).toBe('check')
  })

  it('checks a merge base with no readable copy outside CI', () => {
    expect(mergeBaseMode({ sha: 'abc', file: null }, {})).toBe('check')
  })

  it('fails in CI when the merge base has no readable copy', () => {
    const noCopy = { sha: 'abc', file: null }

    expect(mergeBaseMode(noCopy, { CI: 'true' })).toBe('fail')
    expect(mergeBaseMode(noCopy, { CI: '1' })).toBe('fail')
    expect(failureReason(noCopy)).toContain(REPO_PATH)
  })

  it('skips a missing merge base outside CI', () => {
    expect(mergeBaseMode(missing, {})).toBe('skip')
  })

  it('fails instead of skipping when CI is set and the merge base is missing', () => {
    expect(mergeBaseMode(missing, { CI: 'true' })).toBe('fail')
    expect(mergeBaseMode(missing, { CI: '1' })).toBe('fail')
  })
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
