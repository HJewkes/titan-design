import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pressable, View } from 'react-native'
import { fn } from 'storybook/test'
import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { AgentHoverCard } from './AgentHoverCard'
import {
  AGENTS_NOW,
  AGENT_BARE,
  AGENT_BLOCKED,
  AGENT_EXITED,
  AGENT_HOSTILE,
  AGENT_HUGE,
  AGENT_NON_FINITE,
  AGENT_NO_TRANSCRIPT,
  AGENT_RETIRED,
  AGENT_WORKING,
} from './agent-fixture'

const AGENTS = {
  blocked: AGENT_BLOCKED,
  working: AGENT_WORKING,
  exited: AGENT_EXITED,
  'retired (history only)': AGENT_RETIRED,
  'no transcript': AGENT_NO_TRANSCRIPT,
  bare: AGENT_BARE,
  huge: AGENT_HUGE,
  'non-finite': AGENT_NON_FINITE,
  hostile: AGENT_HOSTILE,
}

const meta: Meta<typeof AgentHoverCard> = {
  title: 'Custom/Agents/AgentHoverCard',
  component: AgentHoverCard,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    agent: AGENT_BLOCKED,
    now: AGENTS_NOW,
    placement: 'right',
    isDisabled: false,
    defaultIsOpen: true,
    onOpenChange: fn(),
  },
  argTypes: {
    agent: { control: 'select', options: Object.keys(AGENTS), mapping: AGENTS },
    now: { control: false },
    placement: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
    isOpen: { control: 'boolean' },
    defaultIsOpen: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    openDelay: { control: 'number' },
    closeDelay: { control: 'number' },
    onOpenChange: { control: false },
    children: { control: false },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen p-6">
        <View className="py-[240px] pr-[360px]">
          <Story />
        </View>
      </Surface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Molecule.** An agent summary over a trigger, as a WAI-ARIA tooltip: hover or ' +
          'keyboard focus opens it, hover out or blur closes it, Escape closes it at once, and ' +
          'the open card describes the trigger. Composes a controlled, portalled ' +
          '[Tooltip](?path=/docs/components-molecules-tooltip--docs) and ' +
          '`AgentHoverCardContent`, which reuses the ' +
          '[AgentCard](?path=/docs/custom-agents-agentcard--docs) identity parts. The story ' +
          'opens with the card shown; Tab to the name or hover it after it closes. Empty: no ' +
          'transcript shows the notice, never zeros. Disabled: `isDisabled` never opens. ' +
          'Loading and error do not apply: it shows an agent the host already holds.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AgentHoverCard>

export const Default: Story = {
  render: (args) => (
    <AgentHoverCard {...args}>
      <Pressable accessibilityRole="link" onPress={() => {}} className="self-start">
        <Typography variant="body2" color="primary" className="web:hover:underline">
          {args.agent.name}
        </Typography>
      </Pressable>
    </AgentHoverCard>
  ),
}
