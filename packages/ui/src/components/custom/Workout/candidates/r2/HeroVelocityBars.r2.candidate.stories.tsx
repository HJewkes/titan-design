// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the R2 dashboard harness's live-view
// subcomponent (voltras-mcp, branch feat/VMCP-r2-react-harness), ported in for
// the component-direction review (see packages/ui/MATURITY.md). Live SSE
// streaming, the latest-bar pop animation, and DOM refs are stripped — this
// shows the LOOK only, in a still state.
//
// Source:   voltras-mcp/src/dashboard/spa/r2/herobars.tsx + r2.css `.r2-herobars`
// Rating:   High · titan equiv: VelocityStrip 'expanded' variant — compact (~100px,
//           info footer), cannot stretch to wall-hero proportions (component-audit.md gap)
// Why:      Full-height per-rep velocity bars for the across-room glance: value labels,
//           running-best reference line, dashed pending-rep placeholders. R2's Direction-C
//           synthesis labels this the candidate titan VelocityStrip 'hero' variant.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

const ZONE_COLOR: Record<string, string> = {
  strength: '#ff4757',
  'strength-speed': '#ffa502',
  power: '#ffd43b',
  speed: '#2ed573',
}
const ZONES: Array<{ id: string; min: number; max: number | null }> = [
  { id: 'strength', min: 0, max: 0.3 },
  { id: 'strength-speed', min: 0.3, max: 0.5 },
  { id: 'power', min: 0.5, max: 0.75 },
  { id: 'speed', min: 0.75, max: null },
]

function zoneColor(v: number): string {
  for (const z of ZONES) {
    if (v >= z.min && (z.max == null || v < z.max)) return ZONE_COLOR[z.id]
  }
  return t['text-tertiary']
}

/** Static faithful re-render of the R2 HeroVelocityBars — full-height per-rep bars. */
function HeroVelocityBarsSpecimen({
  velocities,
  targetReps,
}: {
  velocities: number[]
  targetReps: number
}) {
  const chartHeight = 190
  const best = velocities.length ? Math.max(...velocities) : 0
  const scale = Math.max(best * 1.1, 0.2)
  const refY = best > 0 ? chartHeight - (best / scale) * chartHeight * 0.94 : null
  return (
    <View
      style={{
        height: 220,
        paddingTop: 24,
        borderBottomWidth: 2,
        borderBottomColor: t['border-strong'],
      }}
    >
      <View style={{ height: chartHeight, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        {refY != null && (
          <View
            style={{
              position: 'absolute',
              left: 4,
              right: 4,
              top: refY,
              borderTopWidth: 1,
              borderStyle: 'dashed',
              borderTopColor: 'rgba(232,234,237,0.4)',
            }}
          >
            <Text
              style={{
                position: 'absolute',
                right: 0,
                top: -13,
                fontSize: 9,
                color: t['text-secondary'],
              }}
            >
              best {best.toFixed(2)}
            </Text>
          </View>
        )}
        {velocities.map((v, i) => (
          <View key={i} style={{ flex: 1, maxWidth: 48, alignItems: 'center' }}>
            <Text
              style={{ fontSize: 12, fontWeight: '800', color: t['text-primary'], marginBottom: 4 }}
            >
              {v.toFixed(2)}
            </Text>
            <View
              style={{
                width: '100%',
                minHeight: 4,
                height: Math.max((v / scale) * chartHeight * 0.94, 4),
                backgroundColor: zoneColor(v),
                borderTopLeftRadius: 5,
                borderTopRightRadius: 5,
              }}
            />
          </View>
        ))}
        {Array.from({ length: Math.max(0, targetReps - velocities.length) }, (_, k) => (
          <View key={`p${k}`} style={{ flex: 1, maxWidth: 48, alignItems: 'center' }}>
            <View
              style={{
                width: '100%',
                height: 6,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#33363d',
              }}
            />
          </View>
        ))}
      </View>
    </View>
  )
}

const meta: Meta<typeof HeroVelocityBarsSpecimen> = {
  title: 'Lab/Candidates/R2Live/HeroVelocityBars',
  component: HeroVelocityBarsSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (R2 dashboard harness → titan review). Full-height ' +
          'per-rep velocity bars for the wall glance, zone-colored, with a running-best reference ' +
          'line and dashed pending-rep placeholders. Candidate titan `VelocityStrip` "hero" variant — ' +
          'the real component cannot stretch to these proportions. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HeroVelocityBarsSpecimen>

export const MidSet: Story = {
  args: { velocities: [0.61, 0.58, 0.55], targetReps: 8 },
}
export const NearComplete: Story = {
  args: { velocities: [0.62, 0.6, 0.57, 0.54, 0.52, 0.5, 0.47], targetReps: 8 },
}
export const FatigueDecline: Story = {
  args: { velocities: [0.63, 0.6, 0.55, 0.5, 0.44, 0.38, 0.33, 0.29], targetReps: 8 },
}
