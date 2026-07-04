// Font mapping context: presentation-only helpers, no rendering.
import { WORKOUT_TOKENS } from '../theme/workout-tokens'

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
  let reps: string | null = null
  if (p.repsLow != null && p.repsHigh != null) {
    reps = p.repsLow === p.repsHigh ? `${p.repsLow}` : `${p.repsLow}–${p.repsHigh}`
  } else if (p.repsLow != null) {
    reps = `${p.repsLow}`
  }
  const weight = p.weightLbs != null ? `${p.weightLbs} lb` : null
  const head = [reps, weight].filter((s): s is string => s != null).join(' @ ')
  const rpe = p.rpe != null ? `RPE ${p.rpe}` : null
  const full = [head.length > 0 ? head : null, rpe]
    .filter((s): s is string => s != null)
    .join(' · ')
  return full.length > 0 ? full : null
}
