import { alpha } from '../../../utils/colors'
import { useOnSurfaceColor } from '../../ui/surface'
import { SetBarChart, type SetSlot } from '../charts/SetBarChart'
import { VelocityBandOverlay } from './VelocityBandOverlay'
import { bandSlotCount, barTone } from './velocityBandGeometry'
import type { VelocityBandPalette } from './velocityBandPalette'
import type { VelocityBandScale } from './VelocityBandScale'

export { EFFORT_BAND_PALETTE, SLOWING_BAND_PALETTE, paletteFor } from './velocityBandPalette'
export type { VelocityBandPalette } from './velocityBandPalette'

export interface VelocityBandPreviewProps {
  velocities: readonly number[]
  scale: VelocityBandScale
  palette: VelocityBandPalette
  height: number
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
  accessibilityLabel,
  testID = 'velocity-band-preview',
}: VelocityBandPreviewProps) {
  const neutral = useOnSurfaceColor('tertiary')
  const slotCount = bandSlotCount(scale, velocities.length)
  // A non-finite reading would flatten every bar through the chart's max; draw it as the minimum.
  const heights = velocities.map((v) => (Number.isFinite(v) ? v : 0))
  const slots: SetSlot[] = heights.map((value) => ({ kind: 'rep', value }))
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
          velocities={heights}
          slotCount={slotCount}
          chart={chart}
        />
      )}
    />
  )
}
