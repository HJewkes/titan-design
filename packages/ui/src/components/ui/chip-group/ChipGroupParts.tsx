import React from 'react'
import { ScrollView, Text, View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Chip, type ChipColor, type ChipSize } from '../chip'
import { Skeleton } from '../skeleton'
import type { ChipGroupItem } from './chipGroupTypes'
import type { RevealSelected } from './useRevealSelected'

// Room for the half of the 44px hit box that overhangs each face, so neither the next row nor
// the scroller's clip edge cuts it: sm faces are 22px tall, md 30, lg 38.
export const crossAxisRoom: Record<ChipSize, { rows: string; scroller: string }> = {
  sm: { rows: 'gap-y-3', scroller: 'py-3' },
  md: { rows: 'gap-y-2', scroller: 'py-2' },
  lg: { rows: 'gap-y-2', scroller: 'py-1' },
}

const LOADING_WIDTHS = [48, 72, 64, 88]

function accessibleName(item: ChipGroupItem): string {
  return Number.isFinite(item.count) ? `${item.label}, ${item.count}` : item.label
}

// The pinned first chip sits outside the scroller, so "All" never scrolls away.
export function ScrollRow({
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

export function GroupChip<T extends string>({
  item,
  id,
  size,
  color,
  formatCount,
  isSelected,
  isEnabled,
  isTabStop,
  onSelect,
  onLayout,
}: {
  item: ChipGroupItem<T>
  id: string
  size: ChipSize
  color: ChipColor
  formatCount: (count: number) => string
  isSelected: boolean
  isEnabled: boolean
  isTabStop: boolean
  onSelect: () => void
  onLayout: ViewProps['onLayout']
}) {
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

export function ChipGroupSkeleton({
  label,
  size = 'md',
  className,
}: {
  label: string
  size?: ChipSize
  className?: string
}) {
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
