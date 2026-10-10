import type { Meta, StoryObj } from '@storybook/react-vite'
import { AgentStateLabel } from './AgentStateLabel'
import { AGENT_STATE_ORDER } from './agent-state'

const meta: Meta<typeof AgentStateLabel> = {
  title: 'Custom/Agents/AgentStateLabel',
  component: AgentStateLabel,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { state: 'working', isDnd: false, size: 'sm' },
  argTypes: {
    state: { control: 'select', options: AGENT_STATE_ORDER },
    isDnd: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'md'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** An agent state as a dot and its word, never colour alone. Composes ' +
          '[Indicator](?path=/docs/components-atoms-indicator--docs), ' +
          '[Typography](?path=/docs/foundations-typography--docs) and, for do not disturb, ' +
          '[Pill](?path=/docs/components-atoms-pill--docs). Loading, empty, error and disabled ' +
          'do not apply: it renders a state the host already holds.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AgentStateLabel>

export const Default: Story = {}
