import { describe, it, expect } from 'vitest'

import {
  deriveMilestoneState,
  isMilestoneMet,
  milestoneGap,
  milestoneProgress,
  UNMET_PROGRESS_CAP,
  weeksAway,
} from './goalMilestone'
import {
  formatMilestoneGap,
  formatMilestoneWhen,
  formatWeeksAway,
} from '../../../utils/workout-format'

const milestone = { reps: 8, load: 105, unit: 'lb' as const, goalWeek: 8 }

describe('milestone state', () => {
  it('is hit once the best set carries the target load for the target reps', () => {
    const state = deriveMilestoneState(milestone, {
      current: { reps: 8, load: 105 },
      currentWeek: 5,
    })

    expect(state).toBe('hit')
  })

  it('is not hit by a heavier set with fewer reps', () => {
    expect(isMilestoneMet({ reps: 6, load: 110 }, milestone)).toBe(false)
  })

  it('is upcoming while the goal week is still ahead', () => {
    expect(deriveMilestoneState(milestone, { currentWeek: 7 })).toBe('upcoming')
  })

  it('is due this week in the goal week itself', () => {
    expect(deriveMilestoneState(milestone, { currentWeek: 8 })).toBe('due_this_week')
  })

  it('is missed once the goal week has passed without the set', () => {
    const state = deriveMilestoneState(milestone, {
      current: { reps: 7, load: 105 },
      currentWeek: 9,
    })

    expect(state).toBe('missed')
  })

  it('is upcoming when the current week is unknown', () => {
    expect(deriveMilestoneState(milestone, {})).toBe('upcoming')
  })

  it('takes an explicit state from the read model over the derived one', () => {
    const state = deriveMilestoneState(milestone, {
      state: 'missed',
      current: { reps: 8, load: 105 },
    })

    expect(state).toBe('missed')
  })
})

describe('distance to the milestone', () => {
  it('counts the load still to add while the bar is light', () => {
    expect(milestoneGap({ reps: 10, load: 100 }, milestone)).toEqual({ kind: 'load', amount: 5 })
  })

  it('counts reps once the load is there', () => {
    expect(milestoneGap({ reps: 6, load: 105 }, milestone)).toEqual({ kind: 'reps', amount: 2 })
  })

  it('has nothing left once the milestone is met', () => {
    expect(milestoneGap({ reps: 8, load: 107.5 }, milestone)).toEqual({ kind: 'none' })
  })

  it('reads a fractional load gap to one decimal', () => {
    const gap = milestoneGap({ reps: 8, load: 102.5 }, milestone)

    expect(formatMilestoneGap(gap, 'lb')).toBe('2.5 lb to go')
  })

  it('reads a single rep in the singular', () => {
    expect(formatMilestoneGap({ kind: 'reps', amount: 1 }, 'lb')).toBe('1 rep to go')
  })

  it('reads nothing once the gap is closed', () => {
    expect(formatMilestoneGap({ kind: 'none' }, 'lb')).toBeNull()
  })
})

describe('progress toward the milestone', () => {
  it('is the share of the estimated-max climb from the start', () => {
    const start = { reps: 8, load: 95 }
    const current = { reps: 8, load: 100 }

    expect(milestoneProgress(milestone, current, start)).toBeCloseTo(0.5)
  })

  it('credits a rep gain at the same load', () => {
    const start = { reps: 8, load: 95 }

    const before = milestoneProgress(milestone, { reps: 8, load: 100 }, start) ?? 0
    const after = milestoneProgress(milestone, { reps: 10, load: 100 }, start) ?? 0

    expect(after).toBeGreaterThan(before)
  })

  it('never falls below zero after a regression', () => {
    expect(milestoneProgress(milestone, { reps: 5, load: 80 }, { reps: 8, load: 95 })).toBe(0)
  })

  it('stops short of full for a light high-rep set that out-estimates the target', () => {
    const progress = milestoneProgress(milestone, { reps: 20, load: 100 }, { reps: 8, load: 95 })

    expect(progress).toBe(UNMET_PROGRESS_CAP)
  })

  it('is full once the milestone is met', () => {
    expect(milestoneProgress(milestone, { reps: 8, load: 105 }, { reps: 8, load: 95 })).toBe(1)
  })

  it('is unknown without a starting set', () => {
    expect(milestoneProgress(milestone, { reps: 8, load: 100 })).toBeNull()
  })
})

describe('when the milestone is due', () => {
  it('counts weeks ahead', () => {
    expect(formatMilestoneWhen(8, 5)).toBe('Week 8 · in 3 weeks')
  })

  it('says this week in the goal week', () => {
    expect(formatMilestoneWhen(8, 8)).toBe('Week 8 · this week')
  })

  it('counts weeks since a passed goal week', () => {
    expect(formatWeeksAway(weeksAway(8, 9))).toBe('1 week ago')
  })

  it('names only the week when the current week is unknown', () => {
    expect(formatMilestoneWhen(8)).toBe('Week 8')
  })
})
