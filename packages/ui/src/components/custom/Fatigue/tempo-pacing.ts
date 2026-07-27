// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * Tempo PACING — how far through its prescribed duration a phase has run, and the
 * semantic tone that says whether the lifter is ahead, on pace, or over.
 *
 * The rule this encodes (borrowed from `TempoDisplay`, which established it): the phase
 * HUE carries phase identity and is deliberately non-semantic, so the pacing tone is free
 * to use success/warning/error without the two colliding. Anything that paints a phase
 * should take its identity colour from `PHASE_AXIS_COLOR` and its pacing colour from here.
 *
 * ⚠️ `TempoDisplay` currently carries its own private copy of this logic
 * (`getTempoFillPct` / `activeNumberTone`). The two agree today and this module is the
 * canonical one; migrating TempoDisplay onto it is deliberately left out of the change
 * that introduced this file, so its rendering is untouched.
 */
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { PACING_TONE } from './fatigue-tokens'
import type { SamplePhase } from './fatigue-model'

const t = getSemanticColors('dark')

/** ± this window (ms) around the target still counts as on pace. Matches TempoDisplay. */
export const ON_TARGET_MS = 100

/** The canonical tempo tuple order: `[ecc, pauseBottom, con, pauseTop]`, seconds. */
export type TempoTuple = [number, number, number, number]

/**
 * How far a phase has run toward its prescribed duration, 0..1, CAPPED at 1.
 *
 * The cap is what makes an over-long phase read correctly: the fill stops at full and the
 * TONE takes over to say "you are past target". Without a target there is nothing to pace
 * against, so the phase reads complete rather than perpetually empty.
 */
export function phaseFillFraction(elapsedMs: number, targetMs: number | null): number {
  if (targetMs == null || targetMs <= 0) return 1
  return Math.min(1, Math.max(0, elapsedMs / targetMs))
}

/**
 * Pacing tone for a phase's LABEL: still short of target → ahead; within ±100 ms → on pace;
 * past target → over. Keyed on time REMAINING, so it reads the same whether the phase is in
 * flight or finished.
 *
 * Takes {@link PACING_TONE} rather than the `status-*` semantic tokens — the label sits on a
 * saturated phase fill, where `status-error` measures 1.88:1. See the token's note.
 */
export function pacingTone(elapsedMs: number, targetMs: number | null): string {
  if (targetMs == null || targetMs <= 0) return t['text-primary']
  const remainingMs = targetMs - elapsedMs
  if (remainingMs > ON_TARGET_MS) return PACING_TONE.ahead
  if (remainingMs >= -ON_TARGET_MS) return PACING_TONE.onPace
  return PACING_TONE.over
}

/**
 * Target duration (ms) for each phase run of a rep, in stream order.
 *
 * A `hold` maps to `pauseBottom` or `pauseTop` by POSITION, not by name: the tuple
 * distinguishes the two but the sample phase does not, so the first hold of a rep is the
 * bottom and a hold after the concentric is the top. Phases with no prescribed duration
 * (`idle` — undirected dead time) get `null` and never pace.
 */
export function phaseTargetsMs(
  phases: readonly SamplePhase[],
  tempo: TempoTuple | null
): Array<number | null> {
  if (tempo == null) return phases.map(() => null)
  const [eccS, pauseBottomS, conS, pauseTopS] = tempo
  let seenConcentric = false
  return phases.map((phase) => {
    switch (phase) {
      case 'eccentric':
        return eccS * 1000
      case 'concentric':
        seenConcentric = true
        return conS * 1000
      case 'hold':
        return (seenConcentric ? pauseTopS : pauseBottomS) * 1000
      default:
        return null
    }
  })
}
