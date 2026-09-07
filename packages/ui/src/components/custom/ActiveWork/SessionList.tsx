// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Divider } from '../../ui/divider'
import { Typography } from '../Typography'
import { Eyebrow } from './Eyebrow'
import { SessionListItem, type SessionSummary } from './SessionListItem'

// React Native's `Role` union omits `'listbox'` and `'group'`, even though RNW
// passes both straight through to the DOM.
const LISTBOX_ROLE = 'listbox' as ViewProps['role']
const GROUP_ROLE = 'group' as ViewProps['role']

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

interface Period {
  label: string
  sessions: SessionSummary[]
}

/** The calendar month a session ended in, as the list's period label. */
export function sessionPeriod(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Undated'
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Consecutive sessions in the same month, in the order given. */
export function groupByPeriod(sessions: SessionSummary[]): Period[] {
  const periods: Period[] = []
  for (const session of sessions) {
    const label = sessionPeriod(session.ended)
    const last = periods[periods.length - 1]
    if (last && last.label === label) last.sessions.push(session)
    else periods.push({ label, sessions: [session] })
  }
  return periods
}

function PeriodDivider({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-2 pt-2" testID="session-period">
      <Typography variant="caption" className="leading-none text-text-tertiary">
        {label}
      </Typography>
      <Divider className="flex-1" />
    </View>
  )
}

/**
 * SessionList — the selectable list half of the session reader. Owns no
 * selection state: the host holds `selectedId` and pairs the list with a
 * `SessionDetail`, so the two can be laid out however the surface needs.
 * Sessions are grouped under a hairline divider per calendar month once the
 * list spans more than one.
 *
 * Composes {@link Eyebrow}, {@link Divider} and {@link SessionListItem}.
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
  const periods = useMemo(() => groupByPeriod(sessions), [sessions])
  const showPeriods = periods.length > 1
  return (
    <View className={cn('gap-2', className)}>
      <Eyebrow>{heading}</Eyebrow>
      <View className="gap-1" role={LISTBOX_ROLE} aria-label={heading}>
        {periods.map((period) => (
          <View key={period.label} className="gap-1" role={GROUP_ROLE} aria-label={period.label}>
            {showPeriods ? <PeriodDivider label={period.label} /> : null}
            {period.sessions.map((session) => (
              <SessionListItem
                key={session.id}
                session={session}
                now={now}
                selected={session.id === selectedId}
                onSelect={onSelect ? () => onSelect(session) : undefined}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}
