// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/SessionDebrief.tsx
// Rating:   High · titan equiv: none (no cross-session debrief composite)
// Why:      Progression arrows (velocity/e1RM/volume trend) + ACWR training-load
//           status + next-session suggestions + PR badges + recovery note — titan
//           has no post-workout debrief equivalent.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

type TrendDirection = 'up' | 'down' | 'flat'
type LoadStatus = 'optimal' | 'undertraining' | 'caution' | 'danger'

const TREND_GLYPH: Record<TrendDirection, string> = { up: '↑', down: '↓', flat: '→' }
function trendColor(dir: TrendDirection) {
  return dir === 'up'
    ? t['status-success']
    : dir === 'down'
      ? t['status-error']
      : t['text-tertiary']
}
const LOAD_DISPLAY: Record<LoadStatus, { color: string; label: string }> = {
  optimal: { color: t['status-success'], label: 'Optimal' },
  undertraining: { color: t['status-warning'], label: 'Undertraining' },
  caution: { color: t['status-warning'], label: 'Caution' },
  danger: { color: t['status-error'], label: 'High Risk' },
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: '700',
        color: t['text-tertiary'],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
      }}
    >
      {title}
    </Text>
  )
}

function MetricPill({
  label,
  direction,
  delta,
}: {
  label: string
  direction: TrendDirection
  delta: number
}) {
  const color = trendColor(direction)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Text style={{ color, fontSize: 12 }}>{TREND_GLYPH[direction]}</Text>
      <Text style={{ fontSize: 11, color: t['text-secondary'] }}>{label}</Text>
      <Text style={{ fontSize: 11, fontWeight: '600', color }}>
        {delta > 0 ? '+' : ''}
        {delta.toFixed(1)}%
      </Text>
    </View>
  )
}

interface ProgressionArrow {
  exerciseName: string
  velocity: { direction: TrendDirection; deltaPercent: number }
  e1RM: { direction: TrendDirection; deltaPercent: number }
  volume: { direction: TrendDirection; deltaPercent: number }
}
interface PRBadge {
  type: 'max_weight' | 'max_reps' | 'max_velocity'
  value: number
}
interface Suggestion {
  exerciseName: string
  reason: string
}

/** Static faithful re-render of the mobile SessionDebrief. */
function SessionDebriefSpecimen({
  progressionArrows,
  acwr,
  loadStatus,
  suggestions,
  prBadges,
  recoveryMessage,
}: {
  progressionArrows: ProgressionArrow[]
  acwr: number
  loadStatus: LoadStatus
  suggestions: Suggestion[]
  prBadges: PRBadge[]
  recoveryMessage?: string
}) {
  const load = LOAD_DISPLAY[loadStatus]
  return (
    <View
      style={{
        width: 360,
        backgroundColor: t['surface-elevated'],
        borderRadius: 12,
        padding: 16,
        gap: 14,
      }}
    >
      {prBadges.length > 0 && (
        <View>
          <SectionHeader title="Personal Records" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {prBadges.map((b, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: alpha(t['status-warning'], 0.15),
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: t['status-warning'] }}>
                  {b.type === 'max_weight'
                    ? 'Max Weight'
                    : b.type === 'max_reps'
                      ? 'Max Reps'
                      : 'Max Velocity'}
                </Text>
                <Text style={{ fontSize: 11, color: t['text-secondary'] }}>
                  {b.type === 'max_velocity' ? b.value.toFixed(2) : Math.round(b.value)}{' '}
                  {b.type === 'max_velocity' ? 'm/s' : 'lbs'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {progressionArrows.length > 0 && (
        <View>
          <SectionHeader title="Progression" />
          {progressionArrows.map((a, i) => (
            <View key={i} style={{ marginTop: i > 0 ? 8 : 0 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: t['text-primary'],
                  marginBottom: 2,
                }}
              >
                {a.exerciseName}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <MetricPill
                  label="Velocity"
                  direction={a.velocity.direction}
                  delta={a.velocity.deltaPercent}
                />
                <MetricPill label="e1RM" direction={a.e1RM.direction} delta={a.e1RM.deltaPercent} />
                <MetricPill
                  label="Volume"
                  direction={a.volume.direction}
                  delta={a.volume.deltaPercent}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      <View>
        <SectionHeader title="Training Load" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: load.color }} />
          <Text style={{ fontSize: 13, color: t['text-primary'] }}>ACWR {acwr.toFixed(2)}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: load.color }}>{load.label}</Text>
        </View>
      </View>

      {suggestions.length > 0 && (
        <View>
          <SectionHeader title="Next Session" />
          {suggestions.map((s, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: i > 0 ? 4 : 0,
              }}
            >
              <Text style={{ color: t['brand-primary'], fontSize: 12 }}>→</Text>
              <Text style={{ fontSize: 13, color: t['text-primary'] }}>{s.exerciseName}</Text>
              <Text style={{ fontSize: 11, color: t['text-tertiary'] }}>{s.reason}</Text>
            </View>
          ))}
        </View>
      )}

      {recoveryMessage && (
        <View
          style={{
            backgroundColor: alpha(t['status-warning'], 0.08),
            borderRadius: 8,
            padding: 10,
          }}
        >
          <Text style={{ fontSize: 12, color: t['text-secondary'] }}>{recoveryMessage}</Text>
        </View>
      )}
    </View>
  )
}

const meta: Meta<typeof SessionDebriefSpecimen> = {
  title: 'Lab/SessionReview/SessionDebrief',
  component: SessionDebriefSpecimen,
  tags: ['status:lab', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Post-workout debrief: PR badges, ' +
          'per-exercise progression arrows (velocity/e1RM/volume), ACWR training-load status, ' +
          'next-session suggestions, and a recovery note. titan has no debrief-composite equivalent. ' +
          'Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SessionDebriefSpecimen>

export const FullDebrief: Story = {
  args: {
    acwr: 1.15,
    loadStatus: 'optimal',
    prBadges: [
      { type: 'max_weight', value: 225 },
      { type: 'max_velocity', value: 0.71 },
    ],
    progressionArrows: [
      {
        exerciseName: 'Back Squat',
        velocity: { direction: 'up', deltaPercent: 4.2 },
        e1RM: { direction: 'up', deltaPercent: 2.8 },
        volume: { direction: 'up', deltaPercent: 6.1 },
      },
      {
        exerciseName: 'Bench Press',
        velocity: { direction: 'down', deltaPercent: -3.1 },
        e1RM: { direction: 'flat', deltaPercent: 0.2 },
        volume: { direction: 'up', deltaPercent: 1.5 },
      },
    ],
    suggestions: [{ exerciseName: 'Back Squat', reason: 'Increase load 5 lbs' }],
  },
}
export const HighRiskWithRecovery: Story = {
  args: {
    acwr: 1.62,
    loadStatus: 'danger',
    prBadges: [],
    progressionArrows: [],
    suggestions: [{ exerciseName: 'Deadlift', reason: 'Deload recommended' }],
    recoveryMessage: 'Acute:chronic ratio elevated 3 sessions running — consider a lighter week.',
  },
}
export const MinimalLoadOnly: Story = {
  args: {
    acwr: 0.95,
    loadStatus: 'undertraining',
    prBadges: [],
    progressionArrows: [],
    suggestions: [],
  },
}
