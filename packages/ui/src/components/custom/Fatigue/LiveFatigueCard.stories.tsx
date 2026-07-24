import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { LiveFatigueCard } from './LiveFatigueCard'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FATIGUE_STATES, WARMING_UP_MODEL } from './fatigue-mock'

const PAGE_BG = primitiveColors.charcoal[900]
const t = getSemanticColors('dark')

const meta: Meta<typeof LiveFatigueCard> = {
  title: 'Workout/Fatigue/Live Fatigue Card',
  component: LiveFatigueCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The vertical live fatigue card — consumes one `LiveFatigueModel`. Composes `VerdictHero` ' +
          '(RPE + verdict word) · `FatigueLights` (VEL/ROM/TEMPO dots) · `RomProgressionChart` · ' +
          '`GhostSpark` (tempo embedded), grounded on a `Surface` raised plane.',
      },
    },
  },
  argTypes: {
    width: { control: { type: 'number', min: 260, max: 420, step: 2 } },
    revealChart: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof LiveFatigueCard>

const Frame = ({ children }: { children: React.ReactNode }) => (
  <View style={{ backgroundColor: PAGE_BG, padding: 28, alignItems: 'flex-start' }}>
    {children}
  </View>
)

/** The default (form breaking down) card, ghost-spark revealed. */
export const Default: Story = {
  args: { model: FATIGUE_STATES[3].model, width: 318, height: 508, revealChart: true },
  render: (args) => (
    <Frame>
      <LiveFatigueCard {...args} />
    </Frame>
  ),
}

/** The four verdict states side by side — the whole spectrum. */
export const States: Story = {
  render: () => (
    <View
      style={{
        backgroundColor: PAGE_BG,
        padding: 28,
        flexDirection: 'row',
        gap: 20,
        alignItems: 'flex-start',
      }}
    >
      {FATIGUE_STATES.map((s) => (
        <View key={s.name} style={{ gap: 8 }}>
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
          <LiveFatigueCard model={s.model} width={300} height={500} revealChart />
        </View>
      ))}
    </View>
  ),
}

/** Warming up — a cold-start set (< 2 reps): neutral verdict, em-dash RPE, no reference lines. */
export const WarmingUp: Story = {
  render: () => (
    <Frame>
      <LiveFatigueCard model={WARMING_UP_MODEL} width={318} height={508} />
    </Frame>
  ),
}
