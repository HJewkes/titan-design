import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Surface } from '../../ui/surface'
import { AgentRoster } from './AgentRoster'
import {
  AGENTS_DUPLICATE_IDS,
  AGENTS_EMPTY,
  AGENTS_LARGE,
  AGENTS_MIXED,
  AGENTS_NOW,
  AGENTS_ONE,
} from './agent-fixture'
import { AGENT_ROSTER_FIELDS } from './agent-roster'

const LISTS = {
  mixed: AGENTS_MIXED,
  one: AGENTS_ONE,
  empty: AGENTS_EMPTY,
  'duplicate ids': AGENTS_DUPLICATE_IDS,
  'large (200)': AGENTS_LARGE,
}

const meta: Meta<typeof AgentRoster> = {
  title: 'Custom/Agents/AgentRoster',
  component: AgentRoster,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    agents: AGENTS_MIXED,
    now: AGENTS_NOW,
    isLoading: false,
    fields: ['task', 'idle', 'cost'],
    onSelectedIdChange: fn(),
  },
  argTypes: {
    agents: { control: 'select', options: Object.keys(LISTS), mapping: LISTS },
    now: { control: false },
    isLoading: { control: 'boolean' },
    fields: { control: 'check', options: AGENT_ROSTER_FIELDS },
    selectedId: { control: 'text' },
    defaultSelectedId: { control: false },
    label: { control: 'text' },
    onSelectedIdChange: { control: false },
    emptyState: { control: false },
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
          '**Organism** (list). The agents as a single-select listbox, live above past, each ' +
          'group by state then recency; a duplicate id shows once. Composes ' +
          '[AgentRosterRow](?path=/docs/custom-agents-agentrosterrow--docs), ' +
          '[Typography](?path=/docs/foundations-typography--docs), ' +
          '[SkeletonListItem](?path=/docs/components-atoms-skeleton--docs) and ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs). Tab enters at the ' +
          'selected row or the first; Up, Down, Home and End move focus; Enter or Space selects. ' +
          'Use `isLoading` for the broker reconnect grace and the `agents` control for empty. ' +
          'There is no error state (no fetch: the host renders a failed read with an Alert) and ' +
          'no disabled state.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AgentRoster>

export const Default: Story = {
  render: (args) => <AgentRoster {...args} className="max-w-[420px]" />,
}
