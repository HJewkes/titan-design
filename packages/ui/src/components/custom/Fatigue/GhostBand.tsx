// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * GhostBand — the wide phase-coloured AXIS BAND that carries movement phase for the
 * ghost family (eccentric magenta / concentric cyan / hold and idle grey), with the
 * ECC / CON labels rendered INSIDE it. Extracted from GhostSpark so the single
 * sparkline and a future top/bottom dual compose the SAME band instead of re-rolling it.
 *
 * It is DECORATIVE for assistive tech (`aria-hidden`): the phase it paints is already carried by
 * the enclosing chart's text alternative, and ECC / CON repeat what that label says.
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
import { useOnSurfaceColor } from '../../ui/surface'
import { PHASE_AXIS_COLOR } from './fatigue-tokens'
import type { TempoTuple } from './tempo-pacing'
import type { PhaseSegment } from './fatigue-model'
import { bandExtent, bandRuns } from './ghostBandRuns'
import { GhostBandDefs, GhostBandLabels, GhostBandRunRects } from './GhostBandParts'

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
  /** Reveal the ECC / CON labels inside the band; hold and idle runs stay unlabelled. */
  showLabels?: boolean
  /**
   * Label colour when there is no pacing tone to apply. Defaults to the primary on-surface
   * colour of the enclosing Surface. Ignored for a run that paces — that label takes
   * {@link pacingTone}.
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
  /**
   * These runs are PRESCRIBED, not performed — the set has not started. Every run paints
   * unfilled at its base tone with a plain label, because nothing has been paced yet.
   *
   * Used by the empty state, where the band shows the SHAPE of the rep that was asked for
   * (from the target tempo) rather than an axis with nothing on it.
   */
  prescribed?: boolean
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
  labelColor,
  targetTempoSeconds = null,
  prescribed = false,
}: GhostBandProps) {
  const onSurface = useOnSurfaceColor('primary')
  const plainLabelColor = labelColor ?? onSurface
  const rawId = useId()
  const safeId = rawId.replace(/[^a-zA-Z0-9]/g, '')
  const clipId = `ghost-band-${safeId}`
  const wellId = `ghost-band-well-${safeId}`

  const extent = bandExtent(segments, x)
  if (!extent) return null
  const runs = bandRuns({ extent, x, targetTempoSeconds, prescribed, plainLabelColor })

  return (
    <g aria-hidden="true">
      <GhostBandDefs clipId={clipId} wellId={wellId} extent={extent} top={top} height={height} />
      <g clipPath={`url(#${clipId})`}>
        {/* the strip floor — the idle tone spans the rep so a pause is band, not a hole. */}
        <rect
          x={extent.bandLeft}
          y={top}
          width={extent.bandW}
          height={height}
          fill={PHASE_AXIS_COLOR.idle}
          data-testid="ghost-band-floor"
        />
        <GhostBandRunRects runs={runs} top={top} height={height} wellId={wellId} />
        {/* Labels last so a fill sweeping past never paints over the word. */}
        {showLabels && <GhostBandLabels runs={runs} top={top} height={height} />}
      </g>
    </g>
  )
}
