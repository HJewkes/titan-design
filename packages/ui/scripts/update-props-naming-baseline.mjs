/**
 * Regenerate `eslint-rules/props-naming-baseline.json`.
 *
 * Runs the real `titan/props-naming` rule with an empty baseline and records how many
 * off-convention props each file declares, keyed by property name (`disabled`, `onClick`). The
 * rule reports on the key node alone, so the name is read straight off the reported range.
 *
 * Run this after renaming a prop to its convention (`isDisabled`, `isLoading`, `isSelected`,
 * `onPress`): the rule reports an allowance a file no longer spends as stale until the baseline
 * is regenerated. It refuses to raise an allowance unless you pass --allow-increase, so a regen
 * can't silently absorb a new site.
 *
 *   node scripts/update-props-naming-baseline.mjs [--allow-increase]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reportedText, runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'props-naming-baseline.json'),
  ruleId: 'titan/props-naming',
  label: 'props-naming',
  globs: ['src/components/**/*.{ts,tsx}'],
  keysOf: (m, readLines) => (m.messageId === 'stale' ? [] : [reportedText(readLines(), m)]),
  hint:
    'These files declared an off-convention prop on a *Props type. Name it isDisabled, isLoading,\n' +
    'isSelected or onPress (CLAUDE.md, Props Conventions) instead;\n' +
    're-run with --allow-increase only if the increase is intended.',
})
