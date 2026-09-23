import { describe, expect, it } from 'vitest'
import {
  MAX_EMPTY_PLACES,
  barTone,
  bandSlotCount,
  bandSlots,
  lineBand,
  velocityBandGeometry,
  type BandBarLayout,
} from './velocityBandGeometry'
import { labelsOverlap, type BandLabel } from './velocityBandLabels'
import {
  EMPTY_SET,
  TIER_A_NO_GUARD,
  TIER_A_REP_RANGE_LOSS_GUARD,
  TIER_A_TARGET_RPE_FALLBACK,
  TIER_B_LOW_CONFIDENCE,
  TIER_B_PAST_CUE,
  TIER_B_REP_RANGE_ONE_GUARD,
  TIER_B_SUSPENDED_TAIL,
  TIER_B_TWO_GUARDS,
  type BandScaleFixture,
} from './velocityBandScale-fixture'
import type {
  VelocityBandLineMarker,
  VelocityBandRepMarker,
  VelocityBandScale,
} from './VelocityBandScale'

/** A 1.0 m/s ceiling over a 200 px plot: 0.5 m/s sits 100 px up. */
function layoutFor(fixture: BandScaleFixture, plotWidth = 600): BandBarLayout {
  return {
    plotWidth,
    plotHeight: 200,
    slotCount: bandSlotCount(fixture.scale, fixture.velocities.length),
    velocities: fixture.velocities,
    scaleDenom: 1,
  }
}

function geometryOf(fixture: BandScaleFixture, plotWidth?: number) {
  return velocityBandGeometry(fixture.scale, layoutFor(fixture, plotWidth))
}

const lossLine: VelocityBandLineMarker = {
  role: 'guard',
  axis: 'velocity',
  condition: 'velocity_loss',
  velocityMps: 0.5,
  band: 3,
  label: 'VL 30%',
  reached: false,
}

describe('slot layout', () => {
  it('pads the columns to the zone top so unperformed reps show as empty places', () => {
    expect(bandSlotCount(TIER_A_NO_GUARD.scale, 5)).toBe(12)
    expect(bandSlotCount(TIER_B_PAST_CUE.scale, 12)).toBe(12)
    expect(bandSlotCount(undefined, 3)).toBe(3)
  })

  it('places columns edge to edge across the plot, as the flex row does', () => {
    const { slots, gap } = bandSlots({ ...layoutFor(TIER_A_NO_GUARD), plotWidth: 600 })
    const last = slots[slots.length - 1]
    expect(slots).toHaveLength(12)
    expect(last.x + last.width).toBeCloseTo(600, 6)
    expect(slots[1].x - (slots[0].x + slots[0].width)).toBeCloseTo(gap, 6)
  })

  it('caps a column at the bar maximum and leaves the rest of a wide plot empty', () => {
    const { slots } = bandSlots({ ...layoutFor(TIER_A_NO_GUARD), plotWidth: 5000, slotCount: 2 })
    expect(slots[0].width).toBe(120)
    expect(slots[1].x + slots[1].width).toBeLessThan(5000)
  })

  it('draws nothing before the plot is measured', () => {
    const g = geometryOf(TIER_B_TWO_GUARDS, 0)
    expect(g.slots).toEqual([])
    expect(g.bars).toEqual([])
    expect(g.lines).toEqual([])
    expect(g.zone).toBeNull()
  })
})

describe('bars', () => {
  it('takes the height from the measured velocity, never from a band edge', () => {
    const g = geometryOf(TIER_B_REP_RANGE_ONE_GUARD)
    expect(g.bars.map((b) => b.height)).toEqual(
      TIER_B_REP_RANGE_ONE_GUARD.velocities.map((v) => v * 200)
    )
  })

  it('takes each band as given', () => {
    const g = geometryOf(TIER_A_REP_RANGE_LOSS_GUARD)
    expect(g.bars.map((b) => b.band)).toEqual(TIER_A_REP_RANGE_LOSS_GUARD.scale.repBands)
  })

  it('flags a low-confidence reading only where a band exists', () => {
    const g = geometryOf(TIER_B_LOW_CONFIDENCE)
    expect(g.bars.filter((b) => b.lowConfidence).map((b) => b.repNumber)).toEqual([9, 10])
  })
})

