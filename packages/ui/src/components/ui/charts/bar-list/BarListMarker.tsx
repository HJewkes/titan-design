import { View } from 'react-native'
import { Typography } from '../../typography'
import { hiddenFromAssistiveTech } from './assistive'
import type { BarListModelMarker } from './bar-list-marker'

const MARKER_WIDTH = 2
const MARKER_OVERHANG = 2

/** The reference line, beside the track because the track clips its children. */
export function MarkerLine({ fraction }: { fraction: number }) {
  return (
    <View
      className="absolute bg-text-primary"
      style={{
        left: `${fraction * 100}%`,
        marginLeft: fraction === 1 ? -MARKER_WIDTH : 0,
        width: MARKER_WIDTH,
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
        <View className="h-3 w-0.5 bg-text-primary" testID="bar-list-marker-swatch" />
      )}
      <Typography variant="caption" color="secondary">
        {`${marker.label} ${marker.valueText}`}
      </Typography>
    </View>
  )
}
