import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'
import { alpha } from '../../../utils/colors'
import { useOnSurfaceColor } from '../../ui/surface'
import { SetBarChart, type SetSlot } from '../charts/SetBarChart'
import { VelocityBandOverlay, type VelocityBandTreatment } from './VelocityBandOverlay'
import { bandSlotCount, barTone } from './velocityBandGeometry'
import type { VelocityBandScale } from './VelocityBandScale'

/** Fill for bands 0 to 3, in the palette the scale's `meaning` calls for. */
export type VelocityBandPalette = readonly [string, string, string, string]

/** Tier b: absolute effort on the shipped four-step performance scale. */
export const EFFORT_BAND_PALETTE: VelocityBandPalette = [
  WORKOUT_TOKENS.scale.green,
  WORKOUT_TOKENS.scale.yellow,
  WORKOUT_TOKENS.scale.orange,
  WORKOUT_TOKENS.scale.red,
]

export interface VelocityBandPreviewProps {
  velocities: readonly number[]
  scale: VelocityBandScale
  palette: VelocityBandPalette
  height: number
  treatment?: Partial<VelocityBandTreatment>
  accessibilityLabel: string
  testID?: string
}

const LOW_CONFIDENCE_FILL_OPACITY = 0.45
/** Bars after a setting change recede so the change mark's label reads over them. */
const SUSPENDED_FILL_OPACITY = 0.35

/**
 * The band overlay on a real `SetBarChart`, for stories and review rounds only. Integration into
 * `VelocityStrip` and the hero is step E of the VW-448 plan; until then this is not exported.
 */
export function VelocityBandPreview({
  velocities,
  scale,
  palette,
  height,
  treatment,
  accessibilityLabel,
  testID = 'velocity-band-preview',
}: VelocityBandPreviewProps) {
  const neutral = useOnSurfaceColor('tertiary')
  const slotCount = bandSlotCount(scale, velocities.length)
  const slots: SetSlot[] = velocities.map((value) => ({ kind: 'rep', value }))
  const colorFor = (_value: number, repIndex: number): string => {
    const tone = barTone(scale, repIndex)
    if (tone.suspended) return alpha(neutral, SUSPENDED_FILL_OPACITY)
    if (tone.band == null) return neutral
    const fill = palette[tone.band]
    return tone.lowConfidence ? alpha(fill, LOW_CONFIDENCE_FILL_OPACITY) : fill
  }
  return (
    <SetBarChart
      slots={slots}
      targetReps={slotCount}
      colorFor={colorFor}
      height={height}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      renderReference={(chart) => (
        <VelocityBandOverlay
          scale={scale}
          velocities={velocities}
          slotCount={slotCount}
          chart={chart}
          treatment={treatment}
        />
      )}
    />
  )
}