describe('suspended tail after a setting change', () => {
  it('draws every bar from the change on neutral, to the end of the set', () => {
    const g = geometryOf(TIER_B_SUSPENDED_TAIL)
    expect(g.bars.filter((b) => b.suspended).map((b) => b.repNumber)).toEqual([6, 7, 8, 9])
    expect(g.bars.slice(5).every((b) => b.band === null)).toBe(true)
  })

  it('ignores a band the caller left on a suspended rep', () => {
    const scale: VelocityBandScale = { ...TIER_B_SUSPENDED_TAIL.scale, repBands: Array(9).fill(1) }
    const g = velocityBandGeometry(scale, layoutFor(TIER_B_SUSPENDED_TAIL))
    expect(g.bars[5].band).toBeNull()
    expect(g.bars[4].band).toBe(1)
  })

  it('marks the change in the gap before the first suspended bar, with the caller label', () => {
    const g = geometryOf(TIER_B_SUSPENDED_TAIL)
    const sixth = g.bars[5]
    expect(g.suspension).toMatchObject({ fromRep: 6, label: 'Setting changed' })
    expect(g.suspension!.x).toBeLessThan(sixth.x)
    expect(g.suspension!.x).toBeGreaterThan(g.bars[4].x + g.bars[4].width)
  })

  it('has no mark when nothing changed', () => {
    expect(geometryOf(TIER_B_REP_RANGE_ONE_GUARD).suspension).toBeNull()
  })
})

describe('rep-range zone', () => {
  it('spans the repsLow slot to the repsHigh slot, including empty places', () => {
    const g = geometryOf(TIER_A_NO_GUARD)
    expect(g.zone).toMatchObject({ repsLow: 8, repsHigh: 12, label: '8 to 12' })
    expect(g.zone!.x0).toBe(g.slots[7].x)
    expect(g.zone!.x1).toBeCloseTo(g.slots[11].x + g.slots[11].width, 6)
  })

  it('puts the tick and the end line in the gaps around the zone', () => {
    const g = geometryOf(TIER_A_NO_GUARD)
    expect(g.zone!.tickX).toBeLessThan(g.zone!.x0)
    expect(g.zone!.tickX).toBeGreaterThan(g.slots[6].x + g.slots[6].width)
    expect(g.zone!.endX).toBeGreaterThanOrEqual(g.zone!.x1)
  })

  it('shows the zone before any rep is performed', () => {
    const g = geometryOf(EMPTY_SET)
    expect(g.bars).toEqual([])
    expect(g.zone).toMatchObject({ repsLow: 8, repsHigh: 12 })
  })

  it('reads an inverted range the right way round', () => {
    const inverted: VelocityBandRepMarker = {
      role: 'goal',
      axis: 'rep',
      condition: 'reps',
      repsLow: 12,
      repsHigh: 8,
      label: '8 to 12',
      reached: false,
    }
    const scale: VelocityBandScale = {
      ...TIER_A_NO_GUARD.scale,
      markers: { goal: inverted, guards: [] },
    }
    const g = velocityBandGeometry(scale, layoutFor(TIER_A_NO_GUARD))
    expect(g.zone).toMatchObject({ repsLow: 8, repsHigh: 12 })
  })

  it('carries the caller label verbatim', () => {
    const goal = TIER_A_TARGET_RPE_FALLBACK.scale.markers.goal as VelocityBandRepMarker
    const scale: VelocityBandScale = {
      ...TIER_A_TARGET_RPE_FALLBACK.scale,
      markers: { goal: { ...goal, label: '8–12 · any wording' }, guards: [] },
    }
    const g = velocityBandGeometry(scale, layoutFor(TIER_A_TARGET_RPE_FALLBACK))
    expect(g.zone!.label).toBe('8–12 · any wording')
  })

  it('draws no horizontal line for a rep-range goal', () => {
    expect(geometryOf(TIER_A_NO_GUARD).lines).toEqual([])
  })
})

