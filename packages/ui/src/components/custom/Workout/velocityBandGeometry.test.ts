import { describe, expect, it } from 'vitest'
import {
  LINE_LABEL_CLEARANCE,
  bandSlotCount,
  bandSlots,
  lineBand,
  velocityBandGeometry,
  type BandBarLayout,
} from './velocityBandGeometry'
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

  it('carries the tier a fallback label verbatim', () => {
    expect(geometryOf(TIER_A_TARGET_RPE_FALLBACK).zone!.label).toBe(
      'RPE 8 · by reps until calibrated'
    )
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

  it('moves the lower of two crowded labels under its line', () => {
    const near = { ...lossLine, velocityMps: 0.36 + (LINE_LABEL_CLEARANCE - 2) / 200 }
    const scale: VelocityBandScale = {
      ...TIER_B_TWO_GUARDS.scale,
      markers: { goal: null, guards: [TIER_B_REP_RANGE_ONE_GUARD.scale.markers.guards[0], near] },
    }
    const lines = velocityBandGeometry(scale, layoutFor(TIER_B_TWO_GUARDS)).lines
    expect(lines.map((l) => l.labelSide)).toEqual(['above', 'below'])
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
