import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Platform,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native'

import { useMeasuredWidth } from '../../../hooks/useMeasuredWidth'
import { primitiveBreakpoints } from '../../../theme/tokens/primitives'
import { space } from '../../../theme/tokens/semantic'
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons'
import { Button, ButtonIcon } from '../button'
import { Surface } from '../surface'
import {
  nudgeTarget,
  resolveItemWidth,
  revealTarget,
  shelfGeometry,
  type ShelfBreakpoint,
  type ShelfGeometry,
  type ShelfItemWidth,
} from './shelfMath'

export type ShelfNudge = 'auto' | 'always' | 'never'
export type ShelfBleed = 'none' | 'sm' | 'md'

export interface ShelfProps extends ViewProps {
  /** Accessible name of the row, usually the heading above it ("Yesterday"). */
  label: string
  /**
   * Width of every item in px: one number, or a map from breakpoint to width read
   * against the shelf's own column (not the window), widest reached entry first.
   */
  itemWidth: ShelfItemWidth
  /**
   * How far the row runs past its column into the page gutter on each side, so a
   * card scrolls out at the screen edge rather than the column edge. Items still
   * rest aligned with the column. Matches the page's `gutter` token.
   */
  bleed?: ShelfBleed
  /**
   * The round arrow over the row's ends. `auto` shows it only when the column is at
   * least `nudgeFrom` wide (a pointer, not a thumb) and the row overflows.
   */
  nudge?: ShelfNudge
  /** The narrowest column `nudge="auto"` shows the arrows on. */
  nudgeFrom?: ShelfBreakpoint
  className?: string
  /** One element per item. Nothing renders when there are none. */
  children?: React.ReactNode
}

const GAP = space.inline.lg
const ICON_PX = 20
const EDGE_SLACK_PX = 1

const BLEED_PX: Record<ShelfBleed, number> = {
  none: 0,
  sm: space.gutter.sm,
  md: space.gutter.md,
}

/**
 * A horizontal row of same-width items that snaps item by item, with the next
 * item peeking at the trailing edge so the reader can see there is more. Above
 * `nudgeFrom` a round arrow at each end moves the row by about 0.8 of the column.
 * Tabbing to an item that is cut off scrolls it whole into view.
 *
 * Empty renders nothing: the caller decides whether to show an `EmptyState` or
 * drop the heading too. Items should hold their own focus target (a pressable
 * card); a row of inert items cannot be reached by keyboard. Not a `Carousel`:
 * see `API-NOTE.md`.
 *
 * @example
 * <Shelf label="Yesterday" itemWidth={{ xs: 236, sm: 264 }} bleed="sm">
 *   {videos.map((video) => <MediaCard key={video.id} {...video} />)}
 * </Shelf>
 */
export function Shelf({
  label,
  itemWidth,
  bleed = 'none',
  nudge = 'auto',
  nudgeFrom = 'md',
  className,
  children,
  ...props
}: ShelfProps) {
  const items = React.Children.toArray(children).filter(React.isValidElement)
  if (items.length === 0) return null
  return (
    <ShelfRow
      label={label}
      itemWidth={itemWidth}
      bleed={BLEED_PX[bleed]}
      nudge={nudge}
      nudgeFrom={nudgeFrom}
      className={className}
      items={items}
      {...props}
    />
  )
}

interface ShelfRowProps extends Omit<ShelfProps, 'bleed' | 'children'> {
  bleed: number
  items: React.ReactElement[]
}

