/**
 * Regenerate `src/theme/tokens/contrast-baseline.json`.
 *
 * Measures every pair in `contrast-pairs.ts` in both modes and records the ones
 * below their floor. The registry is TypeScript, so it is loaded through Vite
 * (no config file: the theme modules are plain TS with no aliases).
 *
 * Run it after a token retune lifts pairs over their floor, to lock the progress
 * in. It refuses to add an entry unless you pass --allow-increase, so a regen
 * can't silently absorb a new failure.
 *
 *   node scripts/update-contrast-baseline.mjs [--allow-increase]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = path.join(pkgDir, 'src', 'theme', 'tokens', 'contrast-baseline.json')
const allowIncrease = process.argv.includes('--allow-increase')

async function measure() {
  const server = await createServer({
    root: pkgDir,
    configFile: false,
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true },
  })
  try {
    const pairs = await server.ssrLoadModule('/src/theme/tokens/contrast-pairs.ts')
    return Object.fromEntries(
      pairs.CONTRAST_MODES.map((mode) => [mode, pairs.failingContrastPairs(mode)])
    )
  } finally {
    await server.close()
  }
}

const previous = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
const next = await measure()

const added = Object.entries(next).flatMap(([mode, ids]) =>
  ids.filter((id) => !(previous[mode] ?? []).includes(id)).map((id) => `${mode}: ${id}`)
)
const removed = Object.entries(previous).flatMap(([mode, ids]) =>
  ids.filter((id) => !(next[mode] ?? []).includes(id)).map((id) => `${mode}: ${id}`)
)

if (added.length > 0 && !allowIncrease) {
  console.error(
    'contrast baseline would grow; these pairs now fall below their floor:\n' +
      added.map((line) => `  + ${line}`).join('\n') +
      '\nRaise the foreground or fill, or re-run with --allow-increase if the\n' +
      'increase is genuinely intended.'
  )
  process.exit(1)
}

fs.writeFileSync(baselinePath, JSON.stringify(next, null, 2) + '\n')
for (const line of removed) console.log(`  - ${line}`)
for (const line of added) console.log(`  + ${line}`)
console.log(`contrast baseline: ${removed.length} removed, ${added.length} added`)
