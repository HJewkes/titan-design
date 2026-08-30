import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Table, TableBody } from '../Table'
import { TaskRow } from './TaskRow'
import { TASK_LIST_FIXTURE } from './task-list-fixture'

/**
 * **TaskRow** — one task as a dense grid row. Composes `TableRow`/`TableCell`,
 * so it must render inside a `Table` to pick up row semantics and density.
 */
const meta: Meta<typeof TaskRow> = {
  title: 'Custom/ActiveWork/TaskRow',
  component: TaskRow,
  args: {
    task: TASK_LIST_FIXTURE[0],
    ageLabel: '2d ago',
  },
  decorators: [
    (Story) => (
      <View className="w-full max-w-[1100px] p-4">
        <Table density="dense">
          <TableBody>
            <Story />
          </TableBody>
        </Table>
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Composes **TableRow** · **TableCell** · **SeverityLabel** · **Pill** · **Typography**.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof TaskRow>

export const Default: Story = {}

/** A critical task carrying more tags than the row shows — the rest collapse to a `+n`. */
export const CriticalWithOverflowingTags: Story = {
  args: { task: TASK_LIST_FIXTURE[2], ageLabel: 'today' },
}

/** No severity and no estimate: both columns hold an em-dash so the grid stays aligned. */
export const MissingSeverityAndEstimate: Story = {
  args: { task: TASK_LIST_FIXTURE[5], ageLabel: '29d ago' },
}

/** A title long enough to clip to one line rather than wrapping the row taller. */
export const LongTitle: Story = {
  args: { task: TASK_LIST_FIXTURE[0], ageLabel: '1d ago' },
}
