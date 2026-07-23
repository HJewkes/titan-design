// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * VelocityHero — the primary live read beside the fatigue card: the shipped
 * {@link VelocityStrip} hero with LOSS-RELATIVE decision bands layered behind the
 * bars. The velocity-loss language (VL20 / VL30 off the running best) lives HERE, so
 * the fatigue card carries no separate VL% chart.
 *
 * The bands are drawn on the hero's OWN peak scale (they must track the same
 * `PEAK_HEADROOM` / label-headroom constants the strip uses) so a bar crossing into
 * the amber then red band reads as "these are your last effective reps".
 *
 * NOTE (deferred): the LOCKED design also wants the BAR FILL recoloured loss-relative
 * (gold→orange→red by velocity loss, not absolute velocity zones). VelocityStrip
 * currently colours bars by absolute zone with no loss-relative mode; that needs a new
 * VelocityStrip prop and is intentionally NOT done here (this component owns the band
 * overlay only, reusing VelocityStrip as-is). See the family README follow-ups.
 */
import { View, Text } from 'react-native'
import { VelocityStrip } from '../Workout/VelocityStrip'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { FONT_MONO } from './fatigue-tokens'

const t = getSemanticColors('dark')

// Must match VelocityStrip's hero constants so the bands line up with the bars.
const PEAK_HEADROOM = 1.06
const HERO_LABEL_HEADROOM = 20

export interface VelocityHeroProps {
  /** Per-rep MEAN concentric velocity (m/s), ordered by rep. */
  velocities: number[]
  /** The set's planned rep count — draws dashed placeholder stubs for reps still to come. */
  targetReps?: number
  /** Index of the most-recently-completed rep (the live-rep pop). Defaults to the last performed rep. */
  liveRepIndex?: number
  /** Fixed width (standalone). Omit to flex-fill the column (in the panel). */
  width?: number
  /** Hero plot height in px. Default 300. */
  height?: number
}

export function VelocityHero({
  velocities,
  targetReps,
  liveRepIndex,
  width,
  height = 300,
}: VelocityHeroProps) {
  const hasData = velocities.length > 0
  const best = hasData ? Math.max(...velocities) : 0
  const denom = best * PEAK_HEADROOM
  const plotH = height - HERO_LABEL_HEADROOM
  // px UP from the baseline for a velocity value, on the hero's own peak scale.
  const yOf = (v: number) => (denom > 0 ? (v / denom) * plotH : 0)
  const vl20 = best * 0.8
  const vl30 = best * 0.7

  const band = (loV: number, hiV: number, color: string) => (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: yOf(loV),
        height: Math.max(0, yOf(hiV) - yOf(loV)),
        backgroundColor: color,
      }}
    />
  )
  const threshold = (v: number, color: string, label: string) => (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: yOf(v) }}>
      <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: color }} />
      <Text
        style={{
          position: 'absolute',
          right: 2,
          top: -13,
          fontSize: 9,
          fontWeight: '800',
          fontFamily: FONT_MONO,
          color,
        }}
      >
        {label}
      </Text>
    </View>
  )

  return (
    <View testID="velocity-hero" style={width != null ? { width, height } : { flex: 1, height }}>
      {hasData && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
        >
          {band(0, vl30, alpha(t['status-error'], 0.09))}
          {band(vl30, vl20, alpha(t['status-warning'], 0.08))}
          {threshold(vl20, alpha(t['status-warning'], 0.75), 'VL 20%')}
          {threshold(vl30, alpha(t['status-error'], 0.75), 'VL 30%')}
        </View>
      )}
      <VelocityStrip
        variant="hero"
        velocities={velocities}
        liveRepIndex={liveRepIndex ?? velocities.length - 1}
        targetReps={targetReps}
        height={height}
        scale="peak"
      />
    </View>
  )
}