function ShelfRow({ label, itemWidth, bleed, nudge, nudgeFrom, items, ...props }: ShelfRowProps) {
  const { width, onLayout } = useMeasuredWidth()
  const column = width ?? 0
  const slotWidth = resolveItemWidth(itemWidth, column)
  const geometry = useMemo(
    () => shelfGeometry({ column, count: items.length, itemWidth: slotWidth, gap: GAP, bleed }),
    [column, items.length, slotWidth, bleed]
  )
  const { scrollRef, atStart, atEnd, onScroll, onNudge, reveal } = useShelfScroll(
    geometry,
    column,
    slotWidth,
    bleed
  )
  const wide = width !== null && column >= primitiveBreakpoints[nudgeFrom ?? 'md']
  const showNudge = geometry.overflows && (nudge === 'always' || (nudge === 'auto' && wide))
  return (
    <View role="group" aria-label={label} onLayout={onLayout} {...props}>
      <View style={{ marginHorizontal: -bleed }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          snapToInterval={Platform.OS === 'web' ? undefined : geometry.step}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerStyle={{ paddingHorizontal: bleed }}
          style={scrollerStyle(bleed)}
          testID="shelf-viewport"
        >
          <View role="list" className="flex-row" style={{ gap: GAP }}>
            {items.map((item, index) => (
              <ShelfItem key={item.key ?? index} width={slotWidth} onFocus={() => reveal(index)}>
                {item}
              </ShelfItem>
            ))}
          </View>
        </ScrollView>
      </View>
      {showNudge ? (
        <ShelfNudges label={label} atStart={atStart} atEnd={atEnd} onNudge={onNudge} />
      ) : null}
    </View>
  )
}

/**
 * Web needs the snap rules as CSS. `scroll-padding` makes an item snap to the column
 * edge rather than the bled scroller edge; `overscroll-behavior-x` keeps a swipe past
 * the end off the browser's history.
 */
function scrollerStyle(bleed: number): object {
  if (Platform.OS !== 'web') return {}
  return {
    overscrollBehaviorX: 'contain',
    scrollSnapType: 'x mandatory',
    scrollPaddingInline: bleed,
  }
}

const WEB_ITEM_SNAP = (Platform.OS === 'web' ? { scrollSnapAlign: 'start' } : {}) as object

interface ShelfItemProps {
  width: number
  onFocus: () => void
  children: React.ReactNode
}

function ShelfItem({ width, onFocus, children }: ShelfItemProps) {
  return (
    <View role="listitem" onFocus={onFocus} style={[WEB_ITEM_SNAP, { width }] as object}>
      {children}
    </View>
  )
}

interface ShelfScroll {
  scrollRef: React.RefObject<ScrollView>
  atStart: boolean
  atEnd: boolean
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onNudge: (direction: 1 | -1) => void
  reveal: (index: number) => void
}

/** The scroll offset lives in a ref; only reaching or leaving an end re-renders. */
function useShelfScroll(
  geometry: ShelfGeometry,
  column: number,
  itemWidth: number,
  bleed: number
): ShelfScroll {
  const scrollRef = useRef<ScrollView>(null)
  const offset = useRef(0)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = event.nativeEvent.contentOffset.x
      offset.current = x
      setAtStart(x <= EDGE_SLACK_PX)
      setAtEnd(x >= geometry.maxOffset - EDGE_SLACK_PX)
    },
    [geometry.maxOffset]
  )
  const scrollTo = useCallback((x: number) => {
    offset.current = x
    scrollRef.current?.scrollTo({ x, animated: true })
  }, [])
  const onNudge = useCallback(
    (direction: 1 | -1) => scrollTo(nudgeTarget(offset.current, direction, geometry, column)),
    [scrollTo, geometry, column]
  )
  const reveal = useCallback(
    (index: number) => {
      const x = revealTarget(index, offset.current, geometry, itemWidth, bleed)
      if (x !== null) scrollTo(x)
    },
    [scrollTo, geometry, itemWidth, bleed]
  )
  return { scrollRef, atStart, atEnd, onScroll, onNudge, reveal }
}

interface ShelfNudgesProps {
  label: string
  atStart: boolean
  atEnd: boolean
  onNudge: (direction: 1 | -1) => void
}

/** The arrows sit over the row's ends, vertically centred, and let drags pass between them. */
function ShelfNudges({ label, atStart, atEnd, onNudge }: ShelfNudgesProps) {
  return (
    <View
      style={{ pointerEvents: 'box-none' }}
      className="absolute inset-0 flex-row items-center justify-between"
    >
      {atStart ? (
        <View />
      ) : (
        <ShelfNudge direction={-1} label={`Back in ${label}`} onPress={onNudge} />
      )}
      {atEnd ? null : <ShelfNudge direction={1} label={`More from ${label}`} onPress={onNudge} />}
    </View>
  )
}

interface ShelfNudgeProps {
  direction: 1 | -1
  label: string
  onPress: (direction: 1 | -1) => void
}

function ShelfNudge({ direction, label, onPress }: ShelfNudgeProps) {
  const isNext = direction > 0
  return (
    <Surface raise={1} className="rounded-full">
      <Button
        variant="ghost"
        color="secondary"
        isIconButton
        onPress={() => onPress(direction)}
        accessibilityLabel={label}
        className="h-11 w-11 rounded-full"
        testID={isNext ? 'shelf-nudge-next' : 'shelf-nudge-previous'}
      >
        <ButtonIcon as={isNext ? ChevronRightIcon : ChevronLeftIcon} size={ICON_PX} />
      </Button>
    </Surface>
  )
}
