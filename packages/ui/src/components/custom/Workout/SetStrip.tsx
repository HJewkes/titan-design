// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps } from 'react-native'
import { SetBar, type SetStripSet } from './SetBar'
import { formatRepsRange, formatExpectedRange } from '../../../utils/workout-format'

// Re-exported so the per-set colour vocabulary stays importable from either the
// molecule (SetStrip) or the atom (SetBar) it now lives in.
export {
  SET_STRIP_ZONES,
  SET_STRIP_VARIABLE_COLOR,
  velocityZoneColor,
  SetBar,
  type SetBarProps,
} from './SetBar'
export type { SetStripSet, ExpectedRepsRange } from './SetBar'

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

/** The stats-derived expected-range label (VW-301) for a `todo`/`active` set, or `null`. */
function expectedRangeLabel(set: SetStripSet): string | null {
  if (set.status !== 'todo' && set.status !== 'active') return null
  return formatExpectedRange(set.expectedRange?.low, set.expectedRange?.high)
}

/** Screen-reader detail for the expected-range label — spells out the sample size the plain text omits. */
function expectedRangeAccessibilityLabel(set: SetStripSet): string | undefined {
  if (set.status !== 'todo' && set.status !== 'active') return undefined
  const range = set.expectedRange
  if (range == null) return undefined
  const bounds = formatRepsRange(range.low, range.high)
  if (bounds == null) return undefined
  return `Expected ${bounds} reps, from ${range.n} sets`
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
 *
 * `todo`/`active` sets may carry both a prescribed rep range (`repsLow`/`repsHigh`,
 * VMCP-03.04) and a stats-derived {@link ExpectedRepsRange} (`expectedRange`,
 * VW-301). The two render with deliberately different weight — prescribed at
 * `text-2xs`/`text-secondary`/semibold, expected at `text-3xs`/`text-tertiary`/
 * regular — so the expected range never reads as a second prescription. It is
 * **not** the prescription: it's what the lifter's own velocity-loss-threshold
 * history predicts, with limits of agreement around ±5 reps (Jukic et al. 2023).
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
        const expected = expectedRangeLabel(set)
        if (label == null && expected == null) return <SetBar key={i} set={set} height={height} />
        return (
          <View key={i} style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <View style={{ position: 'absolute', bottom: height + 3, left: 0, right: 0 }}>
              {label != null && (
                <Text
                  className="text-text-secondary text-2xs font-semibold text-center"
                  testID="set-strip-reps-label"
                  numberOfLines={1}
                >
                  {label}
                </Text>
              )}
              {expected != null && (
                <Text
                  className="text-text-tertiary text-3xs text-center"
                  testID="set-strip-expected-label"
                  numberOfLines={1}
                  accessibilityLabel={expectedRangeAccessibilityLabel(set)}
                >
                  {expected}
                </Text>
              )}
            </View>
            <SetBar set={set} height={height} />
          </View>
        )
      })}
    </View>
  )
}
