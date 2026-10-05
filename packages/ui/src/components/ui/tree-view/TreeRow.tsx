import {
  Pressable,
  View,
  type GestureResponderEvent,
  type NativeSyntheticEvent,
  type TargetedEvent,
} from 'react-native'
import { cn } from '../../../utils/cn'
import { ChevronRightIcon } from '../../icons'
import { Spinner } from '../spinner'
import { Typography } from '../typography'
import type { TreeRenderSlot } from './types'
import type { TreeKeyEvent, TreeRowProps } from './useTreeNavigation'

export type TreeDensity = 'comfortable' | 'dense'

/** One fixed row height per density, from the control sizes (`size.control` in semantic.ts). */
export const ROW_HEIGHT: Record<TreeDensity, number> = { comfortable: 40, dense: 32 }

const HEIGHT_CLASS: Record<TreeDensity, string> = {
  comfortable: 'h-control-md',
  dense: 'h-control-sm',
}

/** Indent per level: 16 px, step 4 of the 4 px numeric scale (`pl-4`). */
const INDENT_STEP = 16

export interface TreeRowViewProps<T> {
  row: TreeRowProps<T>
  density: TreeDensity
  isDisabled: boolean
  /** The id the trailing slot renders under, which the row names as its description (A2). */
  descriptionId: string
  renderLeading?: TreeRenderSlot<T>
  renderTrailing?: TreeRenderSlot<T>
  onKeyDown: (event: TreeKeyEvent) => void
  onBlur: (event: NativeSyntheticEvent<TargetedEvent>) => void
  /** Receives the row's host element, for scroll-then-focus. */
  onElement: (element: View | null) => void
}

function Expander<T>({ row }: { row: TreeRowProps<T> }) {
  if (row.isLoading) return <Spinner size="sm" className="h-4 w-4" />
  if (row.isExpanded === undefined) return null
  return (
    <View className={cn('text-text-secondary', row.isExpanded && 'rotate-90')}>
      <ChevronRightIcon size={16} />
    </View>
  )
}

/** The `treeitem` attributes, as direct DOM props: react-native-web drops `accessibilityState`. */
function ariaProps<T>(row: TreeRowProps<T>, describedBy: string | undefined) {
  return {
    role: 'treeitem' as const,
    'aria-label': row.node.label,
    'aria-level': row.level,
    'aria-setsize': row.setsize,
    'aria-posinset': row.posinset,
    'aria-expanded': row.isExpanded,
    'aria-selected': row.isSelected,
    'aria-busy': row.isLoading || undefined,
    'aria-describedby': describedBy,
    tabIndex: row.tabIndex,
  }
}

/** react-native-web's Pressable also presses on Enter's keyup; the hook has handled Enter on keydown. */
const isKeyPress = (event: GestureResponderEvent) =>
  (event as unknown as { type?: string }).type?.startsWith('key') === true

function rowClassName(density: TreeDensity, isSelected: boolean) {
  return cn(
    'flex-row items-center gap-inline-sm pr-2',
    HEIGHT_CLASS[density],
    isSelected ? 'bg-surface-raised' : 'web:hover:bg-interactive-hover',
    'web:outline-none web:focus-visible:ring-2 web:focus-visible:ring-inset web:focus-visible:ring-interactive-focus'
  )
}

/** Everything inside the row: expander, leading slot, label and the trailing description. */
function RowContent<T>({ row, density, isDisabled, renderLeading }: TreeRowViewProps<T>) {
  return (
    <>
      <Pressable
        aria-hidden
        tabIndex={-1}
        onPress={row.onToggle}
        className="h-6 w-6 items-center justify-center"
      >
        <Expander row={row} />
      </Pressable>
      {renderLeading?.(row.node)}
      <Typography
        variant={density === 'dense' ? 'caption' : 'body2'}
        color={isDisabled ? 'disabled' : 'primary'}
        maxLines={1}
        className="min-w-0 flex-1"
      >
        {row.node.label}
      </Typography>
    </>
  )
}

/** One `treeitem`: indent, expander, leading slot, label and the trailing description. */
export function TreeRow<T>(props: TreeRowViewProps<T>) {
  const { row, density, isDisabled, descriptionId, renderTrailing } = props
  const { onKeyDown, onBlur, onElement } = props
  const trailing = renderTrailing?.(row.node) ?? null
  return (
    <Pressable
      ref={onElement}
      {...ariaProps(row, trailing === null ? undefined : descriptionId)}
      {...{ onKeyDown }}
      onBlur={onBlur}
      onFocus={row.onFocus}
      onPress={(event) => {
        if (!isKeyPress(event)) row.onPress()
      }}
      // Pressable owns `aria-disabled`; `tabIndex` above keeps the row focusable while disabled.
      disabled={isDisabled}
      style={{ paddingLeft: (row.level - 1) * INDENT_STEP }}
      className={rowClassName(density, row.isSelected)}
    >
      <RowContent {...props} />
      {trailing !== null && <View nativeID={descriptionId}>{trailing}</View>}
    </Pressable>
  )
}
