/**
 * Regenerate `eslint-rules/no-raw-caps-baseline.json`.
 *
 * Runs the real `titan/no-raw-caps` rule with an empty baseline and records how many caps
 * treatments each file has, keyed by message id (`uppercase`, `tracking`, `arbitrarySize`,
 * `textTransform`, `letterSpacing`).
 *
 * Run this after moving a label onto a Typography variant: the rule reports an allowance a
 * file no longer spends as stale until the baseline is regenerated. It refuses to raise an
 * allowance unless you pass --allow-increase, so a regen can't silently absorb a new site.
 *
 *   node scripts/update-no-raw-caps-baseline.mjs [--allow-increase]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'no-raw-caps-baseline.json'),
  ruleId: 'titan/no-raw-caps',
  label: 'no-raw-caps',
  globs: ['src/components/**/*.{ts,tsx}'],
  keysOf: (m) => (m.messageId === 'stale' ? [] : [m.messageId]),
  hint:
    'These files gained a hand-rolled uppercase, tracking or pixel type size. Render Typography\n' +
    'with overline, microLabel or monoLabel, or compose Eyebrow, instead;\n' +
    're-run with --allow-increase only if the increase is intended.',
})
