// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/ExercisePickerModal.tsx
// Rating:   Medium · titan equiv: none (no grouped bottom-sheet picker)
// Why:      Bottom-sheet exercise list grouped by muscle group, with cable-path +
//           attachment sub-labels per row. titan has flat pickers only.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

const CABLE_ICON: Record<string, string> = { high: '↑', mid: '↔', low: '↓' }

interface ExerciseRowData {
  id: string
  name: string
  cablePath?: 'high' | 'mid' | 'low'
  attachment?: string
}

interface MuscleGroupData {
  label: string
  exercises: ExerciseRowData[]
}

/** Static faithful re-render of a single exercise row (no press behavior). */
function ExerciseRowSpecimen({ exercise }: { exercise: ExerciseRowData }) {
  const cableLabel = exercise.cablePath
    ? `${CABLE_ICON[exercise.cablePath]} ${exercise.cablePath}`
    : null
  return (
    <Pressable
      onPress={() => {}}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginBottom: 2,
        borderRadius: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: t['text-primary'] }}>
          {exercise.name}
        </Text>
        {(cableLabel || exercise.attachment) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
            {cableLabel && (
              <Text style={{ fontSize: 11, color: t['text-tertiary'] }}>{cableLabel}</Text>
            )}
            {exercise.attachment && (
              <Text style={{ fontSize: 11, color: t['text-tertiary'] }} numberOfLines={1}>
                {exercise.attachment}
              </Text>
            )}
          </View>
        )}
      </View>
      <Text style={{ fontSize: 16, color: t['text-tertiary'] }}>›</Text>
    </Pressable>
  )
}

/** Static faithful re-render of the mobile ExercisePickerModal sheet (no Modal wrapper, no scroll). */
function ExercisePickerModalSpecimen({ groups }: { groups: MuscleGroupData[] }) {
  return (
    <View
      style={{
        width: 320,
        maxHeight: 480,
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
      }}
    >
      <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
        <View
          style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: alpha('#fff', 0.2) }}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: t['text-primary'] }}>
          Next Exercise
        </Text>
        <Text style={{ fontSize: 18, color: t['text-tertiary'] }}>✕</Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {groups.map(({ label, exercises }) => (
          <View key={label} style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: t['text-tertiary'],
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 6,
                paddingHorizontal: 4,
              }}
            >
              {label}
            </Text>
            {exercises.map((exercise) => (
              <ExerciseRowSpecimen key={exercise.id} exercise={exercise} />
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

const meta: Meta<typeof ExercisePickerModalSpecimen> = {
  title: 'Lab/ExerciseSelection/ExercisePickerModal',
  component: ExercisePickerModalSpecimen,
  tags: ['status:lab', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Bottom-sheet exercise catalog ' +
          'grouped by muscle group, with cable-path + attachment sub-labels per row. titan has no ' +
          'equivalent grouped picker sheet. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ExercisePickerModalSpecimen>

export const PushDay: Story = {
  args: {
    groups: [
      {
        label: 'Chest',
        exercises: [
          { id: 'bench', name: 'Barbell Bench Press', cablePath: undefined, attachment: undefined },
          {
            id: 'incline-db',
            name: 'Incline Dumbbell Press',
            cablePath: undefined,
            attachment: undefined,
          },
          { id: 'cable-fly', name: 'Cable Fly', cablePath: 'mid', attachment: 'D-handle' },
        ],
      },
      {
        label: 'Shoulders',
        exercises: [
          { id: 'ohp', name: 'Overhead Press', cablePath: undefined, attachment: undefined },
          {
            id: 'lateral-raise',
            name: 'Cable Lateral Raise',
            cablePath: 'low',
            attachment: 'Single grip',
          },
        ],
      },
      {
        label: 'Triceps',
        exercises: [
          {
            id: 'pushdown',
            name: 'Triceps Pushdown',
            cablePath: 'high',
            attachment: 'Straight bar',
          },
        ],
      },
    ],
  },
}

export const PullDay: Story = {
  args: {
    groups: [
      {
        label: 'Back',
        exercises: [
          { id: 'lat-pulldown', name: 'Lat Pulldown', cablePath: 'high', attachment: 'Wide bar' },
          { id: 'seated-row', name: 'Seated Cable Row', cablePath: 'mid', attachment: 'V-handle' },
        ],
      },
      {
        label: 'Biceps',
        exercises: [
          { id: 'cable-curl', name: 'Cable Curl', cablePath: 'low', attachment: 'EZ bar' },
        ],
      },
    ],
  },
}

export const LegDay: Story = {
  args: {
    groups: [
      {
        label: 'Quads',
        exercises: [
          { id: 'leg-press', name: 'Leg Press', cablePath: undefined, attachment: undefined },
        ],
      },
      {
        label: 'Hamstrings',
        exercises: [
          { id: 'rdl', name: 'Romanian Deadlift', cablePath: undefined, attachment: undefined },
        ],
      },
      {
        label: 'Glutes',
        exercises: [
          {
            id: 'cable-kickback',
            name: 'Cable Glute Kickback',
            cablePath: 'low',
            attachment: 'Ankle cuff',
          },
        ],
      },
    ],
  },
}
