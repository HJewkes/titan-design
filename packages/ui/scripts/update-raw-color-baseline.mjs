/**
 * Regenerate `eslint-rules/raw-color-baseline.json`.
 *
 * Runs the real `titan/no-raw-color` rule with an empty baseline and records how
 * many violations each file actually produces. Going through ESLint rather than
 * re-scanning with regexes is the point: the baseline then counts exactly what
 * the rule counts, including its AST scoping (string literals and template
 * chunks only — not comments, identifiers, or imports).
 *
 * The file only ever shrinks in practice: run this after removing raw colours to
 * lower a file's allowance and lock the progress in. It will refuse to raise an
 * allowance unless you pass --allow-increase, so a regen can't silently absorb
 * new violations someone just added.
 *
 *   node scripts/update-raw-color-baseline.mjs [--allow-increase]
 */

import { ESLint } from 'eslint'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const { extractRawColors } = createRequire(import.meta.url)('../eslint-rules/raw-color-patterns.js')

/**
 * Source text the rule reported on, recovered from the message range.
 *
 * ESLint interpolates a message's `data` into its string before returning it, so
 * the offending value can't be read back off the result — but the node's
 * line/column range can, and slicing it gives the original literal to re-extract
 * from. Falls back to the whole first line if a range is missing.
 */
function literalAt(lines, m) {
  // The slice spans the whole node, quotes included, but the bare-keyword
  // pattern is anchored to the entire string — so `'white'` would not match
  // until the delimiters come off.
  const unquote = (s) => s.replace(/^['"`]/, '').replace(/['"`]$/, '')
  if (!m.line) return ''
  if (!m.endLine || m.endLine === m.line) {
    return unquote(
      (lines[m.line - 1] ?? '').slice(m.column - 1, m.endColumn ? m.endColumn - 1 : undefined)
    )
  }
  const chunk = [(lines[m.line - 1] ?? '').slice(m.column - 1)]
  for (let i = m.line; i < m.endLine - 1; i++) chunk.push(lines[i] ?? '')
  chunk.push((lines[m.endLine - 1] ?? '').slice(0, m.endColumn - 1))
  return unquote(chunk.join('\n'))
}

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = path.join(pkgDir, 'eslint-rules', 'raw-color-baseline.json')
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

// With an empty baseline the rule reports every raw colour. The offending value
// can't be read back off the message (ESLint interpolates `data` into the string
// before returning it), so the source is re-read and the reported range sliced
// out to rebuild the multiset.
const counts = {}
for (const result of results) {
  const source = readFileSync(result.filePath, 'utf8').split('\n')
  const file = path.relative(pkgDir, result.filePath).split(path.sep).join('/')
  for (const m of result.messages) {
    if (m.ruleId !== 'titan/no-raw-color') continue
    // Record EVERY colour in the reported literal, not just the one that
    // triggered the message. The rule consumes allowance for all of them, so
    // recording only the first would leave the rest unfunded and fail at
    // baseline.
    for (const { value } of extractRawColors(literalAt(source, m))) {
      counts[file] ??= {}
      counts[file][value] = (counts[file][value] ?? 0) + 1
    }
  }
}

const fileTotal = (entry) => Object.values(entry ?? {}).reduce((a, b) => a + b, 0)

const raised = Object.entries(counts).filter(
  ([file, entry]) => fileTotal(entry) > fileTotal(previous[file])
)
if (raised.length > 0 && !allowIncrease) {
  writeFileSync(baselinePath, JSON.stringify(previous, null, 2) + '\n')
  console.error('Refusing to raise the raw-colour baseline for:\n')
  for (const [file, entry] of raised) {
    console.error(`  ${file}: ${fileTotal(previous[file])} -> ${fileTotal(entry)}`)
  }
  console.error(
    '\nThese files gained raw colours. Replace them with tokens, or re-run with\n' +
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
console.log(`raw-colour baseline: ${total} occurrences across ${Object.keys(sorted).length} files`)
if (before) console.log(`previous: ${before} — delta ${total - before}`)
