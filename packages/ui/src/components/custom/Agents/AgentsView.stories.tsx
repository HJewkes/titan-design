import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Surface } from '../../ui/surface'
import { Switch } from '../../ui/switch'
import { Typography } from '../../ui/typography'
import { AgentCard } from './AgentCard'
import { AgentHoverCard } from './AgentHoverCard'
import { AgentRoster } from './AgentRoster'
import { AGENTS_MIXED, AGENTS_NOW, AGENT_BLOCKED, AGENT_WORKING } from './agent-fixture'
import type { AgentSummary } from './agent-metrics'
import { compareAgents, partitionAgents } from './agent-state'

/** Board rows another view would render; each names its assignee, and the name carries the hover card. */
const ASSIGNED = [
  { taskId: 'ORC-41', title: 'Reconcile the orchard ledger totals', agent: AGENT_WORKING },
  { taskId: 'ORC-57', title: 'Rotate the kiln schedule', agent: AGENT_BLOCKED },
]

function AssigneeRows() {
  return (
    <View className="gap-stack-sm">
      <Typography variant="microLabel" color="secondary">
        Board assignees
      </Typography>
      {ASSIGNED.map(({ taskId, title, agent }) => (
        <View key={taskId} className="flex-row flex-wrap items-center gap-inline-md">
          <Typography variant="mono" color="secondary">
            {taskId}
          </Typography>
          <Typography variant="body2" color="primary" className="flex-1">
            {title}
          </Typography>
          <AgentHoverCard agent={agent} now={AGENTS_NOW} placement="top">
            <Pressable accessibilityRole="link" onPress={() => {}}>
              <Typography variant="body2" color="primary" className="web:hover:underline">
                {agent.name}
              </Typography>
            </Pressable>
          </AgentHoverCard>
        </View>
      ))}
    </View>
  )
}

function CardGrid({ agents, selectedId }: { agents: AgentSummary[]; selectedId?: string }) {
  return (
    <View className="flex-row flex-wrap gap-inline-md">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          now={AGENTS_NOW}
          isHighlighted={agent.id === selectedId}
          className="w-[380px]"
        />
      ))}
    </View>
  )
}

/** The host holds the historical toggle and the selection; the grid and the roster share both. */
function AgentsView() {
  const [showPast, setShowPast] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>(AGENT_WORKING.id)
  const shown = useMemo(() => {
    const { live, past } = partitionAgents(AGENTS_MIXED)
    return showPast ? [...live, ...past] : live
  }, [showPast])
  const cards = useMemo(() => [...shown].sort(compareAgents), [shown])
  return (
    <View className="gap-section-sm">
      <Switch label="Show past agents" isChecked={showPast} onCheckedChange={setShowPast} />
      <View className="flex-row flex-wrap items-start gap-gutter-sm">
        <View className="min-w-[320px] flex-1">
          <CardGrid agents={cards} selectedId={selectedId} />
        </View>
        <View className="w-[360px] gap-section-sm">
          <AgentRoster
            agents={shown}
            now={AGENTS_NOW}
            selectedId={selectedId}
            onSelectedIdChange={setSelectedId}
            fields={['idle', 'cost']}
          />
          <AssigneeRows />
        </View>
      </View>
    </View>
  )
}

const meta: Meta = {
  title: 'Custom/Agents/AgentsView',
  tags: ['autodocs', 'status:candidate', '!status:review'],
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
          '**Composition** (no component of its own). The agents view as the console assembles ' +
          'it: a grid of [AgentCard](?path=/docs/custom-agents-agentcard--docs), an ' +
          '[AgentRoster](?path=/docs/custom-agents-agentroster--docs) beside it sharing one ' +
          'selection, and an [AgentHoverCard](?path=/docs/custom-agents-agenthovercard--docs) ' +
          'on the assignee of a board row. The historical toggle is host state that filters ' +
          'both the grid and the roster through `partitionAgents`; neither component owns it.',
      },
    },
  },
}
export default meta
type Story = StoryObj

export const Default: Story = {
  render: function Render() {
    return <AgentsView />
  },
}
