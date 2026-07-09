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
  title: 'Shell/SessionRail/ExpandedDrawer/TableHeader',
  component: SetTableHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**🚧 WIP / placeholder.** **Atom** (shell S3). The expanded-set-table column header ' +
          'row; per-column widths mirror [SetRow](?path=/docs/workout-setrow--docs) so headers ' +
          'align over the rows. Used-by ↑ ' +
          '[ExpandedDrawer](?path=/docs/shell-sessionrail-expandeddrawer--docs) and ' +
          '[ExerciseCard](?path=/docs/workout-exercisecard--docs) (expanded). ' +
          'Column set / widths provisional pending TD-03.56 responsive unification.',
      },
    },
  },
  argTypes: {
    unit: { control: 'select', options: ['lbs', 'kg'] },
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
