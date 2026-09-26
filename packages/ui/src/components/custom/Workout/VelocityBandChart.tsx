import { alpha } from '../../../utils/colors'
import { useOnSurfaceColor, useSurface } from '../../ui/surface'
import { SetBarChart, type SetSlot } from '../charts/SetBarChart'
import { VelocityBandOverlay } from './VelocityBandOverlay'
import { bandSlotCount, barTone } from './velocityBandGeometry'
import { paletteFor, type VelocityBandPalette } from './velocityBandPalette'
import type { VelocityBandScale } from './VelocityBandScale'

export interface VelocityBandChartProps {
  /** Mean concentric velocity of each performed rep (m/s), in rep order. */
  velocities: readonly number[]
  /** The resolver's bands and markers for this set, with the caller's labels. */
  scale: VelocityBandScale
  /** Band fills. Default: the effort scale for `effort`, the `dataviz-slowing` tokens otherwise. */
  palette?: VelocityBandPalette
  height: number
  /** Per-rep value labels, as on `SetBarChart`. Default false. */
  showValueLabels?: boolean
  formatValue?: (value: number) => string
  /** `down` mirrors the plot for a lower wing; overlay text stays upright. Default `up`. */
  orientation?: 'up' | 'down'
  accessibilityLabel: string
  testID?: string
}

const LOW_CONFIDENCE_FILL_OPACITY = 0.45
/** Bars after a setting change recede so the change mark's label reads over them. */
const SUSPENDED_FILL_OPACITY = 0.35

/** One set on `SetBarChart`, bars coloured by the resolver's bands under the band overlay (VW-448). */
export function VelocityBandChart({
  velocities,
  scale,
  palette,
  height,
  showValueLabels = false,
  formatValue,
  orientation = 'up',
  accessibilityLabel,
  testID = 'velocity-band-chart',
}: VelocityBandChartProps) {
  const neutral = useOnSurfaceColor('tertiary')
  const { mode } = useSurface()
  const fills = palette ?? paletteFor(scale.meaning, mode)
  const slotCount = bandSlotCount(scale, velocities.length)
  // The overlay places its badge and marks on bar tops, so a non-finite reading sits at the minimum.
  const heights = velocities.map((v) => (Number.isFinite(v) ? v : 0))
  const slots: SetSlot[] = heights.map((value) => ({ kind: 'rep', value }))
  const colorFor = (_value: number, repIndex: number): string => {
    const tone = barTone(scale, repIndex)
    if (tone.suspended) return alpha(neutral, SUSPENDED_FILL_OPACITY)
    if (tone.band == null) return neutral
    const fill = fills[tone.band]
    return tone.lowConfidence ? alpha(fill, LOW_CONFIDENCE_FILL_OPACITY) : fill
  }
  return (
    <SetBarChart
      slots={slots}
      targetReps={slotCount}
      colorFor={colorFor}
      height={height}
      showValueLabels={showValueLabels}
      formatValue={formatValue}
      orientation={orientation}
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
