// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { ExerciseHeading, type ExerciseHeadingProps } from './ExerciseHeading'
import { SetStrip, type SetStripSet } from './SetStrip'

export interface ExerciseCardHeadingProps extends ExerciseHeadingProps {
  /** Per-set performance data driving the strip; an empty list renders no strip. */
  setStates: SetStripSet[]
  /** Strip height in px. Default 8. */
  stripHeight?: number
}

/**
 * The complete, standalone session-rail heading: an {@link ExerciseHeading} info
 * block over its per-set {@link SetStrip}. The unit the rail lists — self-contained
 * and independent of {@link ExerciseCard} (whose `rail` state delegates here).
 * e1RM is intentionally dropped (a planning / live-panel concern). Dimming lives on
 * the outer wrapper so the strip dims with the heading.
 */
export function ExerciseCardHeading({
  setStates,
  stripHeight = 8,
  dimmed,
  ...heading
}: ExerciseCardHeadingProps) {
  return (
    <View
      style={{ paddingVertical: 9, paddingHorizontal: 12, opacity: dimmed ? 0.55 : 1 }}
      testID="exercise-card"
    >
      <ExerciseHeading {...heading} />

      {setStates.length > 0 && (
        <View style={{ marginTop: 7 }} testID="exercise-card-strip">
          <SetStrip sets={setStates} height={stripHeight} />
        </View>
      )}
    </View>
  )
}
