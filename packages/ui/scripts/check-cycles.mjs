// Fails on any import cycle not in check-cycles.baseline.json, and on baseline entries that no longer exist.
import { readFileSync } from 'node:fs'
import madge from 'madge'

// madge rotates a cycle by traversal start; start at the smallest path so the key is stable, keeping direction.
const key = (cycle) => {
  const start = cycle.indexOf([...cycle].sort()[0])
  return [...cycle.slice(start), ...cycle.slice(0, start)].join(' > ')
}

const baseline = JSON.parse(readFileSync(new URL('./check-cycles.baseline.json', import.meta.url), 'utf8'))

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
