// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/analytics/charts/HorizontalBarChart.tsx
// Rating:   Medium · titan equiv: none (no labeled horizontal-bar distribution chart)
// Why:      Muscle-group set distribution — label + percent-fill bar + count. Was
//           already static in the mobile app (no gestures to strip).
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

interface HorizontalBarItem {
  label: string
  value: number
  percentage: number
  color?: string
}

const MUSCLE_COLORS: Record<string, string> = {
  quads: '#3B82F6',
  hamstrings: '#8B5CF6',
  glutes: '#EC4899',
  back: '#10B981',
  chest: '#F59E0B',
  shoulders: '#EF4444',
  biceps: '#06B6D4',
  triceps: '#F97316',
  core: '#84CC16',
  calves: '#A78BFA',
}

function formatMuscleGroup(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Static faithful re-render of the mobile HorizontalBarChart. */
function HorizontalBarChartSpecimen({ data }: { data: HorizontalBarItem[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  return (
    <View>
      {data.map((item) => {
        const fillPercent = (item.value / maxValue) * 100
        const color = item.color ?? MUSCLE_COLORS[item.label.toLowerCase()] ?? t['brand-primary']
        return (
          <View key={item.label} style={{ marginBottom: 12 }}>
            <View
              style={{
                marginBottom: 4,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '500', color: t['text-primary'] }}>
                {formatMuscleGroup(item.label)}
              </Text>
              <Text style={{ fontSize: 12, color: t['text-disabled'] }}>
                {item.value} sets ({item.percentage}%)
              </Text>
            </View>
            <View
              style={{
                height: 8,
                overflow: 'hidden',
                borderRadius: 999,
                backgroundColor: t['surface-elevated'],
              }}
            >
              <View
                style={{
                  height: '100%',
                  borderRadius: 999,
                  width: `${fillPercent}%`,
                  backgroundColor: color,
                }}
              />
            </View>
          </View>
        )
      })}
    </View>
  )
}

const meta: Meta<typeof HorizontalBarChartSpecimen> = {
  title: 'Lab/Candidates/Charts/HorizontalBarChart',
  component: HorizontalBarChartSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Labeled horizontal bars ' +
          'with set-count + percentage, colored per muscle group, used for training ' +
          'distribution. titan has no equivalent labeled-distribution chart. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HorizontalBarChartSpecimen>

export const MuscleGroupDistribution: Story = {
  args: {
    data: [
      { label: 'quads', value: 24, percentage: 28 },
      { label: 'back', value: 20, percentage: 23 },
      { label: 'chest', value: 16, percentage: 19 },
      { label: 'hamstrings', value: 12, percentage: 14 },
      { label: 'shoulders', value: 9, percentage: 10 },
      { label: 'core', value: 5, percentage: 6 },
    ],
  },
}
export const TwoItems: Story = {
  args: {
    data: [
      { label: 'glutes', value: 18, percentage: 60 },
      { label: 'calves', value: 12, percentage: 40 },
    ],
  },
}
export const CustomColorOverride: Story = {
  args: {
    data: [
      { label: 'biceps', value: 14, percentage: 50, color: t['status-success'] },
      { label: 'triceps', value: 14, percentage: 50, color: t['status-warning'] },
    ],
  },
}
