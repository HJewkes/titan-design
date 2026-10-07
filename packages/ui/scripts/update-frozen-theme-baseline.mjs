/**
 * Regenerate `eslint-rules/frozen-theme-baseline.json`.
 *
 * Runs the real `titan/no-frozen-theme` rule with an empty baseline and records
 * how many frozen calls each file holds, keyed by the frozen value (`dark`,
 * `light`, `module-scope`). Going through ESLint rather than re-scanning with
 * regexes is the point: the baseline then counts exactly what the rule counts,
 * including its module-scope analysis and the config's file scoping.
 *
 * The file only ever shrinks in practice: run this after migrating a file to
 * hook-time resolution to lower its allowance and lock the progress in. It
 * refuses to raise an allowance unless you pass --allow-increase, so a regen
 * can't silently absorb a new violation.
 *
 *   node scripts/update-frozen-theme-baseline.mjs [--allow-increase]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

/**
 * The frozen value a message was reported for. ESLint interpolates `data` into
 * the message string before returning it, so read the mode back out of the
 * rendered text: `literalMode` quotes it, `moduleScope` has no mode at all.
 */
function frozenValueOf(message) {
  const match = /^getSemanticColors\('([^']+)'\)/.exec(message.message)
  return match ? match[1] : 'module-scope'
}

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Globs src/** rather than the component directories: the rule is only enabled
// where the config enables it, and a `pages/` glob would throw
// NoFilesFoundError before that family exists.
await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'frozen-theme-baseline.json'),
  ruleId: 'titan/no-frozen-theme',
  label: 'frozen-theme',
  keysOf: (m) => [frozenValueOf(m)],
  hint:
    'These files gained frozen-theme calls. Resolve the colour at render time\n' +
    '(useOnSurfaceColor / getSemanticColors(useSurfaceMode())), or re-run with\n' +
    '--allow-increase if the increase is genuinely intended.',
})
