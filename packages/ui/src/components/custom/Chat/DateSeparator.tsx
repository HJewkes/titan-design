import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Divider } from '../../ui/divider'
import { Typography } from '../../ui/typography'
import { DateTime } from '../../ui/date-time'
import { dayKey } from './chatThread'

export interface DateSeparatorProps {
  /** Any instant on the day this separator opens (ISO string, Date or epoch ms). */
  date: string | Date | number
  /** The reader's "now", for Today / Yesterday. Pass a fixed value to freeze stories and tests. */
  now?: string | Date | number
  /** Name the day. Turn it off for a pause within a day, which shows only the time. */
  showDay?: boolean
  /** Add the clock time, as Messages does when it opens a day or follows a long pause. */
  showTime?: boolean
  /** Replaces any of the built-in strings; the rest keep their defaults. */
  labels?: Partial<DateSeparatorLabels>
  /** Makes the separator a button that toggles message times; the keyboard and tap route to them. */
  onPress?: () => void
  /** Whether message times are showing, which names the button's action and its state. */
  timesShown?: boolean
  className?: string
}

/** The separator's built-in strings. */
export interface DateSeparatorLabels {
  /** Names the reader's current day. */
  today: string
  /** Names the calendar day before it. */
  yesterday: string
  /** Names the separator's action while message times are hidden. */
  showTimes: string
  /** Names the separator's action while message times are showing. */
  hideTimes: string
}

const DEFAULT_LABELS: DateSeparatorLabels = {
  today: 'Today',
  yesterday: 'Yesterday',
  showTimes: 'Show message times',
  hideTimes: 'Hide message times',
}

function relativeDayName(date: Date, now: Date, labels: DateSeparatorLabels): string | null {
  const iso = date.toISOString()
  if (dayKey(iso) === dayKey(now.toISOString())) return labels.today
  // A calendar step, not 24 hours: a DST day is 23 or 25 hours long.
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  return dayKey(iso) === dayKey(yesterday.toISOString()) ? labels.yesterday : null
}

/**
 * A hairline with the day's name and, optionally, the time in the middle. It opens each
 * calendar day of a thread and marks a long pause within one. Composes Divider + Typography,
 * and DateTime for days older than yesterday and for the time.
 */
function DayLabel({ at, now, labels }: { at: Date; now: Date; labels: DateSeparatorLabels }) {
  const dayName = relativeDayName(at, now, labels)
  if (dayName) {
    return (
      <Typography variant="caption" color="tertiary">
        {dayName}
      </Typography>
    )
  }
  return <DateTime value={at} format="medium" variant="caption" color="tertiary" />
}

export function DateSeparator({
  date,
  now,
  showDay = true,
  showTime = false,
  labels,
  onPress,
  timesShown = false,
  className,
}: DateSeparatorProps) {
  const [renderedAt] = useState(() => Date.now())
  const at = new Date(date)
  const text = { ...DEFAULT_LABELS, ...labels }
  const content = (
    <>
      <Divider className="flex-1" />
      {showDay ? <DayLabel at={at} now={new Date(now ?? renderedAt)} labels={text} /> : null}
      {showTime ? <DateTime value={at} format="time" variant="caption" color="tertiary" /> : null}
      <Divider className="flex-1" />
    </>
  )
  const layout = cn('flex-row items-center gap-inline-md py-stack-md', className)
  if (!onPress) {
    return (
      <View className={layout} testID="chat-date-separator">
        {content}
      </View>
    )
  }
  return (
    <Pressable
      className={layout}
      testID="chat-date-separator"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={timesShown ? text.hideTimes : text.showTimes}
      aria-expanded={timesShown}
    >
      {content}
    </Pressable>
  )
}
