import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, type ViewProps } from 'react-native'
import { fn } from 'storybook/test'
import { Surface } from '../../ui/surface'
import { AgentRosterRow } from './AgentRosterRow'
import {
  AGENTS_NOW,
  AGENT_AVAILABLE,
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
import { AGENT_ROSTER_FIELDS } from './agent-roster'

const LISTBOX_ROLE = 'listbox' as ViewProps['role']

const AGENTS = {
  working: AGENT_WORKING,
  available: AGENT_AVAILABLE,
  blocked: AGENT_BLOCKED,
  exited: AGENT_EXITED,
  'retired (history only)': AGENT_RETIRED,
  'no transcript': AGENT_NO_TRANSCRIPT,
  bare: AGENT_BARE,
  huge: AGENT_HUGE,
  'non-finite': AGENT_NON_FINITE,
  hostile: AGENT_HOSTILE,
}

const meta: Meta<typeof AgentRosterRow> = {
  title: 'Custom/Agents/AgentRosterRow',
  component: AgentRosterRow,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    agent: AGENT_WORKING,
    now: AGENTS_NOW,
    isSelected: false,
    fields: ['task', 'idle', 'cost'],
    onSelect: fn(),
  },
  argTypes: {
    agent: { control: 'select', options: Object.keys(AGENTS), mapping: AGENTS },
    now: { control: false },
    isSelected: { control: 'boolean' },
    fields: { control: 'check', options: AGENT_ROSTER_FIELDS },
    onSelect: { control: false },
    trailing: { control: false },
    tabIndex: { control: false },
    focusRef: { control: false },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen p-6">
        <View role={LISTBOX_ROLE} aria-label="Agents" className="max-w-[420px]">
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
          '**Molecule** (row). One agent in a dense list: name, state and the chosen details, ' +
          'printed in a fixed order. With `onSelect` it is a listbox option, so the story wraps ' +
          'it in a listbox; without it the row is inert. Composes ' +
          '[Avatar](?path=/docs/components-atoms-avatar--docs), ' +
          '[AgentStateLabel](?path=/docs/custom-agents-agentstatelabel--docs) and ' +
          '[Typography](?path=/docs/foundations-typography--docs). Empty: a field the agent ' +
          'lacks is skipped, and a session with no transcript prints no metric field. Loading ' +
          'belongs to AgentRoster; error and disabled do not apply.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AgentRosterRow>

export const Default: Story = {}
