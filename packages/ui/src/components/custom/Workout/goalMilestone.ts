// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { GoalMilestoneGap, GoalValueMetric } from '../../../utils/workout-format'
import type { GoalDirection } from './GoalTrajectoryChartGeometry'

export type { GoalMilestoneGap, GoalValueMetric }

/** Where the meso target stands. There is no "due" state: the target is judged at the block's end. */
export type GoalMilestoneState = 'upcoming' | 'hit' | 'missed'

/** One past week's verdict against that week's expected band, supplied by the read model. */
export type GoalWeekOutcome = 'ahead' | 'on_track' | 'missed' | 'none'

/** The load goal metrics; their target is a set. */
export type GoalLoadMetric = 'top_load_at_reps' | 'reps_at_load'

export interface GoalMilestoneSet {
  reps: number
  load: number
}

export interface GoalMilestoneValue {
  value: number
}

export interface GoalLoadTarget extends GoalMilestoneSet {
  metric: GoalLoadMetric
  unit: 'lb' | 'kg'
}

export interface GoalValueTarget extends GoalMilestoneValue {
  metric: GoalValueMetric
  unit?: string
}

/** The block's committed value, due in its last week. */
export type GoalMilestoneTarget = GoalLoadTarget | GoalValueTarget

/** A matched reading in the target's own shape: a set for load metrics, a value otherwise. */
export type GoalMilestoneReading = GoalMilestoneSet | GoalMilestoneValue

export function isLoadTarget(target: GoalMilestoneTarget): target is GoalLoadTarget {
  return target.metric === 'top_load_at_reps' || target.metric === 'reps_at_load'
}

function asSet(reading: GoalMilestoneReading): GoalMilestoneSet | null {
  return 'load' in reading ? reading : null
}

function asValue(reading: GoalMilestoneReading): number | null {
  return 'value' in reading ? reading.value : null
}

const LEAD_ORDER = {
  top_load_at_reps: ['load', 'reps'],
  reps_at_load: ['reps', 'load'],
} as const

/** The metric names what leads: load for top_load_at_reps, reps for reps_at_load. */
function setGap(latest: GoalMilestoneSet, target: GoalLoadTarget): GoalMilestoneGap {
  const short = { load: target.load - latest.load, reps: target.reps - latest.reps }
  for (const kind of LEAD_ORDER[target.metric]) {
    if (short[kind] > 0) return { kind, amount: short[kind] }
  }
  return { kind: 'none' }
}

function valueGap(latest: number, target: number, direction: GoalDirection): GoalMilestoneGap {
  const remaining = direction === 'down' ? latest - target : target - latest
  return remaining > 0 ? { kind: 'value', amount: remaining } : { kind: 'none' }
}

/** What is left to close, or null when the reading's shape does not match the target's. */
export function milestoneGap(
  target: GoalMilestoneTarget,
  latest: GoalMilestoneReading,
  direction: GoalDirection = 'up'
): GoalMilestoneGap | null {
  if (isLoadTarget(target)) {
    const set = asSet(latest)
    return set && setGap(set, target)
  }
  const value = asValue(latest)
  return value === null ? null : valueGap(value, target.value, direction)
}

/** How far past the target the reading went, in the unit the metric leads with. */
export function milestoneSurplus(
  target: GoalMilestoneTarget,
  latest: GoalMilestoneReading,
  direction: GoalDirection = 'up'
): GoalMilestoneGap | null {
  if (isLoadTarget(target)) {
    const set = asSet(latest)
    if (!set) return null
    const over = { load: set.load - target.load, reps: set.reps - target.reps }
    for (const kind of LEAD_ORDER[target.metric]) {
      if (over[kind] > 0) return { kind, amount: over[kind] }
    }
    return { kind: 'none' }
  }
  const value = asValue(latest)
  if (value === null) return null
  const over = direction === 'down' ? target.value - value : value - target.value
  return over > 0 ? { kind: 'value', amount: over } : { kind: 'none' }
}

/** Where a reading landed against its target: short of it, exactly on it, or past it. */
export type GoalReach = 'short' | 'met' | 'beyond'

/**
 * Reach against a bare number, in the goal's direction. The one definition of
 * "past the target": the chart derives its beyond-goal tone from this, and
 * {@link milestoneReach} routes its value targets through it.
 */
export function valueReach(
  target: number,
  latest: number,
  direction: GoalDirection = 'up'
): GoalReach {
  const remaining = direction === 'down' ? latest - target : target - latest
  if (remaining > 0) return 'short'
  return remaining === 0 ? 'met' : 'beyond'
}

/**
 * Reach against a milestone target, judged in the unit the metric leads with,
 * or null when the reading's shape does not match the target's.
 */
export function milestoneReach(
  target: GoalMilestoneTarget,
  latest: GoalMilestoneReading,
  direction: GoalDirection = 'up'
): GoalReach | null {
  const gap = milestoneGap(target, latest, direction)
  if (!gap) return null
  if (gap.kind !== 'none') return 'short'
  const surplus = milestoneSurplus(target, latest, direction)
  return surplus && surplus.kind !== 'none' ? 'beyond' : 'met'
}

export function isMilestoneMet(
  target: GoalMilestoneTarget,
  latest: GoalMilestoneReading,
  direction: GoalDirection = 'up'
): boolean {
  return milestoneGap(target, latest, direction)?.kind === 'none'
}

/** An explicit state wins; otherwise a met target is hit, and a finished block without it is missed. */
export function deriveMilestoneState({
  state,
  met,
  currentWeek,
  goalWeek,
}: {
  state?: GoalMilestoneState
  met: boolean
  currentWeek?: number
  goalWeek: number
}): GoalMilestoneState {
  if (state) return state
  if (met) return 'hit'
  return currentWeek !== undefined && currentWeek > goalWeek ? 'missed' : 'upcoming'
}

export type GoalWeekPhase = 'past' | 'current' | 'future'

/** What the read model says about one week: its verdict, and the reading behind it. */
export interface GoalWeekEntry {
  outcome: GoalWeekOutcome
  /** The week's matched reading, in the target's shape; absent when `outcome` is `none`. */
  reading?: GoalMilestoneReading
}

export interface GoalWeekCell {
  week: number
  phase: GoalWeekPhase
  /** Present on past weeks only; a missing entry reads as `none`. */
  outcome?: GoalWeekOutcome
  entry?: GoalWeekEntry
}

function weekPhase(week: number, currentWeek?: number): GoalWeekPhase {
  if (currentWeek === undefined || week > currentWeek) return 'future'
  return week === currentWeek ? 'current' : 'past'
}

/** Every week of the block, 1-based, with where it sits against now and what it came to. */
export function weekStripCells(
  weekCount: number,
  currentWeek?: number,
  weeks: readonly GoalWeekEntry[] = []
): GoalWeekCell[] {
  return Array.from({ length: Math.max(weekCount, 1) }, (_, i) => {
    const week = i + 1
    const phase = weekPhase(week, currentWeek)
    if (phase !== 'past') return { week, phase }
    const entry = weeks[i]
    return { week, phase, outcome: entry?.outcome ?? 'none', entry }
  })
}
