// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/ProgressionCard.tsx
// Rating:   High · titan equiv: none (no stacked metric-delta row exists)
// Why:      "vs Last Session" metric rows — each row pairs a value with a signed delta,
//           percent, and trend icon, and velocity inverts the up/down color convention
//           vs. e1RM/volume. titan has no comparable comparison-row primitive.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

type TrendDirection = 'up' | 'down' | 'flat'

interface MetricComparison {
  label: string
  current: number
  unit: string
  direction: TrendDirection
  delta: number
  deltaPercent: number
}

function getTrendGlyph(direction: TrendDirection): string {
  if (direction === 'up') return '↑'
  if (direction === 'down') return '↓'
  return '→'
}

function getTrendColor(direction: TrendDirection, isVelocity: boolean): string {
  if (direction === 'flat') return t['text-disabled']
  if (isVelocity) return direction === 'down' ? t['status-warning'] : t['status-success']
  return direction === 'up' ? t['status-success'] : t['status-warning']
}

function MetricRow({
  metric,
  isVelocity = false,
}: {
  metric: MetricComparison
  isVelocity?: boolean
}) {
  const color = getTrendColor(metric.direction, isVelocity)
  const glyph = getTrendGlyph(metric.direction)
  const sign = metric.delta > 0 ? '+' : ''

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: t['text-disabled'] }}>{metric.label}</Text>
        <Text style={{ fontSize: 17, fontWeight: '700', color: t['text-primary'] }}>
          {metric.current} {metric.unit}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 15, color }}>{glyph}</Text>
        <Text style={{ marginLeft: 4, fontWeight: '600', color }}>
          {sign}
          {metric.delta} ({sign}
          {metric.deltaPercent}%)
        </Text>
      </View>
    </View>
  )
}

interface ProgressionCardSpecimenProps {
  sinceLabel: string
  weight: number
  velocity: MetricComparison
  e1RM: MetricComparison
  volume: MetricComparison
}

/** Static re-render of the mobile ProgressionCard "vs Last Session" comparison. */
function ProgressionCardSpecimen({
  sinceLabel,
  weight,
  velocity,
  e1RM,
  volume,
}: ProgressionCardSpecimenProps) {
  return (
    <View
      style={{ width: 320, borderRadius: 16, padding: 16, backgroundColor: t['surface-elevated'] }}
    >
      <View
        style={{
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontWeight: '700', color: t['text-secondary'] }}>vs Last Session</Text>
        <Text style={{ fontSize: 12, color: t['text-disabled'] }}>{sinceLabel}</Text>
      </View>
      {weight > 0 && (
        <Text style={{ marginBottom: 8, fontSize: 12, color: t['text-disabled'] }}>
          @ {weight} lbs
        </Text>
      )}
      <MetricRow metric={velocity} isVelocity />
      <View
        style={{ marginVertical: 4, height: 1, backgroundColor: alpha(t['border-default'], 0.3) }}
      />
      <MetricRow metric={e1RM} />
      <View
        style={{ marginVertical: 4, height: 1, backgroundColor: alpha(t['border-default'], 0.3) }}
      />
      <MetricRow metric={volume} />
    </View>
  )
}

const meta: Meta<typeof ProgressionCardSpecimen> = {
  title: 'Lab/Candidates/Alerts/ProgressionCard',
  component: ProgressionCardSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). "vs Last Session" comparison ' +
          'card — velocity, e1RM, and volume rows each show a signed delta + trend glyph, with ' +
          'velocity inverting the usual up-good/down-bad color mapping. titan has no comparable ' +
          'stacked metric-delta primitive. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ProgressionCardSpecimen>

export const Improving: Story = {
  args: {
    sinceLabel: '3 days ago',
    weight: 185,
    velocity: {
      label: 'Avg Velocity',
      current: 0.58,
      unit: 'm/s',
      direction: 'up',
      delta: 0.06,
      deltaPercent: 12,
    },
    e1RM: { label: 'e1RM', current: 225, unit: 'lbs', direction: 'up', delta: 8, deltaPercent: 4 },
    volume: {
      label: 'Volume',
      current: 7400,
      unit: 'lbs',
      direction: 'up',
      delta: 420,
      deltaPercent: 6,
    },
  },
}

export const Regressing: Story = {
  args: {
    sinceLabel: '1 week ago',
    weight: 275,
    velocity: {
      label: 'Avg Velocity',
      current: 0.31,
      unit: 'm/s',
      direction: 'down',
      delta: -0.09,
      deltaPercent: -22,
    },
    e1RM: {
      label: 'e1RM',
      current: 315,
      unit: 'lbs',
      direction: 'down',
      delta: -10,
      deltaPercent: -3,
    },
    volume: {
      label: 'Volume',
      current: 5250,
      unit: 'lbs',
      direction: 'down',
      delta: -600,
      deltaPercent: -10,
    },
  },
}

export const Flat: Story = {
  args: {
    sinceLabel: '2 days ago',
    weight: 135,
    velocity: {
      label: 'Avg Velocity',
      current: 0.72,
      unit: 'm/s',
      direction: 'flat',
      delta: 0,
      deltaPercent: 0,
    },
    e1RM: {
      label: 'e1RM',
      current: 165,
      unit: 'lbs',
      direction: 'flat',
      delta: 0,
      deltaPercent: 0,
    },
    volume: {
      label: 'Volume',
      current: 3600,
      unit: 'lbs',
      direction: 'flat',
      delta: 0,
      deltaPercent: 0,
    },
  },
}
