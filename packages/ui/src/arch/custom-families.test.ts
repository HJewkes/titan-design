// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import baseline from './custom-families.baseline.json'

const CUSTOM_DIR = fileURLToPath(new URL('../components/custom', import.meta.url))

/** The baseline as committed when TD-366 landed. It may only lose entries, so shrink this list with it. */
const COMMITTED_BASELINE = [
  'CircularTimer',
  'DateTime',
  'EmptyState',
  'Gauge',
  'Metric',
  'Prose',
  'Scatter',
  'Sidebar',
  'Table',
  'TimerReadout',
  'Treemap',
  'Typography',
  'stepper',
]

function topLevelDirectories(customDir: string): string[] {
  return readdirSync(customDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

function declaredFamilies(readme: string): string[] {
  const section = readme.split(/^## /m)[0] ?? ''
  return [...section.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map((match) => match[1] as string)
}

function undeclaredDirectories(dirs: string[], families: string[], listed: string[]) {
  return dirs.filter((dir) => !families.includes(dir) && !listed.includes(dir))
}

function staleEntries(dirs: string[], listed: string[]) {
  return listed.filter((entry) => !dirs.includes(entry))
}

function addedEntries(listed: string[], committed: string[]) {
  return listed.filter((entry) => !committed.includes(entry))
}

const names = (items: string[]) => items.map((item) => `custom/${item}`).join(', ')

describe('custom families structure', () => {
  const dirs = topLevelDirectories(CUSTOM_DIR)
  const readme = readFileSync(path.join(CUSTOM_DIR, 'README.md'), 'utf8')
  const families = declaredFamilies(readme)

  it('declares Chat as a family', () => {
    expect(families).toContain('Chat')
  })

  it('has no top-level directory that is neither a README family row nor a baseline entry', () => {
    const offenders = undeclaredDirectories(dirs, families, baseline)
    expect(
      offenders,
      `Undeclared: ${names(offenders)}. Add a Family-table row to custom/README.md if it is a ` +
        'domain family; a generic component belongs in ui/ (CLAUDE.md, Placement).'
    ).toEqual([])
  })

  it('lists no baseline entry whose directory is gone', () => {
    const stale = staleEntries(dirs, baseline)
    expect(
      stale,
      `Stale baseline entries: ${names(stale)}. Remove them from custom-families.baseline.json.`
    ).toEqual([])
  })

  it('never gains a baseline entry', () => {
    const added = addedEntries(baseline, COMMITTED_BASELINE)
    expect(
      added,
      `Baseline grew: ${names(added)}. The list only shrinks; place the component instead.`
    ).toEqual([])
  })
})

describe('custom families detectors', () => {
  it('names a directory that is neither a family nor listed', () => {
    expect(undeclaredDirectories(['Foo', 'Chat', 'Metric'], ['Chat'], ['Metric'])).toEqual(['Foo'])
  })

  it('names a baseline entry with no directory', () => {
    expect(staleEntries(['Chat'], ['Chat', 'Gone'])).toEqual(['Gone'])
  })

  it('names an entry absent from the committed list', () => {
    expect(addedEntries(['Metric', 'New'], ['Metric'])).toEqual(['New'])
  })

  it('reads family names from the first table only', () => {
    const readme = '| Family | D |\n| `A` | x |\n| `B` | y |\n\n## Other\n| `C` | z |\n'
    expect(declaredFamilies(readme)).toEqual(['A', 'B'])
  })
})
