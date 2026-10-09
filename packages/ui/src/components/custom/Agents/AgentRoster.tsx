import { useMemo, useRef, useState, type ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { useControllableState } from '../../../hooks/useControllableState'
import { useListNavigation, type ListNavigationKeyEvent } from '../../../hooks/useListNavigation'
import { cn } from '../../../utils/cn'
import { EmptyState } from '../../ui/empty-state'
import { Eyebrow } from '../../ui/eyebrow'
import { SkeletonListItem } from '../../ui/skeleton'
import { Typography } from '../../ui/typography'
import { AgentRosterRow } from './AgentRosterRow'
import type { AgentSummary } from './agent-metrics'
import { rosterGroups, type AgentRosterField } from './agent-roster'

// React Native's `Role` union omits both; RNW passes them straight through to the DOM.
const LISTBOX_ROLE = 'listbox' as ViewProps['role']
const GROUP_ROLE = 'group' as ViewProps['role']

const SKELETON_ROWS = 4

/** Props for {@link AgentRoster}. */
export interface AgentRosterProps {
  /** Every agent; duplicates by id collapse to the first, and the list sorts itself. */
  agents: AgentSummary[]
  /** Reference instant for the recency labels, injected so renders are deterministic. */
  now: number
  /** Controlled selection. */
  selectedId?: string
  /** Initial selection when uncontrolled. */
  defaultSelectedId?: string
  /** Called with the id of the row chosen by press, Enter or Space. */
  onSelectedIdChange?: (id: string | undefined) => void
  /** The details each row shows. */
  fields?: AgentRosterField[]
  /** Renders skeleton rows in place of the list. Map the broker's reconnect grace here, never to empty. */
  isLoading?: boolean
  /** Shown when `agents` is empty. Defaults to an `EmptyState`. */
  emptyState?: ReactNode
  /** Heading and accessible name of the list. */
  label?: string
  /** Tailwind overrides on the root. */
  className?: string
  /** Test id on the root. */
  testID?: string
}

/**
 * The roving tab stop: one stop for the list, on the selected row or the first. Arrows, Home and
 * End move focus without selecting. RNW presses an option on Enter but not on Space, so Space is
 * handled here. Rows register a guarded focus target, so a host re-sort while focus is elsewhere
 * never pulls focus into the list.
 */
function useRosterKeys(
  ids: string[],
  selectedId: string | undefined,
  onSelect: (id: string) => void
) {
  const listRef = useRef<View>(null)
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const activeIndex = [activeId, selectedId]
    .map((id) => (id === undefined ? -1 : ids.indexOf(id)))
    .find((index) => index !== -1)
  const navigation = useListNavigation({
    count: ids.length,
    activeIndex: activeIndex ?? 0,
    onActiveIndexChange: (index) => setActiveId(ids[index]),
    focusMode: 'roving',
    loop: false,
  })
  const listHasFocus = () => {
    const list = listRef.current as unknown as Node | null
    return typeof document !== 'undefined' && !!list?.contains(document.activeElement)
  }
  const getItemProps = (index: number) => {
    const { tabIndex, ref } = navigation.getItemProps(index)
    const focusRef = (node: unknown) =>
      ref(node == null ? null : { focus: () => listHasFocus() && focusNode(node) })
    return { tabIndex, focusRef }
  }
  const select = (id: string) => {
    setActiveId(id)
    onSelect(id)
  }
  const onKeyDown = (event: ListNavigationKeyEvent) => {
    const id = ids[activeIndex ?? 0]
    if (event.key !== ' ' || id === undefined) return navigation.onKeyDown(event)
    event.preventDefault()
    select(id)
  }
  return { listRef, onKeyDown, getItemProps, select }
}

function focusNode(node: unknown) {
  ;(node as { focus?: () => void }).focus?.()
}

function RosterSkeleton() {
  return (
    <View role={GROUP_ROLE} aria-label="Loading agents" aria-busy testID="agent-roster-loading">
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <SkeletonListItem key={i} avatarSize={24} lines={2} />
      ))}
    </View>
  )
}

const DEFAULT_EMPTY = (
  <EmptyState
    title="No agents"
    description="Agents appear here when a session registers with the broker."
  />
)

/**
 * The agents as a single-select listbox, live above past, each group sorted by state and then
 * recency. Tab enters at the selected row or the first; Up, Down, Home and End move focus; Enter,
 * Space or a press selects. Selection never follows focus.
 */
export function AgentRoster({
  agents,
  now,
  selectedId: selectedIdProp,
  defaultSelectedId,
  onSelectedIdChange,
  fields,
  isLoading = false,
  emptyState,
  label = 'Agents',
  className,
  testID = 'agent-roster',
}: AgentRosterProps) {
  const [selectedId, setSelectedId] = useControllableState<string | undefined>({
    value: selectedIdProp,
    defaultValue: defaultSelectedId,
    onChange: onSelectedIdChange,
  })
  const { live, past } = useMemo(() => rosterGroups(agents), [agents])
  const ordered = useMemo(() => [...live, ...past], [live, past])
  const ids = useMemo(() => ordered.map((agent) => agent.id), [ordered])
  const { listRef, onKeyDown, getItemProps, select } = useRosterKeys(ids, selectedId, setSelectedId)

  const renderGroup = (title: string, group: AgentSummary[], offset: number) =>
    group.length === 0 ? null : (
      <View role={GROUP_ROLE} aria-label={title} className="gap-stack-sm" key={title}>
        <Typography variant="microLabel" color="secondary" className="px-squish-x-md">
          {`${title} · ${group.length}`}
        </Typography>
        {group.map((agent, i) => (
          <AgentRosterRow
            key={agent.id}
            agent={agent}
            now={now}
            fields={fields}
            isSelected={agent.id === selectedId}
            onSelect={() => select(agent.id)}
            {...getItemProps(offset + i)}
          />
        ))}
      </View>
    )

  return (
    <View className={cn('gap-stack-md', className)} testID={testID}>
      <Eyebrow>{label}</Eyebrow>
      {isLoading ? (
        <RosterSkeleton />
      ) : ordered.length === 0 ? (
        (emptyState ?? DEFAULT_EMPTY)
      ) : (
        <View
          ref={listRef}
          role={LISTBOX_ROLE}
          aria-label={label}
          className="gap-stack-md"
          {...{ onKeyDown }}
        >
          {renderGroup('Live', live, 0)}
          {renderGroup('Past', past, live.length)}
        </View>
      )}
    </View>
  )
}
