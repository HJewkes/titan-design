// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { heatmapColors } from '../../../theme/workout-tokens'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface/SurfaceContext'
import { ZoneTrack } from './ZoneTrack'
import { DataRow } from '../../ui/data-row/DataRow'
import { Typography } from '../../ui/typography'
import type { VolumeLandmarks } from './muscleTaxonomy'

// ZoneTrack's own default track token. Only the zone band paints it: the pill
// and its un-reached overlay stay clear, because dark border-prominent is
// translucent and each stacked layer would lighten the track (TD-101).
const TRACK_TOKEN = 'border-prominent'
const CLEAR = 'transparent'

export type VolumeZone = 'under' | 'maintenance' | 'productive' | 'approaching' | 'over'

// The MEV/MAV/MRV shape is the canonical one from muscleTaxonomy — reused, not
// redefined, so there is a single source of truth. Re-exported for convenience.
export type { VolumeLandmarks }

export interface VolumeLandmarkBarProps extends ViewProps {
  /** Muscle group label shown in the header lockup. */
  muscle: string
  /** Current weekly working sets for this muscle group. */
  currentSets: number
  /** MEV / MAV / MRV landmark set counts. */
  landmarks: VolumeLandmarks
  /** Track width in px (default 220). */
  width?: number
  /** Track height in px (default 10). */
  trackHeight?: number
  /**
   * Upper bound of the track scale in sets. Defaults to `mrv` plus 20% headroom
   * so an over-MRV fill visibly extends past the MRV tick.
   */
  scaleMax?: number
  className?: string
}

const ZONE_DESCRIPTION: Record<VolumeZone, string> = {
  under: 'below MEV',
  maintenance: 'building toward MAV',
  productive: 'in the productive zone',
  approaching: 'approaching MRV',
  over: 'over MRV',
}

const LANDMARK_NAME: Record<'MEV' | 'MAV' | 'MRV', string> = {
  MEV: 'Minimum Effective Volume',
  MAV: 'Maximum Adaptive Volume',
  MRV: 'Maximum Recoverable Volume',
}

/** Map weekly sets against the three landmarks to a diverging HEAT zone. */
function zoneForSets(sets: number, { mev, mav, mrv }: VolumeLandmarks): VolumeZone {
  if (sets < mev) return 'under'
  if (sets < mav) return 'maintenance'
  if (sets >= mrv) return 'over'
  // Between MAV and MRV: lower half is the optimal productive band, upper half
  // approaches the recoverable ceiling.
  const midpoint = (mav + mrv) / 2
  return sets < midpoint ? 'productive' : 'approaching'
}

/** The bar's reading: its HEAT zone and the % of the MAV target. */
function volumeLandmarkReading(
  currentSets: number,
  landmarks: VolumeLandmarks
): { zone: VolumeZone; pct: number } {
  const { mav } = landmarks
  return {
    zone: zoneForSets(currentSets, landmarks),
    pct: mav > 0 ? Math.round((currentSets / mav) * 100) : 0,
  }
}

interface VolumeLandmarkTrackProps {
  muscle: string
  currentSets: number
  landmarks: VolumeLandmarks
  trackHeight: number
  scaleMax?: number
}

/** The bar's track beneath its header lockup. */
function VolumeLandmarkTrack({
  muscle,
  currentSets,
  landmarks,
  trackHeight,
  scaleMax,
}: VolumeLandmarkTrackProps) {
  const { mev, mav, mrv } = landmarks
  const max = scaleMax ?? mrv * 1.2
  const { zone, pct } = volumeLandmarkReading(currentSets, landmarks)
  // Resolved per render from the nearest Surface, not frozen at import (VW-371).
  // ZoneTrack takes literal hex only, so this reads the diverging roles through
  // `heatmapColors` rather than `resolveColor`, which returns `var()` on web.
  const fillColor = heatmapColors(useSurfaceMode())[zone]
  const trackColor = getSemanticColors(useSurfaceMode())[TRACK_TOKEN]

  return (
    <ZoneTrack
      zones={[{ upTo: max, color: trackColor }]}
      max={max}
      marker={{
        type: 'fill',
        value: currentSets,
        color: fillColor,
        // Glow when in the optimal productive band — the "sweet spot" cue.
        glow: zone === 'productive',
      }}
      trackColor={CLEAR}
      trackHeight={trackHeight}
      ticks={[
        { value: mev, label: 'MEV', tooltip: `${LANDMARK_NAME.MEV} · ${mev} sets/wk` },
        {
          value: mav,
          label: 'MAV',
          emphasized: true,
          tooltip: `${LANDMARK_NAME.MAV} (target) · ${mav} sets/wk`,
        },
        { value: mrv, label: 'MRV', tooltip: `${LANDMARK_NAME.MRV} · ${mrv} sets/wk` },
      ]}
      accessibilityLabel={`${muscle} weekly volume: ${currentSets} sets, ${pct}% of MAV target, ${ZONE_DESCRIPTION[zone]}`}
      testID="volume-landmark-track"
    />
  )
}

/**
 * Horizontal weekly-volume bar with MEV / MAV / MRV landmark ticks and a HEAT-scale
 * fill positioned against the MAV target. Composes the shared {@link ZoneTrack}
 * gauge primitive (track + active-zone fill + colored/tooltip landmark ticks; glows
 * when in the productive zone) and a {@link DataRow} header lockup (muscle name as an
 * overline label + current % in bold). The tick acronyms expand to their full name +
 * raw set count on hover/long-press, keeping the footer light. Reuses the canonical
 * BodyMap volume heat scale so a muscle's status reads the same as in the body map.
 *
 * @example
 * <VolumeLandmarkBar muscle="Quads" currentSets={16} landmarks={{ mev: 8, mav: 16, mrv: 22 }} />
 */
export function VolumeLandmarkBar({
  muscle,
  currentSets,
  landmarks,
  width = 220,
  trackHeight = 10,
  scaleMax,
  className,
  style,
  ...props
}: VolumeLandmarkBarProps) {
  const { pct } = volumeLandmarkReading(currentSets, landmarks)

  return (
    <View
      className={className}
      style={[{ width, gap: 3 }, style]}
      testID="volume-landmark-bar"
      {...props}
    >
      <DataRow
        // The name is an overline label (sans, semibold, caps) over a bold `body2`
        // figure, both in text-secondary (owner pick C, TD-101). Text ink, not the
        // zone fill: a pale fill is unreadable as text (VW-371).
        label={
          <Typography variant="overline" color="secondary" testID="volume-landmark-muscle">
            {muscle}
          </Typography>
        }
        value={
          <Typography
            variant="body2"
            color="secondary"
            className="font-bold"
            testID="volume-landmark-pct"
          >
            {pct}%
          </Typography>
        }
        // The header lockup spans the bar's own width, so it drops DataRow's
        // inset and stays flush with the track beneath it.
        className="p-0"
        testID="volume-landmark-header"
      />
      <VolumeLandmarkTrack
        muscle={muscle}
        currentSets={currentSets}
        landmarks={landmarks}
        trackHeight={trackHeight}
        scaleMax={scaleMax}
      />
    </View>
  )
}
