// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * GhostBand — the wide phase-coloured AXIS BAND that carries movement phase for the
 * ghost family (eccentric magenta / concentric cyan / hold and idle grey), with the
 * ECC / HOLD / CON labels rendered INSIDE it. Extracted from GhostSpark so the single
 * sparkline and a future top/bottom dual compose the SAME band instead of re-rolling it.
 *
 * It is a pure SVG group: the caller owns the x-scale (`x`) and the band's vertical
 * placement (`top`), so the same band serves a bottom-pinned single or a centred dual.
 *
 * ## Pacing
 *
 * Given a target tempo, each run paints a MUTED base with a brighter fill growing
 * left-to-right across `elapsed / target` of its own width (capped at full), and its label
 * takes the pacing tone — ahead / on pace / over. The band's GEOMETRY is untouched by this:
 * runs keep their actual-time positions and widths so the internal boundaries still land
 * under the sparkline's phase transitions. Pacing is a fill INSIDE the existing bars, never
 * a re-layout of them.
 *
 * The two encodings read together: a slow phase is a WIDE run filled to the brim with an
 * error-toned label; a fast phase is a NARROW run only partly filled, warning-toned.
 *
 * Every run is recessed into a WELL, so the part not yet earned reads as empty channel
 * rather than as a darker shade of the phase. The well needs no flag: where nothing is
 * prescribed the fill covers the whole run and the recess is hidden behind it.
 */
import { useId } from 'react'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { FONT_UI, PHASE_AXIS_COLOR, PHASE_AXIS_BASE_COLOR } from './fatigue-tokens'
import { phaseFillFraction, pacingTone, phaseTargetsMs, type TempoTuple } from './tempo-pacing'
import type { PhaseSegment } from './fatigue-model'

const t = getSemanticColors('dark')

/** Band height in px. */
export const BAND_H = 16
/** Gap between the band's near edge and a bloom's baseline. */
export const BAND_GAP = 4

/** Phase → the word rendered inside its run. `idle` stays unnamed: dead time has no name. */
const PHASE_LABEL: Partial<Record<PhaseSegment['phase'], string>> = {
  eccentric: 'ECC',
  concentric: 'CON',
  hold: 'HOLD',
}

/** Label glyph advance at fontSize 8 + letterSpacing 1, plus a little side padding. */
const LABEL_CH_PX = 7
const LABEL_PAD_PX = 6

/** The well shades toward black so it recesses every phase tone identically. */
const WELL_SHADE = primitiveColors.black
/** The faint light line on the well's floor — the far lip catching light. */
const WELL_FLOOR_LIGHT = primitiveColors.white

/**
 * Does `label` fit inside a run `segW` px wide? Sized per WORD, not a flat floor — a flat
 * 20 px clipped 'HOLD' to 'HOL' on exactly the short top-hold runs the label exists for.
 */
function labelFits(label: string, segW: number): boolean {
  return segW >= label.length * LABEL_CH_PX + LABEL_PAD_PX
}

export interface GhostBandProps {
  /** The current rep's phase runs, in stream order. */
  segments: PhaseSegment[]
  /** Time (ms) → px mapper, owned by the caller. */
  x: (ms: number) => number
  /** The band's top edge, px. */
  top: number
  /** Band height, px. Default {@link BAND_H}. */
  height?: number
  /** Reveal the ECC / HOLD / CON labels inside the band. */
  showLabels?: boolean
  /**
   * Label colour when there is no pacing tone to apply. Default the primary text token.
   * Ignored for a run that paces — that label takes {@link pacingTone}.
   */
  labelColor?: string
  /**
   * Prescribed tempo `[ecc, pauseBottom, con, pauseTop]` in seconds. Supplying it turns on
   * PACING: runs paint muted-base + fill, and labels take the ahead/on-pace/over tone.
   *
   * Omit it and the band paints flat at full tone with plain labels — the pre-pacing look,
   * which is also the honest one when nothing was prescribed to pace against.
   */
  targetTempoSeconds?: TempoTuple | null
}

/**
 * The phase-coloured axis band — ONE contiguous strip whose internal boundaries land
 * exactly on the sparkline's phase transitions.
 *
 * Contiguity is structural, not incidental: the band is a single rounded silhouette
 * (clipped), floored with the idle tone across its whole time extent, and each phase run
 * paints SQUARE inside that clip, extended to the next run's start. No per-segment inset
 * and no per-segment rounding — those read as gaps between sections.
 */
