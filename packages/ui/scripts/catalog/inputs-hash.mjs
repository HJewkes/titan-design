/**
 * The freshness key for `src/arch/component-catalog.json`: a content hash over every file
 * the generator reads, plus the generator's own source. The generator and the freshness test
 * share this module, so the two cannot disagree about which files count.
 *
 * Component `.tsx` files are not inputs: names and exports come from arch-graph.json.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const ARCH_GRAPH = 'packages/ui/src/arch/arch-graph.json'
export const MATURITY = 'packages/ui/MATURITY.md'
export const PREVIEW = 'packages/ui/.storybook/preview.tsx'

const GENERATOR = 'packages/ui/scripts/catalog.mjs'
const GENERATOR_MODULES = 'packages/ui/scripts/catalog'
const STORY_FILE = /\.stories\.tsx$/
const MODULE_FILE = /\.mjs$/

function filesIn(repoRoot, dir, pattern) {
  return fs
    .readdirSync(path.join(repoRoot, dir))
    .filter((name) => pattern.test(name))
    .map((name) => `${dir}/${name}`)
}

/** Every `*.stories.tsx` directly inside a directory that holds an arch-graph component. */
export function storyFiles(repoRoot, graph) {
  const dirs = new Set(graph.components.map((component) => path.posix.dirname(component.file)))
  return [...dirs].flatMap((dir) => filesIn(repoRoot, dir, STORY_FILE)).sort()
}

/** Repo-relative POSIX paths of every catalog input and generator module, in code-unit order. */
export function inputFiles(repoRoot, graph) {
  const files = new Set([ARCH_GRAPH, MATURITY, PREVIEW, GENERATOR])
  for (const module of filesIn(repoRoot, GENERATOR_MODULES, MODULE_FILE)) files.add(module)
  for (const story of storyFiles(repoRoot, graph)) files.add(story)
  return [...files].sort()
}

/** Reads an input as text with line endings pinned to `\n`, so a CRLF checkout hashes the same. */
export function readInput(repoRoot, rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8').replace(/\r\n/g, '\n')
}

/** sha256 over each input's path and normalised content, path-sorted. */
export function catalogInputsHash(repoRoot) {
  const graph = JSON.parse(readInput(repoRoot, ARCH_GRAPH))
  const hash = crypto.createHash('sha256')
  for (const rel of inputFiles(repoRoot, graph)) {
    hash.update(rel)
    hash.update('\0')
    hash.update(readInput(repoRoot, rel))
    hash.update('\0')
  }
  return `sha256:${hash.digest('hex')}`
}
