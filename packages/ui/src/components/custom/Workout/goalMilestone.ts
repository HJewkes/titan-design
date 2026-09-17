// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { GoalMilestoneGap } from '../../../utils/workout-format'
import type { GoalLiftMilestone } from './GoalLiftCard'

/** Where a milestone stands relative to the lifter's calendar and their best set. */
export type GoalMilestoneState = 'upcoming' | 'due_this_week' | 'hit' | 'missed'

/** One set: the lifter's best at or toward the milestone, or where the goal started. */
export interface GoalMilestoneSet {
  reps: number
  load: number
}

export type { GoalMilestoneGap }

export const GOAL_MILESTONE_STATE_LABEL: Record<GoalMilestoneState, string> = {
  upcoming: 'Upcoming',
  due_this_week: 'Due this week',
  hit: 'Hit',
  missed: 'Missed',
}

/** Met means the target load at the target reps or better; a heavier single does not count. */
export function isMilestoneMet(current: GoalMilestoneSet, target: GoalMilestoneSet): boolean {
  return current.load >= target.load && current.reps >= target.reps
}

/** Load closes first: reps only count once the bar carries the target load. */
export function milestoneGap(
  current: GoalMilestoneSet,
  target: GoalMilestoneSet
): GoalMilestoneGap {
  if (current.load < target.load) return { kind: 'load', amount: target.load - current.load }
  if (current.reps < target.reps) return { kind: 'reps', amount: target.reps - current.reps }
  return { kind: 'none' }
}

/** Weeks until the milestone is due; negative once it is past, null without a current week. */
export function weeksAway(goalWeek: number, currentWeek?: number): number | null {
  return currentWeek === undefined ? null : goalWeek - currentWeek
}

/** An explicit state wins; otherwise the set decides hit, and the calendar decides the rest. */
export function deriveMilestoneState(
  milestone: GoalLiftMilestone,
  {
    state,
    current,
    currentWeek,
  }: { state?: GoalMilestoneState; current?: GoalMilestoneSet; currentWeek?: number }
): GoalMilestoneState {
  if (state) return state
  if (current && isMilestoneMet(current, milestone)) return 'hit'
  const away = weeksAway(milestone.goalWeek, currentWeek)
  if (away === null || away > 0) return 'upcoming'
  return away === 0 ? 'due_this_week' : 'missed'
}

/** Epley: the one number that lets a rep gain and a load gain count toward the same bar. */
export function estimatedOneRepMax({ reps, load }: GoalMilestoneSet): number {
  return load * (1 + reps / 30)
}

/** An unmet milestone never fills the bar, however far its estimated max has climbed. */
export const UNMET_PROGRESS_CAP = 0.95

/**
 * The share of the start-to-target climb already made, 0..1, or null when
 * either end is unknown. Only a met milestone reads 1.
 */
export function milestoneProgress(
  target: GoalMilestoneSet,
  current?: GoalMilestoneSet,
  start?: GoalMilestoneSet
): number | null {
  if (!current || !start) return null
  if (isMilestoneMet(current, target)) return 1
  const from = estimatedOneRepMax(start)
  const span = estimatedOneRepMax(target) - from
  if (span <= 0) return 0
  const share = (estimatedOneRepMax(current) - from) / span
  return Math.min(Math.max(share, 0), UNMET_PROGRESS_CAP)
}
