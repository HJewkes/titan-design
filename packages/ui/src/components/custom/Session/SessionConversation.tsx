import { memo, useCallback, useInsertionEffect, useMemo, useRef, type ReactNode } from 'react'
import { ScrollView, View, type ViewProps } from 'react-native'
import { useControllableState } from '../../../hooks/useControllableState'
import { cn } from '../../../utils/cn'
import { EmptyState } from '../../ui/empty-state'
import { Skeleton, SkeletonText } from '../../ui/skeleton'
import { Typography } from '../../ui/typography'
import type { ProseLinker } from '../Prose'
import {
  buildConversationRows,
  dayKeyFor,
  isActiveQuery,
  searchTurns,
  type ConversationRow,
} from './conversation-model'
import {
  ConversationTurn,
  type ConversationLimits,
  type ConversationTurnProps,
  type SessionRoleLabels,
} from './ConversationTurn'
import { GapIndicator } from './GapIndicator'
import {
  CONVERSATION_LABEL,
  NO_TURNS_DESCRIPTION,
  NO_TURNS_TITLE,
  searchStatusLabel,
} from './session-vocabulary'
import type { TimelineMessage, TimelineToolCall, TimelineTurn } from './session-types'

/** Props for {@link SessionConversation}. */
export interface SessionConversationProps extends Omit<ViewProps, 'children'> {
  /** The session's turns, in order. Pass `SessionTimeline['turns']` as it comes. */
  turns: TimelineTurn[]
  /**
   * Plain text, matched case-insensitively against user and assistant text, tool names, input
   * summaries, file paths and error messages. Turns without it are dimmed, never removed, and
   * a closed tool group stays closed. Empty or whitespace dims nothing.
   */
  searchQuery?: string
  /** Controlled: the `turn.index` of every turn whose tool group is open. */
  expandedTurns?: number[]
  /** Uncontrolled: the turn indexes whose tool groups start open. */
  defaultExpandedTurns?: number[]
  /** Called with the next set of open turn indexes. */
  onExpandedTurnsChange?: (turnIndexes: number[]) => void
  /** Shows times in UTC rather than the runtime's zone; day changes follow the same zone. */
  isUTC?: boolean
  /** Replaces the speaker labels. */
  roleLabels?: SessionRoleLabels
  /** Reference patterns to link in assistant text. */
  linkers?: ProseLinker[]
  /** How much text and how many tool rows each turn mounts at once. */
  limits?: ConversationLimits
  /** Makes each tool row a button. */
  onToolCallPress?: (call: TimelineToolCall) => void
  /** Shown as an action on a message the read model cut at its cap. */
  onRequestFullText?: (message: TimelineMessage) => void
  /** Renders three skeleton turns and marks the region busy. */
  isLoading?: boolean
  /** Replaces the default empty state when `turns` is empty. */
  emptyState?: ReactNode
}

const NO_TURNS: number[] = []
const SKELETON_TURNS = [0, 1, 2]

function LoadingTurns() {
  return (
    <View className="gap-stack-lg py-stack-md" testID="session-conversation-loading">
      {SKELETON_TURNS.map((i) => (
        <View key={i} className="gap-stack-sm">
          <Skeleton variant="text" width="25%" />
          <Skeleton variant="rounded" height={56} />
          <SkeletonText lines={3} />
        </View>
      ))}
    </View>
  )
}

type SharedTurnProps = Pick<
  ConversationTurnProps,
  'isUTC' | 'roleLabels' | 'linkers' | 'limits' | 'onToolCallPress' | 'onRequestFullText'
>

interface RowProps {
  row: ConversationRow
  isOpen: boolean
  isDimmed: boolean
  onTurnToggle: (turnIndex: number, isOpen: boolean) => void
  shared: SharedTurnProps
}

/** Memoised so opening one tool group re-renders one turn, not 500. */
const Row = memo(function Row({ row, isOpen, isDimmed, onTurnToggle, shared }: RowProps) {
  if (row.kind === 'gap') {
    return (
      <GapIndicator
        durationMs={row.durationMs}
        resumedAtMs={row.resumedAtMs}
        showDate={row.showDate}
        isUTC={shared.isUTC}
      />
    )
  }
  const { turn } = row
  return (
    <ConversationTurn
      turn={turn}
      expanded={isOpen}
      onExpandedChange={(next) => onTurnToggle(turn.index, next)}
      isDimmed={isDimmed}
      showDate={row.showDate}
      {...shared}
    />
  )
})

