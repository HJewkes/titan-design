import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { main, mergeKeys, serialise } from './update-audit-stories-baseline.mjs'

const WIDTHS = [360, 768, 1280]
const FIXED = 'components-atoms-fixed--default'
const UNTOUCHED = 'components-atoms-untouched--default'
const NARROW = 'components-atoms-narrow--default'

const floor = (selector) => ({ kind: 'text-floor', selector, detail: '8px text' })
const frame = (id, width, selectors = []) => ({
  id,
  width,
  theme: 'dark',
  rendered: true,
  blockers: [],
  warnings: selectors.map(floor),
})
const atAllWidths = (id, selectors) => WIDTHS.map((w) => frame(id, w, selectors))
const baseline = (textFloor, extraKinds = {}) => ({
  schema: 1,
  generated: { sha: 'abc1234', widths: WIDTHS },
  ceiling: { 'text-floor': Object.values(textFloor).flat().length },
  kinds: { 'text-floor': textFloor, ...extraKinds },
})

let dir
let files
const write = (name, value) => writeFileSync(join(dir, name), JSON.stringify(value))
const read = () => JSON.parse(readFileSync(files.baseline, 'utf8'))
const run = (...flags) => main([files.dom, '--baseline', files.baseline, ...flags])

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'audit-stories-baseline-'))
  files = { dom: join(dir, 'dom.json'), baseline: join(dir, 'baseline.json') }
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('regenerating from a scoped run', () => {
  it('drops a key that a fully audited story no longer has, and lowers the ceiling', () => {
    write('baseline.json', baseline({ [FIXED]: ['span.a', 'span.b'] }))
    write('dom.json', { stories: atAllWidths(FIXED, ['span.a']) })

    expect(run()).toBe(0)

    expect(read().kinds['text-floor']).toEqual({ [FIXED]: ['span.a'] })
    expect(read().ceiling['text-floor']).toBe(1)
  })

  it('keeps the keys of a story the dom.json did not audit', () => {
    write('baseline.json', baseline({ [UNTOUCHED]: ['span.a'] }))
    write('dom.json', { stories: atAllWidths(FIXED, []) })

    run()

    expect(read().kinds['text-floor']).toEqual({ [UNTOUCHED]: ['span.a'] })
  })

  it('keeps the keys of a story audited at 360 only', () => {
    write('baseline.json', baseline({ [NARROW]: ['span.a', 'span.wide'] }))
    write('dom.json', { stories: [frame(NARROW, 360, ['span.a'])] })

    run()

    expect(read().kinds['text-floor'][NARROW]).toEqual(['span.a', 'span.wide'])
  })

  it('refuses a new key without --allow-increase and lists it, then accepts it with the flag', () => {
    write('baseline.json', baseline({ [FIXED]: ['span.a'] }))
    write('dom.json', { stories: atAllWidths(FIXED, ['span.a', 'span.new']) })

    expect(run()).toBe(1)
    expect(console.error).toHaveBeenCalledWith(`  new key: text-floor ${FIXED} span.new`)
    expect(read().kinds['text-floor'][FIXED]).toEqual(['span.a'])

    expect(run('--allow-increase')).toBe(0)
    expect(read().kinds['text-floor'][FIXED]).toEqual(['span.a', 'span.new'])
    expect(read().ceiling['text-floor']).toBe(2)
  })

  it('writes sorted output that is byte-identical across two runs', () => {
    write('baseline.json', baseline({ [UNTOUCHED]: ['span.z', 'span.a'], [FIXED]: ['b', 'a'] }))
    write('dom.json', { stories: atAllWidths(FIXED, ['b', 'a']) })

    run()
    const first = readFileSync(files.baseline, 'utf8')
    run()

    expect(readFileSync(files.baseline, 'utf8')).toBe(first)
    expect(Object.keys(read().kinds['text-floor'])).toEqual([FIXED, UNTOUCHED])
    expect(read().kinds['text-floor'][UNTOUCHED]).toEqual(['span.a', 'span.z'])
  })

  it('leaves another kind’s section untouched under --kind text-floor', () => {
    const other = { [FIXED]: ['div.lift'] }
    write('baseline.json', baseline({ [FIXED]: ['span.a'] }, { 'nested-lift': other }))
    write('dom.json', { stories: atAllWidths(FIXED, []) })

    run('--kind', 'text-floor')

    expect(read().kinds['nested-lift']).toEqual(other)
  })
})

describe('seeding', () => {
  it('writes every key at the captured widths when the story count matches', () => {
    write('dom.json', { stories: [...atAllWidths(FIXED, ['span.a']), frame(NARROW, 360)] })

    expect(run('--seed', '2', '--sha', 'def5678')).toBe(0)

    expect(read()).toEqual({
      schema: 1,
      generated: { sha: 'def5678', widths: WIDTHS },
      ceiling: { 'text-floor': 1 },
      kinds: { 'text-floor': { [FIXED]: ['span.a'] } },
    })
  })

  it('refuses a dom.json whose story count differs from the run’s', () => {
    write('dom.json', { stories: atAllWidths(FIXED, ['span.a']) })

    expect(() => run('--seed', '1272', '--sha', 'def5678')).toThrow(/expects 1272 stories/)
  })

  it('refuses to seed over an existing file', () => {
    write('baseline.json', baseline({}))
    write('dom.json', { stories: atAllWidths(FIXED, []) })

    expect(() => run('--seed', '1', '--sha', 'def5678')).toThrow(/exists/)
  })
})

describe('mergeKeys', () => {
  it('reports added and dropped keys as story-selector strings', () => {
    const out = mergeKeys({ [FIXED]: ['a'] }, new Map([[FIXED, new Set(['b'])]]), [FIXED])

    expect(out).toEqual({
      next: { [FIXED]: ['b'] },
      added: [`${FIXED} b`],
      dropped: [`${FIXED} a`],
    })
  })
})

describe('serialise', () => {
  it('puts one selector per line', () => {
    const text = serialise(baseline({ [FIXED]: ['a', 'b'] }))

    expect(text).toContain('\n        "a",\n        "b"\n')
  })
})
