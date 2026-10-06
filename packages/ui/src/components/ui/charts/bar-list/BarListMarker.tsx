import { View } from 'react-native'
import { cn } from '../../../../utils/cn'

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
