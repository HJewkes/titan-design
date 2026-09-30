/**
 * Regenerate `src/arch/component-anatomy-baseline.json`.
 *
 * Runs the same detector the ratchet test runs (`scripts/component-anatomy.mjs`)
 * and rewrites the baseline from the gaps it finds. The file only ever shrinks
 * in practice: run this after closing a gap to delete its entry. It refuses to
 * add a gap unless you pass --allow-increase, so a regen can't silently absorb
 * a new one.
 *
 *   node packages/ui/scripts/update-component-anatomy-baseline.mjs [--allow-increase]
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectGaps, gapKeys, mergeBaseline, readComponentTree } from './component-anatomy.mjs'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = path.join(pkgDir, 'src', 'arch', 'component-anatomy-baseline.json')
const allowIncrease = process.argv.includes('--allow-increase')

const previous = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {}
const live = detectGaps(readComponentTree(pkgDir))
const { ok, added, baseline } = mergeBaseline(previous, live, { allowIncrease })

if (!ok) {
  console.error('Refusing to add gaps to the component anatomy baseline:\n')
  for (const key of added) console.error(`  ${key}`)
  console.error(
    '\nThese units gained anatomy gaps. Close them, or re-run with\n' +
      '--allow-increase if the gap is genuinely intended.'
  )
  process.exit(1)
}

writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n')

const total = gapKeys(baseline).size
const before = gapKeys(previous).size
console.log(
  `component anatomy baseline: ${total} gaps across ${Object.keys(baseline).length} units`
)
if (before) console.log(`previous: ${before} (delta ${total - before})`)
