// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/FatigueGauge.tsx
// Rating:   High · titan equiv: none (no green→red trend-driven fill bar)
// Why:      Session fatigue bar that recolors green→yellow→orange→red as the
//           velocity trend declines, paired with a signed velocity-delta label.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

type FatigueTrend = 'fresh' | 'moderate' | 'fatigued' | 'exhausted'

const TREND_LABEL: Record<FatigueTrend, string> = {
  fresh: 'Fresh',
  moderate: 'Moderate',
  fatigued: 'Fatigued',
  exhausted: 'Exhausted',
}

/** Colors map to the green→yellow→orange→red spectrum. */
const TREND_COLOR: Record<FatigueTrend, string> = {
  fresh: t['status-success'],
  moderate: '#A8C230',
  fatigued: t['status-warning'],
  exhausted: t['status-error'],
}

/** Static faithful re-render of the mobile FatigueGauge. */
function FatigueGaugeSpecimen({
  fatigueScore,
  trend,
  velocityDecline,
}: {
  fatigueScore: number
  trend: FatigueTrend
  velocityDecline: number
}) {
  const color = TREND_COLOR[trend]
  const label = TREND_LABEL[trend]
  const fillPct = Math.min(100, Math.max(0, fatigueScore))
  const deltaLabel =
    velocityDecline > 0
      ? `-${velocityDecline.toFixed(2)} m/s`
      : `+${Math.abs(velocityDecline).toFixed(2)} m/s`

  return (
    <View style={{ width: 280 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: t['text-secondary'] }}>
          Session Fatigue
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color }}>{label}</Text>
          <Text style={{ fontSize: 12, color: t['text-disabled'] }}>{deltaLabel}</Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 8,
          height: 8,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: t['surface-raised'],
        }}
      >
        <View
          style={{
            height: '100%',
            borderRadius: 999,
            width: `${fillPct}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  )
}

const meta: Meta<typeof FatigueGaugeSpecimen> = {
  title: 'Lab/Candidates/Live/FatigueGauge',
  component: FatigueGaugeSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Fill bar that recolors ' +
          'green→yellow→orange→red as session fatigue accumulates, paired with a signed ' +
          'velocity-delta readout. titan has no trend-driven recoloring fill bar. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FatigueGaugeSpecimen>

export const Low: Story = { args: { fatigueScore: 12, trend: 'fresh', velocityDecline: -0.03 } }
export const Mid: Story = { args: { fatigueScore: 48, trend: 'fatigued', velocityDecline: 0.14 } }
export const High: Story = { args: { fatigueScore: 86, trend: 'exhausted', velocityDecline: 0.31 } }
