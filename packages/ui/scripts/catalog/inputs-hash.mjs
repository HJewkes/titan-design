/**
 * The freshness key for `src/arch/component-catalog.json`: a content hash over every file
 * the generator reads. The generator and the freshness test share this module, so the two
 * cannot disagree about which files count.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const ARCH_GRAPH = 'packages/ui/src/arch/arch-graph.json'
export const MATURITY = 'packages/ui/MATURITY.md'
export const PREVIEW = 'packages/ui/.storybook/preview.tsx'

const STORY_FILE = /\.stories\.tsx$/

const toPosix = (p) => p.split(path.sep).join('/')

/** Every `*.stories.tsx` directly inside a directory that holds an arch-graph component. */
export function storyFiles(repoRoot, graph) {
  const dirs = new Set(graph.components.map((component) => path.posix.dirname(component.file)))
  const files = []
  for (const dir of dirs) {
    for (const name of fs.readdirSync(path.join(repoRoot, dir))) {
      if (STORY_FILE.test(name)) files.push(`${dir}/${name}`)
    }
  }
  return files.sort()
}

/** Repo-relative POSIX paths of every catalog input, in code-unit order. */
export function inputFiles(repoRoot, graph) {
  const files = new Set([ARCH_GRAPH, MATURITY, PREVIEW])
  for (const component of graph.components) files.add(toPosix(component.file))
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
