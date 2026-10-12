import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToolBadge } from './ToolBadge'
import { TOOL_FAMILY_ORDER } from './session-vocabulary'

const meta: Meta<typeof ToolBadge> = {
  title: 'Custom/Session/ToolBadge',
  component: ToolBadge,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { family: 'fs_read', size: 'md' },
  argTypes: {
    family: { control: 'select', options: [...TOOL_FAMILY_ORDER, 'future_family'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Atom.** A tool family as a one-character glyph in a neutral pill, named by the family ' +
          'label. Composes [Pill](?path=/docs/components-atoms-pill--docs). `future_family` shows ' +
          'the fallback to Other tool. Neutral on purpose: a tint per family needs new tokens ' +
          '(owner question C12). No loading, empty, error or disabled state: it renders one ' +
          'known value and is never interactive.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof ToolBadge>

export const Default: Story = {}
