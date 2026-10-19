import React, { useId } from 'react'
import { ScrollView, Text, View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { formatCompact } from '../../../utils/number-format'
import { useControllableState } from '../../../hooks/useControllableState'
import type { HitTargetLimit } from '../../../utils/hit-target'
import { Chip, type ChipColor, type ChipSize } from '../chip'
import { ChipGroupContext } from '../chip/chipGroupContext'
import { Skeleton } from '../skeleton'
import { indexForKey, tabStopIndex } from './chipGroupModel'
import { useRevealSelected, type RevealSelected } from './useRevealSelected'

/** One choice in a {@link ChipGroup}. */
export interface ChipGroupItem<T extends string = string> {
  /** The value reported through `onValueChange`. */
  value: T
  /** Text shown on the chip. */
  label: string
  /** Items matching this choice. Omitted when not known. */
  count?: number
  /** Disables this chip only. */
  isDisabled?: boolean
}

/** How a {@link ChipGroup} handles more chips than fit on one row. */
export type ChipGroupOverflow = 'wrap' | 'scroll'

/** Props of {@link ChipGroup}. */
export interface ChipGroupProps<T extends string = string> extends ViewProps {
  /** Accessible name of the group. Not drawn: the row sits under a heading or in a bar. */
  label: string
  /** The choices, in order. The first is the one `overflow="scroll"` pins. */
  items: ReadonlyArray<ChipGroupItem<T>>
  /** Controlled selected value. */
  value?: T
  /** Uncontrolled starting value. Defaults to the first item, so one chip is always selected. */
  defaultValue?: T
  /** Called with the newly selected value; never called for the chip already selected. */
  onValueChange?: (value: T) => void
  /** `wrap` flows onto more rows; `scroll` keeps one row, pins the first item and scrolls the rest. */
  overflow?: ChipGroupOverflow
  /** Chip size. */
  size?: ChipSize
  /** Colour of the selected chip. */
  color?: ChipColor
  /** Disables every chip. */
  isDisabled?: boolean
  /** Placeholder capsules while the choices load. */
  isLoading?: boolean
  /** Formats a count for display. Defaults to compact (`128.4k`); the accessible name keeps the exact count. */
  formatCount?: (count: number) => string
  /** Additional className on the group. */
  className?: string
}

// The 8px gap is also how far each hit box reaches toward the neighbouring chip (TD-10).
const ROW_LIMIT: HitTargetLimit = { axis: 'horizontal', outset: 8 }

// Room for the half of the 44px hit box that overhangs each face, so neither the next row nor
// the scroller's clip edge cuts it: sm faces are 22px tall, md 30, lg 38.
const crossAxisRoom: Record<ChipSize, { rows: string; scroller: string }> = {
  sm: { rows: 'gap-y-3', scroller: 'py-3' },
  md: { rows: 'gap-y-2', scroller: 'py-2' },
  lg: { rows: 'gap-y-2', scroller: 'py-1' },
}

const LOADING_WIDTHS = [48, 72, 64, 88]

function accessibleName(item: ChipGroupItem): string {
  return Number.isFinite(item.count) ? `${item.label}, ${item.count}` : item.label
}

/**
 * ChipGroup — a single-select filter row of chips, each with an optional count. It is a
 * radio group: one chip is always selected, arrow keys move the selection, and only the
 * selected chip is a Tab stop.
 *
 * @example
 * <ChipGroup label="Kind" items={items} defaultValue="all" overflow="scroll" />
 */
export function ChipGroup<T extends string = string>(props: ChipGroupProps<T>) {
  const { items, value, defaultValue, onValueChange, isLoading = false, overflow = 'wrap' } = props
  const baseId = useId()
  const [current, setCurrent] = useControllableState<T | undefined>({
    value,
    defaultValue: defaultValue ?? items[0]?.value,
    onChange: onValueChange as ((next: T | undefined) => void) | undefined,
  })
  const selectedIndex = items.findIndex((item) => item.value === current)
  const { scrollRef, onScroll, onViewportLayout, onItemLayout } = useRevealSelected(
    overflow === 'scroll' ? selectedIndex : -1
  )

  if (isLoading) return <ChipGroupSkeleton {...props} />
  if (items.length === 0) return null

  const enabled = items.map((item) => !(props.isDisabled || item.isDisabled))
  const select = (index: number) => {
    setCurrent(items[index].value)
    if (typeof document !== 'undefined') document.getElementById(`${baseId}-${index}`)?.focus()
  }
  const handleKeyDown = (event: { key: string; preventDefault: () => void }) => {
    const target = indexForKey(event.key, enabled, selectedIndex)
    if (target === undefined || target < 0) return
    event.preventDefault()
    select(target)
  }

  const chips = items.map((item, index) => (
    <GroupChip
      key={item.value}
      item={item}
      id={`${baseId}-${index}`}
      groupProps={props}
      isSelected={index === selectedIndex}
      isEnabled={enabled[index]}
      isTabStop={index === tabStopIndex(enabled, selectedIndex)}
      onSelect={() => select(index)}
      onLayout={
        overflow === 'scroll' && index > 0 ? (event) => onItemLayout(index, event) : undefined
      }
    />
  ))

  return (
    <GroupFrame {...props} onKeyDown={handleKeyDown}>
      {overflow === 'scroll' ? (
        <ScrollRow
          chips={chips}
          size={props.size}
          scrollRef={scrollRef}
          onScroll={onScroll}
          onViewportLayout={onViewportLayout}
        />
      ) : (
        chips
      )}
    </GroupFrame>
  )
}

function GroupFrame<T extends string>({
  label,
  overflow = 'wrap',
  size = 'md',
  className,
  onKeyDown,
  children,
  ...rest
}: ChipGroupProps<T> & {
  onKeyDown: (event: { key: string; preventDefault: () => void }) => void
}) {
  const viewProps = withoutGroupProps(rest)
  return (
    <ChipGroupContext.Provider value={ROW_LIMIT}>
      <View
        {...viewProps}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        {...{ onKeyDown }}
        className={cn(
          'flex-row items-center gap-x-2',
          overflow === 'wrap' && cn('flex-wrap', crossAxisRoom[size].rows),
          className
        )}
      >
        {children}
      </View>
    </ChipGroupContext.Provider>
  )
}

// The pinned first chip sits outside the scroller, so "All" never scrolls away.
function ScrollRow({
  chips,
  size = 'md',
  scrollRef,
  onScroll,
  onViewportLayout,
}: Omit<RevealSelected, 'onItemLayout'> & { chips: React.ReactElement[]; size?: ChipSize }) {
  const [pinned, ...scrolled] = chips
  return (
    <>
      <View className={crossAxisRoom[size].scroller}>{pinned}</View>
      {scrolled.length > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
          onLayout={onViewportLayout}
          className="flex-1"
        >
          <View className={cn('flex-row items-center gap-x-2', crossAxisRoom[size].scroller)}>
            {scrolled}
          </View>
        </ScrollView>
      )}
    </>
  )
}

