import { Pressable, View } from 'react-native'
import { Avatar } from '../../ui/avatar'
import { Pill } from '../../ui/pill'
import { Typography } from '../../ui/typography'
import { AgentStateLabel } from './AgentStateLabel'
import { agentLastEventLabel, type AgentSummary } from './agent-metrics'

/** Tags beyond this many collapse into a `+N` pill. */
const MAX_TAGS = 3

function AgentName({ agent, onPress }: { agent: AgentSummary; onPress?: () => void }) {
  const name = (
    <Typography variant="subtitle2" color="primary" className="web:break-all">
      {agent.name}
    </Typography>
  )
  return onPress ? (
    <Pressable accessibilityRole="link" onPress={onPress} className="web:hover:underline">
      {name}
    </Pressable>
  ) : (
    name
  )
}

export function AgentCardHeader({ agent, onPress }: { agent: AgentSummary; onPress?: () => void }) {
  return (
    <View className="flex-row items-start gap-inline-md">
      <Avatar
        size="sm"
        colorFromName={agent.name}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View className="flex-1 gap-stack-sm">
        <AgentName agent={agent} onPress={onPress} />
        {agent.isProvisional ? (
          <Typography variant="caption" color="secondary">
            Provisional name
          </Typography>
        ) : null}
      </View>
      <AgentStateLabel state={agent.state} isDnd={agent.isDnd} />
    </View>
  )
}

export function AgentCardTask({
  agent,
  onPressTask,
}: {
  agent: AgentSummary
  onPressTask?: (taskId: string) => void
}) {
  const { taskId, task } = agent
  return (
    <View className="flex-row flex-wrap items-center gap-inline-sm">
      {taskId ? (
        <Pill
          size="xs"
          onPress={onPressTask ? () => onPressTask(taskId) : undefined}
          accessibilityRole={onPressTask ? 'link' : undefined}
        >
          {taskId}
        </Pill>
      ) : null}
      <Typography variant="body2" color="secondary" className="flex-1">
        {task || 'No stated task'}
      </Typography>
    </View>
  )
}

function AgentCardTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  const hidden = tags.length - MAX_TAGS
  return (
    <View className="flex-row flex-wrap gap-inline-sm">
      {tags.slice(0, MAX_TAGS).map((tag) => (
        <Pill key={tag} size="xs" variant="outline">
          {tag}
        </Pill>
      ))}
      {hidden > 0 ? <Pill size="xs" variant="outline">{`+${hidden}`}</Pill> : null}
    </View>
  )
}

export function AgentCardMeta({ agent, now }: { agent: AgentSummary; now: number }) {
  return (
    <View className="gap-stack-sm">
      {agent.branch ? (
        <Typography variant="mono" color="secondary" className="web:break-all">
          {agent.branch}
        </Typography>
      ) : null}
      <Typography variant="caption" color="secondary">
        {`Last event ${agentLastEventLabel(agent.lastEventAt, now)}`}
      </Typography>
      <AgentCardTags tags={agent.tags ?? []} />
    </View>
  )
}