describe('guard lines', () => {
  it('draws none for a set with no guard', () => {
    expect(geometryOf(TIER_A_NO_GUARD).lines).toHaveLength(0)
  })

  it('draws one guard at its velocity', () => {
    const [line] = geometryOf(TIER_B_REP_RANGE_ONE_GUARD).lines
    expect(line).toMatchObject({ key: 'guard-0', condition: 'effort', band: 2, label: 'RPE 9' })
    expect(line.y).toBeCloseTo(72, 6)
  })

  it('draws two guards, and only the effort one keeps its colour', () => {
    const lines = geometryOf(TIER_B_TWO_GUARDS).lines
    expect(lines.map((l) => [l.condition, l.band])).toEqual([
      ['velocity_loss', null],
      ['effort', 2],
    ])
  })

  it('draws at most two guards', () => {
    const scale: VelocityBandScale = {
      ...TIER_B_TWO_GUARDS.scale,
      markers: { goal: null, guards: [lossLine, lossLine, lossLine] },
    }
    expect(velocityBandGeometry(scale, layoutFor(TIER_B_TWO_GUARDS)).lines).toHaveLength(2)
  })

  it('skips a loss line that has no best rep yet', () => {
    const scale: VelocityBandScale = {
      ...TIER_B_TWO_GUARDS.scale,
      markers: { goal: null, guards: [{ ...lossLine, velocityMps: null }] },
    }
    expect(velocityBandGeometry(scale, layoutFor(TIER_B_TWO_GUARDS)).lines).toEqual([])
  })

  it('clamps a line above the plot to its top edge and says so', () => {
    const scale: VelocityBandScale = {
      ...TIER_B_TWO_GUARDS.scale,
      markers: { goal: null, guards: [{ ...lossLine, velocityMps: 3 }] },
    }
    const [line] = velocityBandGeometry(scale, layoutFor(TIER_B_TWO_GUARDS)).lines
    expect(line).toMatchObject({ y: 200, clamped: true })
  })

  it('marks the guard that fired the cue', () => {
    const lines = geometryOf(TIER_B_TWO_GUARDS).lines
    expect(lines.find((l) => l.firedCue)?.condition).toBe('velocity_loss')
  })
})

describe('line colour rules', () => {
  const effortGoal: VelocityBandLineMarker = {
    ...lossLine,
    role: 'goal',
    condition: 'effort',
    band: 0,
  }

  it('keeps a tier b effort line and a tier b loss goal in colour', () => {
    expect(lineBand(effortGoal, 'effort')).toBe(0)
    expect(lineBand({ ...lossLine, role: 'goal' }, 'effort')).toBe(3)
  })

  it('draws a loss guard in neutral ink in every tier', () => {
    expect(lineBand(lossLine, 'effort')).toBeNull()
    expect(lineBand(lossLine, 'velocity_loss')).toBeNull()
  })

  it('draws every line neutral in tier a, which claims no effort', () => {
    expect(lineBand(effortGoal, 'velocity_loss')).toBeNull()
  })
})

describe('past-cue count', () => {
  it('spans the reps after the cue and counts them', () => {
    const g = geometryOf(TIER_B_PAST_CUE)
    expect(g.pastCue).toMatchObject({ count: 2, label: '+2' })
    expect(g.pastCue!.x0).toBe(g.bars[10].x)
    expect(g.pastCue!.x1).toBeCloseTo(g.bars[11].x + g.bars[11].width, 6)
  })

  it('uses the caller wording when given', () => {
    const scale: VelocityBandScale = {
      ...TIER_B_PAST_CUE.scale,
      cue: { atRep: 10, repsPast: 2, pastLabel: '2 past' },
    }
    expect(velocityBandGeometry(scale, layoutFor(TIER_B_PAST_CUE)).pastCue!.label).toBe('2 past')
  })

  it('is absent before the cue fires and on the cue rep itself', () => {
    expect(geometryOf(TIER_B_REP_RANGE_ONE_GUARD).pastCue).toBeNull()
    const onCue: VelocityBandScale = { ...TIER_B_PAST_CUE.scale, cue: { atRep: 12, repsPast: 0 } }
    expect(velocityBandGeometry(onCue, layoutFor(TIER_B_PAST_CUE)).pastCue).toBeNull()
  })
})

describe('band edges', () => {
  it('places the given edges and skips a null one', () => {
    const scale: VelocityBandScale = {
      ...TIER_B_REP_RANGE_ONE_GUARD.scale,
      edgesMps: [0.45, null, 0.33],
    }
    const g = velocityBandGeometry(scale, layoutFor(TIER_B_REP_RANGE_ONE_GUARD))
    expect(g.edges.map((e) => e.band)).toEqual([1, 3])
    expect(g.edges[0].y).toBeCloseTo(90, 6)
  })

  it('has none in tier a, where the scale carries no edges', () => {
    expect(geometryOf(TIER_A_NO_GUARD).edges).toEqual([])
  })
})

/** The chart's own `peak` scale: the best rep with 3% headroom. */
function chartLayout(fixture: BandScaleFixture, plotWidth: number, plotHeight: number) {
  const best = Math.max(...fixture.velocities)
  return {
    plotWidth,
    plotHeight,
    slotCount: bandSlotCount(fixture.scale, fixture.velocities.length),
    velocities: fixture.velocities,
    scaleDenom: best * 1.03,
  }
}

