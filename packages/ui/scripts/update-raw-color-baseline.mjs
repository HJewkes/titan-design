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

import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reportedText, runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

const { extractRawColors } = createRequire(import.meta.url)('../eslint-rules/raw-color-patterns.js')

// The slice spans the whole node, quotes included, but the bare-keyword pattern is
// anchored to the entire string, so `'white'` would not match until the delimiters
// come off.
const unquote = (s) => s.replace(/^['"`]/, '').replace(/['"`]$/, '')

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'raw-color-baseline.json'),
  ruleId: 'titan/no-raw-color',
  label: 'raw-colour',
  // Record EVERY colour in the reported literal, not just the one that triggered the
  // message. The rule consumes allowance for all of them, so recording only the first
  // would leave the rest unfunded and fail at baseline.
  keysOf: (m, readLines) =>
    extractRawColors(unquote(reportedText(readLines(), m))).map(({ value }) => value),
  hint:
    'These files gained raw colours. Replace them with tokens, or re-run with\n' +
    '--allow-increase if the increase is genuinely intended.',
})
