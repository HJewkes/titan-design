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

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reportedText, runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'no-local-formatter-baseline.json'),
  ruleId: 'titan/no-local-formatter',
  label: 'no-local-formatter',
  keysOf: (m, readLines) => [reportedText(readLines(), m)],
  hint:
    'These files gained raw toFixed/format* debt. Move it into the shared formatter\n' +
    'module, or re-run with --allow-increase if the increase is genuinely intended.',
})
