// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/ExerciseSessionSummaryCard.tsx
// Rating:   High · titan equiv: none (no termination-reason banner + set breakdown)
// Why:      Color-coded termination banner (5 reasons) + stat row + per-set delta
//           breakdown in one post-session card — titan has no equivalent composite.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, TouchableOpacity } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

type TerminationReason =
  | 'plan_exhausted'
  | 'failure'
  | 'velocity_grinding'
  | 'junk_volume'
  | 'user_stopped'

interface SetRow {
  weight: number
  reps: number
  repsDelta: number
  meanVelocity: number
  rpe: number
}

const TERMINATION_DISPLAY: Record<
  TerminationReason,
  { glyph: string; color: string; label: string }
> = {
  plan_exhausted: { glyph: '✓', color: t['status-success'], label: 'Complete!' },
  failure: { glyph: '!', color: t['status-warning'], label: 'Reached Failure' },
  velocity_grinding: { glyph: '↓', color: t['status-warning'], label: 'Max Effort' },
  junk_volume: { glyph: '⚠', color: t['status-error'], label: 'Volume Limit' },
  user_stopped: { glyph: '■', color: t['brand-primary'], label: 'Stopped Early' },
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 13, color: t['text-disabled'] }}>{label}</Text>
      <Text style={{ marginTop: 4, fontSize: 22, fontWeight: '700', color: t['text-primary'] }}>
        {value}
      </Text>
      {sub && <Text style={{ fontSize: 11, color: t['text-disabled'] }}>{sub}</Text>}
    </View>
  )
}

/** Static faithful re-render of the mobile ExerciseSessionSummaryCard. */
function ExerciseSessionSummaryCardSpecimen({
  exerciseName,
  sets,
  plannedSetCount,
  terminationReason,
  terminationMessage,
}: {
  exerciseName: string
  sets: SetRow[]
  plannedSetCount: number
  terminationReason: TerminationReason
  terminationMessage?: string
}) {
  const totalReps = sets.reduce((sum, s) => sum + s.reps, 0)
  const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
  const disp = TERMINATION_DISPLAY[terminationReason]

  return (
    <View style={{ width: 360 }}>
      <View
        style={{
          marginBottom: 16,
          alignItems: 'center',
          borderRadius: 24,
          padding: 24,
          backgroundColor: alpha(disp.color, 0.08),
          borderWidth: 1,
          borderColor: alpha(disp.color, 0.19),
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            backgroundColor: disp.color,
          }}
        >
          <Text style={{ fontSize: 36, fontWeight: '700', color: '#fff' }}>{disp.glyph}</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: disp.color, marginBottom: 8 }}>
          {disp.label}
        </Text>
        {terminationMessage && (
          <Text style={{ fontSize: 13, color: t['text-disabled'], textAlign: 'center' }}>
            {terminationMessage}
          </Text>
        )}
      </View>

      <View
        style={{
          backgroundColor: t['surface-elevated'],
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 13, color: t['text-disabled'], marginBottom: 14 }}>
          {exerciseName}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: t['surface-input'],
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Stat label="Sets" value={String(sets.length)} sub={`of ${plannedSetCount}`} />
          <View style={{ width: 1, backgroundColor: alpha('#fff', 0.08) }} />
          <Stat label="Reps" value={String(totalReps)} />
          <View style={{ width: 1, backgroundColor: alpha('#fff', 0.08) }} />
          <Stat label="Volume" value={`${(totalVolume / 1000).toFixed(1)}k`} sub="lbs" />
        </View>
      </View>

      <View
        style={{
          backgroundColor: t['surface-elevated'],
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: t['text-disabled'],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          Set Breakdown
        </Text>
        {sets.map((s, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              borderBottomWidth: i < sets.length - 1 ? 1 : 0,
              borderBottomColor: alpha('#fff', 0.06),
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
                backgroundColor: t['background-subtle'],
              }}
            >
              <Text style={{ fontWeight: '700', color: t['text-secondary'] }}>{i + 1}</Text>
            </View>
            <View>
              <Text style={{ fontWeight: '500', color: t['text-primary'] }}>
                {s.weight} lbs {'×'} {s.reps}
                <Text style={{ color: s.repsDelta >= 0 ? t['status-success'] : t['status-error'] }}>
                  {' '}
                  ({s.repsDelta >= 0 ? '+' : ''}
                  {s.repsDelta})
                </Text>
              </Text>
              <Text style={{ fontSize: 12, color: t['text-disabled'] }}>
                {s.meanVelocity.toFixed(2)} m/s {'•'} RPE {s.rpe.toFixed(1)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <TouchableOpacity
          onPress={() => {}}
          style={{
            alignItems: 'center',
            borderRadius: 16,
            padding: 20,
            backgroundColor: t['brand-primary-dark'],
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>New Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {}}
          style={{
            alignItems: 'center',
            borderRadius: 16,
            padding: 20,
            backgroundColor: t['surface-elevated'],
          }}
        >
          <Text style={{ fontWeight: '700', color: t['text-secondary'] }}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const meta: Meta<typeof ExerciseSessionSummaryCardSpecimen> = {
  title: 'Lab/Candidates/Summary/ExerciseSessionSummaryCard',
  component: ExerciseSessionSummaryCardSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Post-set-session summary: ' +
          'color-coded termination-reason banner (5 states) + stat row (sets/reps/volume) + ' +
          'per-set delta breakdown. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ExerciseSessionSummaryCardSpecimen>

export const PlanExhausted: Story = {
  args: {
    exerciseName: 'Barbell Bench Press',
    plannedSetCount: 4,
    terminationReason: 'plan_exhausted',
    terminationMessage: 'All planned sets completed.',
    sets: [
      { weight: 185, reps: 8, repsDelta: 0, meanVelocity: 0.52, rpe: 7.5 },
      { weight: 185, reps: 8, repsDelta: 0, meanVelocity: 0.48, rpe: 8 },
      { weight: 185, reps: 7, repsDelta: -1, meanVelocity: 0.43, rpe: 8.5 },
      { weight: 185, reps: 8, repsDelta: 0, meanVelocity: 0.45, rpe: 9 },
    ],
  },
}
export const JunkVolume: Story = {
  args: {
    exerciseName: 'Leg Press',
    plannedSetCount: 5,
    terminationReason: 'junk_volume',
    terminationMessage:
      'Velocity loss exceeded threshold across sets — stopping to protect recovery.',
    sets: [
      { weight: 360, reps: 12, repsDelta: 2, meanVelocity: 0.61, rpe: 7 },
      { weight: 360, reps: 10, repsDelta: 0, meanVelocity: 0.5, rpe: 8 },
      { weight: 360, reps: 6, repsDelta: -4, meanVelocity: 0.31, rpe: 9.5 },
    ],
  },
}
