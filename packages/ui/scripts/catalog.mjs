/**
 * Generates `src/arch/component-catalog.json` (TD-24) from the committed arch-graph.json,
 * MATURITY.md and the story files. It never calls codewatch, so any checkout can run it.
 *
 *   pnpm catalog        (from the repo root or packages/ui)
 *
 * Output is deterministic: entries and keys in code-unit order, no timestamps.
 * `src/arch/component-catalog.freshness.test.ts` fails until the output is regenerated.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { buildEntry, exclusionReason } from './catalog/entries.mjs'
import {
  ARCH_GRAPH,
  MATURITY,
  PREVIEW,
  catalogInputsHash,
  readInput,
  storyFiles,
} from './catalog/inputs-hash.mjs'
import { defaultExportTags, maturityStatuses, readStoryFile } from './catalog/stories.mjs'

export const CATALOG = 'packages/ui/src/arch/component-catalog.json'
const SCHEMA = 1
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

function readContext(repoRoot, graph) {
  const stories = new Map()
  for (const file of storyFiles(repoRoot, graph)) {
    stories.set(file, readStoryFile(file, readInput(repoRoot, file)))
  }
  return {
    stories,
    projectTags: defaultExportTags(PREVIEW, readInput(repoRoot, PREVIEW)),
    vocabulary: maturityStatuses(readInput(repoRoot, MATURITY)),
  }
}

/** The catalog object for the checkout at `repoRoot`. */
export function buildCatalog(repoRoot = REPO_ROOT) {
  const graph = JSON.parse(readInput(repoRoot, ARCH_GRAPH))
  const context = readContext(repoRoot, graph)
  const entries = []
  const excluded = []
  for (const component of graph.components) {
    const reason = exclusionReason(component)
    if (reason) excluded.push({ file: component.file, reason })
    else entries.push(buildEntry(component, context))
  }
  return {
    schema: SCHEMA,
    inputsHash: catalogInputsHash(repoRoot),
    entries: entries.sort((a, b) => byCodeUnit(a.file, b.file)),
    excluded: excluded.sort((a, b) => byCodeUnit(a.file, b.file)),
  }
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value === null || typeof value !== 'object') return value
  const keys = Object.keys(value).sort(byCodeUnit)
  return Object.fromEntries(keys.map((key) => [key, sortKeys(value[key])]))
}

/** The catalog as written to disk: sorted keys, two-space indent, trailing newline. */
export function serializeCatalog(catalog) {
  return `${JSON.stringify(sortKeys(catalog), null, 2)}\n`
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const catalog = buildCatalog()
  fs.writeFileSync(path.join(REPO_ROOT, CATALOG), serializeCatalog(catalog))
  const { entries, excluded } = catalog
  process.stdout.write(`${CATALOG}: ${entries.length} entries, ${excluded.length} excluded\n`)
}
