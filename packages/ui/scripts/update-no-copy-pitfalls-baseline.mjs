/**
 * Regenerate `eslint-rules/no-copy-pitfalls-baseline.json`.
 *
 * Runs the real `titan/no-copy-pitfalls` rule with an empty baseline and records how many times
 * each file hits each pitfall, keyed by the same VALUE the rule reports (the offending fragment).
 * The value is read back from the message's first backticked span: a fragment sits inside a
 * longer piece of copy, so the reported range is the whole text, not the fragment.
 *
 * Run this after fixing copy: the rule reports an allowance a file no longer spends as stale
 * until the baseline is regenerated. It refuses to raise an allowance unless you pass
 * --allow-increase, so a regen can't silently absorb a new site.
 *
 *   node scripts/update-no-copy-pitfalls-baseline.mjs [--allow-increase]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'no-copy-pitfalls-baseline.json'),
  ruleId: 'titan/no-copy-pitfalls',
  label: 'no-copy-pitfalls',
  keysOf: (m) => [m.message.match(/`([^`]+)`/)?.[1] ?? ''],
  hint:
    'These files gained copy pitfalls. Fix the copy, add a term written in capitals to\n' +
    'eslint-rules/copy-glossary.json, or re-run with --allow-increase if the increase is\n' +
    'genuinely intended.',
})
