// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/analytics/charts/TrainingLoadGauge.tsx
// Rating:   Medium · titan equiv: none (no ACWR zone-bar gauge)
// Why:      Acute:Chronic Workload Ratio shown as a 4-zone horizontal bar with a
//           position marker. Was already static in the mobile app (no gestures).
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

interface TrainingLoad {
  acwr: number
  status: 'undertraining' | 'optimal' | 'caution' | 'danger'
  acuteLoad: number
  chronicLoad: number
}

const STATUS_CONFIG: Record<TrainingLoad['status'], { color: string; label: string }> = {
  undertraining: { color: '#3B82F6', label: 'Undertraining' },
  optimal: { color: '#10B981', label: 'Optimal' },
  caution: { color: '#F59E0B', label: 'Caution' },
  danger: { color: '#EF4444', label: 'Overreaching' },
}

function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return String(Math.round(num))
}

/** Static faithful re-render of the mobile TrainingLoadGauge. */
function TrainingLoadGaugeSpecimen({ load, width }: { load: TrainingLoad; width: number }) {
  const config = STATUS_CONFIG[load.status]
  const barHeight = 12
  const padding = 4
  const barWidth = width - padding * 2
  const clampedRatio = Math.min(Math.max(load.acwr, 0), 2)
  const markerX = padding + (clampedRatio / 2) * barWidth

  return (
    <View>
      <View
        style={{
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: t['text-primary'] }}>
          ACWR: {load.acwr.toFixed(2)}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: config.color }}>{config.label}</Text>
      </View>
      <Svg width={width} height={barHeight + 8}>
        <Rect
          x={padding}
          y={4}
          width={barWidth * 0.4}
          height={barHeight}
          rx={2}
          fill="#3B82F6"
          opacity={0.3}
        />
        <Rect
          x={padding + barWidth * 0.4}
          y={4}
          width={barWidth * 0.25}
          height={barHeight}
          fill="#10B981"
          opacity={0.3}
        />
        <Rect
          x={padding + barWidth * 0.65}
          y={4}
          width={barWidth * 0.1}
          height={barHeight}
          fill="#F59E0B"
          opacity={0.3}
        />
        <Rect
          x={padding + barWidth * 0.75}
          y={4}
          width={barWidth * 0.25}
          height={barHeight}
          rx={2}
          fill="#EF4444"
          opacity={0.3}
        />
        <Rect x={markerX - 3} y={2} width={6} height={barHeight + 4} rx={3} fill={config.color} />
      </Svg>
      <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 9, color: t['text-disabled'] }}>0.0</Text>
        <Text style={{ fontSize: 9, color: t['text-disabled'] }}>0.8</Text>
        <Text style={{ fontSize: 9, color: t['text-disabled'] }}>1.3</Text>
        <Text style={{ fontSize: 9, color: t['text-disabled'] }}>2.0</Text>
      </View>
      <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: t['text-disabled'] }}>
          Acute: {formatCompact(load.acuteLoad)} lbs
        </Text>
        <Text style={{ fontSize: 12, color: t['text-disabled'] }}>
          Chronic: {formatCompact(load.chronicLoad)} lbs/wk
        </Text>
      </View>
    </View>
  )
}

const meta: Meta<typeof TrainingLoadGaugeSpecimen> = {
  title: 'Lab/Candidates/Charts/TrainingLoadGauge',
  component: TrainingLoadGaugeSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Acute:Chronic Workload ' +
          'Ratio rendered as a 4-zone horizontal bar (under/optimal/caution/overreaching) ' +
          'with a position marker. titan has no equivalent ACWR gauge. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TrainingLoadGaugeSpecimen>

export const Optimal: Story = {
  args: {
    load: { acwr: 1.05, status: 'optimal', acuteLoad: 12400, chronicLoad: 11800 },
    width: 300,
  },
}
export const Undertraining: Story = {
  args: {
    load: { acwr: 0.55, status: 'undertraining', acuteLoad: 6200, chronicLoad: 11200 },
    width: 300,
  },
}
export const Caution: Story = {
  args: {
    load: { acwr: 1.45, status: 'caution', acuteLoad: 15800, chronicLoad: 10900 },
    width: 300,
  },
}
export const Overreaching: Story = {
  args: {
    load: { acwr: 1.85, status: 'danger', acuteLoad: 20100, chronicLoad: 10870 },
    width: 300,
  },
}
