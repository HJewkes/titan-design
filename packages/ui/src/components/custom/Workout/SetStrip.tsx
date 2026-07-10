// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { SetBar, type SetStripSet } from './SetBar'

// Re-exported so the per-set colour vocabulary stays importable from either the
// molecule (SetStrip) or the atom (SetBar) it now lives in.
export { SET_STRIP_ZONES, velocityZoneColor, SetBar, type SetBarProps } from './SetBar'
export type { SetStripSet } from './SetBar'

/** Gap between set bars — ~2× the (zero) rep gap, so sets read as discrete units. */
const SET_STRIP_GAP = 5

function describeSets(sets: SetStripSet[]): string {
  const done = sets.filter((s) => s.status === 'done').length
  const active = sets.filter((s) => s.status === 'active').length
  const todo = sets.filter((s) => s.status === 'todo').length
  return `Set progress: ${done} done, ${active} in progress, ${todo} upcoming`
}

export interface SetStripProps extends ViewProps {
  /** Per-set performance data, in set order. */
  sets: SetStripSet[]
  /** Bar height in px. Default 8. */
  height?: number
  className?: string
}

/**
 * The per-set segmented performance strip: one continuous {@link SetBar} per set
 * (rep intensities as butted color segments, no rep gaps), sets separated by a
 * fixed gap. Fills its container width. Colors are the real titan ramp pins.
 */
export function SetStrip({ sets, height = 8, className, ...props }: SetStripProps) {
  return (
    <View
      className={className}
      style={{ flexDirection: 'row', width: '100%', height, gap: SET_STRIP_GAP }}
      accessibilityRole="image"
      accessibilityLabel={describeSets(sets)}
      testID="set-strip"
      {...props}
    >
      {sets.map((set, i) => (
        <SetBar key={i} set={set} height={height} />
      ))}
    </View>
  )
}