function GroupChip<T extends string>({
  item,
  id,
  groupProps,
  isSelected,
  isEnabled,
  isTabStop,
  onSelect,
  onLayout,
}: {
  item: ChipGroupItem<T>
  id: string
  groupProps: ChipGroupProps<T>
  isSelected: boolean
  isEnabled: boolean
  isTabStop: boolean
  onSelect: () => void
  onLayout: ViewProps['onLayout']
}) {
  const { size = 'md', color = 'primary', formatCount = formatCompact } = groupProps
  return (
    <Chip
      id={id}
      size={size}
      color={color}
      isSelected={isSelected}
      isDisabled={!isEnabled}
      onPress={onSelect}
      onLayout={onLayout}
      tabIndex={isTabStop ? 0 : -1}
      accessibilityLabel={accessibleName(item)}
      rightElement={
        Number.isFinite(item.count) ? (
          <Text className="text-xs text-inherit tabular-nums">
            {formatCount(item.count as number)}
          </Text>
        ) : undefined
      }
    >
      {item.label}
    </Chip>
  )
}

function ChipGroupSkeleton<T extends string>({ label, size = 'md', className }: ChipGroupProps<T>) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Loading ${label}`}
      className={cn('flex-row items-center gap-x-2', crossAxisRoom[size].scroller, className)}
    >
      {LOADING_WIDTHS.map((width) => (
        <Skeleton key={width} variant="rounded" width={width} height={sizeHeights[size]} />
      ))}
    </View>
  )
}

const sizeHeights: Record<ChipSize, number> = { sm: 22, md: 30, lg: 38 }

// The group's own props must not reach the radiogroup View as unknown DOM attributes.
function withoutGroupProps<T extends string>(rest: Omit<ChipGroupProps<T>, 'label'>): ViewProps {
  const {
    items: _items,
    value: _value,
    defaultValue: _defaultValue,
    onValueChange: _onValueChange,
    color: _color,
    isDisabled: _isDisabled,
    isLoading: _isLoading,
    formatCount: _formatCount,
    ...viewProps
  } = rest
  return viewProps
}
