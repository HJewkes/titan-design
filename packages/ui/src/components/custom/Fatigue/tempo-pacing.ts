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
 * `TempoDisplay` consumes this module for its fill percent, number tone and readout text, so
 * there is one timing model (VW-678).
 */
import { formatTenths } from '../../../utils/number-format'
import { PACING_TONE } from './fatigue-tokens'
import type { SamplePhase, PhaseSegment, TempoTuple } from './fatigue-model'

/** ± this window (ms) around the target still counts as on pace. Matches TempoDisplay. */
export const ON_TARGET_MS = 100

export type { TempoTuple }

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

/** Where a phase stands against its target: short of it, within the window, or past it. */
export type PacingStatus = 'ahead' | 'onPace' | 'over'

/**
 * Pacing status keyed on time REMAINING, so it reads the same whether the phase is in flight
 * or finished. `null` when there is no target to pace against.
 */
export function pacingStatus(elapsedMs: number, targetMs: number | null): PacingStatus | null {
  if (targetMs == null || targetMs <= 0) return null
  const remainingMs = targetMs - elapsedMs
  if (remainingMs > ON_TARGET_MS) return 'ahead'
  if (remainingMs >= -ON_TARGET_MS) return 'onPace'
  return 'over'
}

/**
 * Pacing tone for a phase's LABEL: still short of target → ahead; within ±100 ms → on pace;
 * past target → over.
 *
 * Takes {@link PACING_TONE} rather than the `status-*` semantic tokens — the label sits on a
 * saturated phase fill, where `status-error` measures 2.18:1 on the concentric fill, its
 * worst case. See the token's note.
 *
 * `null` when there is no target: pacing has no opinion, so the caller keeps its own label
 * colour. That also keeps this module theme-free — it used to reach for a frozen
 * `text-primary` here, which is the VW-316 pattern.
 */
export function pacingTone(elapsedMs: number, targetMs: number | null): string | null {
  const status = pacingStatus(elapsedMs, targetMs)
  return status == null ? null : PACING_TONE[status]
}

/** The colours a caller supplies to tone a number: one per pacing status, plus the no-target fallback. */
export interface PacingNumberPalette extends Record<PacingStatus, string> {
  noTarget: string
}

/**
 * Pacing tone for a phase's NUMBER, from the caller's own palette. TempoDisplay paints the
 * number on its chip surface (not on a saturated fill), so it passes theme-aware `status-*`
 * colours instead of {@link PACING_TONE}.
 */
export function pacingNumberTone(
  elapsedMs: number,
  targetMs: number | null,
  palette: PacingNumberPalette
): string {
  const status = pacingStatus(elapsedMs, targetMs)
  return status == null ? palette.noTarget : palette[status]
}

/** Percent (0–100) of the target a phase has run, capped at 100. No target reads full. */
export function phaseFillPercent(elapsedMs: number, targetMs: number | null): number {
  return phaseFillFraction(elapsedMs, targetMs) * 100
}

/** Live readout style: `countdown` remaining to 0.0 (then −), or `countup` elapsed to target. */
export type TempoLiveReadout = 'countdown' | 'countup'

/** The live number for a phase, to 0.1 s. */
export function liveReadoutText(
  elapsedMs: number,
  targetMs: number,
  readout: TempoLiveReadout
): string {
  const seconds = readout === 'countup' ? elapsedMs / 1000 : (targetMs - elapsedMs) / 1000
  return formatTenths(seconds)
}

/**
 * The rep the prescription DESCRIBES, as phase runs — ecc, bottom hold, con, top hold, laid
 * end to end at their target durations from t=0.
 *
 * This is the only place a band's geometry may come from the prescription rather than from
 * actual samples, and it exists for exactly one case: nothing has been performed yet, so
 * there is no actual time to lay out. Zero-length phases (a tempo with no holds) are
 * dropped rather than drawn as slivers.
 */
export function prescribedSegments(tempo: TempoTuple | null): PhaseSegment[] {
  if (tempo == null) return []
  const [ecc, pauseBottom, con, pauseTop] = tempo
  const order: Array<[SamplePhase, number]> = [
    ['eccentric', ecc],
    ['hold', pauseBottom],
    ['concentric', con],
    ['hold', pauseTop],
  ]
  const out: PhaseSegment[] = []
  let t = 0
  for (const [phase, seconds] of order) {
    const ms = seconds * 1000
    if (ms > 0) out.push({ phase, startMs: t, endMs: t + ms })
    t += ms
  }
  return out
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