function expectClearLabels(labels: BandLabel[], plotWidth: number, plotHeight: number) {
  expect(labelsOverlap(labels)).toBe(false)
  for (const l of labels) {
    expect(l.crowded).toBe(false)
    expect(l.x).toBeGreaterThanOrEqual(0)
    expect(l.x + l.width).toBeLessThanOrEqual(plotWidth)
    expect(l.y).toBeGreaterThanOrEqual(0)
    expect(l.y + l.height).toBeLessThanOrEqual(plotHeight)
  }
}

const PHONE = [328, 150] as const
const WALL = [1888, 240] as const

const heavySet: BandScaleFixture = {
  title: 'heavy',
  velocities: [0.4, 0.39, 0.38, 0.37, 0.36],
  scale: {
    ...TIER_B_REP_RANGE_ONE_GUARD.scale,
    repBands: [1, 1, 1, 2, 2],
  },
}

const lateChange: BandScaleFixture = {
  ...TIER_B_SUSPENDED_TAIL,
  velocities: [...TIER_B_SUSPENDED_TAIL.velocities, 0.6, 0.58, 0.55],
  scale: { ...TIER_B_SUSPENDED_TAIL.scale, settingChangedAtRep: 10 },
}

describe('label placement (functional gate S1 to S4)', () => {
  const cases: [string, BandScaleFixture][] = [
    ['past cue under a line (S1)', TIER_B_PAST_CUE],
    ['setting change late in the set (S2)', lateChange],
    ['heavy set, line near the plot top (S3)', heavySet],
    ['two guards', TIER_B_TWO_GUARDS],
    ['fallback eyebrow set', TIER_A_TARGET_RPE_FALLBACK],
  ]
  for (const [name, fixture] of cases) {
    for (const [w, h] of [PHONE, WALL]) {
      it(`keeps every label clear and inside the plot: ${name} at ${w}x${h}`, () => {
        const g = velocityBandGeometry(fixture.scale, chartLayout(fixture, w, h))
        expectClearLabels(g.labels, w, h)
      })
    }
  }

  it('stacks three lines within one label height without overlap (S4)', () => {
    const three: VelocityBandScale = {
      ...TIER_B_TWO_GUARDS.scale,
      markers: {
        goal: {
          ...lossLine,
          role: 'goal',
          condition: 'effort',
          velocityMps: 0.4,
          band: 1,
          label: 'RPE 8',
        },
        guards: [
          { ...lossLine, condition: 'effort', velocityMps: 0.39, band: 2, label: 'RPE 9' },
          { ...lossLine, velocityMps: 0.38, label: 'VL 30%' },
        ],
      },
    }
    const g = velocityBandGeometry(three, chartLayout(TIER_B_TWO_GUARDS, 1888, 240))
    expect(g.labels.filter((l) => l.key.startsWith('line-'))).toHaveLength(3)
    expectClearLabels(g.labels, 1888, 240)
  })

  it('keeps a +1 badge over the last of 20 columns clear of the line label (S1 re-verification)', () => {
    const twenty: BandScaleFixture = {
      title: 'twenty',
      velocities: Array.from({ length: 20 }, (_, i) => 0.66 - i * 0.015),
      scale: {
        ...TIER_B_PAST_CUE.scale,
        repBands: Array(20).fill(0),
        markers: {
          goal: {
            ...(TIER_B_PAST_CUE.scale.markers.goal as VelocityBandRepMarker),
            repsLow: 15,
            repsHigh: 19,
          },
          guards: TIER_B_PAST_CUE.scale.markers.guards,
        },
        cue: { atRep: 19, repsPast: 1 },
      },
    }
    const g = velocityBandGeometry(twenty.scale, chartLayout(twenty, 328, 150))
    expect(g.labels.map((l) => l.key)).toContain('past-cue')
    expectClearLabels(g.labels, 328, 150)
  })

  it('names every mark once, zone first', () => {
    const g = velocityBandGeometry(lateChange.scale, chartLayout(lateChange, 1888, 240))
    expect(g.labels.map((l) => l.key)).toEqual(['zone', 'line-guard-0', 'suspension'])
  })

  it('colours a line label like its line', () => {
    const g = geometryOf(TIER_B_TWO_GUARDS)
    const inks = Object.fromEntries(g.labels.map((l) => [l.text, l.ink]))
    expect(inks).toMatchObject({ 'RPE 9': 2, 'VL 30%': 'ink', '8 to 12': 'ink', '+2': 'ink' })
  })
})

