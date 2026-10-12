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
const WHOLE_LIBRARY_SUMMARY = ['consumers', 'extractionTop', 'standardCoverage', 'substitution']

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

describe('arch-graph.json freshness', () => {
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

  it('has no node for a component file that no longer exists', () => {
    expect(
      graph.components
        .map((component) => component.file)
        .filter((file) => !existsSync(path.join(REPO_ROOT, file))),
      'These arch-graph nodes name a deleted or moved file. Delete each block from ' +
        'src/arch/arch-graph.json (for a move, then `pnpm arch:graph -- --add <new file>`), ' +
        'then `pnpm catalog`.'
    ).toEqual([])
  })

  // Each of these was a line every component PR rewrote, so of any two open component
  // PRs the second to merge conflicted (TD-792). arch-graph-derived.ts derives them.
  it('stores no figure a component PR would have to rewrite', () => {
    expect(Object.keys(graph).sort()).toEqual(['components', 'schema', 'summary'])
    expect(Object.keys(graph.summary).sort()).toEqual(WHOLE_LIBRARY_SUMMARY)
  })

  it('tallies every configured consumer, so none can be silently scored as zero usage', () => {
    const configured = graph.summary.consumers.map((c) => c.name)
    for (const component of graph.components) {
      expect(
        Object.keys(component.xproj)
          .filter((k) => k !== 'total')
          .sort(),
        `${component.name}.xproj is missing a configured consumer. A consumer absent from ` +
          'the tally scores 0 usage, which lands its components on the `dead` list.'
      ).toEqual([...configured].sort())
    }
  })

  // The consumer list is committed precisely so every machine computes the same
  // `dead` verdicts. Adding a consumer without regenerating leaves a graph that
  // looks authoritative and is wrong about the repo that was just added.
  it('was generated from the committed consumer list', () => {
    const shared = JSON.parse(
      readFileSync(path.join(REPO_ROOT, 'scripts/arch.config.json'), 'utf8')
    ) as { consumers: { name: string }[] }

    expect(
      graph.summary.consumers.map((c) => c.name).sort(),
      'arch-graph.json was generated from a different consumer set than ' +
        'scripts/arch.config.json. Run `pnpm arch:graph -- --reindex` and commit the result.'
    ).toEqual(shared.consumers.map((c) => c.name).sort())
  })
})
