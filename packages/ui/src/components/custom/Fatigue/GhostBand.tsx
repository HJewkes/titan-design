// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * GhostBand — the wide phase-coloured AXIS BAND that carries movement phase for the
 * ghost family (eccentric magenta / concentric cyan / idle grey), with the ECC / CON
 * labels rendered INSIDE it. Extracted from GhostSpark so the single sparkline and a
 * future top/bottom dual compose the SAME band instead of re-rolling it.
 *
 * It is a pure SVG group: the caller owns the x-scale (`x`) and the band's vertical
 * placement (`top`), so the same band serves a bottom-pinned single or a centred dual.
 */
import { useId } from 'react'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FONT_UI, PHASE_AXIS_COLOR } from './fatigue-tokens'
import type { PhaseSegment } from './fatigue-model'

const t = getSemanticColors('dark')

/** Band height in px. */
export const BAND_H = 16
/** Gap between the band's near edge and a bloom's baseline. */
export const BAND_GAP = 4

export interface GhostBandProps {
  /** The current rep's phase runs, in stream order. */
  segments: PhaseSegment[]
  /** Time (ms) → px mapper, owned by the caller. */
  x: (ms: number) => number
  /** The band's top edge, px. */
  top: number
  /** Band height, px. Default {@link BAND_H}. */
  height?: number
  /** Reveal the ECC / CON labels inside the band. */
  showLabels?: boolean
  /** Label colour. Default the primary text token. */
  labelColor?: string
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
}: GhostBandProps) {
  const rawId = useId()
  const clipId = `ghost-band-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  const drawn = segments.filter((seg) => x(seg.endMs) - x(seg.startMs) > 0)
  if (drawn.length === 0) return null

  const bandLeft = x(drawn[0].startMs)
  const bandRight = x(drawn[drawn.length - 1].endMs)
  const bandW = bandRight - bandLeft
  if (bandW <= 0) return null

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={bandLeft} y={top} width={bandW} height={height} rx={2} />
        </clipPath>
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
        {drawn.map((seg, i) => {
          const left = x(seg.startMs)
          // Butt each run against the next run's start (not its own end) so rounding
          // between the two can never open a seam; the last run runs to the band edge.
          const right = i === drawn.length - 1 ? bandRight : x(drawn[i + 1].startMs)
          const segW = Math.max(0, right - left)
          const label = seg.phase === 'eccentric' ? 'ECC' : seg.phase === 'concentric' ? 'CON' : null
          return (
            <g key={i}>
              <rect
                x={left}
                y={top}
                width={segW}
                height={height}
                fill={PHASE_AXIS_COLOR[seg.phase]}
              />
              {showLabels && label && segW > 20 && (
                <text
                  x={left + segW / 2}
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
              )}
            </g>
          )
        })}
      </g>
    </g>
  )
}
