// Fails on any import cycle not in check-cycles.baseline.json, and on baseline entries that no longer exist.
import { readFileSync } from 'node:fs'
import madge from 'madge'

const baseline = JSON.parse(readFileSync(new URL('./check-cycles.baseline.json', import.meta.url), 'utf8'))
const key = (cycle) => cycle.join(' > ')

const result = await madge('src', {
  fileExtensions: ['ts', 'tsx'],
  tsConfig: 'tsconfig.json',
})
const found = result.circular().map(key)

const added = found.filter((c) => !baseline.includes(c))
const stale = baseline.filter((c) => !found.includes(c))

for (const c of added) console.error(`New import cycle: ${c}`)
for (const c of stale) console.error(`Stale baseline entry (cycle is gone, remove it from scripts/check-cycles.baseline.json): ${c}`)

if (added.length || stale.length) process.exit(1)
console.log(`No new import cycles (${baseline.length} baselined).`)
