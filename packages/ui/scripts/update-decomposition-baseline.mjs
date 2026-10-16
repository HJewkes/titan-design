/**
 * Regenerate `src/arch/decomposition-baseline.json`.
 *
 * Runs the same detector the ratchet test runs (`scripts/decomposition.mjs`) and rewrites the
 * baseline from every metric over its limit. Run it after a split to lock in the lower values.
 * It refuses a new or grown entry unless you pass --allow-increase, so a regen can't silently
 * absorb new debt.
 *
 *   node packages/ui/scripts/update-decomposition-baseline.mjs [--allow-increase]
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describeEntry, measure, mergeBaseline, programFor } from './decomposition.mjs'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = path.join(pkgDir, 'src', 'arch', 'decomposition-baseline.json')
const allowIncrease = process.argv.includes('--allow-increase')

const countByMetric = (baseline) => {
  const counts = {}
  for (const metrics of Object.values(baseline)) {
    for (const metric of Object.keys(metrics)) counts[metric] = (counts[metric] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort())
}

const previous = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {}
const live = measure(programFor(pkgDir))
const { ok, added, grown, baseline } = mergeBaseline(previous, live, { allowIncrease })

if (!ok) {
  console.error('Refusing to add or grow entries in the decomposition baseline:\n')
  for (const entry of added) console.error(`  added: ${describeEntry(entry, 'added')}`)
  for (const entry of grown) console.error(`  grown: ${describeEntry(entry, 'grown')}`)
  process.exit(1)
}

writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n')

console.log(`decomposition baseline: ${Object.keys(baseline).length} keys`)
for (const [metric, count] of Object.entries(countByMetric(baseline))) {
  console.log(`  ${metric}: ${count}`)
}
