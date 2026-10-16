/**
 * The files the catalog generator reads from a checkout: arch-graph.json, MATURITY.md, the
 * Storybook preview and the story files beside each arch-graph component. Component `.tsx`
 * files are not inputs: names and exports come from arch-graph.json.
 */
import fs from 'node:fs'
import path from 'node:path'

export const ARCH_GRAPH = 'packages/ui/src/arch/arch-graph.json'
export const MATURITY = 'packages/ui/MATURITY.md'
export const PREVIEW = 'packages/ui/.storybook/preview.tsx'

const STORY_FILE = /\.stories\.tsx$/

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

/** Reads an input as text with line endings pinned to `\n`, so a CRLF checkout yields the same catalog. */
export function readInput(repoRoot, rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8').replace(/\r\n/g, '\n')
}
