import { describe, expect, it } from 'vitest'
import { hostileFixture, hubItemId, matrixFixtures } from './fixtures'

const byName = (name: string) => {
  const fixture = matrixFixtures.find((f) => f.name === name)
  if (!fixture) throw new Error(`missing fixture ${name}`)
  return fixture
}

describe('DependencyMatrix fixtures', () => {
  it('lists every contract fixture once', () => {
    expect(matrixFixtures.map((f) => f.name).sort()).toEqual(
      [
        'Cycle',
        'Default',
        'Empty',
        'Heaviest cell',
        'Hostile',
        'Hub',
        'Long label',
        'No edges',
        'Null weight',
        'One item',
        'Package level',
        'Very large',
        'Wide',
      ].sort()
    )
  })

  it.each(matrixFixtures.filter((f) => f !== hostileFixture).map((f) => [f.name, f] as const))(
    '%s has only cells whose from and to are in items',
    (_name, fixture) => {
      const ids = new Set(fixture.items.map((i) => i.id))
      for (const cell of fixture.cells) {
        expect(ids.has(cell.from), `from ${cell.from}`).toBe(true)
        expect(ids.has(cell.to), `to ${cell.to}`).toBe(true)
      }
    }
  )

  it.each(matrixFixtures.filter((f) => f !== hostileFixture).map((f) => [f.name, f] as const))(
    '%s has unique item ids and no repeated or self cells',
    (_name, fixture) => {
      expect(new Set(fixture.items.map((i) => i.id)).size).toBe(fixture.items.length)
      const pairs = fixture.cells.map((c) => `${c.from}>${c.to}`)
      expect(new Set(pairs).size).toBe(pairs.length)
      expect(fixture.cells.every((c) => c.from !== c.to)).toBe(true)
    }
  )

  it('Very large has 386 items and 1021 edges', () => {
    const fixture = byName('Very large')
    expect(fixture.items).toHaveLength(386)
    expect(fixture.cells).toHaveLength(1021)
  })

  it('matches the contract shapes for the smaller fixtures', () => {
    expect(byName('Default').items).toHaveLength(31)
    expect(byName('Default').cells).toHaveLength(68)
    expect(byName('Wide').items).toHaveLength(46)
    expect(byName('Wide').cells).toHaveLength(147)
    expect(byName('Package level').items).toHaveLength(20)
    expect(byName('Package level').cells).toHaveLength(22)
    expect(new Set(byName('Package level').items.map((i) => i.group)).size).toBe(2)
    expect(byName('One item').items).toHaveLength(1)
    expect(byName('No edges').items).toHaveLength(2)
    expect(byName('No edges').cells).toHaveLength(0)
    expect(byName('Empty').items).toHaveLength(0)
  })

  it('Hub is a column of 25 importers with total weight 128', () => {
    const cells = byName('Hub').cells
    expect(cells.every((c) => c.to === hubItemId)).toBe(true)
    expect(cells).toHaveLength(25)
    expect(cells.reduce((sum, c) => sum + (c.value ?? 0), 0)).toBe(128)
  })

  it('Heaviest cell peaks at weight 16 and Cycle mirrors one flagged pair', () => {
    expect(Math.max(...byName('Default').cells.map((c) => c.value ?? 0))).toBe(16)
    const cycle = byName('Cycle').cells
    expect(cycle).toHaveLength(2)
    expect(cycle.every((c) => c.flag === 'cycle')).toBe(true)
    expect(cycle[0].from).toBe(cycle[1].to)
    expect(cycle[0].to).toBe(cycle[1].from)
  })

  it('Null weight and Long label cover their edge cases', () => {
    expect(byName('Null weight').cells.some((c) => c.value === null)).toBe(true)
    expect(Math.max(...byName('Long label').items.map((i) => i.label.length))).toBeGreaterThan(60)
  })

  it('Hostile carries each invalid shape it is meant to exercise', () => {
    const ids = new Set(hostileFixture.items.map((i) => i.id))
    const { cells, items } = hostileFixture
    expect(new Set(items.map((i) => i.id)).size).toBeLessThan(items.length)
    expect(cells.some((c) => !ids.has(c.from) || !ids.has(c.to))).toBe(true)
    expect(cells.some((c) => c.from === c.to)).toBe(true)
    expect(cells.some((c) => (c.value ?? 0) < 0)).toBe(true)
    expect(cells.some((c) => Number.isNaN(c.value))).toBe(true)
    const pairs = cells.map((c) => `${c.from}>${c.to}`)
    expect(new Set(pairs).size).toBeLessThan(pairs.length)
  })
})
