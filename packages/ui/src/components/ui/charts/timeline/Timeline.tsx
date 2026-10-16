import { useMemo, type ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../../utils/cn'
import { EmptyState } from '../../empty-state'
import { Skeleton } from '../../skeleton'
import { Typography } from '../../typography'
import {
  layoutTimeline,
  type TimelineItem,
  type TimelineMark,
  type TimelineRange,
  type TimelineTone,
} from './timeline-model'

export { followWindow } from './timeline-model'
export type { TimelineItem, TimelineRange, TimelineTone } from './timeline-model'

/** `horizontal` fills its width; `vertical` runs down a fixed height (`h-60` unless overridden). */
export type TimelineOrientation = 'horizontal' | 'vertical'

/** Props of {@link Timeline}. */
export interface TimelineProps extends Omit<ViewProps, 'children'> {
  /** The events. Drawn in time order whatever the input order. */
  items: TimelineItem[]
  /** Names the timeline for assistive tech. */
  accessibilityLabel: string
  /** The axis span. Defaults to the items' extent. */
  domain?: TimelineRange<number | Date>
  /** Playhead as a fraction of the domain, 0..1. Omit for no playhead. */
  playhead?: number
  /**
   * The visible part of the domain as fractions of it, e.g. `[0.5, 1]` for the second half. It may
   * run past either end; `followWindow(playhead, width)` keeps the playhead centred as it advances.
   */
  window?: TimelineRange
  /** Axis direction. Defaults to `horizontal`. */
  orientation?: TimelineOrientation
  /** Shows a skeleton track in place of the events. */
  isLoading?: boolean
  /** Replaces the default empty state, shown when `items` is empty. */
  emptyState?: ReactNode
  /** Tailwind classes merged onto the root. */
  className?: string
}

// RN's Role union omits 'list' and 'listitem'; RNW passes them through to the DOM.
const LIST_ROLE = 'list' as ViewProps['role']
const LIST_ITEM_ROLE = 'listitem' as ViewProps['role']

const TONE_CLASS: Record<TimelineTone, string> = {
  neutral: 'bg-text-secondary',
  primary: 'bg-brand-primary',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
  info: 'bg-status-info',
}

// The gutter holds an edge item's label; overflow-hidden clips a mark fading past the window edge
// to the component's box, so it never draws over neighbouring content.
const ROOT_CLASS: Record<TimelineOrientation, string> = {
  horizontal: 'h-20 w-full overflow-hidden px-12',
  vertical: 'h-60 w-full overflow-hidden py-3',
}

const percent = (position: number): `${number}%` => `${position * 100}%`

/** Where a mark sits along the axis: `left` across, `top` down. */
function along(orientation: TimelineOrientation, position: number) {
  return orientation === 'horizontal' ? { left: percent(position) } : { top: percent(position) }
}

/** The track spans only the domain, so its ends show where the timeline starts and stops. */
function Track({
  span: [from, to],
  orientation,
}: {
  span: TimelineRange
  orientation: TimelineOrientation
}) {
  const horizontal = orientation === 'horizontal'
  return (
    <View
      testID="timeline-track"
      style={
        horizontal
          ? { left: percent(from), right: percent(1 - to) }
          : { top: percent(from), bottom: percent(1 - to) }
      }
      className={cn('absolute bg-hairline-strong', horizontal ? 'top-1/2 h-px' : 'left-1 w-px')}
    />
  )
}

function Mark({ mark, orientation }: { mark: TimelineMark; orientation: TimelineOrientation }) {
  const horizontal = orientation === 'horizontal'
  const labelPlacement = horizontal
    ? cn('-ml-12 w-24 items-center', mark.lane === 0 ? 'top-1/2 mt-2' : 'bottom-1/2 mb-2')
    : 'left-5 -mt-2.5'
  return (
    // Fills the plot so its absolute children position against the plot, not a 0-height row.
    <View
      role={LIST_ITEM_ROLE}
      testID={`timeline-mark-${mark.item.id}`}
      style={{ opacity: mark.opacity }}
      className="absolute inset-0"
      pointerEvents="box-none"
    >
      <View
        style={along(orientation, mark.position)}
        className={cn(
          'absolute h-2 w-2 rounded-full',
          horizontal ? 'top-1/2 -ml-1 -mt-1' : 'left-0 -mt-1',
          TONE_CLASS[mark.item.tone ?? 'neutral']
        )}
      />
      <View style={along(orientation, mark.position)} className={cn('absolute', labelPlacement)}>
        <Typography variant="caption" color="secondary" numberOfLines={1}>
          {mark.item.label}
        </Typography>
      </View>
    </View>
  )
}

function Playhead({
  position,
  orientation,
}: {
  position: number
  orientation: TimelineOrientation
}) {
  // A 2 px tick across the track, 12 px long: it stays inside the 8 px gap the labels leave either
  // side of the track, so it never crosses a label.
  return (
    <View
      testID="timeline-playhead"
      aria-hidden
      style={along(orientation, position)}
      className={cn(
        'absolute rounded-full bg-brand-primary',
        orientation === 'horizontal'
          ? 'top-1/2 -ml-px -mt-1.5 h-3 w-0.5'
          : '-left-0.5 -mt-px h-0.5 w-3'
      )}
    />
  )
}

/**
 * Timeline: events on one time axis, with an optional playhead and a pan window. Positions are
 * percentages of the plot, so it fills whatever width (or, vertical, height) it is given. It is
 * static: a beat author moves `playhead` and `window` by deriving them from time.
 *
 * @example
 * <Timeline accessibilityLabel="Chapters" playhead={0.25} items={[{ id: 'a', at: 0, label: 'Intro' }]} />
 */
export function Timeline({
  items,
  accessibilityLabel,
  domain,
  playhead,
  window,
  orientation = 'horizontal',
  isLoading = false,
  emptyState,
  className,
  ...props
}: TimelineProps) {
  const layout = useMemo(
    () => layoutTimeline({ items, domain, playhead, window }),
    [items, domain, playhead, window]
  )

  if (isLoading) {
    return (
      <View
        role="group"
        aria-busy
        accessibilityLabel={accessibilityLabel}
        className={className}
        {...props}
      >
        <Skeleton variant="rounded" height={orientation === 'horizontal' ? 80 : 240} />
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <View role="group" accessibilityLabel={accessibilityLabel} className={className} {...props}>
        {emptyState ?? <EmptyState title="No events" className="py-4" />}
      </View>
    )
  }

  return (
    <View
      role={LIST_ROLE}
      accessibilityLabel={accessibilityLabel}
      className={cn(ROOT_CLASS[orientation], className)}
      {...props}
    >
      <View className="relative flex-1">
        {layout.track !== null && <Track span={layout.track} orientation={orientation} />}
        {layout.marks.map((mark) => (
          <Mark key={mark.item.id} mark={mark} orientation={orientation} />
        ))}
        {layout.playhead !== null && (
          <Playhead position={layout.playhead} orientation={orientation} />
        )}
      </View>
    </View>
  )
}
