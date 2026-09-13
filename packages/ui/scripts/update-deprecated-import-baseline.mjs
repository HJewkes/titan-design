/**
 * Regenerate `eslint-rules/deprecated-import-baseline.json`.
 *
 * Runs the real `titan/no-deprecated-import` rule with an empty baseline and
 * records how many times each file imports each deprecated name. Going
 * through ESLint rather than re-scanning by hand is the point: the baseline
 * then counts exactly what the rule counts, including its re-export-chain
 * resolution (`deprecated-export-registry.js`).
 *
 * The file only ever shrinks in practice: run this after migrating a
 * consumer off a deprecated export to lower a file's allowance and lock the
 * progress in. It refuses to raise an allowance unless you pass
 * --allow-increase, so a regen can't silently absorb a new violation.
 *
 *   node scripts/update-deprecated-import-baseline.mjs [--allow-increase]
 */

import { ESLint } from 'eslint'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The deprecated name a message was reported for, recovered from the node's
 * range — ESLint interpolates a message's `data` into its string before
 * returning it, so the name can't be read back off the result. The rule
 * reports on the specifier's own identifier node, so the range is exactly
 * the name text with nothing to strip.
 */
function nameAt(lines, m) {
  const line = lines[m.line - 1] ?? ''
  return line.slice(m.column - 1, m.endColumn ? m.endColumn - 1 : undefined)
}

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = path.join(pkgDir, 'eslint-rules', 'deprecated-import-baseline.json')
const allowIncrease = process.argv.includes('--allow-increase')

// Empty the baseline first so the rule reports every occurrence, not just the
// ones past the current allowance.
const previous = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {}
writeFileSync(baselinePath, '{}\n')

let results
try {
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
    if (m.ruleId !== 'titan/no-deprecated-import') continue
    const name = nameAt(source, m)
    counts[file] ??= {}
    counts[file][name] = (counts[file][name] ?? 0) + 1
  }
}

const fileTotal = (entry) => Object.values(entry ?? {}).reduce((a, b) => a + b, 0)

const raised = Object.entries(counts).filter(
  ([file, entry]) => fileTotal(entry) > fileTotal(previous[file])
)
if (raised.length > 0 && !allowIncrease) {
  writeFileSync(baselinePath, JSON.stringify(previous, null, 2) + '\n')
  console.error('Refusing to raise the deprecated-import baseline for:\n')
  for (const [file, entry] of raised) {
    console.error(`  ${file}: ${fileTotal(previous[file])} -> ${fileTotal(entry)}`)
  }
  console.error(
    '\nThese files gained deprecated imports. Migrate them to the replacement named in\n' +
      'the @deprecated tag, or re-run with --allow-increase if the increase is genuinely\n' +
      'intended.'
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
  `deprecated-import baseline: ${total} occurrences across ${Object.keys(sorted).length} files`
)
if (before) console.log(`previous: ${before} — delta ${total - before}`)
