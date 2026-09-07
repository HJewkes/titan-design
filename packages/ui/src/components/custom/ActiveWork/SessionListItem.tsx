// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Tooltip, useHoverState } from '../../ui/tooltip'
import { DateTime } from '../DateTime'
import { Typography } from '../Typography'
import { formatSessionDuration, formatTaskAge } from './format-time'
import { extractTaskRefs } from './session-linkers'

/** One recorded session, as the session reader consumes it. */
export interface SessionSummary {
  id: string
  /** The session file's name, when the host has it. */
  filename?: string
  /** ISO timestamps. */
  started: string
  ended: string
  /** `canonical` is the mainline thread; anything else (`sidecar`, `adhoc`) is folded or parallel work. */
  track: string
  /** The log's first heading, without the leading `#`. */
  title: string
  /** The session log's markdown body. */
  body: string
}

export interface SessionListItemProps {
  session: SessionSummary
  /** Reference instant for the age label, injected so renders are deterministic. */
  now: number
  /** Renders the selected treatment (raised fill + leading accent bar). */
  selected?: boolean
  onSelect?: () => void
}

/** The row's footer as one string: age, wall-clock length, distinct tasks touched, and the track. */
export function sessionRowMeta(session: SessionSummary, now: number, taskCount: number): string {
  const parts = [formatTaskAge(session.ended, now)]
  const duration = formatSessionDuration(session.started, session.ended)
  if (duration) parts.push(duration)
  if (taskCount > 0) parts.push(`${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`)
  parts.push(session.track)
  return parts.join(' · ')
}

function MetaText({ children }: { children: ReactNode }) {
  return (
    <Typography variant="caption" className="leading-none text-text-tertiary">
      {children}
    </Typography>
  )
}

/**
 * A footer segment with a hover detail. The Tooltip is controlled and renders
 * no Pressable, so the row underneath keeps its press.
 */
function MetaHover({
  tip,
  testID,
  children,
}: {
  tip: ReactNode
  testID: string
  children: string
}) {
  const { hovered, hoverProps } = useHoverState()
  return (
    <Tooltip usePortal isOpen={hovered} content={tip}>
      <View {...hoverProps} testID={testID}>
        <MetaText>{children}</MetaText>
      </View>
    </Tooltip>
  )
}

/** The exact end time behind the relative age. */
export function ExactTime({ session }: { session: SessionSummary }) {
  return (
    <DateTime value={session.ended} format="datetime" isUTC variant="caption" color="primary" />
  )
}

/** The task ids behind the count. */
export function TaskIds({ refs }: { refs: string[] }) {
  return (
    <Typography variant="mono" className="text-text-primary">
      {refs.join(' ')}
    </Typography>
  )
}

function RowMeta({ session, now, refs }: { session: SessionSummary; now: number; refs: string[] }) {
  const duration = formatSessionDuration(session.started, session.ended)
  const count = refs.length
  return (
    <View className="flex-row flex-wrap items-center">
      <MetaHover tip={<ExactTime session={session} />} testID="session-age">
        {formatTaskAge(session.ended, now)}
      </MetaHover>
      {duration ? <MetaText>{` · ${duration}`}</MetaText> : null}
      {count > 0 ? (
        <>
          <MetaText>{' · '}</MetaText>
          <MetaHover tip={<TaskIds refs={refs} />} testID="session-task-count">
            {`${count} ${count === 1 ? 'task' : 'tasks'}`}
          </MetaHover>
        </>
      ) : null}
      <MetaText>{` · ${session.track}`}</MetaText>
    </View>
  )
}

/**
 * SessionListItem — one session in the reader's list, led by its title, with
 * a footer of age · duration · tasks touched · track. Hovering the age shows
 * the exact end time; hovering the task count lists the task ids.
 *
 * Composes {@link Tooltip} (controlled, so the row keeps its press),
 * {@link DateTime} and {@link Typography}. Used by {@link SessionList}.
 */
export function SessionListItem({
  session,
  now,
  selected = false,
  onSelect,
}: SessionListItemProps) {
  const refs = useMemo(() => extractTaskRefs(session.body), [session.body])
  return (
    <Pressable
      onPress={onSelect}
      // Raw `role`/`aria-selected` rather than `accessibilityState={{ selected }}`:
      // RNW silently drops the latter, so selection would never reach AT.
      role="option"
      aria-selected={selected}
      accessibilityLabel={`${session.title}, ${sessionRowMeta(session, now, refs.length)}`}
      testID="session-list-item"
      className={`relative gap-1 rounded-md px-3 py-2 ${selected ? 'bg-surface-raised' : ''}`}
    >
      {selected ? (
        <View
          testID="session-list-item-accent"
          className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-[3px] bg-brand-primary"
        />
      ) : null}
      <Typography variant="body2" numberOfLines={2} className="font-medium text-text-primary">
        {session.title}
      </Typography>
      <RowMeta session={session} now={now} refs={refs} />
    </Pressable>
  )
}
