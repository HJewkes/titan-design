// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { resolveColor } from '../../../theme/resolve-color'

// The planned-set rail is a visible hairline rule, not a plane, so it takes the
// one border token meant to be seen outright. It used to be a `#3A3A3A` pin in
// `workout-tokens`, which sat between two ramp steps and never flipped to light.
const RAIL_TOKEN = 'border-prominent' as const

export interface PlaceholderStripProps extends ViewProps {
  width?: number | string
  /** Render as single solid strip or segmented mini-strip */
  mode?: 'single' | 'segmented'
  /** Number of segments when mode is 'segmented' */
  segments?: number
  className?: string
}

function SingleStrip({
  width,
  className,
  ...props
}: Omit<PlaceholderStripProps, 'mode' | 'segments'>) {
  return (
    <View
      className={className}
      style={[
        {
          height: 3,
          backgroundColor: resolveColor(RAIL_TOKEN),
          borderRadius: 2,
          opacity: 0.5,
        },
        width != null ? { width: width as number } : { flex: 1 },
      ]}
      accessibilityRole="image"
      accessibilityLabel="Planned set, not yet completed"
      testID="placeholder-strip"
      {...props}
    />
  )
}

function SegmentedStrip({
  segments = 3,
  width,
  className,
  ...props
}: Omit<PlaceholderStripProps, 'mode'>) {
  return (
    <View
      className={cn('flex-row', className)}
      style={[
        { height: 3, gap: 2, opacity: 0.5 },
        width != null ? { width: width as number } : { flex: 1 },
      ]}
      accessibilityRole="image"
      accessibilityLabel="Planned set, not yet completed"
      testID="placeholder-strip"
      {...props}
    >
      {Array.from({ length: segments }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            backgroundColor: resolveColor(RAIL_TOKEN),
            borderRadius: 1,
            minWidth: 4,
          }}
          accessibilityElementsHidden
          testID="placeholder-segment"
        />
      ))}
    </View>
  )
}

export function PlaceholderStrip({ mode = 'single', segments, ...props }: PlaceholderStripProps) {
  if (mode === 'segmented') {
    return <SegmentedStrip segments={segments} {...props} />
  }
  return <SingleStrip {...props} />
}
