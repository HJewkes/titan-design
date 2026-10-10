import { describe, it, expect } from 'vitest'
import { simulateCvd } from '../../theme/color-checks'
import {
  CATEGORICAL_SETS,
  setColors,
  type CategoricalSetId,
} from './categorical-revisit.candidates'
import { measureSet, type SetMeasurement } from './categorical-revisit'

/** The TD-756 plan prints one or two decimals; the story must agree with it to 0.05. */
const TOLERANCE = 0.05

const byId = (id: CategoricalSetId) => {
  const set = CATEGORICAL_SETS.find((candidate) => candidate.id === id)
  if (!set) throw new Error(`no set ${id}`)
  return set
}
const measured = (id: CategoricalSetId) => measureSet(byId(id))

function expectNear(actual: number[], planned: number[]) {
  expect(actual).toHaveLength(planned.length)
  actual.forEach((value, i) =>
    expect(Math.abs(value - planned[i]), `#${i}`).toBeLessThanOrEqual(TOLERANCE)
  )
}

/** The plan's separation row: all-pairs CVD 0-5, with slot 6, adjacent normal-vision ΔE. */
const separation = ({ cvdSafe, cvdWithExtended, normalAdjacent }: SetMeasurement) => [
  cvdSafe.plan,
  cvdWithExtended.plan,
  normalAdjacent,
]

describe('categorical revisit numbers match the TD-756 plan', () => {
  it('measures the shipped dark fills as §3.1 and §3.3 print them', () => {
    const dark = measured('current-dark')
    expectNear(separation(dark), [8.1, 7.2, 12.7])
    expectNear([dark.cvdAdjacent.plan, dark.tritanSafe.plan], [8.1, 4.7])
    expectNear(dark.slots[6].planes, [3.48, 2.85, 3.12, 2.62, 2.4])
    expectNear(
      dark.slots.map((slot) => slot.worst),
      [3.86, 3.09, 3.16, 4.59, 6.25, 6.67, 2.4]
    )
  })

  it('measures the shipped light fills (set B) as §3.2 and §3.3 print them', () => {
    const light = measured('current-light')
    expectNear(separation(light), [4.9, 3.8, 15.3])
    expectNear([light.cvdAdjacent.plan, light.tritanSafe.plan], [6.9, 5.5])
    expectNear(light.slots[0].planes, [2.61, 2.9, 3.12, 2.61, 3.12])
    expect(light.slots.map((slot) => slot.grey)).toEqual([
      '#929292',
      '#696969',
      '#767676',
      '#A0A0A0',
      '#767676',
      '#A5A5A5',
      '#6F6F6F',
    ])
  })

  it('shows set B red and green as the same olive under deuteranopia', () => {
    const [, , red, , green] = setColors(byId('current-light'))
    expect([red, green].map((hex) => simulateCvd(hex, 'deutan').toUpperCase())).toEqual([
      '#8E813F',
      '#7E7339',
    ])
  })

  it('measures the light fill candidates as appendix B prints them', () => {
    const vivid = measured('L-fix-vivid')
    expectNear(separation(vivid), [8.5, 2.2, 9.5])
    expectNear(vivid.slots[2].planes, [2.31, 2.58, 2.77, 2.31, 2.77])
    expect(
      setColors(byId('L-fix-vivid')).map((hex) => simulateCvd(hex, 'deutan').toUpperCase())
    ).toEqual(['#4789F1', '#657293', '#B2A672', '#C1AB00', '#655C2B', '#8A9ED1', '#857501'])
    const green = measured('L-fix-green')
    expectNear(separation(green), [10.3, 4.9, 15.3])
    expectNear([green.slots[4].worst], [8.11])
  })

  it('measures the ink tiers as §4.3 and appendix B print them', () => {
    expectNear(measured('ink-dark').slots[6].planes, [4.83, 3.94, 4.32, 3.63, 3.33])
    expectNear(separation(measured('ink-dark')).slice(0, 2), [8.1, 5.0])
    expectNear(separation(measured('ink-light-A')).slice(0, 2), [8.6, 0.3])
    expectNear(measured('ink-light-A').slots[0].planes, [4.08, 4.55, 4.89, 4.08, 4.89])
    const inkB = measured('ink-light-B')
    expectNear([inkB.cvdSafe.plan, inkB.tritanSafe.plan], [8.6, 7.0])
    expectNear(
      inkB.slots.map((slot) => slot.worst),
      [5.74, 9.07, 3.18, 4.34, 8.11, 3.95, 4.19]
    )
  })

  it('prints the CI gate figure beside the plan figure; both clear 8 where the plan says pass', () => {
    const passing = [
      'current-dark',
      'L-fix-vivid',
      'L-fix-green',
      'ink-light-A',
      'ink-dark',
    ] as const
    for (const id of passing) expect(measured(id).cvdSafe.gate, id).toBeGreaterThanOrEqual(8)
    expectNear([measured('current-light').cvdSafe.gate], [4.87])
    expectNear([measured('current-dark').cvdSafe.gate], [8.34])
  })

  it('clears 3:1 on every plane of its mode in both light ink sets', () => {
    for (const id of ['ink-light-A', 'ink-light-B'] as const) {
      const worst = Math.min(...measured(id).slots.map((slot) => slot.worst))
      expect(worst, id).toBeGreaterThanOrEqual(3)
    }
  })
})
