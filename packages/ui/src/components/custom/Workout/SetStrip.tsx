// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps } from 'react-native'
import { SetBar, type SetStripSet } from './SetBar'
import { formatRepsRange } from '../../../utils/workout-format'

// Re-exported so the per-set colour vocabulary stays importable from either the
// molecule (SetStrip) or the atom (SetBar) it now lives in.
export {
  SET_STRIP_ZONES,
  SET_STRIP_VARIABLE_COLOR,
  velocityZoneColor,
  SetBar,
  type SetBarProps,
} from './SetBar'
export type { SetStripSet } from './SetBar'

/** Gap between set bars — ~2× the (zero) rep gap, so sets read as discrete units. */
const SET_STRIP_GAP = 5

/** Collapse a set (flat or set-type) to its glance category for the progress summary. */
function setCategory(set: SetStripSet): 'done' | 'active' | 'upcoming' {
  switch (set.status) {
    case 'done':
    case 'drop':
    case 'myo':
      return 'done'
    case 'active':
      return 'active'
    case 'range':
      return set.doneVels.length > 0 ? 'active' : 'upcoming'
    case 'todo':
    case 'myo-upcoming':
      return 'upcoming'
  }
}

function describeSets(sets: SetStripSet[]): string {
  const done = sets.filter((s) => setCategory(s) === 'done').length
  const active = sets.filter((s) => setCategory(s) === 'active').length
  const upcoming = sets.filter((s) => setCategory(s) === 'upcoming').length
  return `Set progress: ${done} done, ${active} in progress, ${upcoming} upcoming`
}

/** The prescribed rep-range label for a `todo`/`active` set, or `null` when unset. */
function repsRangeLabel(set: SetStripSet): string | null {
  if (set.status !== 'todo' && set.status !== 'active') return null
  return formatRepsRange(set.repsLow, set.repsHigh)
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
      {sets.map((set, i) => {
        const label = repsRangeLabel(set)
        if (label == null) return <SetBar key={i} set={set} height={height} />
        return (
          <View key={i} style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <Text
              className="text-text-secondary text-2xs font-semibold text-center"
              style={{ position: 'absolute', bottom: height + 3, left: 0, right: 0 }}
              testID="set-strip-reps-label"
            >
              {label}
            </Text>
            <SetBar set={set} height={height} />
          </View>
        )
      })}
    </View>
  )
}
