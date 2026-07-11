import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { SetTableHeader } from './SetTableHeader'

/**
 * 🚧 WIP / placeholder — `SetTableHeader` (exported as `SetTableHeader`; the generic
 * `TableHeader` name is taken by the DataViz `Table`). The expanded-set-table column
 * header row (SET · PREV · REPS · LOAD · RPE) whose widths mirror `SetRow`. Extracted
 * from `ExerciseCard`; the column set / widths are provisional pending the responsive
 * unification (TD-03.56).
 */
const meta: Meta<typeof SetTableHeader> = {
  title: 'Workout/SetTableHeader',
  component: SetTableHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** The expanded-set-table column header row; per-column widths mirror ' +
          '[SetRow](?path=/docs/workout-setrow--docs) so headers align over the rows. ' +
          'Used-by ↑ [ExerciseCard](?path=/docs/workout-exercisecard--docs) (expanded), which ' +
          'renders it with `showPrevious={false}`. ' +
          'Column set / widths provisional pending TD-03.56 responsive unification.',
      },
    },
  },
  argTypes: {
    unit: { control: 'select', options: ['lbs', 'kg'] },
    showPrevious: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <View style={{ width: 320, backgroundColor: '#131313' }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SetTableHeader>

export const Lbs: Story = {
  args: { unit: 'lbs' },
}

export const Kg: Story = {
  args: { unit: 'kg' },
  parameters: {
    docs: { description: { story: 'The weight column reflects the `kg` unit.' } },
  },
}

export const NoPrevious: Story = {
  args: { unit: 'lbs', showPrevious: false },
  parameters: {
    docs: {
      description: {
        story:
          'PREV dropped for rail density (`showPrevious={false}`); the column blanks to a flex ' +
          'spacer so REPS/LOAD/RPE hold their positions. Pair with `SetRow`’s `showPrevious`.',
      },
    },
  },
}
