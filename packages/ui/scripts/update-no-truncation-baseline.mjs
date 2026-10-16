/**
 * Regenerate `eslint-rules/no-truncation-baseline.json`.
 *
 * Runs the real `titan/no-truncation` rule with an empty baseline and records how many times
 * each file truncates, keyed by the same VALUE the rule reports (the attribute or property
 * name, or the class token). The value is read back from the message's single-quoted span:
 * a class token sits inside a longer string literal, so the reported range is the whole
 * literal, not the token. Sites in `truncation-allowlist.json` are allowed before the
 * baseline is consulted, so they never land in it.
 *
 * Run this after removing truncation from a file: the rule reports an allowance a file no
 * longer spends as stale until the baseline is regenerated. It refuses to raise an allowance
 * unless you pass --allow-increase, so a regen can't silently absorb a new site.
 *
 *   node scripts/update-no-truncation-baseline.mjs [--allow-increase]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'no-truncation-baseline.json'),
  ruleId: 'titan/no-truncation',
  label: 'no-truncation',
  keysOf: (m) => [m.message.match(/'([^']+)'/)?.[1] ?? ''],
  hint:
    'These files gained truncation. Let the text wrap, add the site to\n' +
    'eslint-rules/truncation-allowlist.json if the full text is one hover or press away,\n' +
    'or re-run with --allow-increase if the increase is genuinely intended.',
})
