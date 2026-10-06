/**
 * The regen flow shared by the shrink-only ESLint baselines (`eslint-rules/*-baseline.json`).
 *
 * Each baseline maps file -> key -> allowed count, where the key is whatever the rule's
 * allowance is spent on (a colour, a specifier, a messageId). A regen empties the baseline so
 * the rule reports every occurrence, buckets those by file and key, and refuses unless every
 * key stays at or below its previous allowance. Comparing per key rather than per file total
 * matters: swapping one grandfathered violation for a new one of another key keeps the total
 * equal, and a total comparison would absorb the new one silently.
 *
 * To add a baseline, write a script that calls `runBaselineUpdater` with its rule id, baseline
 * path, label, hint and a `keysOf(message, readLines)` that names the keys a message spends.
 */

import { ESLint } from 'eslint'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DEFAULT_GLOBS = ['src/**/*.{ts,tsx}']

const writeJson = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n')

const sortedEntries = (object) => Object.entries(object).sort(([a], [b]) => a.localeCompare(b))

/**
 * Source text a message was reported on, sliced from its range. ESLint interpolates a
 * message's `data` into its string before returning it, so the offending value can't be read
 * back off the result, but the node's range can.
 */
export function reportedText(lines, m) {
  if (!m.line) return ''
  if (!m.endLine || m.endLine === m.line) {
    return (lines[m.line - 1] ?? '').slice(m.column - 1, m.endColumn ? m.endColumn - 1 : undefined)
  }
  const chunk = [(lines[m.line - 1] ?? '').slice(m.column - 1)]
  for (let i = m.line; i < m.endLine - 1; i++) chunk.push(lines[i] ?? '')
  chunk.push((lines[m.endLine - 1] ?? '').slice(0, m.endColumn - 1))
  return chunk.join('\n')
}

/** file -> key -> count for every `ruleId` message; a file's source is read only if asked. */
export function countByKey(results, { pkgDir, ruleId, keysOf }) {
  const counts = {}
  for (const result of results) {
    const file = path.relative(pkgDir, result.filePath).split(path.sep).join('/')
    let lines
    const readLines = () => (lines ??= readFileSync(result.filePath, 'utf8').split('\n'))
    for (const m of result.messages) {
      if (m.ruleId !== ruleId) continue
      for (const key of keysOf(m, readLines)) {
        if (!Object.hasOwn(counts, file)) counts[file] = {}
        counts[file][key] = (Object.hasOwn(counts[file], key) ? counts[file][key] : 0) + 1
      }
    }
  }
  return counts
}

/** Own properties only: a key named `constructor` must not read Object.prototype. */
const allowanceOf = (previous, file, key) =>
  Object.hasOwn(previous, file) && Object.hasOwn(previous[file], key) ? previous[file][key] : 0

/** Every file and key whose count rose past its previous allowance. */
export function raisedKeys(previous, counts) {
  return Object.entries(counts).flatMap(([file, entry]) =>
    Object.entries(entry)
      .filter(([key, n]) => n > allowanceOf(previous, file, key))
      .map(([key, n]) => ({ file, key, from: allowanceOf(previous, file, key), to: n }))
  )
}

/** Files ESLint could not lint (parse errors and the like), whose violations went uncounted. */
const fatalFiles = (results, pkgDir) =>
  results
    .filter((result) => result.fatalErrorCount > 0)
    .map((result) => path.relative(pkgDir, result.filePath).split(path.sep).join('/'))

/** Files and the keys within each sorted, so a regen diff shows only real changes. */
export function sortBaseline(counts) {
  return Object.fromEntries(
    sortedEntries(counts).map(([file, entry]) => [file, Object.fromEntries(sortedEntries(entry))])
  )
}

/**
 * Rewrite the baseline from a fresh lint. On a refusal or a crashed lint the baseline file is
 * put back byte for byte, so a failed run can't leave the repo unguarded.
 */
export async function regenEslintBaseline(config, { allowIncrease = false, lint } = {}) {
  const { pkgDir, baselinePath, globs = DEFAULT_GLOBS } = config
  const runLint = lint ?? ((files) => new ESLint({ cwd: pkgDir }).lintFiles(files))
  const original = existsSync(baselinePath) ? readFileSync(baselinePath, 'utf8') : '{}\n'
  const restore = () => writeFileSync(baselinePath, original)
  const previous = JSON.parse(original)

  writeJson(baselinePath, {})
  let results
  try {
    results = await runLint(globs)
  } finally {
    if (!results) restore()
  }

  const fatal = fatalFiles(results, pkgDir)
  if (fatal.length > 0) {
    restore()
    return { ok: false, raised: [], fatal, previous }
  }

  const counts = countByKey(results, config)
  const raised = raisedKeys(previous, counts)
  if (raised.length > 0 && !allowIncrease) {
    restore()
    return { ok: false, raised, previous }
  }
  const baseline = sortBaseline(counts)
  writeJson(baselinePath, baseline)
  return { ok: true, raised, baseline, previous }
}

const occurrences = (baseline) =>
  Object.values(baseline).reduce(
    (sum, entry) => sum + Object.values(entry).reduce((a, b) => a + b, 0),
    0
  )

function summarizeTotals(label, baseline, previous) {
  const total = occurrences(baseline)
  const before = occurrences(previous)
  console.log(
    `${label} baseline: ${total} occurrences across ${Object.keys(baseline).length} files`
  )
  if (before) console.log(`previous: ${before} — delta ${total - before}`)
}

export function formatRaised({ file, key, from, to }) {
  return `  ${file} ${key}: ${from} -> ${to}`
}

/**
 * The CLI around `regenEslintBaseline`: honours `--allow-increase`, lists every raised
 * file and key and exits 1 on a refusal, otherwise prints a summary (`summarize` overrides
 * the default occurrence count).
 */
export async function runBaselineUpdater(config) {
  const allowIncrease = process.argv.includes('--allow-increase')
  const outcome = await regenEslintBaseline(config, { allowIncrease })
  if (outcome.fatal?.length) {
    console.error(`Refusing to rewrite the ${config.label} baseline: ESLint failed on:\n`)
    for (const file of outcome.fatal) console.error(`  ${file}`)
    process.exit(1)
  }
  if (!outcome.ok) {
    console.error(`Refusing to raise the ${config.label} baseline for:\n`)
    for (const raised of outcome.raised) console.error(formatRaised(raised))
    console.error(`\n${config.hint}`)
    process.exit(1)
  }
  const summarize = config.summarize ?? summarizeTotals
  summarize(config.label, outcome.baseline, outcome.previous)
}
