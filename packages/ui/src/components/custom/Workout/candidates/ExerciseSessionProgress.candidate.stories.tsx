// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/ExerciseSessionProgress.tsx
// Rating:   Medium · titan equiv: none (no session progress + per-set chip strip)
// Why:      Header progress bar over a wrapping strip of per-set chips
//           (warmup/current/completed), each showing weight×reps and,
//           once completed, mean velocity.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

interface PlannedSet {
  weight: number
  targetReps: number
  isWarmup?: boolean
}
interface CompletedSet {
  avgVel: number
}

function SetChip({
  planned,
  completed,
  isCurrent,
  isCompleted,
}: {
  planned: PlannedSet
  completed?: CompletedSet
  isCurrent: boolean
  isCompleted: boolean
}) {
  let bg: string = t['background-subtle']
  if (isCompleted) bg = alpha(t['status-success'], 0.12)
  else if (isCurrent) bg = alpha(t['brand-primary'], 0.12)
  const border = isCurrent ? { borderWidth: 2, borderColor: t['brand-primary'] } : {}

  return (
    <View
      style={{
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: bg,
        ...border,
      }}
    >
      <Text
        style={{
          marginBottom: 4,
          fontSize: 11,
          fontWeight: '500',
          color: planned.isWarmup ? t['status-warning'] : t['brand-primary'],
        }}
      >
        {planned.isWarmup ? 'Warmup' : 'Working'}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: '500', color: t['text-secondary'] }}>
        {planned.weight}lbs × {planned.targetReps}
      </Text>
      {completed && (
        <Text style={{ fontSize: 11, color: t['text-disabled'] }}>
          {completed.avgVel.toFixed(2)} m/s
        </Text>
      )}
      {isCurrent && !isCompleted && (
        <Text style={{ marginTop: 4, fontSize: 11, fontWeight: '700', color: t['brand-primary'] }}>
          Current
        </Text>
      )}
    </View>
  )
}

interface ExerciseSessionProgressSpecimenProps {
  exerciseName: string
  plannedSets: PlannedSet[]
  completedSets: CompletedSet[]
  currentSetIndex: number
  isDiscovery?: boolean
  error?: string
}

/** Static re-render of ExerciseSessionProgress (Card/Progress flattened to Views). */
function ExerciseSessionProgressSpecimen({
  exerciseName,
  plannedSets,
  completedSets,
  currentSetIndex,
  isDiscovery,
  error,
}: ExerciseSessionProgressSpecimenProps) {
  const progress =
    plannedSets.length > 0 ? Math.min(100, (completedSets.length / plannedSets.length) * 100) : 0

  return (
    <View
      style={{ width: 360, backgroundColor: t['surface-elevated'], borderRadius: 16, padding: 16 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: t['text-primary'] }}>
          {exerciseName}
        </Text>
        {isDiscovery && <Text style={{ fontSize: 13, color: t['brand-primary'] }}>Discovery</Text>}
      </View>

      <View
        style={{
          height: 8,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: t['background-subtle'],
        }}
      >
        <View
          style={{ height: '100%', width: `${progress}%`, backgroundColor: t['brand-primary'] }}
        />
      </View>

      {error && (
        <Text style={{ marginTop: 8, fontSize: 13, color: t['status-error-light'] }}>
          Error: {error}
        </Text>
      )}

      <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {plannedSets.map((planned, i) => (
          <SetChip
            key={i}
            planned={planned}
            completed={completedSets[i]}
            isCurrent={i === currentSetIndex}
            isCompleted={i < completedSets.length}
          />
        ))}
      </View>
    </View>
  )
}

const meta: Meta<typeof ExerciseSessionProgressSpecimen> = {
  title: 'Lab/Candidates/Live/ExerciseSessionProgress',
  component: ExerciseSessionProgressSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Session progress bar over a ' +
          'wrapping strip of per-set chips (warmup/current/completed, w/ mean velocity once done). ' +
          'titan has no equivalent progress + chip-strip pairing. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ExerciseSessionProgressSpecimen>

export const MidSession: Story = {
  args: {
    exerciseName: 'Barbell Bench Press',
    plannedSets: [
      { weight: 95, targetReps: 10, isWarmup: true },
      { weight: 135, targetReps: 8 },
      { weight: 185, targetReps: 8 },
      { weight: 185, targetReps: 8 },
      { weight: 185, targetReps: 6 },
    ],
    completedSets: [{ avgVel: 0.71 }, { avgVel: 0.58 }, { avgVel: 0.49 }],
    currentSetIndex: 3,
  },
}
export const DiscoverySession: Story = {
  args: {
    exerciseName: 'Cable Row',
    plannedSets: [
      { weight: 90, targetReps: 10, isWarmup: true },
      { weight: 110, targetReps: 8 },
      { weight: 130, targetReps: 6 },
    ],
    completedSets: [{ avgVel: 0.62 }],
    currentSetIndex: 1,
    isDiscovery: true,
  },
}
export const WithError: Story = {
  args: {
    exerciseName: 'Leg Press',
    plannedSets: [
      { weight: 270, targetReps: 12 },
      { weight: 315, targetReps: 10 },
    ],
    completedSets: [],
    currentSetIndex: 0,
    error: 'Lost connection to device — reconnect to continue',
  },
}