describe('hostile input (functional gate S8 to S10, N1 to N3, N8)', () => {
  it('drops a band outside 0 to 3 instead of drawing it (S8)', () => {
    const scale = { ...TIER_B_REP_RANGE_ONE_GUARD.scale, repBands: [7, -1, 0.5, 2] as never }
    expect([0, 1, 2, 3].map((i) => barTone(scale, i).band)).toEqual([null, null, null, 2])
  })

  it('pads no columns for a non-finite bound, rounds a fractional one, and caps the padding (S8, N3)', () => {
    const withHigh = (repsHigh: number): VelocityBandScale => ({
      ...TIER_A_NO_GUARD.scale,
      markers: {
        goal: { ...(TIER_A_NO_GUARD.scale.markers.goal as VelocityBandRepMarker), repsHigh },
        guards: [],
      },
    })
    expect(bandSlotCount(withHigh(Infinity), 5)).toBe(5)
    expect(bandSlotCount(withHigh(NaN), 5)).toBe(5)
    expect(bandSlotCount(withHigh(11.6), 5)).toBe(12)
    expect(bandSlotCount(withHigh(200), 5)).toBe(5 + MAX_EMPTY_PLACES)
  })

  it('skips the zone, not the lines, when a bound is not finite (S8)', () => {
    const scale: VelocityBandScale = {
      ...TIER_B_REP_RANGE_ONE_GUARD.scale,
      markers: {
        goal: { ...(TIER_A_NO_GUARD.scale.markers.goal as VelocityBandRepMarker), repsHigh: NaN },
        guards: TIER_B_REP_RANGE_ONE_GUARD.scale.markers.guards,
      },
    }
    const g = velocityBandGeometry(scale, layoutFor(TIER_B_REP_RANGE_ONE_GUARD))
    expect(g.zone).toBeNull()
    expect(g.lines).toHaveLength(1)
  })

  it('draws no line or edge when the height scale is not finite (S9)', () => {
    const layout = { ...layoutFor(TIER_B_TWO_GUARDS), scaleDenom: NaN }
    const g = velocityBandGeometry(TIER_B_TWO_GUARDS.scale, layout)
    expect(g.lines).toEqual([])
    expect(g.edges).toEqual([])
    expect(g.labels.some((l) => l.key.startsWith('line-'))).toBe(false)
  })

  it('keeps every bar and line neutral when the scale means none (S10)', () => {
    const scale: VelocityBandScale = { ...TIER_B_TWO_GUARDS.scale, meaning: 'none' }
    const g = velocityBandGeometry(scale, layoutFor(TIER_B_TWO_GUARDS))
    expect(g.bars.every((b) => b.band === null)).toBe(true)
    expect(g.lines.every((l) => l.band === null)).toBe(true)
    expect(g.zone).not.toBeNull()
  })

  it('draws no line at a zero or negative velocity (N1)', () => {
    const scale: VelocityBandScale = {
      ...TIER_B_TWO_GUARDS.scale,
      markers: {
        goal: null,
        guards: [
          { ...lossLine, velocityMps: -1 },
          { ...lossLine, velocityMps: 0 },
        ],
      },
    }
    expect(velocityBandGeometry(scale, layoutFor(TIER_B_TWO_GUARDS)).lines).toEqual([])
  })

  it('draws no zone below rep 1 or past the columns the caller drew (N2)', () => {
    const goal = TIER_A_NO_GUARD.scale.markers.goal as VelocityBandRepMarker
    const zero: VelocityBandScale = {
      ...TIER_A_NO_GUARD.scale,
      markers: { goal: { ...goal, repsLow: 0, repsHigh: 0 }, guards: [] },
    }
    expect(velocityBandGeometry(zero, layoutFor(TIER_A_NO_GUARD)).zone).toBeNull()
    const short = { ...layoutFor(TIER_A_NO_GUARD), slotCount: 5 }
    expect(velocityBandGeometry(TIER_A_NO_GUARD.scale, short).zone).toBeNull()
  })

  it('treats a setting change before rep 1 as no change (N8)', () => {
    const scale: VelocityBandScale = { ...TIER_B_SUSPENDED_TAIL.scale, settingChangedAtRep: 0 }
    const g = velocityBandGeometry(scale, layoutFor(TIER_B_SUSPENDED_TAIL))
    expect(g.suspension).toBeNull()
    expect(g.bars[0].band).toBe(0)
  })
})
