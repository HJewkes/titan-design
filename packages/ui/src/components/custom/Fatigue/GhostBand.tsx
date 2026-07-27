// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * GhostBand — the wide phase-coloured AXIS BAND that carries movement phase for the
 * ghost family (eccentric magenta / concentric cyan / hold amber / idle grey), with the
 * ECC / HOLD / CON labels rendered INSIDE it. Extracted from GhostSpark so the single
 * sparkline and a future top/bottom dual compose the SAME band instead of re-rolling it.
 *
 * It is a pure SVG group: the caller owns the x-scale (`x`) and the band's vertical
 * placement (`top`), so the same band serves a bottom-pinned single or a centred dual.
 */
import { useId } from 'react'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { FONT_UI, PHASE_AXIS_COLOR } from './fatigue-tokens'
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

/** How far back the {@link GhostBandProps.progressRamp} pulls the strip's start. */
const RAMP_START_OPACITY = 0.62
/** The ramp shades toward black so it darkens every phase tone identically. */
const RAMP_SHADE = primitiveColors.black

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
  /** Label colour. Default the primary text token. */
  labelColor?: string
  /**
   * Shade the strip with ONE dark→full ramp across its whole extent, so the rep's start sits
   * back and the leading edge reads at full tone — the band doubling as a progress bar.
   *
   * Deliberately one ramp over the WHOLE band, never a ramp per phase: a per-phase ramp
   * restarts dark at every boundary, which butts a dark leading edge against the previous
   * run's bright tail and reads as a SEAM — reopening the very gap this band is built to
   * close. Off by default; the band is otherwise flat-toned.
   */
  progressRamp?: boolean
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
  progressRamp = false,
}: GhostBandProps) {
  const rawId = useId()
  const safeId = rawId.replace(/[^a-zA-Z0-9]/g, '')
  const clipId = `ghost-band-${safeId}`
  const rampId = `ghost-band-ramp-${safeId}`

  const drawn = segments.filter((seg) => x(seg.endMs) - x(seg.startMs) > 0)
  if (drawn.length === 0) return null

  const bandLeft = x(drawn[0].startMs)
  const bandRight = x(drawn[drawn.length - 1].endMs)
  const bandW = bandRight - bandLeft
  if (bandW <= 0) return null

  // Butt each run against the NEXT run's start (not its own end) so rounding between the
  // two can never open a seam; the last run runs to the band edge.
  const runs = drawn.map((seg, i) => {
    const left = x(seg.startMs)
    const right = i === drawn.length - 1 ? bandRight : x(drawn[i + 1].startMs)
    return { phase: seg.phase, left, width: Math.max(0, right - left) }
  })

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={bandLeft} y={top} width={bandW} height={height} rx={2} />
        </clipPath>
        {progressRamp && (
          <linearGradient id={rampId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={RAMP_SHADE} stopOpacity={RAMP_START_OPACITY} />
            <stop offset="100%" stopColor={RAMP_SHADE} stopOpacity={0} />
          </linearGradient>
        )}
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
        {runs.map((run, i) => (
          <g key={i}>
            <rect
              x={run.left}
              y={top}
              width={run.width}
              height={height}
              fill={PHASE_AXIS_COLOR[run.phase]}
            />
          </g>
        ))}
        {/* ONE ramp over the finished strip — never per run, or every boundary steps dark. */}
        {progressRamp && (
          <rect
            x={bandLeft}
            y={top}
            width={bandW}
            height={height}
            fill={`url(#${rampId})`}
            data-testid="ghost-band-ramp"
          />
        )}
        {/* Labels last so the ramp shades the BAND, never the words. */}
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
                fill={labelColor}
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
