// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — plain-ESM build tooling, the digest `pnpm catalog` writes
import { renderDigest } from '../../scripts/catalog/digest.mjs'
import committedCatalog from './component-catalog.json'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIGEST = path.join(PKG_ROOT, 'docs/component-catalog.md')
const COLUMNS = 6
// Title, blank, provenance line, blank, header, separator.
const PREAMBLE_LINES = 6

type Entry = { name: string; status: string; purpose: string | null; storyIds: string[] }
type Catalog = { entries: Entry[] }

const catalog = committedCatalog as unknown as Catalog
const committedDigest = (): string => readFileSync(DIGEST, 'utf8')
const render = (c: Catalog): string => renderDigest(c) as string

/** A row's cells, split on unescaped pipes. */
const cellsOf = (row: string): string[] =>
  row
    .slice(2, -2)
    .split(/(?<!\\) \| /)
    .map((value) => value.trim())

const tableRows = (digest: string): string[] =>
  digest.split('\n').slice(PREAMBLE_LINES).filter(Boolean)

/** Entry names whose row is in one digest and not, byte for byte, in the other. */
function differingRows(committed: string, fresh: string): string[] {
  const rows = (text: string) => new Map(tableRows(text).map((row) => [cellsOf(row)[0], row]))
  const [a, b] = [rows(committed), rows(fresh)]
  return [...new Set([...a.keys(), ...b.keys()])].filter((key) => a.get(key) !== b.get(key)).sort()
}

const withEntry = (name: string, change: Partial<Entry>): Catalog => ({
  entries: catalog.entries.map((entry) => (entry.name === name ? { ...entry, ...change } : entry)),
})

describe('docs/component-catalog.md', () => {
  it('matches the committed component-catalog.json, byte for byte', () => {
    const differing = differingRows(committedDigest(), render(catalog))
    expect(
      differing,
      `docs/component-catalog.md is stale for: ${differing.join(', ')}. Run \`pnpm catalog\`.`
    ).toEqual([])
    expect(committedDigest(), 'Run `pnpm catalog`.').toBe(render(catalog))
  })

  it('has one row per entry, sorted by name', () => {
    const names = tableRows(render(catalog)).map((row) => cellsOf(row)[0])
    expect(names).toEqual(catalog.entries.map((entry) => entry.name).sort())
  })

  it('names the row left behind when an entry is removed from the JSON', () => {
    const removed = { entries: catalog.entries.filter((entry) => entry.name !== 'Alert') }
    expect(differingRows(committedDigest(), render(removed))).toEqual(['Alert'])
  })

  it.each([
    ['status', { status: 'lab' }],
    ['purpose', { purpose: 'Alert component for status callouts.' }],
    ['first story id', { storyIds: ['components-molecules-alert--aaa-first'] }],
  ])('names the entry whose %s changed without re-rendering', (_field, change) => {
    expect(differingRows(committedDigest(), render(withEntry('Alert', change)))).toEqual(['Alert'])
  })

  it('keeps a purpose with a pipe or a newline inside its own row and cell', () => {
    const purpose = 'Splits MEV|MRV\nacross two lines.'
    const lines = render(withEntry('Alert', { purpose })).split('\n')
    const row = lines.find((line) => line.startsWith('| Alert |')) as string
    expect(lines).toHaveLength(committedDigest().split('\n').length)
    expect(cellsOf(row)).toHaveLength(COLUMNS)
    expect(cellsOf(row)[3]).toBe('Splits MEV\\|MRV across two lines.')
  })
})
