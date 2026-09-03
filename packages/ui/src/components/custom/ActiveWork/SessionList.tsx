// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Eyebrow } from './Eyebrow'
import { SessionListItem, type SessionSummary } from './SessionListItem'

// React Native's `Role` union has `'option'` but omits `'listbox'`, even though
// RNW passes it straight through to the DOM.
const LISTBOX_ROLE = 'listbox' as ViewProps['role']

export interface SessionListProps {
  /** Newest first is the expected order; the list renders what it is given. */
  sessions: SessionSummary[]
  /** Reference instant for the age labels, injected so renders are deterministic. */
  now: number
  selectedId?: string
  onSelect?: (session: SessionSummary) => void
  /** Heading over the list. Defaults to the session count. */
  label?: string
  className?: string
}

/**
 * SessionList — the selectable list half of the session reader. Owns no
 * selection state: the host holds `selectedId` and pairs the list with a
 * `SessionDetail`, so the two can be laid out however the surface needs.
 *
 * Composes {@link Eyebrow} and {@link SessionListItem}.
 */
export function SessionList({
  sessions,
  now,
  selectedId,
  onSelect,
  label,
  className,
}: SessionListProps) {
  const heading = label ?? `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}`
  return (
    <View className={cn('gap-2', className)}>
      <Eyebrow>{heading}</Eyebrow>
      <View className="gap-1" role={LISTBOX_ROLE} aria-label={heading}>
        {sessions.map((session) => (
          <SessionListItem
            key={session.id}
            session={session}
            now={now}
            selected={session.id === selectedId}
            onSelect={onSelect ? () => onSelect(session) : undefined}
          />
        ))}
      </View>
    </View>
  )
}
