import { View } from 'react-native'
import { cn } from '../../../../utils/cn'
import { Typography } from '../../typography'
import { hiddenFromAssistiveTech } from './assistive'
import type { BarListModelMarker } from './bar-list-marker'

const MARKER_CORE = 2
const MARKER_KEYLINE = 1
const MARKER_SPAN = MARKER_CORE + 2 * MARKER_KEYLINE
const MARKER_OVERHANG = 2

// The core reads against the track and the plane; the keyline each side separates it from a
// fill of either tone, which the core alone cannot do on silver.
const MARKER_PAINT = 'border-x border-text-inverse bg-text-primary'

/** The reference line; the margin keeps its right edge inside the track at every fraction. Beside the track because the track clips its children. */
export function MarkerLine({ fraction }: { fraction: number }) {
  return (
    <View
      className={cn('absolute', MARKER_PAINT)}
      style={{
        left: `${fraction * 100}%`,
        marginLeft: -MARKER_SPAN * fraction,
        width: MARKER_SPAN,
        top: -MARKER_OVERHANG,
        bottom: -MARKER_OVERHANG,
      }}
      testID="bar-list-marker"
    />
  )
}

/** The legend line: a swatch of the line when it is drawn, then the label and value. */
export function MarkerLegend({ marker }: { marker: BarListModelMarker | null }) {
  if (!marker) return null
  return (
    <View
      className="flex-row items-center gap-inline-sm"
      testID="bar-list-marker-legend"
      {...hiddenFromAssistiveTech}
    >
      {marker.fraction === null ? null : (
        <View className={cn('h-3 w-1', MARKER_PAINT)} testID="bar-list-marker-swatch" />
      )}
      <Typography variant="caption" color="secondary">
        {`${marker.label} ${marker.valueText}`}
      </Typography>
    </View>
  )
}
