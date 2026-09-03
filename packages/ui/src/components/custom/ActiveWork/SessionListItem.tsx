// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { Pill } from '../../ui/pill'
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

/** The row's footer: age, wall-clock length, and how many distinct tasks the log touches. */
export function sessionRowMeta(session: SessionSummary, now: number, taskCount: number): string {
  const parts = [formatTaskAge(session.ended, now)]
  const duration = formatSessionDuration(session.started, session.ended)
  if (duration) parts.push(duration)
  if (taskCount > 0) parts.push(`${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`)
  return parts.join(' · ')
}

/**
 * SessionListItem — one session in the reader's list: when it ended, its
 * track, its title, and a footer of age · duration · tasks touched.
 *
 * Composes {@link DateTime}, {@link Pill} and {@link Typography}. Used by
 * {@link SessionList}.
 */
export function SessionListItem({
  session,
  now,
  selected = false,
  onSelect,
}: SessionListItemProps) {
  const taskCount = useMemo(() => extractTaskRefs(session.body).length, [session.body])
  const meta = sessionRowMeta(session, now, taskCount)
  return (
    <Pressable
      onPress={onSelect}
      // Raw `role`/`aria-selected` rather than `accessibilityState={{ selected }}`:
      // RNW silently drops the latter, so selection would never reach AT.
      role="option"
      aria-selected={selected}
      accessibilityLabel={`${session.title}, ${meta}`}
      testID="session-list-item"
      className={`relative gap-1 rounded-md px-3 py-2 ${selected ? 'bg-surface-raised' : ''}`}
    >
      {selected ? (
        <View
          testID="session-list-item-accent"
          className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-[3px] bg-brand-primary"
        />
      ) : null}
      <View className="flex-row items-center justify-between gap-2">
        <DateTime
          value={session.ended}
          format="short"
          isUTC
          variant="mono"
          className="font-bold text-text-primary"
        />
        <Pill
          variant="subtle"
          color={session.track === 'canonical' ? 'primary' : 'default'}
          size="xs"
        >
          {session.track}
        </Pill>
      </View>
      <Typography variant="body2" numberOfLines={2} className="text-xs text-text-secondary">
        {session.title}
      </Typography>
      <Typography variant="caption" className="text-text-tertiary">
        {meta}
      </Typography>
    </Pressable>
  )
}
