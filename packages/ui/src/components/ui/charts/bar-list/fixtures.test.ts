import { describe, expect, it } from 'vitest'
import { barListFixtures, defaultFixture, funnelFixture, veryLargeFixture } from './fixtures'

const byName = (name: string) => {
  const fixture = barListFixtures.find((f) => f.name === name)
  if (!fixture) throw new Error(`missing fixture ${name}`)
  return fixture
}

describe('BarList fixtures', () => {
  it('lists every contract fixture once', () => {
    expect(barListFixtures.map((f) => f.name).sort()).toEqual(
      [
        'All equal',
        'All zero',
        'Default',
        'Empty',
        'Flagged',
        'Funnel',
        'Hostile',
        'Long label',
        'Missing values',
        'One item',
        'Very large',
        'With description',
        'With marker',
        'With secondary',
      ].sort()
    )
  })

  it('keeps Default a 12-row heavy tail capped at 10', () => {
    expect(defaultFixture.rows.map((r) => r.value)).toEqual([
      412, 388, 201, 96, 44, 31, 18, 9, 6, 3, 2, 1,
    ])
    expect(defaultFixture.maxRows).toBe(10)
  })

  it('gives With marker the Default rows and a Limit of 100 that three rows reach', () => {
    const fixture = byName('With marker')
    expect(fixture.rows).toEqual(defaultFixture.rows)
    expect(fixture.referenceMarker).toEqual({ value: 100, label: 'Limit' })
    expect(fixture.rows.filter((r) => (r.value ?? 0) >= 100)).toHaveLength(3)
  })

  it('keeps Funnel in a fixed order with a caller maximum', () => {
    expect(funnelFixture.sort).toBe('none')
    expect(funnelFixture.max).toBe(100)
    expect(funnelFixture.rows.map((r) => r.value)).toEqual([100, 82, 61, 40, 12])
  })

  it('gives every fixture except Hostile unique ids and finite or null values', () => {
    for (const fixture of barListFixtures.filter((f) => f.name !== 'Hostile')) {
      const ids = fixture.rows.map((r) => r.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const row of fixture.rows) {
        expect(row.value === null || Number.isFinite(row.value)).toBe(true)
      }
    }
  })

  it('flags two Flagged rows with words', () => {
    const flagged = byName('Flagged').rows.filter((r) => r.flag)
    expect(flagged).toHaveLength(2)
    expect(flagged.every((r) => r.flag?.label === 'over 5%')).toBe(true)
  })

  it('builds Very large the same way every time', () => {
    expect(veryLargeFixture.rows).toHaveLength(5000)
    expect(veryLargeFixture.rows[0].value).toBe(byName('Very large').rows[0].value)
  })

  it('bounds Long label to the contract lengths', () => {
    const [first] = byName('Long label').rows
    expect(first.label).toHaveLength(120)
    expect(first.description).toHaveLength(300)
    expect(String(first.value)).toHaveLength(9)
  })

  it('has two null values and one null secondary in Missing values', () => {
    const rows = byName('Missing values').rows
    expect(rows.filter((r) => r.value === null)).toHaveLength(2)
    expect(rows.filter((r) => r.secondaryValue === null)).toHaveLength(1)
  })
})
