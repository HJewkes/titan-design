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
          'Per-rep depth bars (silver at/above working → light red below working range → deep red below the short threshold), ' +
          'with dashed working-standard + short-threshold reference lines and a faint red short-zone. ' +
          'Data-driven from absolute metres; the bars carry the read alone (no caption strip). ' +
          'Composes the shared **SetBarChart** — same adaptive bar spacing as the velocity hero, and an optional ' +
          '`plannedReps` draws the remaining reps as dashed to-do placeholders (the "N of M done" read).',
      },
    },
  },
  argTypes: { barHeight: { control: { type: 'number', min: 24, max: 120, step: 2 } } },
}
export default meta
type Story = StoryObj<typeof RomProgressionChart>

/**
 * Mid-set with `plannedReps` — 4 of 10 done, the remaining 6 reps drawn as dashed to-do placeholders
 * (the velocity hero's "N of M" read, now on the ROM chart). The working-standard + short-threshold
 * lines still sit on-chart. Bars carry the shared SetBarChart adaptive spacing.
 */
export const PlannedToDo: Story = {
  render: () => (
    <View style={{ backgroundColor: PAGE_BG, padding: 28, gap: 22 }}>
      {[
        { name: 'MID-SET · 4 OF 10', done: 4 },
        { name: 'FIRST REP · 1 OF 10', done: 1 },
        { name: 'PLANNED · 0 OF 10', done: 0 },
      ].map((s) => (
        <View key={s.name} style={{ gap: 6, width: 320 }}>
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
            points={[0.92, 0.9, 0.86, 0.81, 0.77, 0.72]
              .slice(0, s.done)
              .map((romM, i) => ({ repNumber: i + 1, romM }))}
            workingStandardM={0.88}
            shortThresholdM={0.66}
            plannedReps={10}
          />
        </View>
      ))}
    </View>
  ),
}

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
