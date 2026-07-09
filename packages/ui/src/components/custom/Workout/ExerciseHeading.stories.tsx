import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { ExerciseHeading } from './ExerciseHeading'

/**
 * `ExerciseHeading` — the exercise-heading info block (no strip): the name +
 * `ExerciseIndicator` title row over a tight `SetsRepsLoad` prescription line beside
 * the real `TempoDisplay` (`showLabel={false}`). The name row is the sole press
 * target; TempoDisplay is a sibling (it is itself a Pressable).
 */
const meta: Meta<typeof ExerciseHeading> = {
  title: 'Shell/SessionRail/ExerciseCardHeading/ExerciseHeading',
  component: ExerciseHeading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** The exercise-heading info block (no strip). Composes ' +
          '[ExerciseIndicator](?path=/docs/shell-sessionrail-exercisecardheading-exerciseheading-exerciseindicator--docs) + ' +
          '[SetsRepsLoad](?path=/docs/shell-sessionrail-exercisecardheading-exerciseheading-setsrepsload--docs) + ' +
          '[TempoDisplay](?path=/docs/shell-sessionrail-exercisecardheading-exerciseheading-tempodisplay--docs). ' +
          'Used-by ↑ [ExerciseCardHeading](?path=/docs/shell-sessionrail-exercisecardheading--docs).',
      },
    },
  },
  argTypes: {
    unit: { control: 'select', options: ['lbs', 'kg'] },
    indicator: { control: 'select', options: [undefined, 'pr', 'issue', 'info'] },
    dimmed: { control: 'boolean' },
    onPress: { action: 'press' },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 246, padding: 16, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ExerciseHeading>

export const Default: Story = {
  args: {
    name: 'Seated Cable Row',
    sets: 5,
    reps: 8,
    load: 145,
    unit: 'lbs',
    tempo: [3, 1, 2, 0],
    indicator: 'pr',
  },
}

export const NoTempoNoIndicator: Story = {
  args: { name: 'Incline DB Press', sets: 3, reps: 8, load: 70, unit: 'lbs' },
}

export const RepRange: Story = {
  args: {
    name: 'Face Pull',
    sets: 3,
    reps: '15-20',
    load: 40,
    unit: 'lbs',
    tempo: [2, 1, 2, 0],
    indicator: 'info',
  },
}

export const Dimmed: Story = {
  args: { ...Default.args, dimmed: true },
  parameters: {
    docs: { description: { story: 'Dimmed as a not-yet-reached exercise (standalone use).' } },
  },
}
