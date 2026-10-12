import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusMark } from './StatusMark'
import { CODE_CHANGE_ORDER } from './code-status'

const meta: Meta<typeof StatusMark> = {
  title: 'Custom/Code/StatusMark',
  component: StatusMark,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { kind: 'worsened', delta: 340, isOverCutoff: false, size: 'sm' },
  argTypes: {
    kind: { control: 'select', options: CODE_CHANGE_ORDER },
    delta: { control: 'number' },
    isOverCutoff: { control: 'boolean' },
    size: { control: 'select', options: ['xs', 'sm', 'md'] },
    className: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** Composes [Pill](?path=/docs/components-atoms-pill--docs). The change vocabulary of ' +
          'the Code family. No loading, empty, error or disabled state: a mark is rendered only when its ' +
          'kind is known.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof StatusMark>

export const Default: Story = {}
