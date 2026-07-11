// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/analytics/SetSummaryModal.tsx
// Rating:   Medium · titan equiv: none (no bottom-sheet set-complete drawer)
// Why:      "Set Complete!" drawer — 3-metric row, RPE-colored effort bar, velocity
//           tiles, tempo-phase grid. titan has no drawer/bottom-sheet primitive yet.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

function getEffortLabel(rpe: number): string {
  if (rpe >= 9.5) return 'Max Effort'
  if (rpe >= 8) return 'Very Hard'
  if (rpe >= 6.5) return 'Hard'
  return 'Moderate'
}
function getRPEColor(rpe: number): string {
  if (rpe >= 9) return t['status-error']
  if (rpe >= 7.5) return t['status-warning']
  return t['status-success']
}
function getRIRDescription(rir: number): string {
  if (rir <= 0) return 'Taken to failure.'
  if (rir <= 1) return `${rir} rep${rir === 1 ? '' : 's'} left in the tank.`
  return `${rir} reps in reserve — room to push.`
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: t['text-primary'] }}>{value}</Text>
      <Text style={{ fontSize: 12, color: t['text-disabled'], marginTop: 2 }}>{label}</Text>
    </View>
  )
}

function TempoStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontWeight: '700', color }}>{value.toFixed(1)}s</Text>
      <Text style={{ fontSize: 11, color: t['text-disabled'], marginTop: 2 }}>{label}</Text>
    </View>
  )
}

interface TempoBreakdown {
  eccentric: number
  pauseTop: number
  concentric: number
  pauseBottom: number
}

/** Static faithful re-render of the mobile SetSummaryModal (rendered inline, not overlaid). */
function SetSummaryModalSpecimen({
  repCount,
  rpe,
  rir,
  velocityLossPct,
  meanVelocity,
  avgTempo,
  tempoBreakdown,
}: {
  repCount: number
  rpe: number
  rir: number
  velocityLossPct: number
  meanVelocity: number
  avgTempo?: string
  tempoBreakdown?: TempoBreakdown
}) {
  return (
    <View
      style={{
        width: 340,
        backgroundColor: t['surface-elevated'],
        borderRadius: 20,
        paddingTop: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: t['background-subtle'],
          alignSelf: 'center',
          marginBottom: 12,
        }}
      />
      <Text
        style={{
          fontSize: 17,
          fontWeight: '700',
          color: t['text-primary'],
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        Set Complete!
      </Text>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 }}>
          <Metric value={String(repCount)} label="Reps" />
          <Metric value={rpe.toFixed(1)} label="RPE" />
          <Metric value={rir.toFixed(0)} label="RIR" />
        </View>

        <View
          style={{
            backgroundColor: t['surface-input'],
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', color: t['text-secondary'] }}>Effort</Text>
            <Text style={{ fontWeight: '700', color: t['text-primary'] }}>
              {getEffortLabel(rpe)}
            </Text>
          </View>
          <View
            style={{ height: 6, borderRadius: 3, backgroundColor: '#1C1C1C', overflow: 'hidden' }}
          >
            <View
              style={{
                height: '100%',
                width: `${rpe * 10}%`,
                borderRadius: 3,
                backgroundColor: getRPEColor(rpe),
              }}
            />
          </View>
          <Text style={{ marginTop: 12, fontSize: 13, color: t['text-disabled'] }}>
            {getRIRDescription(rir)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <View
            style={{ flex: 1, backgroundColor: t['surface-input'], borderRadius: 12, padding: 16 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: t['text-disabled'] }}>
              Velocity Loss
            </Text>
            <Text
              style={{ marginTop: 4, fontSize: 20, fontWeight: '700', color: t['text-primary'] }}
            >
              {velocityLossPct > 0 ? '-' : ''}
              {Math.abs(velocityLossPct).toFixed(0)}%
            </Text>
          </View>
          <View
            style={{ flex: 1, backgroundColor: t['surface-input'], borderRadius: 12, padding: 16 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: t['text-disabled'] }}>
              Avg Velocity
            </Text>
            <Text
              style={{ marginTop: 4, fontSize: 20, fontWeight: '700', color: t['text-primary'] }}
            >
              {meanVelocity.toFixed(2)}
            </Text>
          </View>
        </View>

        {tempoBreakdown && (
          <View
            style={{
              backgroundColor: t['surface-input'],
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}
            >
              <Text style={{ fontWeight: '700', color: t['text-secondary'] }}>Avg Tempo</Text>
              <Text style={{ fontWeight: '700', color: t['text-primary'] }}>
                {avgTempo ?? '0-0-0-0'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TempoStat value={tempoBreakdown.eccentric} label="Ecc" color={t['status-info']} />
              <TempoStat value={tempoBreakdown.pauseTop} label="Top" color={t['status-warning']} />
              <TempoStat
                value={tempoBreakdown.concentric}
                label="Con"
                color={t['status-success']}
              />
              <TempoStat
                value={tempoBreakdown.pauseBottom}
                label="Bot"
                color={t['text-secondary']}
              />
            </View>
          </View>
        )}
      </View>

      <View style={{ padding: 20, paddingTop: 0 }}>
        <View
          style={{
            alignItems: 'center',
            borderRadius: 16,
            paddingVertical: 20,
            backgroundColor: t['brand-primary-dark'],
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>Continue</Text>
        </View>
      </View>
    </View>
  )
}

const meta: Meta<typeof SetSummaryModalSpecimen> = {
  title: 'Lab/Candidates/Summary/SetSummaryModal',
  component: SetSummaryModalSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Bottom-sheet "Set Complete!" ' +
          'drawer: reps/RPE/RIR metrics, RPE-colored effort bar, velocity-loss tiles, and a 4-phase ' +
          'tempo grid. titan has no drawer/bottom-sheet primitive. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SetSummaryModalSpecimen>

export const WithTempo: Story = {
  args: {
    repCount: 8,
    rpe: 7.5,
    rir: 2,
    velocityLossPct: 18,
    meanVelocity: 0.52,
    avgTempo: '2-1-1-0',
    tempoBreakdown: { eccentric: 2.1, pauseTop: 0.9, concentric: 1.1, pauseBottom: 0.2 },
  },
}
export const NoTempoData: Story = {
  args: { repCount: 10, rpe: 6.5, rir: 3.5, velocityLossPct: 9, meanVelocity: 0.68 },
}
export const NearFailure: Story = {
  args: {
    repCount: 5,
    rpe: 9.5,
    rir: 0,
    velocityLossPct: 34,
    meanVelocity: 0.31,
    avgTempo: '3-0-2-0',
    tempoBreakdown: { eccentric: 3.2, pauseTop: 0.1, concentric: 2.3, pauseBottom: 0.1 },
  },
}
