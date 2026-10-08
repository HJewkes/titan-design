// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  GAP_FIELDS,
  filledGaps,
  findGaps,
  newGaps,
  // @ts-expect-error — plain-ESM build tooling, shared with scripts/update-catalog-gaps-baseline.mjs
} from '../../scripts/update-catalog-gaps-baseline.mjs'
import baseline from './catalog-gaps-baseline.json'
import catalog from './component-catalog.json'

type Gaps = Record<string, string[]>
type Entry = Record<string, unknown> & { name: string }

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const UPDATER = path.join(PKG_ROOT, 'scripts', 'update-catalog-gaps-baseline.mjs')
const CATALOG = path.join(PKG_ROOT, 'src', 'arch', 'component-catalog.json')
const FIX = 'Fill the field, then run `node scripts/update-catalog-gaps-baseline.mjs`.'

const complete = (name: string): Entry => ({
  name,
  status: 'candidate',
  purpose: 'Does one thing.',
  props: [{ name: 'tone' }],
  storyIds: [`${name.toLowerCase()}--default`],
  composes: ['Typography'],
})

describe('component catalog completeness', () => {
  it('lists every empty field in the baseline and nothing else', () => {
    const live: Gaps = findGaps(catalog)
    expect(newGaps(baseline, live), `Unbaselined gaps. ${FIX}`).toEqual([])
    expect(filledGaps(baseline, live), `Filled gaps still listed. ${FIX}`).toEqual([])
  })

  it('baselines only the checked fields, each name once and sorted', () => {
    for (const [field, names] of Object.entries(baseline as Gaps)) {
      expect(GAP_FIELDS).toContain(field)
      expect(names).toEqual([...new Set(names)].sort())
    }
  })
})

describe('findGaps', () => {
  it.each(GAP_FIELDS as string[])('reports an entry whose %s is empty', (field) => {
    const empty = field === 'status' || field === 'purpose' ? '' : []
    const gaps = findGaps({
      entries: [{ ...complete('Broken'), [field]: empty }, complete('Whole')],
    })
    expect(gaps).toEqual({ [field]: ['Broken'] })
  })

  it('reports nothing for a complete entry', () => {
    expect(findGaps({ entries: [complete('Whole')] })).toEqual({})
  })
})

describe('shrink-only comparison', () => {
  it('flags a new gap that is not baselined', () => {
    expect(newGaps({ purpose: ['Old'] }, { purpose: ['Old', 'Fresh'] })).toEqual(['purpose:Fresh'])
  })

  it('flags a baselined gap that has been filled', () => {
    expect(filledGaps({ purpose: ['Old', 'Done'] }, { purpose: ['Old'] })).toEqual(['purpose:Done'])
  })

  it('accepts a baseline that matches the live gaps', () => {
    const gaps = { props: ['A'], composes: ['A', 'B'] }
    expect([...newGaps(gaps, gaps), ...filledGaps(gaps, gaps)]).toEqual([])
  })
})

describe('update-catalog-gaps-baseline.mjs', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  /** A temp catalog (the real one plus one entry with no purpose) and the real baseline. */
  function sandbox() {
    const dir = mkdtempSync(path.join(tmpdir(), 'catalog-gaps-'))
    dirs.push(dir)
    const catalogCopy = path.join(dir, 'catalog.json')
    const baselineCopy = path.join(dir, 'baseline.json')
    const real = JSON.parse(readFileSync(CATALOG, 'utf8'))
    real.entries.push({ ...complete('Newcomer'), purpose: '' })
    writeFileSync(catalogCopy, JSON.stringify(real))
    copyFileSync(path.join(PKG_ROOT, 'src', 'arch', 'catalog-gaps-baseline.json'), baselineCopy)
    return { catalogCopy, baselineCopy }
  }

  const run = (paths: { catalogCopy: string; baselineCopy: string }, ...flags: string[]) =>
    spawnSync(
      process.execPath,
      [UPDATER, '--catalog', paths.catalogCopy, '--baseline', paths.baselineCopy, ...flags],
      { encoding: 'utf8' }
    )

  it('refuses a new gap without --allow-increase and leaves the baseline alone', () => {
    const paths = sandbox()
    const before = readFileSync(paths.baselineCopy, 'utf8')
    const result = run(paths)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('purpose:Newcomer')
    expect(readFileSync(paths.baselineCopy, 'utf8')).toBe(before)
  })

  it('records a new gap when --allow-increase is passed', () => {
    const paths = sandbox()
    expect(run(paths, '--allow-increase').status).toBe(0)
    const written = JSON.parse(readFileSync(paths.baselineCopy, 'utf8')) as Gaps
    expect(written.purpose).toContain('Newcomer')
  })
})
