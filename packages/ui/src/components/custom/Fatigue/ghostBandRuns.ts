import { phaseFillFraction, pacingTone, phaseTargetsMs, type TempoTuple } from './tempo-pacing'
import type { PhaseSegment } from './fatigue-model'

/**
 * Phase → the word rendered inside its run.
 *
 * Only the two MOVEMENT phases are named. `idle` never was — dead time has no name — and
 * `hold` is deliberately unlabelled too: holds are the narrowest runs on the band, so the
 * word was dropping out at exactly the sizes it mattered, and the runs it did fit were
 * spending their whole width on it. A hold is legible without the word, from its tone,
 * its position between the movement phases, and the fact that it fills.
 */
export const PHASE_LABEL: Partial<Record<PhaseSegment['phase'], string>> = {
  eccentric: 'ECC',
  concentric: 'CON',
}

/** Label glyph advance at fontSize 8 + letterSpacing 1, plus a little side padding. */
const LABEL_CH_PX = 7
const LABEL_PAD_PX = 6

/**
 * Does `label` fit inside a run `segW` px wide? Sized per WORD, not a flat floor — a flat
 * 20 px clipped 'HOLD' to 'HOL' on exactly the short top-hold runs the label exists for.
 */
export function labelFits(label: string, segW: number): boolean {
  return segW >= label.length * LABEL_CH_PX + LABEL_PAD_PX
}

export interface GhostBandRun {
  phase: PhaseSegment['phase']
  left: number
  width: number
  fillWidth: number
  labelTone: string
}

export interface BandExtent {
  drawn: PhaseSegment[]
  bandLeft: number
  bandRight: number
  bandW: number
}

/** The drawn runs and the band's horizontal extent, or `null` when there is nothing to paint. */
export function bandExtent(segments: PhaseSegment[], x: (ms: number) => number): BandExtent | null {
  const drawn = segments.filter((seg) => x(seg.endMs) - x(seg.startMs) > 0)
  if (drawn.length === 0) return null

  const bandLeft = x(drawn[0].startMs)
  const bandRight = x(drawn[drawn.length - 1].endMs)
  const bandW = bandRight - bandLeft
  if (bandW <= 0) return null
  return { drawn, bandLeft, bandRight, bandW }
}

export interface BandRunsInput {
  extent: BandExtent
  x: (ms: number) => number
  targetTempoSeconds: TempoTuple | null
  prescribed: boolean
  plainLabelColor: string
}

export function bandRuns({
  extent: { drawn, bandRight },
  x,
  targetTempoSeconds,
  prescribed,
  plainLabelColor,
}: BandRunsInput): GhostBandRun[] {
  const pacing = targetTempoSeconds != null && !prescribed
  // Each run's elapsed time IS its own duration — the in-flight run's `endMs` is already
  // "now" — so pacing needs no clock of its own.
  const targetsMs = phaseTargetsMs(
    drawn.map((seg) => seg.phase),
    targetTempoSeconds
  )

  // Butt each run against the NEXT run's start (not its own end) so rounding between the
  // two can never open a seam; the last run runs to the band edge.
  return drawn.map((seg, i) => {
    const left = x(seg.startMs)
    const right = i === drawn.length - 1 ? bandRight : x(drawn[i + 1].startMs)
    const width = Math.max(0, right - left)
    const targetMs = targetsMs[i]
    const elapsedMs = seg.endMs - seg.startMs
    return {
      phase: seg.phase,
      left,
      width,
      // Prescribed → nothing performed, so nothing filled. No target at all → the run reads
      // complete rather than perpetually empty.
      fillWidth: prescribed ? 0 : pacing ? width * phaseFillFraction(elapsedMs, targetMs) : width,
      labelTone: (pacing ? pacingTone(elapsedMs, targetMs) : null) ?? plainLabelColor,
    }
  })
}
