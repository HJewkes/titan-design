// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/WorkoutSummary.tsx
// Rating:   Medium · titan equiv: none (no whole-workout multi-exercise summary)
// Why:      Consolidated stats + per-exercise tree breakdown (working weight, best
//           velocity, RPE range) in one card — titan has per-set summaries only.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, TouchableOpacity } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

interface ExerciseSummary {
  name: string
  setCount: number
  workingWeight: number | null
  bestVelocity: number | null
  rpeMin: number | null
  rpeMax: number | null
}

function ExerciseRow({ stats, isLast }: { stats: ExerciseSummary; isLast: boolean }) {
  const details: string[] = []
  if (stats.workingWeight !== null) details.push(`Working weight: ${stats.workingWeight} lbs`)
  if (stats.bestVelocity !== null)
    details.push(`Best velocity: ${stats.bestVelocity.toFixed(2)} m/s`)
  if (stats.rpeMin !== null && stats.rpeMax !== null) {
    details.push(
      stats.rpeMin === stats.rpeMax
        ? `RPE: ${stats.rpeMin.toFixed(1)}`
        : `RPE range: ${stats.rpeMin.toFixed(1)} - ${stats.rpeMax.toFixed(1)}`
    )
  }
  return (
    <View
      style={{
        paddingVertical: 8,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: alpha('#fff', 0.04),
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: t['text-primary'], flex: 1 }}>
          {stats.name}
        </Text>
        <Text style={{ fontSize: 13, color: t['text-tertiary'] }}>{stats.setCount} sets</Text>
      </View>
      {details.map((detail, i) => (
        <View
          key={i}
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, paddingLeft: 4 }}
        >
          <Text style={{ fontSize: 11, color: t['text-disabled'], marginRight: 6 }}>
            {i < details.length - 1 ? '├' : '└'}
          </Text>
          <Text style={{ fontSize: 12, color: t['text-secondary'] }}>{detail}</Text>
        </View>
      ))}
    </View>
  )
}

/** Static faithful re-render of the mobile WorkoutSummary (whole-workout recap). */
function WorkoutSummarySpecimen({
  exercises,
  totalDuration,
}: {
  exercises: ExerciseSummary[]
  totalDuration?: string
}) {
  const totalSets = exercises.reduce((sum, ex) => sum + ex.setCount, 0)
  const headerParts = [`${exercises.length} exercises`, `${totalSets} sets`]
  if (totalDuration) headerParts.push(totalDuration)

  return (
    <View
      style={{ width: 340, backgroundColor: t['surface-elevated'], borderRadius: 12, padding: 16 }}
    >
      <View style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <View
            style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t['status-success'] }}
          />
          <Text style={{ fontSize: 18, fontWeight: '700', color: t['text-primary'] }}>
            Workout Complete
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: t['text-tertiary'], paddingLeft: 18 }}>
          {headerParts.join(' · ')}
        </Text>
      </View>
      <View style={{ height: 1, backgroundColor: alpha('#fff', 0.06), marginVertical: 4 }} />
      {exercises.map((ex, i) => (
        <ExerciseRow key={i} stats={ex} isLast={i === exercises.length - 1} />
      ))}
      <View
        style={{ height: 1, backgroundColor: alpha('#fff', 0.06), marginTop: 4, marginBottom: 12 }}
      />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={() => {}}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: alpha(t['text-secondary'], 0.1),
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: t['text-secondary'] }}>
            Copy Summary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {}}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: t['brand-primary'],
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Start New Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const meta: Meta<typeof WorkoutSummarySpecimen> = {
  title: 'Lab/Candidates/Summary/WorkoutSummary',
  component: WorkoutSummarySpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Whole-workout recap: header ' +
          'stat line + per-exercise tree breakdown (working weight, best velocity, RPE range) + ' +
          'copy/new-workout actions. titan has no multi-exercise summary equivalent. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof WorkoutSummarySpecimen>

export const TwoExercises: Story = {
  args: {
    totalDuration: '42 min',
    exercises: [
      {
        name: 'Barbell Bench Press',
        setCount: 4,
        workingWeight: 185,
        bestVelocity: 0.51,
        rpeMin: 7,
        rpeMax: 9,
      },
      {
        name: 'Barbell Row',
        setCount: 3,
        workingWeight: 155,
        bestVelocity: 0.63,
        rpeMin: 6.5,
        rpeMax: 8,
      },
    ],
  },
}
export const FullWorkout: Story = {
  args: {
    totalDuration: '68 min',
    exercises: [
      {
        name: 'Back Squat',
        setCount: 5,
        workingWeight: 275,
        bestVelocity: 0.42,
        rpeMin: 7,
        rpeMax: 9.5,
      },
      {
        name: 'Romanian Deadlift',
        setCount: 3,
        workingWeight: 225,
        bestVelocity: 0.48,
        rpeMin: 7,
        rpeMax: 8,
      },
      {
        name: 'Leg Press',
        setCount: 4,
        workingWeight: 360,
        bestVelocity: 0.55,
        rpeMin: 6,
        rpeMax: 8.5,
      },
      {
        name: 'Walking Lunge',
        setCount: 3,
        workingWeight: 95,
        bestVelocity: null,
        rpeMin: 6,
        rpeMax: 7,
      },
    ],
  },
}
export const SingleExercise: Story = {
  args: {
    exercises: [
      {
        name: 'Overhead Press',
        setCount: 3,
        workingWeight: 115,
        bestVelocity: 0.58,
        rpeMin: 8,
        rpeMax: 8,
      },
    ],
  },
}
