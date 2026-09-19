// Font mapping context: presentation-only helpers, no rendering.
import { WORKOUT_TOKENS } from '../theme/workout-tokens'
import { formatTrimmedDecimal } from './number-format'

/**
 * Presentation helpers for workout metrics.
 *
 * The data layer (`@voltras/workout-analytics` view-model derivations) supplies
 * EXACT, unrounded values; these turn them into the rounded / banded / formatted
 * forms a view renders. Keeping display munging here — in the design system, not
 * the analytics layer — is the render half of the model↔render split: one view
 * can round while another (or a hover) shows the exact value from the same real
 * data. Workout components consume these so the rules live in one place.
 */

/** Round an exact RPE onto its conventional 0.5 granularity for display. */
export function roundRpe(rpe: number): number {
  return Math.round(rpe * 2) / 2
}

/** Round-and-format an RPE to its conventional 0.5 step; em-dash when absent. */
export function formatRpe(rpe: number | null | undefined): string {
  if (rpe == null) return '—'
  return roundRpe(rpe).toFixed(1)
}

/**
 * Color band for an RPE on the canonical performance scale. Higher RPE = harder
 * = red (direction inverted vs velocity, which shares the same scale). Bands:
 * `<7` green, `7–8.5` yellow, `8.5–9.5` orange, `≥9.5` red.
 */
export function rpeColor(rpe: number): string {
  if (rpe >= 9.5) return WORKOUT_TOKENS.scale.red
  if (rpe >= 8.5) return WORKOUT_TOKENS.scale.orange
  if (rpe >= 7) return WORKOUT_TOKENS.scale.yellow
  return WORKOUT_TOKENS.scale.green
}

/** Round a weight or e1RM to a whole unit for compact display. */
export function roundWeight(weight: number): number {
  return Math.round(weight)
}

/** Format an exact velocity (m/s) to the 2-dp string shown on the velocity strip. */
export function formatVelocity(velocity: number): string {
  return velocity.toFixed(2)
}

/** Round an exact tempo tuple (seconds) to 1 dp per phase for display. */
export function roundTempo(
  tempo: [number, number, number, number]
): [number, number, number, number] {
  return tempo.map((v) => Math.round(v * 10) / 10) as [number, number, number, number]
}

/** Signed percentage label for a deviation ratio, e.g. `+9%` / `-5%` / `0%`. */
export function formatSignedPct(ratio: number): string {
  const pct = Math.round(ratio * 100)
  return `${pct > 0 ? '+' : ''}${pct}%`
}

/** A bodyweight to one decimal, always shown: `196.8`, `200.0`. */
export function formatBodyweight(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1)
}

/** A weekly rate in percent, signed, to at most two places and at least one: `-0.6`, `+0.25`, `0.0`. */
export function formatSignedRate(pctPerWeek: number): string {
  const rounded = Math.round(pctPerWeek * 100) / 100
  const digits = String(Math.abs(rounded))
  const text = digits.includes('.') ? digits : `${digits}.0`
  if (rounded > 0) return `+${text}`
  return rounded < 0 ? `-${text}` : text
}

/**
 * Rep-range label, e.g. `"8–10"`. `"8"` when the bounds are equal or only one is
 * given; `null` when neither is set. Shared by {@link formatPrescription} and the
 * set strip's per-set prescribed-range label so the two never drift apart.
 */
export function formatRepsRange(repsLow?: number, repsHigh?: number): string | null {
  if (repsLow != null && repsHigh != null) {
    return repsLow === repsHigh ? `${repsLow}` : `${repsLow}–${repsHigh}`
  }
  if (repsLow != null) return `${repsLow}`
  if (repsHigh != null) return `${repsHigh}`
  return null
}

/**
 * Stats-derived expected-range label, e.g. `"~5–15 expected"`. `null` when neither
 * bound is set. **Not the prescription** (see {@link formatRepsRange}) — the `~`
 * prefix and `expected` suffix are load-bearing: they mark this as the lifter's own
 * velocity-loss-threshold history (VW-301), not what the plan called for.
 */
export function formatExpectedRange(low?: number, high?: number): string | null {
  const bounds = formatRepsRange(low, high)
  return bounds == null ? null : `~${bounds} expected`
}

