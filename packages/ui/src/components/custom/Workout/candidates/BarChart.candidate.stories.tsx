// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/analytics/charts/BarChart.tsx
// Rating:   Medium · titan equiv: none (no generic vertical SVG bar chart)
// Why:      Simple volume-trend bar chart with optional value labels — a plausible
//           generic-chart primitive for titan's analytics surfaces.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import Svg, { Rect, Line } from 'react-native-svg'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

interface BarChartDataPoint {
  label: string
  value: number
}

function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return String(Math.round(num))
}

/** Static faithful re-render of the mobile BarChart. */
function BarChartSpecimen({
  data,
  width,
  height,
  barColor = t['brand-primary'],
  showValues = false,
}: {
  data: BarChartDataPoint[]
  width: number
  height: number
  barColor?: string
  showValues?: boolean
}) {
  const padding = { top: 20, right: 8, bottom: 40, left: 8 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const max = Math.max(...data.map((d) => d.value), 1)
  const barWidth = Math.max((chartWidth / data.length) * 0.6, 4)
  const gap = (chartWidth - barWidth * data.length) / (data.length + 1)
  const bars = data.map((point, i) => {
    const x = padding.left + gap + i * (barWidth + gap)
    const barHeight = (point.value / max) * chartHeight
    const y = padding.top + chartHeight - barHeight
    return { x, y, width: barWidth, height: barHeight, ...point }
  })

  return (
    <View>
      <Svg width={width} height={height}>
        <Line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={width - padding.right}
          y2={padding.top + chartHeight}
          stroke={t['border-strong']}
          strokeWidth={1}
        />
        {bars.map((bar, i) => (
          <Rect
            key={i}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={Math.max(bar.height, 1)}
            rx={3}
            fill={barColor}
            opacity={0.9}
          />
        ))}
      </Svg>
      <View
        style={{
          position: 'absolute',
          bottom: 4,
          left: padding.left,
          right: padding.right,
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}
      >
        {data.map((point, i) => (
          <Text
            key={i}
            style={{ fontSize: 9, color: t['text-disabled'], textAlign: 'center' }}
            numberOfLines={1}
          >
            {point.label}
          </Text>
        ))}
      </View>
      {showValues &&
        bars.map((bar, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: bar.y - 16,
              left: bar.x - 4,
              width: bar.width + 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 8, color: t['text-secondary'], fontWeight: '600' }}>
              {formatCompact(bar.value)}
            </Text>
          </View>
        ))}
    </View>
  )
}

const meta: Meta<typeof BarChartSpecimen> = {
  title: 'Lab/Candidates/Charts/BarChart',
  component: BarChartSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Generic vertical SVG bar ' +
          'chart with baseline and optional value labels, used for volume trends. titan has ' +
          'no equivalent generic bar-chart primitive. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof BarChartSpecimen>

const weeklyVolume: BarChartDataPoint[] = [
  { label: 'W1', value: 8200 },
  { label: 'W2', value: 9450 },
  { label: 'W3', value: 7100 },
  { label: 'W4', value: 11300 },
  { label: 'W5', value: 10200 },
  { label: 'W6', value: 12850 },
]

export const WeeklyVolume: Story = { args: { data: weeklyVolume, width: 300, height: 160 } }
export const WithValueLabels: Story = {
  args: { data: weeklyVolume, width: 300, height: 160, showValues: true },
}
export const SparseData: Story = {
  args: {
    data: [
      { label: 'Mon', value: 4200 },
      { label: 'Thu', value: 5600 },
    ],
    width: 300,
    height: 160,
  },
}
export const CustomColor: Story = {
  args: {
    data: weeklyVolume,
    width: 300,
    height: 160,
    barColor: t['status-info'],
    showValues: true,
  },
}
