import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { VerdictHero } from './VerdictHero'
import { greyRamp } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FATIGUE_STATES, WARMING_UP_MODEL } from './fatigue-mock'

const PAGE_BG = greyRamp[975]
const t = getSemanticColors('dark')

const meta: Meta<typeof VerdictHero> = {
  title: 'Workout/Fatigue/Verdict Hero',
  component: VerdictHero,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The card focal read: a big tone-flooded RPE number + the verdict word. RPE-led — no ' +
          'reps-in-reserve line. `verdict === null` renders a neutral "Warming up".',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof VerdictHero>

export const AcrossStates: Story = {
  render: () => (
    <View
      style={{
        backgroundColor: PAGE_BG,
        padding: 28,
        flexDirection: 'row',
        gap: 40,
        flexWrap: 'wrap',
      }}
    >
      {[
        ...FATIGUE_STATES.map((s) => ({ name: s.name, model: s.model })),
        { name: 'WARMING UP', model: WARMING_UP_MODEL },
      ].map((s) => (
        <View key={s.name} style={{ gap: 8, width: 240 }}>
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
          <VerdictHero rpe={s.model.rpe} verdict={s.model.verdict} />
        </View>
      ))}
    </View>
  ),
}
