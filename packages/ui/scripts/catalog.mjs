/**
 * Generates `src/arch/component-catalog.json` (TD-24) from the committed arch-graph.json,
 * MATURITY.md, the story files and react-docgen-typescript over the entry files. It never calls
 * codewatch, so any checkout can run it.
 *
 *   pnpm catalog        (from the repo root or packages/ui)
 *
 * Output is deterministic: entries and keys in code-unit order. No global hash or timestamp: a change to one component rewrites only that component's block.
 * `src/arch/component-catalog.freshness.test.ts` regenerates in memory and fails until the
 * committed file matches.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { buildEntry, exclusionReason } from './catalog/entries.mjs'
import { ARCH_GRAPH, MATURITY, PREVIEW, readInput, storyFiles } from './catalog/inputs.mjs'
import { docgen, propsFor } from './catalog/props.mjs'
import { defaultExportTags, maturityStatuses, readStoryFile } from './catalog/stories.mjs'

export const CATALOG = 'packages/ui/src/arch/component-catalog.json'
const SCHEMA = 1
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

function readContext(repoRoot, graph, read) {
  const stories = new Map()
  for (const file of storyFiles(repoRoot, graph)) {
    stories.set(file, readStoryFile(file, read(repoRoot, file)))
  }
  return {
    stories,
    projectTags: defaultExportTags(PREVIEW, read(repoRoot, PREVIEW)),
    vocabulary: maturityStatuses(read(repoRoot, MATURITY)),
  }
}

/**
 * The catalog object for the checkout at `repoRoot`. Every non-TypeScript file it reads goes
 * through `read`; docgen reads entry sources through the compiler, with `overlay` (repo-relative
 * path to source text) served in place of the disk.
 */
export function buildCatalog(repoRoot = REPO_ROOT, read = readInput, overlay = {}) {
  const graph = JSON.parse(read(repoRoot, ARCH_GRAPH))
  const context = readContext(repoRoot, graph, read)
  const included = graph.components.filter((component) => !exclusionReason(component))
  const docs = docgen(
    repoRoot,
    included.map((component) => component.file),
    overlay
  )
  const entries = included.map((component) =>
    buildEntry(component, context, propsFor(component, docs))
  )
  const excluded = graph.components
    .filter((component) => exclusionReason(component))
    .map((component) => ({ file: component.file, reason: exclusionReason(component) }))
  return {
    schema: SCHEMA,
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
