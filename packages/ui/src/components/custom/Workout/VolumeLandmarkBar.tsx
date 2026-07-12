// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps } from 'react-native'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { ZoneTrack } from './ZoneTrack'
import { DataRow } from '../../ui/data-row/DataRow'
import type { VolumeLandmarks } from './muscleTaxonomy'

// Reuse the canonical BodyMap volume HEAT scale (the `divergingScale` under →
// optimal → over) rather than reinventing a fill ramp. Same color language as
// BodyMap / MesoProgressBar so a muscle reads identically across the app.
const HEAT = WORKOUT_TOKENS.heatmap

// The muted, un-reached track colour — the same charcoal step ZoneTrack defaults
// to, so the bar sits on the shared gauge-track surface.
const NEUTRAL_TRACK = primitiveColors.charcoal[200]
const MONO = 'monospace'

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

const HEAT_BY_ZONE: Record<VolumeZone, string> = {
  under: HEAT.under,
  maintenance: HEAT.maintenance,
  productive: HEAT.productive,
  approaching: HEAT.approaching,
  over: HEAT.over,
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

/**
 * Horizontal weekly-volume bar with MEV / MAV / MRV landmark ticks and a HEAT-scale
 * fill positioned against the MAV target. Composes the shared {@link ZoneTrack}
 * gauge primitive (track + active-zone fill + colored/tooltip landmark ticks; glows
 * when in the productive zone) and a {@link DataRow} header lockup (muscle title +
 * current % at matched type height). The tick acronyms expand to their full name +
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
  const { mev, mav, mrv } = landmarks
  const max = scaleMax ?? mrv * 1.2
  const zone = zoneForSets(currentSets, landmarks)
  const fillColor = HEAT_BY_ZONE[zone]
  const pct = mav > 0 ? Math.round((currentSets / mav) * 100) : 0

  return (
    <View
      className={className}
      style={[{ width, gap: 3 }, style]}
      testID="volume-landmark-bar"
      {...props}
    >
      <DataRow
        label={muscle}
        value={
          <Text
            testID="volume-landmark-pct"
            style={{ fontSize: 14, fontWeight: '700', fontFamily: MONO, color: fillColor }}
          >
            {pct}%
          </Text>
        }
        className="py-0"
        testID="volume-landmark-header"
      />

      <ZoneTrack
        zones={[{ upTo: max, color: NEUTRAL_TRACK }]}
        max={max}
        marker={{
          type: 'fill',
          value: currentSets,
          color: fillColor,
          // Glow when in the optimal productive band — the "sweet spot" cue.
          glow: zone === 'productive',
        }}
        trackColor={NEUTRAL_TRACK}
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
    </View>
  )
}
