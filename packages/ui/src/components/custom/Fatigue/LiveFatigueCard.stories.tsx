import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { LiveFatigueCard } from './LiveFatigueCard'
import { Surface } from '../../ui/surface/Surface'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FATIGUE_STATES, WARMING_UP_MODEL } from './fatigue-mock'

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
          '`GhostSpark` (tempo embedded). Grounded on the `Surface` **base** plane — one step ' +
          'above the `background` shell the live stage paints — separated by the alpha ' +
          '`hairline-default` edge and finished with the shared **paper** accent (matte grain + ' +
          'top rim-light + contact shadow), the hero-surface treatment from the surface north-star.',
      },
    },
  },
  argTypes: {
    width: { control: { type: 'number', min: 260, max: 420, step: 2 } },
  },
}
export default meta
type Story = StoryObj<typeof LiveFatigueCard>

/** The live stage the card actually sits on — the `background` shell plane, not a raw hex. */
const Frame = ({ children }: { children: React.ReactNode }) => (
  <Surface level="background" style={{ padding: 28, alignItems: 'flex-start' }}>
    {children}
  </Surface>
)

/** The default (form breaking down) card. */
export const Default: Story = {
  args: { model: FATIGUE_STATES[3].model, width: 318, height: 508 },
  render: (args) => (
    <Frame>
      <LiveFatigueCard {...args} />
    </Frame>
  ),
}

/** The four verdict states side by side — the whole spectrum. */
export const States: Story = {
  render: () => (
    <Surface
      level="background"
      style={{
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
          <LiveFatigueCard model={s.model} width={300} height={500} />
        </View>
      ))}
    </Surface>
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
