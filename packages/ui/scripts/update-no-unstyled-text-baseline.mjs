/**
 * Regenerate `eslint-rules/no-unstyled-text-baseline.json`.
 *
 * Runs the real `titan/no-unstyled-text` rule with an empty baseline and records how many bare
 * Text elements each file has. Every site spends the same key, `unstyled`.
 *
 * Run this after styling a bare Text: the rule reports an allowance a file no longer spends as
 * stale until the baseline is regenerated. It refuses to raise an allowance unless you pass
 * --allow-increase, so a regen can't silently absorb a new site.
 *
 *   node scripts/update-no-unstyled-text-baseline.mjs [--allow-increase]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'no-unstyled-text-baseline.json'),
  ruleId: 'titan/no-unstyled-text',
  label: 'no-unstyled-text',
  keysOf: () => ['unstyled'],
  hint:
    'These files gained a bare Text. Give it a className or style, render Typography, or\n' +
    'move it inside another Text; re-run with --allow-increase only if the increase is intended.',
})
