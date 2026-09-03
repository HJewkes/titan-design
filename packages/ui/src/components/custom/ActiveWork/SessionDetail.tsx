// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Card } from '../../ui/card'
import { Divider } from '../../ui/divider'
import { Pill } from '../../ui/pill'
import { DateTime } from '../DateTime'
import { MarkdownProse } from '../Prose'
import { Typography } from '../Typography'
import { formatSessionDuration, formatTaskAge } from './format-time'
import { extractTaskRefs, sessionLinkers, type SessionLinkHandlers } from './session-linkers'
import type { SessionSummary } from './SessionListItem'

/** Task pills beyond this collapse into a `+N`, so a sprawling session cannot push the log off screen. */
const MAX_TASK_PILLS = 14

export interface SessionDetailProps extends SessionLinkHandlers {
  session: SessionSummary
  /** Reference instant for the age label, injected so renders are deterministic. */
  now: number
  className?: string
}

function SessionHeader({ session, now }: { session: SessionSummary; now: number }) {
  const duration = formatSessionDuration(session.started, session.ended)
  return (
    <View className="flex-row items-center gap-2.5">
      <DateTime
        value={session.ended}
        format="medium"
        isUTC
        variant="mono"
        className="shrink-0 text-sm text-text-secondary"
      />
      <Typography variant="caption" className="shrink-0 text-text-tertiary">
        {formatTaskAge(session.ended, now)}
      </Typography>
      {duration ? (
        <Typography variant="caption" className="shrink-0 text-text-tertiary">
          {`· ${duration}`}
        </Typography>
      ) : null}
      <Typography variant="mono" numberOfLines={1} className="shrink text-text-tertiary">
        {session.id}
      </Typography>
    </View>
  )
}

function TasksTouched({
  refs,
  onPressTask,
}: {
  refs: string[]
  onPressTask?: (id: string) => void
}) {
  if (refs.length === 0) return null
  const shown = refs.slice(0, MAX_TASK_PILLS)
  const hidden = refs.length - shown.length
  return (
    <View className="flex-row flex-wrap items-center gap-1.5" testID="session-tasks-touched">
      <Typography variant="caption" className="text-text-tertiary">
        tasks touched
      </Typography>
      {shown.map((id) => (
        <Pill
          key={id}
          variant="subtle"
          color="primary"
          size="xs"
          onPress={onPressTask ? () => onPressTask(id) : undefined}
        >
          {id}
        </Pill>
      ))}
      {hidden > 0 ? (
        <Typography variant="caption" className="text-text-tertiary">
          {`+${hidden}`}
        </Typography>
      ) : null}
    </View>
  )
}

/**
 * SessionDetail — one session log, readable: when it ran and for how long,
 * the tasks it touched, then the markdown body with task ids, `[[name]]`
 * links and PR numbers auto-linked.
 *
 * Holds no selection state; pair it with {@link SessionList} in the host.
 * Composes {@link Card}, {@link Divider}, {@link Pill}, {@link DateTime} and
 * {@link MarkdownProse}.
 */
export function SessionDetail({
  session,
  now,
  onPressTask,
  onPressLink,
  onPressPr,
  className,
}: SessionDetailProps) {
  const refs = useMemo(() => extractTaskRefs(session.body), [session.body])
  const linkers = useMemo(
    () => sessionLinkers({ onPressTask, onPressLink, onPressPr }),
    [onPressTask, onPressLink, onPressPr]
  )
  return (
    <Card variant="outline" className={cn('gap-3.5 p-5', className)} testID="session-detail">
      <View className="gap-1.5">
        <SessionHeader session={session} now={now} />
        <TasksTouched refs={refs} onPressTask={onPressTask} />
      </View>
      <Divider />
      <MarkdownProse body={session.body} linkers={linkers} testID="session-body" />
    </Card>
  )
}
