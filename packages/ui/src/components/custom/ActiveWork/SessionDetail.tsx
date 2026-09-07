// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Card } from '../../ui/card'
import { Collapse, CollapseButton, CollapseContent } from '../../ui/collapse'
import { Divider } from '../../ui/divider'
import { Pill } from '../../ui/pill'
import { Tooltip, useHoverState } from '../../ui/tooltip'
import { DateTime } from '../DateTime'
import { MarkdownProse } from '../Prose'
import { Typography } from '../Typography'
import { formatSessionDuration, formatTaskAge } from './format-time'
import { extractTaskRefs, sessionLinkers, type SessionLinkHandlers } from './session-linkers'
import { ExactTime, type SessionSummary } from './SessionListItem'
import { TaskTable, type TaskColumnKey } from './TaskTable'
import type { TaskListItem } from './TaskRow'

/** Task pills beyond this collapse into a `+N`, so a sprawling session cannot push the log off screen. */
const MAX_TASK_PILLS = 14

// The card already names the initiative context, and tags would crowd the title; the id column keeps the prefix.
const EMBEDDED_HIDDEN_COLUMNS: TaskColumnKey[] = ['slug', 'tags']

export interface SessionDetailProps extends SessionLinkHandlers {
  session: SessionSummary
  /** Reference instant for the age label, injected so renders are deterministic. */
  now: number
  /**
   * Task rows for the ids the log mentions, resolved by the host from its task
   * store. When given, the tasks-touched strip can expand into a table.
   */
  tasks?: TaskListItem[]
  className?: string
}

/** The body without its leading h1: the card header carries the title. */
export function stripLeadingHeading(body: string): string {
  const lines = body.split('\n')
  const first = lines.findIndex((line) => line.trim() !== '')
  if (first === -1 || !/^#\s/.test(lines[first]!.trim())) return body
  return lines.slice(first + 1).join('\n')
}

function AgeHover({ session, now }: { session: SessionSummary; now: number }) {
  const { hovered, hoverProps } = useHoverState()
  return (
    <Tooltip usePortal isOpen={hovered} content={<ExactTime session={session} />}>
      <View {...hoverProps} className="shrink-0" testID="session-age">
        <Typography variant="caption" className="leading-none text-text-tertiary">
          {formatTaskAge(session.ended, now)}
        </Typography>
      </View>
    </Tooltip>
  )
}

function SessionMeta({ session, now }: { session: SessionSummary; now: number }) {
  const duration = formatSessionDuration(session.started, session.ended)
  return (
    <View className="flex-row items-center gap-2.5">
      <DateTime
        value={session.ended}
        format="medium"
        isUTC
        variant="mono"
        className="shrink-0 text-text-secondary"
      />
      <AgeHover session={session} now={now} />
      {duration ? (
        <Typography variant="caption" className="shrink-0 leading-none text-text-tertiary">
          {`· ${duration}`}
        </Typography>
      ) : null}
      <Typography variant="mono" numberOfLines={1} className="shrink text-text-tertiary">
        {session.id}
      </Typography>
    </View>
  )
}

interface TasksTouchedProps {
  refs: string[]
  tasks: TaskListItem[]
  now: number
  onPressTask?: (id: string) => void
}

/** The strip of task pills; with task rows supplied it expands into a table. */
function TasksTouched({ refs, tasks, now, onPressTask }: TasksTouchedProps) {
  if (refs.length === 0) return null
  const shown = refs.slice(0, MAX_TASK_PILLS)
  const hidden = refs.length - shown.length
  return (
    <Collapse>
      <View className="flex-row flex-wrap items-center gap-1.5" testID="session-tasks-touched">
        <Typography variant="caption" className="leading-none text-text-tertiary">
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
          <Typography variant="caption" className="leading-none text-text-tertiary">
            {`+${hidden}`}
          </Typography>
        ) : null}
        {tasks.length > 0 ? (
          <CollapseButton
            className="ml-auto px-1 py-0"
            accessibilityLabel={`Show the ${tasks.length} tasks touched as a table`}
          />
        ) : null}
      </View>
      {tasks.length > 0 ? (
        <CollapseContent className="pt-2">
          <TaskTable
            tasks={tasks}
            now={now}
            hideLegend
            hideColumns={EMBEDDED_HIDDEN_COLUMNS}
            label={`${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} touched`}
          />
        </CollapseContent>
      ) : null}
    </Collapse>
  )
}

/**
 * SessionDetail — one session log, readable: its title, when it ran and for
 * how long, the tasks it touched (as pills, or as a table when the host
 * supplies the rows), then the markdown body with task ids, `[[name]]` links
 * and PR numbers auto-linked.
 *
 * Holds no selection state; pair it with {@link SessionList} in the host.
 * Composes {@link Card}, {@link Divider}, {@link Pill}, {@link Collapse},
 * {@link DateTime}, {@link TaskTable} and {@link MarkdownProse}.
 */
export function SessionDetail({
  session,
  now,
  tasks = [],
  onPressTask,
  onPressLink,
  onPressPr,
  className,
}: SessionDetailProps) {
  const refs = useMemo(() => extractTaskRefs(session.body), [session.body])
  const touched = useMemo(
    () => refs.map((id) => tasks.find((t) => t.id === id)).filter((t): t is TaskListItem => !!t),
    [refs, tasks]
  )
  const body = useMemo(() => stripLeadingHeading(session.body), [session.body])
  const linkers = useMemo(
    () => sessionLinkers({ onPressTask, onPressLink, onPressPr }),
    [onPressTask, onPressLink, onPressPr]
  )
  return (
    <Card variant="outline" className={cn('gap-3 p-5', className)} testID="session-detail">
      <View className="gap-2">
        <Typography variant="h5" className="text-text-primary">
          {session.title}
        </Typography>
        <SessionMeta session={session} now={now} />
        <TasksTouched refs={refs} tasks={touched} now={now} onPressTask={onPressTask} />
      </View>
      <Divider />
      <MarkdownProse body={body} linkers={linkers} testID="session-body" />
    </Card>
  )
}
