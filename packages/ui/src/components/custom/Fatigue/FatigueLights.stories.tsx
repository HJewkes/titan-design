import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { FatigueLights } from './FatigueLights'
import { greyRamp } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FATIGUE_STATES } from './fatigue-mock'

const PAGE_BG = greyRamp[975]
const t = getSemanticColors('dark')

const meta: Meta<typeof FatigueLights> = {
  title: 'Workout/Fatigue/Fatigue Lights',
  component: FatigueLights,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The three VEL/ROM/TEMPO "why" dots behind the verdict. Composes the shared `StatusDot` ' +
          '(glow) inside a `Tooltip` that reveals the dimension detail on hover. `dimensions === null` ' +
          '⇒ three neutral dots (warming up).',
      },
    },
  },
  argTypes: { spread: { control: 'boolean' } },
}
export default meta
type Story = StoryObj<typeof FatigueLights>

export const AcrossStates: Story = {
  render: () => (
    <View style={{ backgroundColor: PAGE_BG, padding: 28, gap: 18 }}>
      {FATIGUE_STATES.map((s) => (
        <View key={s.name} style={{ gap: 6 }}>
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
          <FatigueLights dimensions={s.model.verdict?.dimensions ?? null} />
        </View>
      ))}
      <View style={{ gap: 6 }}>
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 1,
            fontFamily: 'monospace',
            color: t['text-tertiary'],
          }}
        >
          WARMING UP
        </Text>
        <FatigueLights dimensions={null} />
      </View>
    </View>
  ),
}

/** Spread evenly across a fixed width (the in-card layout). */
export const Spread: Story = {
  render: () => (
    <View style={{ backgroundColor: PAGE_BG, padding: 28 }}>
      <View style={{ width: 280 }}>
        <FatigueLights dimensions={FATIGUE_STATES[3].model.verdict?.dimensions ?? null} spread />
      </View>
    </View>
  ),
}
