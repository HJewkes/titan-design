import { useState } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Divider } from '../../ui/divider'
import { Typography } from '../Typography'
import { DateTime } from '../DateTime'
import { dayKey } from './chatThread'

export interface DateSeparatorProps {
  /** Any instant on the day this separator opens (ISO string, Date or epoch ms). */
  date: string | Date | number
  /** The reader's "now", for Today / Yesterday. Pass a fixed value to freeze stories and tests. */
  now?: string | Date | number
  className?: string
}

const DAY_MS = 24 * 60 * 60 * 1000

function relativeDayName(date: Date, now: Date): string | null {
  const iso = date.toISOString()
  if (dayKey(iso) === dayKey(now.toISOString())) return 'Today'
  const yesterday = new Date(now.getTime() - DAY_MS).toISOString()
  return dayKey(iso) === dayKey(yesterday) ? 'Yesterday' : null
}

/**
 * A hairline with the day's name in the middle, opening each calendar day of a
 * thread. Composes Divider + Typography, and DateTime for days older than yesterday.
 */
export function DateSeparator({ date, now, className }: DateSeparatorProps) {
  const [renderedAt] = useState(() => Date.now())
  const at = new Date(date)
  const dayName = relativeDayName(at, new Date(now ?? renderedAt))
  return (
    <View
      className={cn('flex-row items-center gap-inline-md py-stack-md', className)}
      testID="chat-date-separator"
    >
      <Divider className="flex-1" />
      {dayName ? (
        <Typography variant="caption" color="tertiary">
          {dayName}
        </Typography>
      ) : (
        <DateTime value={at} format="medium" variant="caption" color="tertiary" />
      )}
      <Divider className="flex-1" />
    </View>
  )
}
