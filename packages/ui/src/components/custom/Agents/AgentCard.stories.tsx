import type { Meta, StoryObj } from '@storybook/react-vite'
import { Surface } from '../../ui/surface'
import { AgentCard } from './AgentCard'
import {
  AGENTS_NOW,
  AGENT_AVAILABLE,
  AGENT_BARE,
  AGENT_BLOCKED,
  AGENT_DETACHED,
  AGENT_EXITED,
  AGENT_FAILED,
  AGENT_HOSTILE,
  AGENT_HUGE,
  AGENT_NON_FINITE,
  AGENT_NO_TRANSCRIPT,
  AGENT_PROVISIONAL,
  AGENT_RETIRED,
  AGENT_SPAWNING,
  AGENT_WORKING,
  AGENT_ZERO_CALLS,
} from './agent-fixture'

const AGENTS = {
  working: AGENT_WORKING,
  available: AGENT_AVAILABLE,
  blocked: AGENT_BLOCKED,
  spawning: AGENT_SPAWNING,
  detached: AGENT_DETACHED,
  exited: AGENT_EXITED,
  failed: AGENT_FAILED,
  'retired (history only)': AGENT_RETIRED,
  'no transcript': AGENT_NO_TRANSCRIPT,
  'zero calls': AGENT_ZERO_CALLS,
  provisional: AGENT_PROVISIONAL,
  bare: AGENT_BARE,
  huge: AGENT_HUGE,
  'non-finite': AGENT_NON_FINITE,
  hostile: AGENT_HOSTILE,
}

const meta: Meta<typeof AgentCard> = {
  title: 'Custom/Agents/AgentCard',
  component: AgentCard,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { agent: AGENT_WORKING, now: AGENTS_NOW, isLoading: false, isHighlighted: false },
  argTypes: {
    agent: { control: 'select', options: Object.keys(AGENTS), mapping: AGENTS },
    now: { control: false },
    isLoading: { control: 'boolean' },
    isHighlighted: { control: 'boolean' },
    onPress: { control: false },
    onPressTask: { control: false },
    metricsEmpty: { control: false },
    footer: { control: false },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen p-6">
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism.** One agent session: state, stated task, branch, recency, and the ' +
          "transcript's tokens, tool calls, errors, cost and activity. Composes " +
          '[Card](?path=/docs/components-molecules-card--docs), ' +
          '[AgentStateLabel](?path=/docs/custom-agents-agentstatelabel--docs), ' +
          '[Avatar](?path=/docs/components-atoms-avatar--docs), ' +
          '[Pill](?path=/docs/components-atoms-pill--docs), ' +
          '[SparkBars](?path=/docs/components-atoms-sparkbars--docs), ' +
          '[Progress](?path=/docs/components-molecules-progress--docs) and ' +
          '[Typography](?path=/docs/foundations-typography--docs). Use the `agent` control for ' +
          'every state: no transcript shows a notice, never zeros. There is no error state: the ' +
          'card holds no fetch, so the host renders a failed roster read with an Alert. There is ' +
          'no disabled state: the card is not a control.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AgentCard>

export const Default: Story = {
  render: (args) => <AgentCard {...args} className="max-w-[420px]" />,
}
