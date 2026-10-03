/**
 * Regenerate `eslint-rules/composition-baseline.json`.
 *
 * Runs the real `titan/no-raw-composition` rule with an empty baseline and
 * records how many times each file trips each messageId (`rawButton`,
 * `d3Import`). Going through ESLint rather than re-scanning with regexes means
 * the baseline counts exactly what the rule counts, including its scoping
 * (tests and stories may render a <button>, ui/charts may import d3, src/lab is
 * exempt).
 *
 * The file only ever shrinks in practice: run this after replacing a raw
 * button or moving a d3 import into ui/charts to lock the progress in. It
 * refuses to raise any allowance unless you pass --allow-increase, so a regen
 * can't silently absorb a new violation.
 *
 *   node scripts/update-composition-baseline.mjs [--allow-increase]
 */

import { ESLint } from 'eslint'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RULE_ID = 'titan/no-raw-composition'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = path.join(pkgDir, 'eslint-rules', 'composition-baseline.json')
const allowIncrease = process.argv.includes('--allow-increase')

const writeBaseline = (baseline) =>
  writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n')

// Empty the baseline first so the rule reports every occurrence, not just the
// ones past the current allowance.
const previous = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {}
writeBaseline({})

let results
try {
  const eslint = new ESLint({ cwd: pkgDir })
  results = await eslint.lintFiles(['src/**/*.{ts,tsx}'])
} finally {
  // Restore on failure so a crashed run can't leave the repo unguarded.
  if (!results) writeBaseline(previous)
}

const counts = {}
for (const result of results) {
  const file = path.relative(pkgDir, result.filePath).split(path.sep).join('/')
  for (const m of result.messages) {
    if (m.ruleId !== RULE_ID || !m.messageId) continue
    counts[file] ??= {}
    counts[file][m.messageId] = (counts[file][m.messageId] ?? 0) + 1
  }
}

const raised = Object.entries(counts).flatMap(([file, entry]) =>
  Object.entries(entry)
    .filter(([id, n]) => n > (previous[file]?.[id] ?? 0))
    .map(([id, n]) => `  ${file} ${id}: ${previous[file]?.[id] ?? 0} -> ${n}`)
)
if (raised.length > 0 && !allowIncrease) {
  writeBaseline(previous)
  console.error(`Refusing to raise the composition baseline for:\n\n${raised.join('\n')}`)
  console.error(
    '\nReplace the raw <button> with Button, ToolbarButton, TriggerSurface or Pressable,\n' +
      'or move the d3 code into src/components/ui/charts. Re-run with --allow-increase\n' +
      'only if the increase is genuinely intended.'
  )
  process.exit(1)
}

const sorted = Object.fromEntries(
  Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, entry]) => [
      file,
      Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))),
    ])
)
writeBaseline(sorted)

const totalOf = (baseline, id) =>
  Object.values(baseline).reduce((sum, entry) => sum + (entry[id] ?? 0), 0)
for (const id of ['rawButton', 'd3Import']) {
  const files = Object.values(sorted).filter((entry) => entry[id]).length
  console.log(
    `${id}: ${totalOf(sorted, id)} across ${files} files (previous ${totalOf(previous, id)})`
  )
}
