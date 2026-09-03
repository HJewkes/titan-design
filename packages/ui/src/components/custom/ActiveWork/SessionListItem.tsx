// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { Tooltip } from '../../ui/tooltip'
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

/** The row's footer: age, wall-clock length, distinct tasks touched, and the track. */
export function sessionRowMeta(session: SessionSummary, now: number, taskCount: number): string {
  const parts = [formatTaskAge(session.ended, now)]
  const duration = formatSessionDuration(session.started, session.ended)
  if (duration) parts.push(duration)
  if (taskCount > 0) parts.push(`${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`)
  parts.push(session.track)
  return parts.join(' · ')
}

/** What the row shows on hover: the untruncated title, the exact time, and the task ids. */
function RowHover({ session, refs }: { session: SessionSummary; refs: string[] }) {
  const duration = formatSessionDuration(session.started, session.ended)
  return (
    <View className="gap-1" testID="session-list-item-hover">
      <Typography variant="body2" className="text-text-primary">
        {session.title}
      </Typography>
      <View className="flex-row items-center gap-1">
        <DateTime
          value={session.ended}
          format="datetime"
          isUTC
          variant="caption"
          color="secondary"
        />
        {duration ? (
          <Typography variant="caption" className="text-text-secondary">
            {`· ${duration}`}
          </Typography>
        ) : null}
      </View>
      {refs.length > 0 ? (
        <Typography variant="mono" className="text-text-tertiary">
          {refs.join(' ')}
        </Typography>
      ) : null}
    </View>
  )
}

/**
 * SessionListItem — one session in the reader's list, led by its title, with
 * a footer of age · duration · tasks touched · track. Hovering the row shows
 * the full title, the exact end time and the task ids.
 *
 * One hover surface wraps the whole row rather than one per field: a Tooltip
 * is a Pressable, and nesting one inside the row would take the row's press.
 * The row's `option` role lives on that wrapper so it stays the listbox's
 * direct child.
 * Composes {@link Tooltip}, {@link DateTime} and {@link Typography}. Used by
 * {@link SessionList}.
 */
export function SessionListItem({
  session,
  now,
  selected = false,
  onSelect,
}: SessionListItemProps) {
  const refs = useMemo(() => extractTaskRefs(session.body), [session.body])
  const meta = sessionRowMeta(session, now, refs.length)
  return (
    // The option role sits on the Tooltip's outer view so the listbox's direct
    // child is the option; raw `role`/`aria-selected` because RNW drops
    // `accessibilityState={{ selected }}`.
    <Tooltip
      usePortal
      placement="right"
      content={<RowHover session={session} refs={refs} />}
      role="option"
      aria-selected={selected}
      accessibilityLabel={`${session.title}, ${meta}`}
      testID="session-list-item"
    >
      <Pressable
        onPress={onSelect}
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
        <Typography variant="caption" className="leading-none text-text-tertiary">
          {meta}
        </Typography>
      </Pressable>
    </Tooltip>
  )
}
