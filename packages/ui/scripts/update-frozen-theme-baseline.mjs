/**
 * Regenerate `eslint-rules/frozen-theme-baseline.json`.
 *
 * Runs the real `titan/no-frozen-theme` rule with an empty baseline and records
 * how many frozen calls each file holds, keyed by the frozen value (`dark`,
 * `light`, `module-scope`). Going through ESLint rather than re-scanning with
 * regexes is the point: the baseline then counts exactly what the rule counts,
 * including its module-scope analysis and the config's file scoping.
 *
 * The file only ever shrinks in practice: run this after migrating a file to
 * hook-time resolution to lower its allowance and lock the progress in. It
 * refuses to raise an allowance unless you pass --allow-increase, so a regen
 * can't silently absorb a new violation.
 *
 *   node scripts/update-frozen-theme-baseline.mjs [--allow-increase]
 */

import { ESLint } from 'eslint'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The frozen value a message was reported for. ESLint interpolates `data` into
 * the message string before returning it, so read the mode back out of the
 * rendered text: `literalMode` quotes it, `moduleScope` has no mode at all.
 */
function frozenValueOf(message) {
  const match = /^getSemanticColors\('([^']+)'\)/.exec(message.message)
  return match ? match[1] : 'module-scope'
}

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = path.join(pkgDir, 'eslint-rules', 'frozen-theme-baseline.json')
const allowIncrease = process.argv.includes('--allow-increase')

// Empty the baseline first so the rule reports every occurrence, not just the
// ones past the current allowance.
const previous = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {}
writeFileSync(baselinePath, '{}\n')

let results
try {
  // Glob src/** rather than the component directories: the rule is only enabled
  // where the config enables it, and a `pages/` glob would throw
  // NoFilesFoundError before that family exists.
  const eslint = new ESLint({ cwd: pkgDir })
  results = await eslint.lintFiles(['src/**/*.{ts,tsx}'])
} finally {
  // Restore on failure so a crashed run can't leave the repo unguarded.
  if (!results) writeFileSync(baselinePath, JSON.stringify(previous, null, 2) + '\n')
}

const counts = {}
for (const result of results) {
  const file = path.relative(pkgDir, result.filePath).split(path.sep).join('/')
  for (const m of result.messages) {
    if (m.ruleId !== 'titan/no-frozen-theme') continue
    const value = frozenValueOf(m)
    counts[file] ??= {}
    counts[file][value] = (counts[file][value] ?? 0) + 1
  }
}

const fileTotal = (entry) => Object.values(entry ?? {}).reduce((a, b) => a + b, 0)

const raised = Object.entries(counts).filter(
  ([file, entry]) => fileTotal(entry) > fileTotal(previous[file])
)
if (raised.length > 0 && !allowIncrease) {
  writeFileSync(baselinePath, JSON.stringify(previous, null, 2) + '\n')
  console.error('Refusing to raise the frozen-theme baseline for:\n')
  for (const [file, entry] of raised) {
    console.error(`  ${file}: ${fileTotal(previous[file])} -> ${fileTotal(entry)}`)
  }
  console.error(
    '\nThese files gained frozen-theme calls. Resolve the colour at render time\n' +
      '(useOnSurfaceColor / getSemanticColors(useSurfaceMode())), or re-run with\n' +
      '--allow-increase if the increase is genuinely intended.'
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
writeFileSync(baselinePath, JSON.stringify(sorted, null, 2) + '\n')

const total = Object.values(sorted).reduce((a, e) => a + fileTotal(e), 0)
const before = Object.values(previous).reduce((a, e) => a + fileTotal(e), 0)
console.log(
  `frozen-theme baseline: ${total} occurrences across ${Object.keys(sorted).length} files`
)
if (before) console.log(`previous: ${before} — delta ${total - before}`)
