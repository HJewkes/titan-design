/**
 * Regenerate `eslint-rules/tier-import-baseline.json`.
 *
 * Runs the real `titan/no-upward-tier-import` rule with an empty baseline and
 * records how many times each file imports each offending specifier. Going
 * through ESLint rather than re-scanning with regexes is the point: the
 * baseline then counts exactly what the rule counts, including its tier
 * resolution (relative and `@/`-alias imports, `src/lab/**` exempted).
 *
 * The file only ever shrinks in practice: run this after moving an upward
 * import down (or removing it) to lower a file's allowance and lock the
 * progress in. It refuses to raise an allowance unless you pass
 * --allow-increase, so a regen can't silently absorb a new violation.
 *
 *   node scripts/update-tier-import-baseline.mjs [--allow-increase]
 */

import { ESLint } from 'eslint'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The import specifier a message was reported for, recovered from the
 * node's line — ESLint interpolates a message's `data` into its string
 * before returning it, so the specifier can't be read back off the result.
 * An import/re-export line carries exactly one quoted string in this
 * codebase (no other quotes appear before `from '...'`), so the first
 * quoted run on the line is it.
 */
function specifierAt(lines, m) {
  const line = lines[m.line - 1] ?? ''
  const match = /(['"])((?:(?!\1).)+)\1/.exec(line)
  return match ? match[2] : null
}

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = path.join(pkgDir, 'eslint-rules', 'tier-import-baseline.json')
const allowIncrease = process.argv.includes('--allow-increase')

// Empty the baseline first so the rule reports every occurrence, not just the
// ones past the current allowance.
const previous = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {}
writeFileSync(baselinePath, '{}\n')

let results
try {
  // Glob src/** rather than each tier directory: the rule itself is a no-op
  // outside the tiers, and a `pages/` glob would throw NoFilesFoundError
  // before that family exists.
  const eslint = new ESLint({ cwd: pkgDir })
  results = await eslint.lintFiles(['src/**/*.{ts,tsx}'])
} finally {
  // Restore on failure so a crashed run can't leave the repo unguarded.
  if (!results) writeFileSync(baselinePath, JSON.stringify(previous, null, 2) + '\n')
}

const counts = {}
for (const result of results) {
  const source = readFileSync(result.filePath, 'utf8').split('\n')
  const file = path.relative(pkgDir, result.filePath).split(path.sep).join('/')
  for (const m of result.messages) {
    if (m.ruleId !== 'titan/no-upward-tier-import') continue
    const specifier = specifierAt(source, m)
    if (!specifier) continue
    counts[file] ??= {}
    counts[file][specifier] = (counts[file][specifier] ?? 0) + 1
  }
}

const fileTotal = (entry) => Object.values(entry ?? {}).reduce((a, b) => a + b, 0)

const raised = Object.entries(counts).filter(
  ([file, entry]) => fileTotal(entry) > fileTotal(previous[file])
)
if (raised.length > 0 && !allowIncrease) {
  writeFileSync(baselinePath, JSON.stringify(previous, null, 2) + '\n')
  console.error('Refusing to raise the tier-import baseline for:\n')
  for (const [file, entry] of raised) {
    console.error(`  ${file}: ${fileTotal(previous[file])} -> ${fileTotal(entry)}`)
  }
  console.error(
    '\nThese files gained upward imports. Move them down a tier, or re-run with\n' +
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
console.log(`tier-import baseline: ${total} occurrences across ${Object.keys(sorted).length} files`)
if (before) console.log(`previous: ${before} — delta ${total - before}`)
