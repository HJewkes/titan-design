import { useId } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { formatCompact } from '../../../utils/number-format'
import { useControllableState } from '../../../hooks/useControllableState'
import type { HitTargetLimit } from '../../../utils/hit-target'
import { ChipGroupContext } from '../chip/chipGroupContext'
import { indexForKey, tabStopIndex } from './chipGroupModel'
import type { ChipGroupProps } from './chipGroupTypes'
import { ChipGroupSkeleton, GroupChip, ScrollRow, crossAxisRoom } from './ChipGroupParts'
import { useRevealSelected } from './useRevealSelected'

export type { ChipGroupItem, ChipGroupOverflow, ChipGroupProps } from './chipGroupTypes'

// The 8px gap is also how far each hit box reaches toward the neighbouring chip (TD-10).
const ROW_LIMIT: HitTargetLimit = { axis: 'horizontal', outset: 8 }

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
  const { size = 'md', color = 'primary', formatCount = formatCompact } = props
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

  if (isLoading)
    return <ChipGroupSkeleton label={props.label} size={size} className={props.className} />
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
      size={size}
      color={color}
      formatCount={formatCount}
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
