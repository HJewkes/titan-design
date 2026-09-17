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

/** Epley: the one number that lets a rep gain and a load gain count toward the same bar. */
export function estimatedOneRepMax({ reps, load }: GoalMilestoneSet): number {
  return load * (1 + reps / 30)
}

/** An unmet target never fills the bar, however far its estimate has climbed. */
export const UNMET_PROGRESS_CAP = 0.95

/** A reading on one "higher is better" axis, or null when its shape does not fit the target. */
function measure(
  target: GoalMilestoneTarget,
  reading: GoalMilestoneReading,
  direction: GoalDirection
): number | null {
  if (isLoadTarget(target)) {
    const set = asSet(reading)
    return set && estimatedOneRepMax(set)
  }
  const value = asValue(reading)
  if (value === null) return null
  return direction === 'down' ? -value : value
}

/**
 * The share of the start-to-target move already made, 0..1, or null when an
 * end is unknown. Only a met target reads 1.
 */
export function milestoneProgress(
  target: GoalMilestoneTarget,
  latest?: GoalMilestoneReading,
  start?: GoalMilestoneReading,
  direction: GoalDirection = 'up'
): number | null {
  if (!latest || !start) return null
  if (isMilestoneMet(target, latest, direction)) return 1
  const from = measure(target, start, direction)
  const now = measure(target, latest, direction)
  const to = measure(target, target, direction)
  if (from === null || now === null || to === null) return null
  if (to - from <= 0) return 0
  return Math.min(Math.max((now - from) / (to - from), 0), UNMET_PROGRESS_CAP)
}

export type GoalWeekPhase = 'past' | 'current' | 'future'

export interface GoalWeekCell {
  week: number
  phase: GoalWeekPhase
  isGoal: boolean
  /** Present on past weeks only; a missing entry reads as `none`. */
  outcome?: GoalWeekOutcome
}

function weekPhase(week: number, currentWeek?: number): GoalWeekPhase {
  if (currentWeek === undefined || week > currentWeek) return 'future'
  return week === currentWeek ? 'current' : 'past'
}

/** Every week of the block, 1-based, with where it sits against now and what it came to. */
export function weekStripCells(
  weekCount: number,
  goalWeek: number,
  currentWeek?: number,
  outcomes: readonly GoalWeekOutcome[] = []
): GoalWeekCell[] {
  return Array.from({ length: Math.max(weekCount, 1) }, (_, i) => {
    const week = i + 1
    const phase = weekPhase(week, currentWeek)
    const outcome = phase === 'past' ? (outcomes[i] ?? 'none') : undefined
    return { week, phase, isGoal: week === goalWeek, outcome }
  })
}
