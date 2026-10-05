import { useId, type ReactNode } from 'react'
import { ScrollView, View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { EmptyState } from '../empty-state'
import { Skeleton } from '../skeleton'
import { Typography } from '../typography'
import { ROW_HEIGHT, TreeRow, type TreeDensity } from './TreeRow'
import type { TreeRenderSlot } from './types'
import { useRovingFocus } from './useRovingFocus'
import {
  useTreeNavigation,
  type TreeNavigation,
  type TreeNavigationOptions,
} from './useTreeNavigation'
import { useTreeWindow } from './useTreeWindow'

export interface TreeViewProps<T>
  extends Omit<ViewProps, 'children' | 'accessibilityLabel'>, TreeNavigationOptions<T> {
  /** Names the tree. */
  accessibilityLabel: string
  renderLeading?: TreeRenderSlot<T>
  /** Text-bearing trailing content; it becomes the row's description (A2). */
  renderTrailing?: TreeRenderSlot<T>
  /** Replaces the default `EmptyState` when there are no rows. */
  emptyState?: ReactNode
  /** Adds a notice row after the last row saying not every row is shown (A4). */
  isTruncated?: boolean
  truncatedNotice?: ReactNode
  /** Swaps the rows for skeleton rows. */
  isLoading?: boolean
  /** Fixed viewport height in px, which turns on windowing; without it every row mounts (A6). */
  height?: number
  density?: TreeDensity
  className?: string
}

const SKELETON_ROWS = 6

const DEFAULT_NOTICE = 'This list was cut short, so not every row is shown.'

function DefaultEmptyState() {
  return <EmptyState title="Nothing to show" description="This tree has no rows." />
}

function TreeSkeleton({ label, density }: { label: string; density: TreeDensity }) {
  return (
    <View role="tree" aria-label={label} aria-busy className="gap-stack-xs">
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <View key={i} style={{ height: ROW_HEIGHT[density] }} className="justify-center px-2">
          <Skeleton width={`${80 - (i % 3) * 15}%`} />
        </View>
      ))}
    </View>
  )
}

function TruncationNotice({ notice, density }: { notice: ReactNode; density: TreeDensity }) {
  return (
    <View style={{ height: ROW_HEIGHT[density] }} className="justify-center px-2">
      {typeof notice === 'string' ? (
        <Typography variant="caption" color="secondary" maxLines={1}>
          {notice}
        </Typography>
      ) : (
        notice
      )}
    </View>
  )
}

function navigationOptions<T>(props: TreeViewProps<T>): TreeNavigationOptions<T> {
  const { nodes, rootId, expandedIds, defaultExpandedIds, onExpandedChange } = props
  const { selectedId, defaultSelectedId, onSelect, revealId, onLoadChildren } = props
  const { loadingIds, isDisabled } = props
  return {
    ...{ nodes, rootId, expandedIds, defaultExpandedIds, onExpandedChange },
    ...{ selectedId, defaultSelectedId, onSelect, revealId, onLoadChildren, loadingIds },
    isDisabled,
  }
}

/** Every prop that is not the tree's own goes to the outer `View`. */
function viewProps<T>(props: TreeViewProps<T>): ViewProps {
  const rest: Record<string, unknown> = { ...props }
  const own = Object.keys(navigationOptions(props)).concat([
    'accessibilityLabel',
    'renderLeading',
    'renderTrailing',
    'emptyState',
    'isTruncated',
    'truncatedNotice',
    'isLoading',
    'height',
    'density',
    'className',
  ])
  own.forEach((key) => delete rest[key])
  return rest as ViewProps
}

interface RowsProps<T> {
  props: TreeViewProps<T>
  nav: TreeNavigation<T>
  range: { start: number; end: number }
  density: TreeDensity
}

function TreeRows<T>({ props, nav, range, density, roving }: RowsProps<T> & { roving: Roving }) {
  const descriptionBase = `tree-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return nav.rows.slice(range.start, range.end).map((row, i) => {
    const rowProps = nav.getRowProps(row)
    return (
      <TreeRow
        key={row.id}
        row={{ ...rowProps, onFocus: roving.focusIn(rowProps.onFocus) }}
        density={density}
        isDisabled={props.isDisabled ?? false}
        descriptionId={`${descriptionBase}-${range.start + i}`}
        renderLeading={props.renderLeading}
        renderTrailing={props.renderTrailing}
        onKeyDown={roving.keyDown(rowProps.onKeyDown)}
        onBlur={roving.onBlur}
        onElement={roving.elementFor(row.id)}
      />
    )
  })
}

type Roving = ReturnType<typeof rovingHandlers>

function rovingHandlers(focus: ReturnType<typeof useRovingFocus>) {
  return {
    focusIn: (onFocus: () => void) => () => {
      focus.onFocusIn()
      onFocus()
    },
    keyDown:
      (onKeyDown: (event: { key: string; preventDefault: () => void }) => void) =>
      (event: { key: string; preventDefault: () => void }) => {
        focus.follow()
        onKeyDown(event)
      },
    onBlur: focus.onBlur,
    elementFor: focus.elementFor,
  }
}

function TreeBody<T>(props: TreeViewProps<T>) {
  const { height, density = 'comfortable', isTruncated = false } = props
  const nav = useTreeNavigation(navigationOptions(props))
  const notices = isTruncated ? 1 : 0
  const { scrollRef, onScroll, reveal, ...win } = useTreeWindow(
    nav.rows.length + notices,
    ROW_HEIGHT[density],
    height
  )
  const roving = rovingHandlers(useRovingFocus(nav.rows, nav.focusedId, reveal))
  if (nav.rows.length === 0) return <>{props.emptyState ?? <DefaultEmptyState />}</>
  const tree = (
    <View
      role="tree"
      aria-label={props.accessibilityLabel}
      aria-disabled={props.isDisabled || undefined}
    >
      <View style={{ height: win.padBefore }} />
      <TreeRows {...{ props, nav, density, roving }} range={win} />
    </View>
  )
  const notice = isTruncated && win.end > nav.rows.length && (
    <TruncationNotice notice={props.truncatedNotice ?? DEFAULT_NOTICE} density={density} />
  )
  const body = [tree, notice, <View key="after" style={{ height: win.padAfter }} />]
  if (height === undefined) return <>{body}</>
  return (
    <ScrollView ref={scrollRef} style={{ height }} onScroll={onScroll} scrollEventThrottle={16}>
      {body}
    </ScrollView>
  )
}

/**
 * A windowed APG Tree View over a flat `parentId` list: one tab stop, arrow-key navigation, lazy
 * children and a trailing description per row. Selection never follows focus.
 */
export function TreeView<T>(props: TreeViewProps<T>) {
  const { isLoading, nodes, density = 'comfortable', className } = props
  const content = isLoading ? (
    <TreeSkeleton label={props.accessibilityLabel} density={density} />
  ) : nodes.length === 0 ? (
    (props.emptyState ?? <DefaultEmptyState />)
  ) : (
    <TreeBody {...props} />
  )
  return (
    <View {...viewProps(props)} className={cn('w-full', className)}>
      {content}
    </View>
  )
}
