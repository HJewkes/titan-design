// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/recording/LiveMetrics.tsx
// Rating:   High · titan equiv: none (no hero live-metrics readout)
// Why:      Hero live display during a set: huge rep count + RPE, a position
//           bar, Force/Velocity/VelLoss tiles, and a fatigue gradient bar.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

function getRPEColor(rpe: number): string {
  if (rpe <= 6) return t['status-success']
  if (rpe <= 7) return t['result-improve']
  if (rpe <= 8) return t['status-warning']
  if (rpe <= 9) return t['brand-primary']
  return t['status-error']
}

function StatTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: t['surface-input'], borderRadius: 12, padding: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: '500', color: t['text-disabled'], marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 24, fontWeight: '700', color: color ?? t['text-primary'] }}>
        {value}
      </Text>
    </View>
  )
}

interface LiveMetricsSpecimenProps {
  repCount: number
  rpe: number
  rir: number
  velocityLossPct: number
  positionPct: number
  force: number
  velocity: number
  weight: number
  statusMessage?: string
  compact?: boolean
}

/** Static re-render of LiveMetricsView (full + compact layouts). */
function LiveMetricsSpecimen({
  repCount,
  rpe,
  rir,
  velocityLossPct,
  positionPct,
  force,
  velocity,
  weight,
  statusMessage,
  compact,
}: LiveMetricsSpecimenProps) {
  const rpeColor = getRPEColor(rpe)

  if (compact) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 8,
          backgroundColor: 'rgba(63,63,70,0.5)',
          paddingHorizontal: 16,
          paddingVertical: 8,
          width: 320,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: t['text-tertiary'] }}>RPE</Text>
          <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '700', color: rpeColor }}>
            {rpe.toFixed(1)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: t['text-tertiary'] }}>RIR</Text>
          <Text
            style={{ marginLeft: 8, fontSize: 18, fontWeight: '700', color: t['text-primary'] }}
          >
            {rir >= 5 ? '5+' : `~${Math.round(rir)}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: t['text-tertiary'] }}>VL</Text>
          <Text
            style={{ marginLeft: 8, fontSize: 18, fontWeight: '700', color: t['text-primary'] }}
          >
            {velocityLossPct.toFixed(0)}%
          </Text>
        </View>
      </View>
    )
  }

  const fatigueColor =
    velocityLossPct > 30 ? '#ef4444' : velocityLossPct > 20 ? '#eab308' : '#22c55e'
  return (
    <View
      style={{ width: 340, backgroundColor: t['surface-elevated'], borderRadius: 16, padding: 24 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <Text style={{ fontWeight: '500', color: t['text-secondary'] }}>{weight} lbs</Text>
        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 3,
            backgroundColor: 'rgba(34,197,94,0.15)',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: t['status-success'] }}>
            CONCENTRIC
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 64, fontWeight: '700', color: t['brand-primary'] }}>
            {repCount}
          </Text>
          <Text style={{ fontSize: 16, color: t['text-tertiary'] }}>reps</Text>
        </View>
        <View style={{ width: 1, height: 96, backgroundColor: t['border-strong'] }} />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 48, fontWeight: '700', color: rpeColor }}>{rpe.toFixed(1)}</Text>
          <Text style={{ fontSize: 16, color: t['text-tertiary'] }}>RPE</Text>
          <Text style={{ marginTop: 4, fontSize: 13, color: t['text-disabled'] }}>
            {rir.toFixed(0)} RIR
          </Text>
        </View>
      </View>

      {statusMessage && (
        <View
          style={{
            marginBottom: 20,
            borderRadius: 16,
            padding: 14,
            backgroundColor: `${rpeColor}15`,
          }}
        >
          <Text style={{ textAlign: 'center', fontSize: 15, fontWeight: '700', color: rpeColor }}>
            {statusMessage}
          </Text>
        </View>
      )}

      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 13, color: t['text-tertiary'] }}>Position</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: t['text-secondary'] }}>
            {positionPct.toFixed(0)}%
          </Text>
        </View>
        <View
          style={{
            height: 12,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: t['background-subtle'],
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${Math.min(100, positionPct)}%`,
              borderRadius: 999,
              backgroundColor: t['brand-primary'],
            }}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatTile label="Force" value={String(Math.round(force))} />
        <StatTile label="Velocity" value={velocity.toFixed(2)} />
        <StatTile
          label="Vel Loss"
          value={`${velocityLossPct > 0 ? '-' : ''}${Math.round(velocityLossPct)}%`}
          color={rpeColor}
        />
      </View>

      <View style={{ marginTop: 16 }}>
        <View
          style={{ height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: '#3f3f46' }}
        >
          <View
            style={{
              height: '100%',
              width: `${Math.min(velocityLossPct, 50) * 2}%`,
              borderRadius: 999,
              backgroundColor: fatigueColor,
            }}
          />
        </View>
        <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, color: '#71717a' }}>Fresh</Text>
          <Text style={{ fontSize: 11, color: '#71717a' }}>Fatigued</Text>
        </View>
      </View>
    </View>
  )
}

const meta: Meta<typeof LiveMetricsSpecimen> = {
  title: 'Lab/Candidates/Live/LiveMetrics',
  component: LiveMetricsSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Hero live-set readout: huge ' +
          'rep count + RPE, position bar, Force/Velocity/VelLoss tiles, fatigue gradient bar — ' +
          'plus a compact inline-row variant. titan has no equivalent hero metrics block. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LiveMetricsSpecimen>

export const FullHero: Story = {
  args: {
    repCount: 7,
    rpe: 8.2,
    rir: 2,
    velocityLossPct: 22,
    positionPct: 64,
    force: 412,
    velocity: 0.47,
    weight: 185,
    statusMessage: 'Getting harder — stay focused',
  },
}
export const CompactRow: Story = {
  args: {
    repCount: 5,
    rpe: 7.4,
    rir: 3,
    velocityLossPct: 14,
    positionPct: 40,
    force: 380,
    velocity: 0.58,
    weight: 185,
    compact: true,
  },
}
