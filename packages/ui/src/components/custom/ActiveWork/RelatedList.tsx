import type { ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { EmptyState } from '../../ui/empty-state'
import { Eyebrow } from '../../ui/eyebrow'
import { Skeleton } from '../../ui/skeleton'
import { Typography } from '../../ui/typography'
import { GROUP_ROLE, LISTITEM_ROLE, LIST_ROLE } from './aria-roles'
import { RefChip } from './RefChip'
import { REF_KIND_META, REF_KIND_ORDER, type EntityRef, type RefKind } from './ref-kind'

/** The refs of one kind. */
export interface RefGroup {
  /** The kind every ref in the group has. */
  kind: RefKind
  /** The group's refs, in input order. */
  refs: EntityRef[]
}

/** Refs bucketed by kind, in `REF_KIND_ORDER`, keeping input order inside a group; empty kinds are dropped. */
export function groupRefsByKind(refs: readonly EntityRef[]): RefGroup[] {
  return REF_KIND_ORDER.map((kind) => ({ kind, refs: refs.filter((r) => r.kind === kind) })).filter(
    (group) => group.refs.length > 0
  )
}

/** Refs to group, and the list's states. */
export interface RelatedListProps {
  /** Refs of any kinds, in any order. */
  refs: readonly EntityRef[]
  /** Passed to every chip. Without it, chips with an `href` still navigate and the rest are static. */
  onPressRef?: (ref: EntityRef) => void
  /** Draws placeholder chips in place of the groups. */
  isLoading?: boolean
  /** Shown when `refs` is empty. Defaults to an `EmptyState`. */
  emptyState?: ReactNode
  /** Extra classes on the root. */
  className?: string
  /** Defaults to `related-list`; each chip is `ref-chip-<id>`. */
  testID?: string
}

function RefGroupSection({
  group,
  onPressRef,
}: {
  group: RefGroup
  onPressRef?: (ref: EntityRef) => void
}) {
  const { plural } = REF_KIND_META[group.kind]
  const count = group.refs.length
  return (
    <View role={GROUP_ROLE} aria-label={`${plural}, ${count}`} className="gap-stack-md">
      <View className="flex-row items-baseline gap-inline-sm">
        <Eyebrow className="text-text-secondary">{plural}</Eyebrow>
        <Typography variant="caption" className="text-text-secondary">
          {String(count)}
        </Typography>
      </View>
      <View role={LIST_ROLE} className="flex-row flex-wrap gap-inline-sm">
        {group.refs.map((ref) => (
          <View key={ref.id} role={LISTITEM_ROLE}>
            <RefChip {...ref} onPressRef={onPressRef} testID={`ref-chip-${ref.id}`} />
          </View>
        ))}
      </View>
    </View>
  )
}

function RelatedListSkeleton() {
  return (
    <View className="gap-stack-md" testID="related-list-loading">
      <Skeleton variant="text" width={64} accessibilityLabel="Loading related items" />
      <View className="flex-row flex-wrap gap-inline-sm">
        {[72, 96, 80].map((width) => (
          <Skeleton key={width} variant="rounded" width={width} height={20} borderRadius={999} />
        ))}
      </View>
    </View>
  )
}

const defaultEmptyState = (
  <EmptyState
    title="Nothing related"
    description="No other item links here yet."
    className="py-6"
  />
)

/**
 * RelatedList — a detail page's related panel: refs grouped by kind, each
 * group headed by its plural and a count, each ref a `RefChip`.
 */
export function RelatedList({
  refs,
  onPressRef,
  isLoading = false,
  emptyState = defaultEmptyState,
  className,
  testID = 'related-list',
}: RelatedListProps) {
  const groups = groupRefsByKind(refs)
  const body =
    groups.length === 0
      ? emptyState
      : groups.map((group) => (
          <RefGroupSection key={group.kind} group={group} onPressRef={onPressRef} />
        ))
  return (
    <View className={cn('gap-stack-lg', className)} testID={testID}>
      {isLoading ? <RelatedListSkeleton /> : body}
    </View>
  )
}
