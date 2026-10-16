/**
 * Regenerate `src/arch/catalog-gaps-baseline.json`.
 *
 * Lists, per field, the catalog entries whose `status`, `purpose`, `props`, `storyIds` or
 * `composes` is empty. The completeness test holds the list shrink-only. This script refuses
 * a gap that is not already listed unless you pass --allow-increase, so a regen can't silently
 * absorb new debt.
 *
 *   node packages/ui/scripts/update-catalog-gaps-baseline.mjs [--allow-increase]
 *
 * `--catalog <path>` and `--baseline <path>` point it at other files (the test uses temp copies).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const GAP_FIELDS = ['status', 'purpose', 'props', 'storyIds', 'composes']

const isEmpty = (value) =>
  value == null || value === '' || (Array.isArray(value) && value.length === 0)

/** `{ field: sorted entry names }` for every field with at least one empty entry. */
export function findGaps(catalog) {
  const gaps = {}
  for (const field of GAP_FIELDS) {
    const names = catalog.entries
      .filter((entry) => isEmpty(entry[field]))
      .map((entry) => entry.name)
    if (names.length > 0) gaps[field] = names.sort()
  }
  return gaps
}

/** Gaps present in `live` but absent from `baseline`, as `field:name` strings. */
export function newGaps(baseline, live) {
  return Object.entries(live).flatMap(([field, names]) =>
    names
      .filter((name) => !(baseline[field] ?? []).includes(name))
      .map((name) => `${field}:${name}`)
  )
}

/** Gaps listed in `baseline` that `live` no longer has, as `field:name` strings. */
export function filledGaps(baseline, live) {
  return newGaps(live, baseline)
}

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

function main(argv) {
  const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const option = (flag, fallback) =>
    argv.includes(flag) ? path.resolve(argv[argv.indexOf(flag) + 1]) : fallback
  const catalogPath = option(
    '--catalog',
    path.join(pkgDir, 'src', 'arch', 'component-catalog.json')
  )
  const baselinePath = option(
    '--baseline',
    path.join(pkgDir, 'src', 'arch', 'catalog-gaps-baseline.json')
  )
  const previous = existsSync(baselinePath) ? readJson(baselinePath) : {}
  const live = findGaps(readJson(catalogPath))
  const added = newGaps(previous, live)

  if (added.length > 0 && !argv.includes('--allow-increase')) {
    console.error(
      'Refusing to add gaps to the catalog gaps baseline (fill them, or pass --allow-increase):\n'
    )
    for (const gap of added) console.error(`  new gap: ${gap}`)
    process.exit(1)
  }

  writeFileSync(baselinePath, JSON.stringify(live, null, 2) + '\n')
  console.log('catalog gaps baseline:')
  for (const [field, names] of Object.entries(live)) console.log(`  ${field}: ${names.length}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
}