function useExpandedTurns(props: SessionConversationProps) {
  const [expanded, setExpanded] = useControllableState({
    value: props.expandedTurns,
    defaultValue: props.defaultExpandedTurns ?? NO_TURNS,
    onChange: props.onExpandedTurnsChange,
  })
  const expandedRef = useRef(expanded)
  // Insertion effects run first, so a toggle in the same commit reads the newest set.
  useInsertionEffect(() => {
    expandedRef.current = expanded
  })
  const onTurnToggle = useCallback(
    (turnIndex: number, isOpen: boolean) => {
      const rest = expandedRef.current.filter((index) => index !== turnIndex)
      setExpanded(isOpen ? [...rest, turnIndex] : rest)
    },
    [setExpanded]
  )
  return { openSet: useMemo(() => new Set(expanded), [expanded]), onTurnToggle }
}

function SearchStatus({
  query,
  matched,
  total,
}: {
  query?: string
  matched: number
  total: number
}) {
  return (
    <View role="status" aria-live="polite" className="px-gutter-sm">
      {isActiveQuery(query) ? (
        <Typography variant="caption" color="secondary">
          {searchStatusLabel(matched, total)}
        </Typography>
      ) : null}
    </View>
  )
}

function ConversationList(props: SessionConversationProps) {
  const { turns, searchQuery, isUTC } = props
  const rows = useMemo(() => buildConversationRows(turns, dayKeyFor(isUTC)), [turns, isUTC])
  const search = useMemo(() => searchTurns(turns, searchQuery ?? ''), [turns, searchQuery])
  const { openSet, onTurnToggle } = useExpandedTurns(props)
  const { roleLabels, linkers, limits, onToolCallPress, onRequestFullText } = props
  const shared = useMemo<SharedTurnProps>(
    () => ({
      isUTC,
      roleLabels,
      linkers,
      limits,
      onToolCallPress,
      onRequestFullText,
    }),
    [isUTC, roleLabels, linkers, limits, onToolCallPress, onRequestFullText]
  )
  return (
    <>
      <SearchStatus query={searchQuery} matched={search.matched.size} total={search.total} />
      <ScrollView className="flex-1">
        <View
          role="list"
          aria-label={props.accessibilityLabel ?? CONVERSATION_LABEL}
          className="px-gutter-sm"
        >
          {rows.map((row) => {
            const turnIndex = row.kind === 'turn' ? row.turn.index : -1
            return (
              <View role="listitem" key={row.key}>
                <Row
                  row={row}
                  isOpen={openSet.has(turnIndex)}
                  isDimmed={row.kind === 'turn' && !search.matched.has(turnIndex)}
                  onTurnToggle={onTurnToggle}
                  shared={shared}
                />
              </View>
            )
          })}
        </View>
      </ScrollView>
    </>
  )
}

/**
 * An agent session read back as a conversation: each turn's opener, the assistant's text and one
 * tool group per turn, with the idle gaps the read model marked. Search dims the turns that do
 * not match and announces the count. `accessibilityLabel` names the list (default "Session
 * conversation"). Not virtualised: a closed tool group mounts no rows, and an
 * open one mounts at most `limits.toolRows`, which bounds a 500-turn session.
 */
export function SessionConversation(props: SessionConversationProps) {
  const {
    turns,
    isLoading = false,
    emptyState,
    className,
    accessibilityLabel,
    ...viewProps
  } = props
  const label = accessibilityLabel ?? CONVERSATION_LABEL
  const body = isLoading ? (
    <LoadingTurns />
  ) : turns.length === 0 ? (
    (emptyState ?? <EmptyState title={NO_TURNS_TITLE} description={NO_TURNS_DESCRIPTION} />)
  ) : (
    <ConversationList {...props} />
  )
  return (
    <View
      {...viewProps}
      aria-busy={isLoading}
      aria-label={isLoading || turns.length === 0 ? label : undefined}
      role={isLoading || turns.length === 0 ? 'region' : undefined}
      testID={viewProps.testID ?? 'session-conversation'}
      className={cn('flex-1 gap-stack-sm', className)}
    >
      {body}
    </View>
  )
}
