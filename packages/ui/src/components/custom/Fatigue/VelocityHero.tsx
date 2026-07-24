// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * VelocityHero — the primary live read beside the fatigue card: the shipped
 * {@link VelocityStrip} hero in its loss-relative mode. Both halves of the
 * loss-relative language now live in VelocityStrip itself — the LOSS bar fill
 * (`barColor="loss"`, the default) AND the VL20 / VL30 decision bands behind the
 * bars (`showLossBands`, the {@link VelocityLossBands} primitive). This component
 * is a thin semantic alias (panel default height + live-rep default) so the
 * fatigue card can drop in "the velocity hero" without re-specifying the mode.
 */
import { View } from 'react-native'
import { VelocityStrip } from '../Workout/VelocityStrip'

export interface VelocityHeroProps {
  /** Per-rep MEAN concentric velocity (m/s), ordered by rep. */
  velocities: number[]
  /** The set's planned rep count — draws dashed placeholder stubs for reps still to come. */
  targetReps?: number
  /** Index of the most-recently-completed rep (the live-rep grow). Defaults to the last performed rep. */
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
  return (
    <View testID="velocity-hero" style={width != null ? { width, height } : { flex: 1, height }}>
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
