/**
 * Regenerate `eslint-rules/no-html-element-baseline.json`.
 *
 * Runs the real `titan/no-html-element` rule with an empty baseline and records how many
 * lowercase JSX elements each file has, keyed by element name (`div`, `path`). The rule reports
 * on the name node alone, so the key is read straight off the reported range.
 *
 * Run this after replacing an intrinsic with a react-native or react-native-svg component: the
 * rule reports an allowance a file no longer spends as stale until the baseline is
 * regenerated. It refuses to raise an allowance unless you pass --allow-increase, so a regen
 * can't silently absorb a new site.
 *
 *   node scripts/update-no-html-element-baseline.mjs [--allow-increase]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reportedText, runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'no-html-element-baseline.json'),
  ruleId: 'titan/no-html-element',
  label: 'no-html-element',
  globs: ['src/components/**/*.{ts,tsx}'],
  keysOf: (m, readLines) => (m.messageId === 'stale' ? [] : [reportedText(readLines(), m)]),
  hint:
    'These files gained a lowercase JSX element. Render the react-native primitive (View, Text,\n' +
    'Pressable, TextInput, Image, ScrollView) or the react-native-svg component instead;\n' +
    're-run with --allow-increase only if the increase is intended.',
})
