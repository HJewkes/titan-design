/**
 * Regenerate `eslint-rules/tier-import-baseline.json`.
 *
 * Runs the real `titan/no-upward-tier-import` rule with an empty baseline and
 * records how many times each file imports each offending specifier. Going
 * through ESLint rather than re-scanning with regexes is the point: the
 * baseline then counts exactly what the rule counts, including its tier
 * resolution (relative and `@/`-alias imports, `src/lab/**` exempted).
 *
 * The file only ever shrinks in practice: run this after moving an upward
 * import down (or removing it) to lower a file's allowance and lock the
 * progress in. It refuses to raise an allowance unless you pass
 * --allow-increase, so a regen can't silently absorb a new violation.
 *
 *   node scripts/update-tier-import-baseline.mjs [--allow-increase]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

/**
 * The import specifier a message was reported for, recovered from the
 * node's line — ESLint interpolates a message's `data` into its string
 * before returning it, so the specifier can't be read back off the result.
 * An import/re-export line carries exactly one quoted string in this
 * codebase (no other quotes appear before `from '...'`), so the first
 * quoted run on the line is it.
 */
function specifierAt(lines, m) {
  const line = lines[m.line - 1] ?? ''
  const match = /(['"])((?:(?!\1).)+)\1/.exec(line)
  return match ? match[2] : null
}

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Globs src/** rather than each tier directory: the rule itself is a no-op outside
// the tiers, and a `pages/` glob would throw NoFilesFoundError before that family
// exists.
await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'tier-import-baseline.json'),
  ruleId: 'titan/no-upward-tier-import',
  label: 'tier-import',
  keysOf: (m, readLines) => {
    const specifier = specifierAt(readLines(), m)
    return specifier ? [specifier] : []
  },
  hint:
    'These files gained upward imports. Move them down a tier, or re-run with\n' +
    '--allow-increase if the increase is genuinely intended.',
})