/** Structured prescription for the active exercise (from the plan). */
export interface PrescriptionInput {
  repsLow?: number
  repsHigh?: number
  weightLbs?: number
  rpe?: number
}

/**
 * Human prescription string, e.g. `"8–10 @ 62 lb · RPE 8"`. `null` when there is
 * nothing to show. Presentation-only: the plan supplies the numbers, this shapes
 * the label.
 */
export function formatPrescription(p: PrescriptionInput | null | undefined): string | null {
  if (p == null) return null
  const reps = formatRepsRange(p.repsLow, p.repsHigh)
  const weight = p.weightLbs != null ? `${p.weightLbs} lb` : null
  const head = [reps, weight].filter((s): s is string => s != null).join(' @ ')
  const rpe = p.rpe != null ? `RPE ${p.rpe}` : null
  const full = [head.length > 0 ? head : null, rpe]
    .filter((s): s is string => s != null)
    .join(' · ')
  return full.length > 0 ? full : null
}

/**
 * Compact `M/D` axis label for a chart date, e.g. `"6/6"`. `date` is parsed as
 * `YYYY-MM-DD` first (avoiding the UTC-shift `new Date()` applies to bare date
 * strings); falls back to `new Date(date)` for anything else, and to the raw
 * string when that's unparseable too.
 */
export function formatChartDate(date: string): string {
  const parts = date.split('-')
  if (parts.length === 3) return `${Number(parts[1])}/${Number(parts[2])}`
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? date : `${d.getMonth() + 1}/${d.getDate()}`
}

/** Joined `"N sets · V unit · duration"` summary line for a workout card. */
export function formatWorkoutStats(
  totalSets: number,
  totalVolume: number | undefined,
  unit: 'lbs' | 'kg',
  duration: string | undefined
): string {
  const parts = [`${totalSets} sets`]
  if (totalVolume != null) parts.push(`${totalVolume} ${unit}`)
  if (duration) parts.push(duration)
  return parts.join(' · ')
}

/** The non-load goal metrics; their target is a single value. */
export type GoalValueMetric = 'bodyweight' | 'sessions_28d' | 'e1rm_trend' | 'composite_strength'

/** What stands between a lifter and a goal milestone, in the one unit that leads. */
export type GoalMilestoneGap =
  | { kind: 'load'; amount: number }
  | { kind: 'reps'; amount: number }
  | { kind: 'value'; amount: number }
  | { kind: 'none' }

export function formatMilestoneLoad(load: number): string {
  return formatTrimmedDecimal(load, 1)
}

function plural(n: number, one: string, many: string): string {
  return `${formatMilestoneLoad(n)} ${n === 1 ? one : many}`
}

/** "8 x 105 lb": reps first, as the goal cards print it. */
export function formatMilestoneSet(reps: number, load: number, unit: string): string {
  return `${reps} x ${formatMilestoneLoad(load)} ${unit}`
}

/** "185 lb bodyweight", "12 sessions in 28 days", "e1RM 180 lb", "strength score 72". */
export function formatMilestoneValue(metric: GoalValueMetric, value: number, unit = ''): string {
  const n = formatMilestoneLoad(value)
  switch (metric) {
    case 'bodyweight':
      return `${n} ${unit} bodyweight`.replace(/\s+/g, ' ')
    case 'sessions_28d':
      return `${plural(value, 'session', 'sessions')} in 28 days`
    case 'e1rm_trend':
      return `e1RM ${n} ${unit}`.trim()
    case 'composite_strength':
      return `strength score ${n}`
  }
}

/** The shortfall as a hero: "5 lb", "2 reps", "1 session", "4 pts"; null once closed. */
export function formatMilestoneGapAmount(
  gap: GoalMilestoneGap,
  unit: string,
  metric?: GoalValueMetric
): string | null {
  if (gap.kind === 'none') return null
  if (gap.kind === 'load') return `${formatMilestoneLoad(gap.amount)} ${unit}`
  if (gap.kind === 'reps') return plural(gap.amount, 'rep', 'reps')
  if (metric === 'sessions_28d') return plural(gap.amount, 'session', 'sessions')
  if (metric === 'composite_strength') return plural(gap.amount, 'pt', 'pts')
  return `${formatMilestoneLoad(gap.amount)} ${unit}`.trim()
}
