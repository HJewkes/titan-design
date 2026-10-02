// Fails when the Storybook play run executed too few tests or skipped any inside a play file.
import { readFileSync } from 'node:fs'

export const MIN_PLAY_TESTS = 10

const SKIPPED = new Set(['skipped', 'pending', 'todo'])

// A file the tag filter dropped has no executed test; a play file has at least one.
export function summarize(report) {
  let executed = 0
  const skippedInPlayFiles = []
  for (const file of report.testResults ?? []) {
    const tests = file.assertionResults ?? []
    const ran = tests.filter((t) => !SKIPPED.has(t.status))
    if (ran.length === 0) continue
    executed += ran.length
    for (const t of tests) if (SKIPPED.has(t.status)) skippedInPlayFiles.push(t.fullName ?? t.title)
  }
  return { executed, skippedInPlayFiles }
}

export function check(report, min = MIN_PLAY_TESTS) {
  const { executed, skippedInPlayFiles } = summarize(report)
  if (executed < min) return `Play guard: ${executed} play tests executed, expected at least ${min}.`
  if (skippedInPlayFiles.length > 0) {
    return `Play guard: ${skippedInPlayFiles.length} play test(s) skipped: ${skippedInPlayFiles.join('; ')}`
  }
  return null
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2] ?? '.vitest-storybook-report.json'
  const failure = check(JSON.parse(readFileSync(path, 'utf8')))
  if (failure) {
    console.error(failure)
    process.exit(1)
  }
  console.log(`Play guard: ${summarize(JSON.parse(readFileSync(path, 'utf8'))).executed} play tests executed, none skipped.`)
}
