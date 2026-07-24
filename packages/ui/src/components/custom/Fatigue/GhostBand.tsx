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

/** The phase-coloured axis band — one rounded rect per phase run, ECC/CON labelled inside. */
export function GhostBand({
  segments,
  x,
  top,
  height = BAND_H,
  showLabels = false,
  labelColor = t['text-primary'],
}: GhostBandProps) {
  return (
    <>
      {segments.map((seg, i) => {
        const segW = x(seg.endMs) - x(seg.startMs)
        if (segW <= 0) return null
        const label =
          seg.phase === 'eccentric' ? 'ECC' : seg.phase === 'concentric' ? 'CON' : null
        return (
          <g key={i}>
            <rect
              x={x(seg.startMs)}
              y={top}
              width={Math.max(0, segW - 1)}
              height={height}
              rx={2}
              fill={PHASE_AXIS_COLOR[seg.phase]}
            />
            {showLabels && label && segW > 20 && (
              <text
                x={(x(seg.startMs) + x(seg.endMs)) / 2}
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
    </>
  )
}
