import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { LiveFatiguePanel } from './LiveFatiguePanel'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FATIGUE_STATES, MOCK_MEAN_VELOCITIES, MOCK_HEADER } from './fatigue-mock'

const PAGE_BG = primitiveColors.charcoal[900]
const t = getSemanticColors('dark')

const meta: Meta<typeof LiveFatiguePanel> = {
  title: 'Workout/Fatigue/Live Fatigue Panel',
  component: LiveFatiguePanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The aligned **Live panel v2** — the primary loss-relative `VelocityHero` beside the vertical ' +
          '`LiveFatigueCard`, flooded by a `LiveAuraFrame` whose category tracks the verdict state. ' +
          'Composes `VelocityHero` (VelocityStrip + VL bands) · `LiveFatigueCard` (VerdictHero · ' +
          'FatigueLights · RomProgressionChart · GhostSpark) · `LiveAuraFrame`. The velocity hero data ' +
          'is passed separately (`velocity`) — it is not on the fatigue model.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LiveFatiguePanel>

/** THE aligned direction — a breaking-down rep 8, ghost-spark revealed. */
export const LivePanelV2: Story = {
  name: 'Live panel v2 (composition)',
  render: () => (
    <View style={{ backgroundColor: PAGE_BG, padding: 24 }}>
      <LiveFatiguePanel
        model={FATIGUE_STATES[3].model}
        velocity={{ velocities: MOCK_MEAN_VELOCITIES, targetReps: 8 }}
        header={MOCK_HEADER}
        revealChart
      />
    </View>
  ),
}

/** The whole system across the verdict spectrum — GOOD → SLOWING → GRINDING → FORM BREAKING DOWN. */
export const LiveStates: Story = {
  name: 'Live states (Good → Breaking down)',
  render: () => (
    <View style={{ backgroundColor: PAGE_BG }}>
      <View style={{ padding: 28, paddingBottom: 8, gap: 4 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '800',
            fontFamily: '"Space Grotesk", sans-serif',
            color: t['text-primary'],
          }}
        >
          Live-view states — the system across the fatigue spectrum
        </Text>
        <Text style={{ fontSize: 12, color: t['text-secondary'], maxWidth: 860, lineHeight: 18 }}>
          The live panel rendered per verdict state, each driven by a full plausible model — RPE,
          the three status dots, the control-aware ghost line, and the ROM progression all respond
          together. The aura flood tracks the state.
        </Text>
      </View>
      {FATIGUE_STATES.map((s) => {
        const liveRep = s.model.velocityCurves.length - 1
        return (
          <View key={s.name} style={{ gap: 6, paddingHorizontal: 28, paddingBottom: 22 }}>
            <Text
              style={{
                fontSize: 9,
                letterSpacing: 1,
                fontFamily: 'monospace',
                color: t['text-tertiary'],
              }}
            >
              {s.name}
            </Text>
            <LiveFatiguePanel
              model={s.model}
              velocity={{
                velocities: MOCK_MEAN_VELOCITIES.slice(0, s.current + 1),
                targetReps: 8,
                liveRepIndex: liveRep,
              }}
              header={{ ...MOCK_HEADER, meta: `SET 3 · REP ${s.current + 1} / 8` }}
              revealChart
            />
          </View>
        )
      })}
    </View>
  ),
}
