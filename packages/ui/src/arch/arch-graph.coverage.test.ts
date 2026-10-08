// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import graph from './arch-graph.json'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const REPO_ROOT = path.resolve(PKG_ROOT, '../..')
const BARRELS = ['ui', 'custom', 'shell'].map((tier) =>
  path.join(PKG_ROOT, 'src/components', tier, 'index.ts')
)
const VALUE_REEXPORT = /^export\s+(?!type\b)[^;]*?\bfrom\s+['"](\.[^'"]*)['"]/gm

function resolveModule(fromFile: string, specifier: string): string | undefined {
  const target = path.resolve(path.dirname(fromFile), specifier)
  const candidates = ['.tsx', '.ts', '/index.ts', '/index.tsx'].map((ext) => target + ext)
  return [target, ...candidates].find((file) => /\.tsx?$/.test(file) && existsSync(file))
}

/** Every `.tsx` file a barrel re-exports values from, followed through nested barrels. */
function reexportedComponentFiles(entries: string[]): string[] {
  const seen = new Set<string>()
  const queue = [...entries]
  for (let file = queue.shift(); file; file = queue.shift()) {
    if (seen.has(file)) continue
    seen.add(file)
    for (const [, specifier] of readFileSync(file, 'utf8').matchAll(VALUE_REEXPORT)) {
      const resolved = resolveModule(file, specifier)
      if (resolved) queue.push(resolved)
    }
  }
  return [...seen]
    .filter((file) => file.endsWith('.tsx'))
    .map((file) => path.relative(REPO_ROOT, file))
    .sort()
}

describe('arch-graph.json coverage', () => {
  it('has a node for every component file the ui, custom and shell barrels export', () => {
    const nodes = new Set(graph.components.map((component) => component.file))
    const exported = reexportedComponentFiles(BARRELS)

    expect(exported.length).toBeGreaterThan(nodes.size / 2)
    expect(
      exported.filter((file) => !nodes.has(file)),
      'These exported components have no arch-graph node, so the catalog never lists them. ' +
        'Run `pnpm arch:graph -- --add <file>` from the repo root for each, then `pnpm catalog`.'
    ).toEqual([])
  })
})
