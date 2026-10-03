import type { Meta, StoryObj } from '@storybook/react-vite'
import { TaskStagePill } from './TaskStagePill'
import { TASK_STAGE_ORDER } from './task-stage'

const meta: Meta<typeof TaskStagePill> = {
  title: 'Custom/ActiveWork/TaskStagePill',
  component: TaskStagePill,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { stage: 'ready', size: 'sm' },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule** — the only renderer of a task stage outside the board columns. Composes ' +
          '[Pill](?path=/docs/components-atoms-pill--docs); label and tone come from the one stage table, ' +
          'and there is no tone prop. Loading, empty and error do not apply (a stage is always known); ' +
          'disabled does not apply (the pill is not a control).',
      },
    },
  },
  argTypes: {
    stage: { control: 'select', options: TASK_STAGE_ORDER },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    className: { control: false },
  },
}
export default meta

type Story = StoryObj<typeof TaskStagePill>

export const Default: Story = {}
