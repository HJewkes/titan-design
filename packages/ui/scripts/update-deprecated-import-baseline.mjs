/**
 * Regenerate `eslint-rules/deprecated-import-baseline.json`.
 *
 * Runs the real `titan/no-deprecated-import` rule with an empty baseline and
 * records how many times each file imports each deprecated name. Going
 * through ESLint rather than re-scanning by hand is the point: the baseline
 * then counts exactly what the rule counts, including its re-export-chain
 * resolution (`deprecated-export-registry.js`).
 *
 * The file only ever shrinks in practice: run this after migrating a
 * consumer off a deprecated export to lower a file's allowance and lock the
 * progress in. It refuses to raise an allowance unless you pass
 * --allow-increase, so a regen can't silently absorb a new violation.
 *
 *   node scripts/update-deprecated-import-baseline.mjs [--allow-increase]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reportedText, runBaselineUpdater } from './lib/regen-eslint-baseline.mjs'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// The rule reports on the specifier's own identifier node, so the reported range is
// exactly the deprecated name with nothing to strip.
await runBaselineUpdater({
  pkgDir,
  baselinePath: path.join(pkgDir, 'eslint-rules', 'deprecated-import-baseline.json'),
  ruleId: 'titan/no-deprecated-import',
  label: 'deprecated-import',
  keysOf: (m, readLines) => [reportedText(readLines(), m)],
  hint:
    'These files gained deprecated imports. Migrate them to the replacement named in\n' +
    'the @deprecated tag, or re-run with --allow-increase if the increase is genuinely\n' +
    'intended.',
})
