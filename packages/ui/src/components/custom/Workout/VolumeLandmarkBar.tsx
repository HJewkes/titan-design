// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import type { VolumeLandmarks } from './muscleTaxonomy'

const t = getSemanticColors('dark')

// Reuse the canonical BodyMap volume HEAT scale (the `divergingScale` under →
// optimal → over) rather than reinventing a fill ramp. Same color language as
// BodyMap / MesoProgressBar so a muscle reads identically across the app.
const HEAT = WORKOUT_TOKENS.heatmap

const TRACK_BG = '#333333'
const TICK_COLOR = '#6B7280'
const MONO = 'monospace'
// Optimal-zone glow: the fill sits on the MAV productive target.
const PRODUCTIVE_GLOW = '0 0 5px 1px rgba(88,246,158,0.30), 0 0 10px 3px rgba(88,246,158,0.12)'

export type VolumeZone = 'under' | 'maintenance' | 'productive' | 'approaching' | 'over'

// The MEV/MAV/MRV shape is the canonical one from muscleTaxonomy — reused, not
// redefined, so there is a single source of truth. Re-exported for convenience.
export type { VolumeLandmarks }

export interface VolumeLandmarkBarProps extends ViewProps {
  /** Muscle group label shown above the track. */
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

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

interface LandmarkTickProps {
  name: 'MEV' | 'MAV' | 'MRV'
  value: number
  left: number
  trackHeight: number
  emphasized: boolean
}

function LandmarkTick({ name, value, left, trackHeight, emphasized }: LandmarkTickProps) {
  const lineWidth = emphasized ? 2 : 1.5
  const color = emphasized ? t['brand-primary'] : TICK_COLOR
  return (
    <>
      <View
        style={{
          position: 'absolute',
          left,
          top: -3,
          width: lineWidth,
          height: trackHeight + 6,
          borderRadius: lineWidth / 2,
          backgroundColor: color,
          zIndex: 3,
        }}
        testID={`volume-landmark-tick-${name.toLowerCase()}`}
      />
      <View
        style={{
          position: 'absolute',
          left: left - 20,
          top: trackHeight + 8,
          width: 40,
          alignItems: 'center',
        }}
        accessibilityElementsHidden
        testID={`volume-landmark-label-${name.toLowerCase()}`}
      >
        <Text style={{ fontSize: 8, fontFamily: MONO, color, letterSpacing: 0.5 }}>{name}</Text>
        <Text style={{ fontSize: 9, fontFamily: MONO, color: t['text-secondary'] }}>{value}</Text>
      </View>
    </>
  )
}

/**
 * Horizontal weekly-volume bar with MEV / MAV / MRV landmark ticks, a HEAT-scale
 * fill positioned against the MAV target, and a % readout. Reuses the canonical
 * BodyMap volume heat scale so a muscle's training status reads the same here as
 * in the body map. Richer than DeviationBar / MesoProgressBar, which carry no
 * landmark markers.
 *
 * @example
 * <VolumeLandmarkBar
 *   muscle="Quads"
 *   currentSets={16}
 *   landmarks={{ mev: 8, mav: 16, mrv: 22 }}
 * />
 */
export function VolumeLandmarkBar({
  muscle,
  currentSets,
  landmarks,
  width = 220,
  trackHeight = 10,
  scaleMax,
  className,
  ...props
}: VolumeLandmarkBarProps) {
  const { mev, mav, mrv } = landmarks
  const max = scaleMax ?? mrv * 1.2
  const zone = zoneForSets(currentSets, landmarks)
  const fillColor = HEAT_BY_ZONE[zone]

  const posFor = (value: number) => clamp01(value / max) * width
  const fillWidth = posFor(currentSets)

  const pct = mav > 0 ? Math.round((currentSets / mav) * 100) : 0

  return (
    <View
      className={className}
      style={{ width, gap: 4, overflow: 'visible' }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: Math.round(max), now: currentSets }}
      accessibilityLabel={`${muscle} weekly volume: ${currentSets} sets, ${pct}% of MAV target, ${ZONE_DESCRIPTION[zone]}`}
      testID="volume-landmark-bar"
      {...props}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}
        accessibilityElementsHidden
      >
        <Text
          style={{
            fontSize: 11,
            fontFamily: '"Nunito Sans", sans-serif',
            color: t['text-secondary'],
          }}
          testID="volume-landmark-muscle"
        >
          {muscle}
        </Text>
        <Text
          style={{ fontSize: 15, fontWeight: '700', fontFamily: MONO, color: fillColor }}
          testID="volume-landmark-pct"
        >
          {pct}%
        </Text>
      </View>

      <View
        style={{
          width,
          height: trackHeight,
          borderRadius: trackHeight / 2,
          backgroundColor: TRACK_BG,
          position: 'relative',
          overflow: 'visible',
        }}
        accessibilityElementsHidden
        testID="volume-landmark-track"
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: fillWidth,
            borderRadius: trackHeight / 2,
            backgroundColor: fillColor,
            zIndex: 1,
            ...(zone === 'productive' ? { boxShadow: PRODUCTIVE_GLOW } : null),
          }}
          testID="volume-landmark-fill"
        />

        <LandmarkTick
          name="MEV"
          value={mev}
          left={posFor(mev)}
          trackHeight={trackHeight}
          emphasized={false}
        />
        <LandmarkTick
          name="MAV"
          value={mav}
          left={posFor(mav)}
          trackHeight={trackHeight}
          emphasized
        />
        <LandmarkTick
          name="MRV"
          value={mrv}
          left={posFor(mrv)}
          trackHeight={trackHeight}
          emphasized={false}
        />
      </View>

      {/* Reserve vertical room for the absolutely-positioned landmark labels. */}
      <View style={{ height: 22 }} accessibilityElementsHidden />
    </View>
  )
}
