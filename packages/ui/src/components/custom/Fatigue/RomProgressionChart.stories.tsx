import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { RomProgressionChart } from './RomProgressionChart'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FATIGUE_STATES, WARMING_UP_MODEL } from './fatigue-mock'

const PAGE_BG = primitiveColors.charcoal[900]
const t = getSemanticColors('dark')

const meta: Meta<typeof RomProgressionChart> = {
  title: 'Workout/Fatigue/ROM Progression',
  component: RomProgressionChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Per-rep depth bars (silver → amber below working range → red below the short threshold), ' +
          'with dashed working-standard + short-threshold reference lines and a faint red short-zone. ' +
          'Data-driven from absolute metres; labelled "depth vs working range · now N%".',
      },
    },
  },
  argTypes: { barHeight: { control: { type: 'number', min: 24, max: 120, step: 2 } } },
}
export default meta
type Story = StoryObj<typeof RomProgressionChart>

export const AcrossStates: Story = {
  render: () => (
    <View style={{ backgroundColor: PAGE_BG, padding: 28, gap: 22 }}>
      {[...FATIGUE_STATES, { name: 'WARMING UP', current: 0, model: WARMING_UP_MODEL }].map((s) => (
        <View key={s.name} style={{ gap: 6, width: 300 }}>
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
          <RomProgressionChart
            points={s.model.romProgression}
            workingStandardM={s.model.romWorkingStandardM}
            shortThresholdM={s.model.romShortThresholdM}
          />
        </View>
      ))}
    </View>
  ),
}
