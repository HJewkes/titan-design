import { describe, it, expect } from 'vitest'

import {
  deriveMilestoneState,
  isMilestoneMet,
  milestoneGap,
  weekStripCells,
  type GoalLoadTarget,
  type GoalValueTarget,
} from './goalMilestone'
import {
  formatMilestoneGapAmount,
  formatMilestoneSet,
  formatMilestoneValue,
} from '../../../utils/workout-format'

const topSet: GoalLoadTarget = { metric: 'top_load_at_reps', reps: 8, load: 105, unit: 'lb' }
const repsGoal: GoalLoadTarget = { metric: 'reps_at_load', reps: 12, load: 185, unit: 'lb' }
const cut: GoalValueTarget = { metric: 'bodyweight', value: 189, unit: 'lb' }

describe('the gap to the meso target', () => {
  it('counts the load still to add', () => {
    expect(milestoneGap(topSet, { reps: 10, load: 100 })).toEqual({ kind: 'load', amount: 5 })
  })

  it('counts reps once the load is there', () => {
    expect(milestoneGap(topSet, { reps: 6, load: 105 })).toEqual({ kind: 'reps', amount: 2 })
  })

  it('leads with load for a top-load goal when both are short', () => {
    expect(milestoneGap(topSet, { reps: 6, load: 100 })).toEqual({ kind: 'load', amount: 5 })
  })

  it('leads with reps for a reps-at-load goal when both are short', () => {
    expect(milestoneGap(repsGoal, { reps: 10, load: 180 })).toEqual({ kind: 'reps', amount: 2 })
  })

  it('falls to load for a reps-at-load goal once the reps are there', () => {
    expect(milestoneGap(repsGoal, { reps: 12, load: 180 })).toEqual({ kind: 'load', amount: 5 })
  })

  it('has nothing left once the target is met', () => {
    expect(milestoneGap(topSet, { reps: 8, load: 107.5 })).toEqual({ kind: 'none' })
  })

  it('counts a loss goal down from above', () => {
    const gap = milestoneGap(cut, { value: 192.4 }, 'down')

    expect(gap?.kind).toBe('value')
    expect(formatMilestoneGapAmount(gap!, 'lb', 'bodyweight')).toBe('3.4 lb')
  })

  it('has nothing left once a loss goal is below its target', () => {
    expect(milestoneGap(cut, { value: 188.5 }, 'down')).toEqual({ kind: 'none' })
  })

  it('cannot measure a reading whose shape does not match the target', () => {
    expect(milestoneGap(topSet, { value: 100 })).toBeNull()
  })

  it('does not count a heavier set with fewer reps as met', () => {
    expect(isMilestoneMet(topSet, { reps: 6, load: 110 })).toBe(false)
  })
})

describe('meso target state', () => {
  it('takes an explicit state from the read model over the derived one', () => {
    expect(deriveMilestoneState({ state: 'missed', met: true, goalWeek: 6 })).toBe('missed')
  })

  it('is hit once the target is met, whatever the week', () => {
    expect(deriveMilestoneState({ met: true, currentWeek: 3, goalWeek: 6 })).toBe('hit')
  })

  it('stays open through the goal week itself', () => {
    expect(deriveMilestoneState({ met: false, currentWeek: 6, goalWeek: 6 })).toBe('upcoming')
  })

  it('is missed once the block has ended without it', () => {
    expect(deriveMilestoneState({ met: false, currentWeek: 7, goalWeek: 6 })).toBe('missed')
  })

  it('is open when the current week is unknown', () => {
    expect(deriveMilestoneState({ met: false, goalWeek: 6 })).toBe('upcoming')
  })
})

describe('week strip cells', () => {
  const weeks = [
    { outcome: 'on_track' as const, reading: { reps: 8, load: 95 } },
    { outcome: 'ahead' as const, reading: { reps: 8, load: 100 } },
    { outcome: 'missed' as const },
  ]

  it('places past, current and future weeks around now', () => {
    const phases = weekStripCells(6, 4, weeks).map((c) => c.phase)

    expect(phases).toEqual(['past', 'past', 'past', 'current', 'future', 'future'])
  })

  it('gives each past week its verdict and reading', () => {
    const cells = weekStripCells(6, 4, weeks)

    expect(cells[1].outcome).toBe('ahead')
    expect(cells[1].entry?.reading).toEqual({ reps: 8, load: 100 })
  })

  it('reads a past week with no entry as no data', () => {
    const cells = weekStripCells(6, 5, weeks)

    expect(cells[3].outcome).toBe('none')
    expect(cells[3].entry).toBeUndefined()
  })

  it('leaves the current and future weeks without a verdict', () => {
    const cells = weekStripCells(6, 4, weeks)

    expect(cells[3].outcome).toBeUndefined()
    expect(cells[5].outcome).toBeUndefined()
  })

  it('treats every week as ahead of us when now is unknown', () => {
    expect(weekStripCells(4).every((c) => c.phase === 'future')).toBe(true)
  })

  it('treats every week as past once the block has ended', () => {
    expect(weekStripCells(4, 5).every((c) => c.phase === 'past')).toBe(true)
  })
})

describe('meso target copy', () => {
  it('prints a set reps first', () => {
    expect(formatMilestoneSet(8, 102.5, 'lb')).toBe('8 x 102.5 lb')
  })

  it('names each value metric in its own words', () => {
    expect(formatMilestoneValue('bodyweight', 189, 'lb')).toBe('189 lb bodyweight')
    expect(formatMilestoneValue('sessions_28d', 12)).toBe('12 sessions in 28 days')
    expect(formatMilestoneValue('e1rm_trend', 180, 'lb')).toBe('e1RM 180 lb')
    expect(formatMilestoneValue('composite_strength', 72)).toBe('strength score 72')
  })

  it('reads a single rep and a single session in the singular', () => {
    expect(formatMilestoneGapAmount({ kind: 'reps', amount: 1 }, 'lb')).toBe('1 rep')
    expect(formatMilestoneGapAmount({ kind: 'value', amount: 1 }, '', 'sessions_28d')).toBe(
      '1 session'
    )
  })

  it('reads nothing once the gap is closed', () => {
    expect(formatMilestoneGapAmount({ kind: 'none' }, 'lb')).toBeNull()
  })
})
