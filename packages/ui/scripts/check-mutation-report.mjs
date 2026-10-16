// Fails when Stryker's JSON report holds no mutants, or none in carouselMath; prints the scores.
import { readFileSync } from 'node:fs'

import { isEntryPoint } from './lib/entry.mjs'

export const SENTINEL_FILE = 'carouselMath.ts'

const DETECTED = new Set(['Killed', 'Timeout'])
const UNDETECTED = new Set(['Survived', 'NoCoverage'])

// The mutation-testing-elements score: detected over detected plus undetected.
export function score(mutants) {
  const detected = mutants.filter((m) => DETECTED.has(m.status)).length
  const undetected = mutants.filter((m) => UNDETECTED.has(m.status)).length
  const valid = detected + undetected
  return { total: mutants.length, detected, valid, percent: valid ? (100 * detected) / valid : NaN }
}

export function summarize(report) {
  const files = Object.entries(report.files ?? {})
  const all = files.flatMap(([, file]) => file.mutants ?? [])
  const sentinel = files.find(([path]) => path.endsWith(SENTINEL_FILE))
  return {
    overall: score(all),
    sentinel: sentinel ? { path: sentinel[0], ...score(sentinel[1].mutants ?? []) } : null,
  }
}

export function check(summary) {
  if (summary.overall.total === 0)
    return 'Mutation guard: the report holds no mutants; check the mutate globs.'
  if (!summary.sentinel || summary.sentinel.total === 0) {
    return `Mutation guard: no mutants in ${SENTINEL_FILE}; check the mutate globs.`
  }
  return null
}

const format = ({ total, detected, valid, percent }) =>
  `${percent.toFixed(2)}% (${detected}/${valid} detected, ${total} mutants)`

if (isEntryPoint(import.meta.url, process.argv[1])) {
  const path = process.argv[2] ?? 'reports/mutation/mutation.json'
  const summary = summarize(JSON.parse(readFileSync(path, 'utf8')))
  const failure = check(summary)
  if (failure) {
    console.error(failure)
    process.exit(1)
  }
  console.log(`Mutation score, all files: ${format(summary.overall)}`)
  console.log(`Mutation score, ${summary.sentinel.path}: ${format(summary.sentinel)}`)
}
