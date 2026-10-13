import { describe, it, expect } from 'vitest'
import { CODE_CHANGE_ORDER } from './code-status'
import {
  SYNTHETIC_PACKAGES,
  makeHotspotRows,
  statusMarkFixtures,
  syntheticBaseline,
  syntheticNode,
  syntheticPackage,
  syntheticPath,
  syntheticSymbol,
} from './fixtures'

const REAL_NAMES = ['titan', 'voltras', 'codewatch', 'agent-chat', 'active-work', 'brain']

describe('synthetic generators', () => {
  it('gives the same path for the same index', () => {
    expect(syntheticPath(17)).toBe(syntheticPath(17))
  })

  it('gives a unique path for every index below 1,000', () => {
    const paths = new Set(Array.from({ length: 1000 }, (_, i) => syntheticPath(i)))
    expect(paths.size).toBe(1000)
  })

  it('holds no real package name in any path, symbol, package or ref', () => {
    const text = [
      ...Array.from({ length: 1000 }, (_, i) => `${syntheticPath(i)} ${syntheticSymbol(i)}`),
      ...Array.from({ length: 30 }, (_, i) => syntheticPackage(i)),
      syntheticBaseline.ref,
    ].join('\n')
    for (const name of REAL_NAMES) expect(text).not.toContain(name)
  })

  it('takes package names from the pool and suffixes past it', () => {
    expect(syntheticPackage(0)).toBe(SYNTHETIC_PACKAGES[0])
    expect(syntheticPackage(SYNTHETIC_PACKAGES.length)).toBe(`${SYNTHETIC_PACKAGES[0]}-1`)
  })

  it('names a symbol node with the symbol rule and a file node without a name', () => {
    expect(syntheticNode(4, 'symbol').name).toBe(syntheticSymbol(4))
    expect(syntheticNode(4).name).toBeUndefined()
  })
})

describe('makeHotspotRows', () => {
  it('gives equal output for the same seed', () => {
    expect(makeHotspotRows(3, 40, { changeEvery: 4 })).toEqual(
      makeHotspotRows(3, 40, { changeEvery: 4 })
    )
  })

  it('keeps churn and complexity in range and scores non-negative', () => {
    for (const row of makeHotspotRows(9, 200)) {
      expect(row.churn).toBeGreaterThanOrEqual(1)
      expect(row.churn).toBeLessThanOrEqual(60)
      expect(row.complexity).toBeGreaterThanOrEqual(1)
      expect(row.complexity).toBeLessThanOrEqual(80)
      expect(row.score).toBeGreaterThanOrEqual(0)
    }
  })

  it('adds utilization only at symbol grain', () => {
    expect(makeHotspotRows(1, 5)[0].utilization).toBeUndefined()
    expect(makeHotspotRows(1, 5, { grain: 'symbol' })[0].utilization).toBeDefined()
  })

  it('rotates change kinds on every nth row and leaves the rest bare', () => {
    const rows = makeHotspotRows(1, 14, { changeEvery: 2 })
    expect(rows.filter((r) => r.change).map((r) => r.change)).toEqual(
      CODE_CHANGE_ORDER.concat(CODE_CHANGE_ORDER[0]).slice(0, 7)
    )
    expect(rows[1].change).toBeUndefined()
  })
})

describe('statusMarkFixtures', () => {
  it('pins the fixture names', () => {
    expect(statusMarkFixtures.map((f) => f.name)).toEqual([
      'Default',
      'Worsened with delta',
      'Worsened over cutoff',
      'Improved with delta',
      'Missing values',
      'Very large',
      'Hostile',
    ])
  })

  it('gives every fixture a known kind', () => {
    for (const f of statusMarkFixtures) expect(CODE_CHANGE_ORDER).toContain(f.kind)
  })

  it('keeps every delta finite except the Hostile fixture', () => {
    for (const f of statusMarkFixtures.filter((x) => x.name !== 'Hostile' && x.delta !== undefined))
      expect(Number.isFinite(f.delta)).toBe(true)
  })
})
