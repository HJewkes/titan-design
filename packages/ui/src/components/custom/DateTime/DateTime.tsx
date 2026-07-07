import { useEffect, useState } from 'react'
import { Text, type TextProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type DateTimeFormat =
  | 'date' // 2024-01-15
  | 'time' // 14:30
  | 'datetime' // 2024-01-15 14:30
  | 'relative' // 2 hours ago
  | 'short' // Jan 15
  | 'medium' // Jan 15, 2024
  | 'long' // January 15, 2024
  | 'full' // Monday, January 15, 2024

export interface DateTimeProps extends TextProps {
  /** Date value (timestamp in ms, Date object, or ISO string). Optional when `live`. */
  value?: number | Date | string | null | undefined
  /** Display format */
  format?: DateTimeFormat
  /** Custom format string (overrides format) */
  customFormat?: string
  /** Whether to show in UTC */
  isUTC?: boolean
  /** Force 12h (true) or 24h (false) for time/datetime formats; locale default when omitted. */
  hour12?: boolean
  /** Track the current time and re-render on an interval (ignores `value`). For clocks / relative time. */
  live?: boolean
  /** Refresh interval in ms when `live` (default 1000). */
  refreshMs?: number
  /** Fallback text when value is null/undefined */
  fallback?: string
  /** Text color */
  color?: 'primary' | 'secondary' | 'tertiary' | 'inherit'
  /** Additional className */
  className?: string
}

const colorStyles = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  tertiary: 'text-text-tertiary',
  inherit: '',
}

/**
 * Formats a date value to a readable string.
 */
function formatDate(
  value: number | Date | string,
  format: DateTimeFormat,
  isUTC: boolean,
  hour12?: boolean
): string {
  const date = value instanceof Date ? value : new Date(value)

  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  // For relative time
  if (format === 'relative') {
    return getRelativeTime(date)
  }

  // Use Intl.DateTimeFormat for locale-aware formatting
  const options: Intl.DateTimeFormatOptions = {}

  switch (format) {
    case 'date':
      options.year = 'numeric'
      options.month = '2-digit'
      options.day = '2-digit'
      break
    case 'time':
      options.hour = '2-digit'
      options.minute = '2-digit'
      break
    case 'datetime':
      options.year = 'numeric'
      options.month = '2-digit'
      options.day = '2-digit'
      options.hour = '2-digit'
      options.minute = '2-digit'
      break
    case 'short':
      options.month = 'short'
      options.day = 'numeric'
      break
    case 'medium':
      options.month = 'short'
      options.day = 'numeric'
      options.year = 'numeric'
      break
    case 'long':
      options.month = 'long'
      options.day = 'numeric'
      options.year = 'numeric'
      break
    case 'full':
      options.weekday = 'long'
      options.month = 'long'
      options.day = 'numeric'
      options.year = 'numeric'
      break
  }

  if (isUTC) {
    options.timeZone = 'UTC'
  }

  if (hour12 !== undefined && (options.hour !== undefined || options.minute !== undefined)) {
    options.hour12 = hour12
  }

  return new Intl.DateTimeFormat(undefined, options).format(date)
}

/**
 * Gets relative time string (e.g., "2 hours ago", "in 3 days")
 */
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffSecs = Math.round(diffMs / 1000)
  const diffMins = Math.round(diffSecs / 60)
  const diffHours = Math.round(diffMins / 60)
  const diffDays = Math.round(diffHours / 24)
  const diffWeeks = Math.round(diffDays / 7)
  const diffMonths = Math.round(diffDays / 30)
  const diffYears = Math.round(diffDays / 365)

  // Use Intl.RelativeTimeFormat if available
  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

    if (Math.abs(diffSecs) < 60) {
      return rtf.format(diffSecs, 'second')
    }
    if (Math.abs(diffMins) < 60) {
      return rtf.format(diffMins, 'minute')
    }
    if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour')
    }
    if (Math.abs(diffDays) < 7) {
      return rtf.format(diffDays, 'day')
    }
    if (Math.abs(diffWeeks) < 4) {
      return rtf.format(diffWeeks, 'week')
    }
    if (Math.abs(diffMonths) < 12) {
      return rtf.format(diffMonths, 'month')
    }
    return rtf.format(diffYears, 'year')
  }

  // Fallback for environments without Intl.RelativeTimeFormat
  const absSeconds = Math.abs(diffSecs)
  const isFuture = diffMs > 0
  const prefix = isFuture ? 'in ' : ''
  const suffix = isFuture ? '' : ' ago'

  if (absSeconds < 60) {
    return 'just now'
  }
  if (Math.abs(diffMins) < 60) {
    const mins = Math.abs(diffMins)
    return `${prefix}${mins} minute${mins === 1 ? '' : 's'}${suffix}`
  }
  if (Math.abs(diffHours) < 24) {
    const hours = Math.abs(diffHours)
    return `${prefix}${hours} hour${hours === 1 ? '' : 's'}${suffix}`
  }
  if (Math.abs(diffDays) < 7) {
    const days = Math.abs(diffDays)
    return `${prefix}${days} day${days === 1 ? '' : 's'}${suffix}`
  }
  if (Math.abs(diffWeeks) < 4) {
    const weeks = Math.abs(diffWeeks)
    return `${prefix}${weeks} week${weeks === 1 ? '' : 's'}${suffix}`
  }
  if (Math.abs(diffMonths) < 12) {
    const months = Math.abs(diffMonths)
    return `${prefix}${months} month${months === 1 ? '' : 's'}${suffix}`
  }
  const years = Math.abs(diffYears)
  return `${prefix}${years} year${years === 1 ? '' : 's'}${suffix}`
}

/**
 * DateTime component for displaying formatted dates and times.
 *
 * @example
 * // Basic usage
 * <DateTime value={Date.now()} />
 *
 * @example
 * // Different formats
 * <DateTime value={date} format="relative" />
 * <DateTime value={date} format="long" />
 *
 * @example
 * // UTC time
 * <DateTime value={timestamp} format="datetime" isUTC />
 */
export function DateTime({
  value,
  format = 'datetime',
  customFormat,
  isUTC = false,
  hour12,
  live = false,
  refreshMs = 1000,
  fallback = '-',
  color = 'inherit',
  className,
  ...props
}: DateTimeProps) {
  // When live, track "now" and re-render on an interval (the value prop is ignored).
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!live) return
    const id = setInterval(() => setNow(Date.now()), refreshMs)
    return () => clearInterval(id)
  }, [live, refreshMs])

  const effectiveValue = live ? now : value

  if (effectiveValue === null || effectiveValue === undefined) {
    return (
      <Text className={cn(colorStyles[color], className)} {...props}>
        {fallback}
      </Text>
    )
  }

  const formattedDate = formatDate(effectiveValue, format, isUTC, hour12)

  return (
    <Text className={cn(colorStyles[color], className)} {...props}>
      {formattedDate}
    </Text>
  )
}

/**
 * Utility function to format dates outside of React components.
 */
export function formatDateTime(
  value: number | Date | string | null | undefined,
  format: DateTimeFormat = 'datetime',
  isUTC: boolean = false,
  fallback: string = '-'
): string {
  if (value === null || value === undefined) {
    return fallback
  }
  return formatDate(value, format, isUTC)
}
