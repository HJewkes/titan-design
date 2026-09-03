// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, Pressable } from 'react-native'
import { roundWeight } from '../../../utils/workout-format'
import { SetsRepsLoad } from './SetsRepsLoad'
import { TempoDisplay } from './TempoDisplay'
import { ExerciseIndicator, type ExerciseIndicatorKind } from './ExerciseIndicator'

export interface ExerciseHeadingProps {
  name: string
  /** Prescription line values (sets × reps @ load). */
  sets: number
  reps: number | string
  /** Load value; a string (e.g. "—") passes through verbatim for an unset/discovery load. */
  load: number | string
  unit?: 'lbs' | 'kg'
  /** Tempo tuple [eccentric, pauseBottom, concentric, pauseTop]; hidden when absent. */
  tempo?: [number, number, number, number]
  /** Small PR / issue / info chip in the title row. */
  indicator?: ExerciseIndicatorKind
  /** Dim the block as a not-yet-reached exercise (standalone use). */
  dimmed?: boolean
  /** Press target for the name row (expand / select). */
  onPress?: () => void
}

function headingLabel(
  name: string,
  sets: number,
  reps: number | string,
  load: number | string,
  unit: string
) {
  const loadLabel = typeof load === 'number' ? roundWeight(load) : load
  return `${name}, ${sets}×${reps} @ ${loadLabel} ${unit}`
}

/**
 * The exercise-heading info block (no strip): the name + {@link ExerciseIndicator}
 * title row over a tight {@link SetsRepsLoad} prescription line beside the real
 * {@link TempoDisplay} (`showLabel={false}`). The name row is the sole press
 * target — TempoDisplay is a sibling, never a descendant, since it is itself a
 * Pressable (nesting would be an a11y nested-interactive violation).
 */
export function ExerciseHeading({
  name,
  sets,
  reps,
  load,
  unit = 'lbs',
  tempo,
  indicator,
  dimmed,
  onPress,
}: ExerciseHeadingProps) {
  return (
    <View style={{ opacity: dimmed ? 0.55 : 1 }} testID="exercise-heading">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={headingLabel(name, sets, reps, load, unit)}
        className="flex-row items-center"
        style={{ gap: 8 }}
        testID="exercise-card-header"
      >
        <Text
          className="text-text-primary"
          style={{ fontSize: 14, fontFamily: '"Space Grotesk", sans-serif', fontWeight: '700' }}
          testID="exercise-card-name"
        >
          {name}
        </Text>
        <View className="flex-1" />
        {indicator && <ExerciseIndicator kind={indicator} />}
      </Pressable>

      <View
        className="flex-row items-center"
        style={{ gap: 8, marginTop: 1 }}
        testID="exercise-card-summary"
      >
        <SetsRepsLoad sets={sets} reps={reps} load={load} unit={unit} />
        <View className="flex-1" />
        {tempo && <TempoDisplay tempo={tempo} size="sm" showLabel={false} showInfo={false} />}
      </View>
    </View>
  )
}
