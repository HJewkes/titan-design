// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the R2 dashboard harness's live-view
// subcomponent (voltras-mcp, branch feat/VMCP-r2-react-harness), ported in for
// the component-direction review (see packages/ui/MATURITY.md). The needle
// transition is stripped — this shows the LOOK only, in a still state.
//
// Source:   voltras-mcp/src/dashboard/spa/r2/status.tsx (FatigueMeter) + r2.css `.r2-fmeter`
// Rating:   Medium · titan equiv: none real; the mobile FatigueGauge candidate (linear fill
//           bar, trend-colored) is a related but distinct shape — no needle, no fixed VL scale
// Why:      Zoned gradient track + sliding needle + VL10/20/30/stop scale markers, in a chunky
//           `size='wall'` density for the across-room glance. Prototypes a proposed size/density
//           prop rather than a fork.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

/** Static faithful re-render of the R2 FatigueMeter — zoned gradient + needle + VL scale. */
function FatigueMeterSpecimen({
  lossPct,
  size = 'wall',
}: {
  lossPct: number
  size?: 'md' | 'wall'
}) {
  const left = Math.min(98, (lossPct / 40) * 100)
  const trackHeight = size === 'wall' ? 22 : 14
  const needleHeight = size === 'wall' ? 32 : 20
  return (
    <View style={{ width: '100%', maxWidth: 420 }}>
      <View style={{ position: 'relative', height: needleHeight }}>
        <View
          style={{
            position: 'absolute',
            top: (needleHeight - trackHeight) / 2,
            left: 0,
            right: 0,
            height: trackHeight,
            borderRadius: trackHeight / 2,
            backgroundColor: '#2ed573',
            overflow: 'hidden',
            flexDirection: 'row',
          }}
        >
          {['#2ed573', '#ffd43b', '#ffa502', '#ff4757'].map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: `${left}%`,
            width: 4,
            height: needleHeight,
            borderRadius: 2,
            backgroundColor: '#fff',
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        {['fresh', 'VL10', 'VL20', 'VL30', 'stop'].map((label) => (
          <Text key={label} style={{ fontSize: 8, color: t['text-tertiary'] }}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  )
}

const meta: Meta<typeof FatigueMeterSpecimen> = {
  title: 'Lab/Candidates/R2Live/FatigueMeter',
  component: FatigueMeterSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (R2 dashboard harness → titan review). Zoned ' +
          'green→yellow→orange→red gradient track with a sliding needle and VL10/20/30/stop ' +
          'scale markers, in a chunky wall-glanceable density. Distinct from the mobile ' +
          '`FatigueGauge` candidate (linear fill bar, no needle). Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FatigueMeterSpecimen>

export const Fresh: Story = { args: { lossPct: 5, size: 'wall' } }
export const Vl20: Story = { args: { lossPct: 21, size: 'wall' } }
export const StopZone: Story = { args: { lossPct: 34, size: 'wall' } }
export const CompactMd: Story = { args: { lossPct: 15, size: 'md' } }
