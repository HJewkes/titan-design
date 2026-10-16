/**
 * Regenerate `eslint-rules/composition-baseline.json`.
 *
 * Runs the real `titan/no-raw-composition` rule with an empty baseline and
 * records how many times each file trips each messageId (`rawButton`,
 * `d3Import`). Going through ESLint rather than re-scanning with regexes means
 * the baseline counts exactly what the rule counts, including its scoping
 * (tests and stories may render a <button>, ui/charts may import d3, src/lab is
 * exempt).
 *
 * The file only ever shrinks in practice: run this after replacing a raw
 * button or moving a d3 import into ui/charts to lock the progress in. It
 * refuses to raise any allowance unless you pass --allow-increase, so a regen
 * can't silently absorb a new violation.
 *
 *   node scripts/update-composition-baseline.mjs [--allow-increase]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

const totalOf = (baseline, id) =>
  Object.values(baseline).reduce((sum, entry) => sum + (entry[id] ?? 0), 0)

function summarizeByMessageId(_label, baseline, previous) {
  for (const id of ['rawButton', 'd3Import']) {
    const files = Object.values(baseline).filter((entry) => entry[id]).length
    console.log(
      `${id}: ${totalOf(baseline, id)} across ${files} files (previous ${totalOf(previous, id)})`
    )
  }
}

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'composition-baseline.json'),
  ruleId: 'titan/no-raw-composition',
  label: 'composition',
  keysOf: (m) => (m.messageId ? [m.messageId] : []),
  summarize: summarizeByMessageId,
  hint:
    'Replace the raw <button> with Button, ToolbarButton, TriggerSurface or Pressable,\n' +
    'or move the d3 code into src/components/ui/charts. Re-run with --allow-increase\n' +
    'only if the increase is genuinely intended.',
})
