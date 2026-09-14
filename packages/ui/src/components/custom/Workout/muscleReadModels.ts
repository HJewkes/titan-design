/**
 * Per-muscle read-model shapes, mirrored from voltras-mcp so the detail panel
 * can be typed against the payload it will actually be handed.
 *
 * MIRRORED, NOT IMPORTED. titan does not depend on voltras-mcp, so these are
 * hand-copied from `src/dashboard/read-models/muscle-strength.ts` (plan row B3,
 * VW-330) and `muscle-plan.ts` (B4, VW-329/VW-331) at voltras-mcp `395bafd`,
 * plus `src/tools/e1rm-band.ts` for the band those rows carry. Optionality is
 * copied EXACTLY: a field the server always emits is required here, and a
 * nullable field stays `| null` rather than becoming optional — the two read
 * very differently at a call site and the drift is silent.
 *
 * Where titan needs something the server does not emit, the extra field lives
 * on a separate interface that extends the mirror, never inside it.
 */
import type { StrengthTrendDataPoint } from './StrengthTrendChart'

/** Which estimator produced an e1RM. Mirrors `E1RMMethod`. */
export type E1RMMethod = 'profile' | 'reps' | 'hybrid'

/**
 * What a reader has to know before using the e1RM the band is attached to.
 * Mirrors `E1RMBand`. Every numeric field is null when no source states that
 * figure for the method that produced the estimate — a rep-formula (Epley)
 * estimate never touches a velocity, so the pooled load-velocity error figures
 * do not describe it and it arrives with nulls.
 */
export interface E1RMBand {
  /** Always `'trend'`: an e1RM is evidence across sessions, never within one. */
  fitFor: 'trend'
  method: E1RMMethod
  seePct: number | null
  seePctCi: readonly [number, number] | null
  /** `seePct` of this estimate, in lb. */
  seeLbs: number | null
  biasPct: number | null
  /** `biasPct` of this estimate, in lb. Reported, never subtracted. */
  biasLbs: number | null
  /** The estimate minus/plus `seeLbs`. */
  lowLbs: number | null
  highLbs: number | null
  citation: string
  note: string
}

/** Which limb a strength row covers. `null` means the sets recorded no side. */
export type MuscleStrengthSide = 'left' | 'right' | null

/** The best e1RM in the window, with the band every e1RM travels with. */
export interface MuscleStrengthBestE1rm {
  value: number
  band: E1RMBand
  method: E1RMMethod
  /** 0-1 score for the estimate; falls with rep count. */
  confidence: number
}

/** One (exercise, side) strength row. Mirrors `MuscleStrengthExerciseRow`. */
export interface MuscleStrengthExerciseRow {
  exerciseId: string
  name: string
  side: MuscleStrengthSide
  bestE1rm: MuscleStrengthBestE1rm | null
  /** Fitted change per week as a percentage of the fit's own day-0 value. */
  slopePctPerWeek: number | null
  rSquared: number | null
  isPR: boolean
  priorBest: number | null
  plateau: 'plateau' | 'tolerated' | 'none' | null
}

/** Agreement of SIGNS between exercises sharing a primary muscle. */
export type MuscleStrengthAgreement = 'stronger' | 'weaker' | 'mixed' | 'insufficient'

/**
 * A B3 row plus the weekly series titan draws its mini chart from. B3 emits the
 * fitted slope, not the points behind it, so `history` is the caller's own join.
 */
export interface StrengthExerciseRow extends MuscleStrengthExerciseRow {
  /** Weekly e1RM points, chronological. The mini chart is omitted without them. */
  history?: StrengthTrendDataPoint[]
}

/**
 * One muscle's strength section. Mirrors `MuscleStrengthMuscle` minus `muscle`,
 * which the panel already carries as `muscleGroup`.
 */
export interface MuscleStrengthSection {
  exercises: StrengthExerciseRow[]
  agreement: MuscleStrengthAgreement
  /** True while strength gains are not yet readable as muscle gains. */
  earlyPhase: boolean
}

/** One planned exercise for a muscle. Mirrors `MusclePlanRemainingExercise`. */
export interface MusclePlanRemainingExercise {
  workoutName: string
  exerciseId: string
  exerciseName: string
  sets: number
}

/**
 * A planned exercise plus whether its workout has already been trained. B4's
 * `plannedRemaining` is exactly the `done: false` subset of this list.
 */
export interface MusclePlanExerciseRow extends MusclePlanRemainingExercise {
  done: boolean
}

/**
 * One muscle's weekly plan-vs-done state. Mirrors `MusclePlanMuscleView` minus
 * `muscle`, with `plannedRemaining` widened to `exercises` so the panel can
 * render the trained rows beside the remaining ones.
 */
export interface MusclePlanSection {
  plannedSetsThisWeek: number
  doneSetsThisWeek: number
  exercises: MusclePlanExerciseRow[]
}

/** Labels for {@link MuscleStrengthAgreement}, in the panel's own wording. */
export const AGREEMENT_LABELS: Record<MuscleStrengthAgreement, string> = {
  stronger: 'Exercises agree: stronger',
  weaker: 'Exercises agree: weaker',
  mixed: 'Exercises disagree',
  insufficient: 'Not enough exercises to call it',
}

/** One decimal, signed — the precision a percent-per-week figure carries. */
function signedPct(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return `${rounded > 0 ? '+' : ''}${rounded}%/wk`
}

/** The slope caption for a strength row, or the reason there is none. */
export function slopeLabel(row: MuscleStrengthExerciseRow): string {
  if (row.slopePctPerWeek === null) return 'trend pending'
  if (row.plateau === 'plateau') return `${signedPct(row.slopePctPerWeek)} · plateau`
  return signedPct(row.slopePctPerWeek)
}

/**
 * The band caption for an e1RM. `fitFor` is the load-bearing part, not the
 * numbers: a band with null figures says so rather than borrowing a
 * load-velocity error figure that was never measured on a rep formula.
 */
export function bandLabel(best: MuscleStrengthBestE1rm | null): string {
  if (best === null) return 'no e1RM in this window'
  const { band } = best
  if (band.seeLbs === null || band.seePct === null) {
    return `${band.fitFor} only · no stated band for a ${band.method} estimate`
  }
  return `${band.fitFor} only · ±${band.seeLbs} lb (SEE ${band.seePct}%)`
}

/** Row title: the exercise, and the limb when the sets recorded one. */
export function strengthRowTitle(row: MuscleStrengthExerciseRow): string {
  return row.side === null ? row.name : `${row.name} · ${row.side}`
}

/** The rows the PR section shows: every strength row flagged `isPR`. */
export function prRows(exercises: readonly StrengthExerciseRow[]): StrengthExerciseRow[] {
  return exercises.filter((row) => row.isPR)
}