export function GhostBand({
  segments,
  x,
  top,
  height = BAND_H,
  showLabels = false,
  labelColor = t['text-primary'],
  targetTempoSeconds = null,
}: GhostBandProps) {
  const rawId = useId()
  const safeId = rawId.replace(/[^a-zA-Z0-9]/g, '')
  const clipId = `ghost-band-${safeId}`
  const wellId = `ghost-band-well-${safeId}`

  const drawn = segments.filter((seg) => x(seg.endMs) - x(seg.startMs) > 0)
  if (drawn.length === 0) return null

  const bandLeft = x(drawn[0].startMs)
  const bandRight = x(drawn[drawn.length - 1].endMs)
  const bandW = bandRight - bandLeft
  if (bandW <= 0) return null

  const pacing = targetTempoSeconds != null
  // Each run's elapsed time IS its own duration — the in-flight run's `endMs` is already
  // "now" — so pacing needs no clock of its own.
  const targetsMs = phaseTargetsMs(
    drawn.map((seg) => seg.phase),
    targetTempoSeconds
  )

  // Butt each run against the NEXT run's start (not its own end) so rounding between the
  // two can never open a seam; the last run runs to the band edge.
  const runs = drawn.map((seg, i) => {
    const left = x(seg.startMs)
    const right = i === drawn.length - 1 ? bandRight : x(drawn[i + 1].startMs)
    const width = Math.max(0, right - left)
    const targetMs = targetsMs[i]
    const elapsedMs = seg.endMs - seg.startMs
    return {
      phase: seg.phase,
      left,
      width,
      // No target (or no prescription at all) → the run reads complete rather than empty.
      fillWidth: pacing ? width * phaseFillFraction(elapsedMs, targetMs) : width,
      labelTone: pacing ? pacingTone(elapsedMs, targetMs) : labelColor,
    }
  })

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={bandLeft} y={top} width={bandW} height={height} rx={2} />
        </clipPath>
        {/* The WELL — dark under the top lip, falling off fast, with a faint light line on
            the floor. SVG has no `inset` box-shadow, so a recess is a gradient. */}
        <linearGradient id={wellId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={WELL_SHADE} stopOpacity={0.6} />
          <stop offset="42%" stopColor={WELL_SHADE} stopOpacity={0.12} />
          <stop offset="88%" stopColor={WELL_SHADE} stopOpacity={0.02} />
          <stop offset="100%" stopColor={WELL_FLOOR_LIGHT} stopOpacity={0.07} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {/* the strip floor — the idle tone spans the rep so a pause is band, not a hole. */}
        <rect
          x={bandLeft}
          y={top}
          width={bandW}
          height={height}
          fill={PHASE_AXIS_COLOR.idle}
          data-testid="ghost-band-floor"
        />
        {/* Each run: the muted base at FULL run width, then the pacing fill over the part
            of it that has been earned. Both square inside the one clip — the fill is a
            fill, never an inset, so no boundary can open a seam. */}
        {runs.map((run, i) => (
          <g key={i}>
            <rect
              x={run.left}
              y={top}
              width={run.width}
              height={height}
              fill={PHASE_AXIS_BASE_COLOR[run.phase]}
              data-testid="ghost-band-base"
            />
            <rect
              x={run.left}
              y={top}
              width={run.width}
              height={height}
              fill={`url(#${wellId})`}
              data-testid="ghost-band-well"
            />
            <rect
              x={run.left}
              y={top}
              width={run.fillWidth}
              height={height}
              fill={PHASE_AXIS_COLOR[run.phase]}
              data-testid="ghost-band-fill"
            />
          </g>
        ))}
        {/* Labels last so a fill sweeping past never paints over the word. */}
        {showLabels &&
          runs.map((run, i) => {
            const label = PHASE_LABEL[run.phase]
            if (!label || !labelFits(label, run.width)) return null
            return (
              <text
                key={i}
                x={run.left + run.width / 2}
                y={top + height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill={run.labelTone}
                fontSize={8}
                fontWeight={800}
                letterSpacing={1}
                fontFamily={FONT_UI}
              >
                {label}
              </text>
            )
          })}
      </g>
    </g>
  )
}
