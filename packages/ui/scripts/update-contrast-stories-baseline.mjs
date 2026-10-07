/**
 * Regenerate `tests/visual/contrast-stories-baseline.json` (TD-738).
 *
 * With no arguments, runs `tests/visual/contrast.spec.ts` through `playwright.contrast.config.ts`
 * (a failing run is expected: it is the regeneration) and merges its report. With arguments, merges
 * the given report files instead: the `contrast-report-<shard>` artifacts the CI `contrast` job
 * uploads, so the committed baseline is the one CI's Chromium produces.
 *
 * The baseline may only shrink. The script refuses to add a story-theme or a pair, or to raise a
 * count, unless you pass --allow-increase; and it keeps an entry no report row mentions (a story
 * absent from a partial set of shards) unless you pass --drop-missing.
 *
 *   node scripts/update-contrast-stories-baseline.mjs [report.jsonl ...] [--allow-increase] [--drop-missing]
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { isEntryPoint } from './lib/entry.mjs'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BASELINE_PATH = path.join(pkgDir, 'tests', 'visual', 'contrast-stories-baseline.json')

/** Rows of one or more JSONL reports; a blank row carries no counts and is dropped. */
export function parseReports(texts) {
  return texts
    .flatMap((text) => text.split('\n'))
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line))
}

function sortedPairs(counts) {
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)))
}

/** The baseline the rows describe, keys sorted; entries without a row are kept unless dropped. */
export function mergeBaseline(previous, rows, { dropMissing = false } = {}) {
  const seen = new Set(rows.map((row) => row.key))
  const next = dropMissing
    ? {}
    : Object.fromEntries(Object.entries(previous).filter(([key]) => !seen.has(key)))
  for (const row of rows) {
    if (row.blank !== undefined || !row.counts) continue
    if (Object.keys(row.counts).length > 0) next[row.key] = sortedPairs(row.counts)
  }
  return Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)))
}

/** Every story-theme and pair whose count the regeneration would raise, as one line each. */
export function increases(previous, next) {
  const lines = []
  for (const [key, counts] of Object.entries(next)) {
    for (const [pair, count] of Object.entries(counts)) {
      const before = previous[key]?.[pair] ?? 0
      if (count > before) lines.push(`${key}: ${pair} ${before} -> ${count}`)
    }
  }
  return lines
}

function runSuite() {
  const report = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'titan-contrast-')),
    'report.jsonl'
  )
  const result = spawnSync(
    'pnpm',
    ['exec', 'playwright', 'test', '--config', 'playwright.contrast.config.ts', '--reporter=line'],
    { cwd: pkgDir, stdio: 'inherit', env: { ...process.env, TITAN_CONTRAST_REPORT: report } }
  )
  if (result.error) throw result.error
  if (!fs.existsSync(report)) throw new Error(`the suite wrote no report at ${report}`)
  return [report]
}

function main() {
  const args = process.argv.slice(2)
  const allowIncrease = args.includes('--allow-increase')
  const dropMissing = args.includes('--drop-missing')
  const files = args.filter((arg) => !arg.startsWith('--'))
  const reports = files.length > 0 ? files : runSuite()

  const previous = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
  const rows = parseReports(reports.map((file) => fs.readFileSync(file, 'utf8')))
  if (rows.length === 0) throw new Error(`no report rows in ${reports.join(', ')}`)
  const next = mergeBaseline(previous, rows, { dropMissing })

  const grown = increases(previous, next)
  if (grown.length > 0 && !allowIncrease) {
    console.error(
      `Refusing to grow the baseline (${grown.length} increase(s); pass --allow-increase):`
    )
    for (const line of grown) console.error(`  ${line}`)
    process.exit(1)
  }

  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`)
  const entries = Object.keys(next).length
  const nodes = Object.values(next).reduce(
    (sum, counts) => sum + Object.values(counts).reduce((a, b) => a + b, 0),
    0
  )
  console.log(
    `${path.relative(pkgDir, BASELINE_PATH)}: ${entries} story-theme entries, ${nodes} nodes, ` +
      `from ${rows.length} report rows`
  )
}

if (isEntryPoint(import.meta.url, process.argv[1])) main()
