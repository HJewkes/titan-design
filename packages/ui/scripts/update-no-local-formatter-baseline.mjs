/**
 * Regenerate `eslint-rules/no-local-formatter-baseline.json`.
 *
 * Runs the real `titan/no-local-formatter` rule with an empty baseline and
 * records how many times each file offends, keyed by the same VALUE the rule
 * reports on (a toFixed argument's source text, or a format*-named
 * function's name) — recovered by slicing the reported range straight out of
 * the source, the same technique `update-raw-color-baseline.mjs` uses, since
 * ESLint interpolates a message's `data` into its string before returning it.
 *
 * The file only ever shrinks in practice: run this after moving a local
 * formatter into the shared module (or reusing an existing export) to lower a
 * file's allowance and lock the progress in. It refuses to raise an allowance
 * unless you pass --allow-increase, so a regen can't silently absorb a new
 * violation.
 *
 *   node scripts/update-no-local-formatter-baseline.mjs [--allow-increase]
 */

import { ESLint } from 'eslint'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Source text the rule reported on, recovered from the message range. */
function textAt(lines, m) {
  if (!m.line) return ''
  if (!m.endLine || m.endLine === m.line) {
    return (lines[m.line - 1] ?? '').slice(m.column - 1, m.endColumn ? m.endColumn - 1 : undefined)
  }
  const chunk = [(lines[m.line - 1] ?? '').slice(m.column - 1)]
  for (let i = m.line; i < m.endLine - 1; i++) chunk.push(lines[i] ?? '')
  chunk.push((lines[m.endLine - 1] ?? '').slice(0, m.endColumn - 1))
  return chunk.join('\n')
}

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = path.join(pkgDir, 'eslint-rules', 'no-local-formatter-baseline.json')
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
    if (m.ruleId !== 'titan/no-local-formatter') continue
    const value = textAt(source, m)
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
  console.error('Refusing to raise the no-local-formatter baseline for:\n')
  for (const [file, entry] of raised) {
    console.error(`  ${file}: ${fileTotal(previous[file])} -> ${fileTotal(entry)}`)
  }
  console.error(
    '\nThese files gained raw toFixed/format* debt. Move it into the shared formatter\n' +
      'module, or re-run with --allow-increase if the increase is genuinely intended.'
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
  `no-local-formatter baseline: ${total} occurrences across ${Object.keys(sorted).length} files`
)
if (before) console.log(`previous: ${before} — delta ${total - before}`)
