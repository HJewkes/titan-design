import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { TaskTable } from './TaskTable'
import { TASK_LIST_FIXTURE, TASK_LIST_NOW } from './task-list-fixture'

/**
 * **T2 · Task table** — every open task across initiatives in one dense,
 * sortable grid.
 *
 * Composes `Table` at `density="dense"`, driven by `useTable` with per-column
 * comparators. Rows are `TaskRow`; the legend tallies `SeverityLabel`.
 */
const meta: Meta<typeof TaskTable> = {
  title: 'Custom/ActiveWork/TaskTable',
  component: TaskTable,
  args: {
    tasks: TASK_LIST_FIXTURE,
    now: TASK_LIST_NOW,
  },
  argTypes: {
    defaultSortKey: {
      control: 'select',
      options: ['priority', 'severity', 'updated', 'slug', 'id', 'title', 'estimate'],
    },
    hideLegend: { control: 'boolean' },
    severityDisplay: { control: 'inline-radio', options: ['auto', 'full', 'dot'] },
    now: { table: { disable: true } },
    tasks: { table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <View className="w-full max-w-[1100px] p-4">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Composes **Table** (density="dense") · **useTable** (comparators) · **TaskRow** · **SeverityLabel** · **Eyebrow**.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof TaskTable>

/** Default view: sorted by priority, lowest number first. */
export const Default: Story = {}

/**
 * Under 840px the severity column collapses to its dot (word on hover) so the
 * title keeps a scannable width. Driven by the table's own measured width, so
 * resize the canvas to watch it switch.
 */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <View className="w-full max-w-[760px]">
        <Story />
      </View>
    ),
  ],
}

/**
 * Sorted by severity. The comparator ranks critical→low by meaning, then breaks
 * ties on priority — an alphabetical sort would bury `low` between `high` and
 * `medium`.
 */
export const SortedBySeverity: Story = {
  args: { defaultSortKey: 'severity' },
}

/** Sorted by age, newest first — the direction that makes an age column useful. */
export const SortedByAge: Story = {
  args: { defaultSortKey: 'updated' },
}

/**
 * Sorted by estimate. `TP-16` and `C-6` are estimated; `AW-86` is not, and
 * unestimated rows sort last in both directions rather than reading as zero.
 */
export const SortedByEstimate: Story = {
  args: { defaultSortKey: 'estimate' },
}

/** Without the severity legend, for embedding under an existing header. */
export const NoLegend: Story = {
  args: { hideLegend: true },
}

/** Empty backlog — the grid keeps its header so the columns stay readable. */
export const Empty: Story = {
  args: { tasks: [] },
}
