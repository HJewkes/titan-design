import { useEffect, useState } from 'react'
import { Text, type TextProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography, type TypographyVariant } from '../../ui/typography'

export type DateTimeFormat =
  | 'date' // 01/15/2024 (en-US; order and separators follow the locale)
  | 'time' // 02:30 PM (en-US; 14:30 with hour12={false})
  | 'datetime' // 01/15/2024, 02:30 PM (en-US)
  | 'relative' // 2 hours ago
  | 'short' // Jan 15
  | 'medium' // Jan 15, 2024
  | 'long' // January 15, 2024
  | 'full' // Monday, January 15, 2024

export interface DateTimeProps
  extends TextProps, Pick<FormatDateTimeOptions, 'isUTC' | 'hour12' | 'seconds' | 'fallback'> {
  /**
   * Date value (timestamp in ms, Date object, or ISO string). Optional when `isLive`: without a
   * value a live DateTime shows the current time (a clock).
   */
  value?: number | Date | string | null | undefined
  /** Display format */
  format?: DateTimeFormat
  /**
   * Custom format string. It was never applied.
   *
   * @deprecated Use `format` with `hour12` and `seconds`, or render the string from
   * `formatDateTime` (which also takes a `locale`) inside `Typography`. Removed in 0.23.0.
   */
  customFormat?: string
  /** Render through Typography with this variant (e.g. 'mono'); plain inheriting Text when omitted. */
  variant?: TypographyVariant
  /**
   * Re-render on an interval. With `value` and `format="relative"` the text stays relative to the
   * current time ("5 minutes ago" becomes "6 minutes ago") and ticks once per displayed unit, at
   * most hourly. Without `value` it is a clock that ticks every `refreshMs`.
   */
  isLive?: boolean
  /** @deprecated Use `isLive`. Removed in 0.23.0; `isLive` wins when both are passed. */
  live?: boolean
  /** Refresh interval in ms for a live clock (default 1000). */
  refreshMs?: number
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

const FORMAT_OPTIONS: Record<Exclude<DateTimeFormat, 'relative'>, Intl.DateTimeFormatOptions> = {
  date: { year: 'numeric', month: '2-digit', day: '2-digit' },
  time: { hour: '2-digit', minute: '2-digit' },
  datetime: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  },
  short: { month: 'short', day: 'numeric' },
  medium: { month: 'short', day: 'numeric', year: 'numeric' },
  long: { month: 'long', day: 'numeric', year: 'numeric' },
  full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
}

/** Options shared by `DateTime` and `formatDateTime`. */
export interface FormatDateTimeOptions {
  /** Show in UTC rather than the runtime's zone. */
  isUTC?: boolean
  /** Force 12h (true) or 24h (false) for time/datetime formats; locale default when omitted. */
  hour12?: boolean
  /** Include seconds in time/datetime formats. */
  seconds?: boolean
  /** BCP 47 locale, e.g. 'en-US'. The runtime's default locale when omitted. */
  locale?: string
  /** Text for a null, undefined or unparseable value (default '-'). */
  fallback?: string
  /** Reference time in ms for the relative format (default `Date.now()`). */
  now?: number
}

function toDate(value: number | Date | string | null | undefined): Date | null {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return isNaN(date.getTime()) ? null : date
}

function absoluteText(date: Date, format: DateTimeFormat, opts: FormatDateTimeOptions): string {
  const options: Intl.DateTimeFormatOptions = {
    ...FORMAT_OPTIONS[format as keyof typeof FORMAT_OPTIONS],
  }
  if (opts.isUTC) options.timeZone = 'UTC'
  if (opts.hour12 !== undefined && options.minute !== undefined) options.hour12 = opts.hour12
  if (opts.seconds && options.hour !== undefined) options.second = '2-digit'
  return new Intl.DateTimeFormat(opts.locale, options).format(date)
}

// unit, seconds per unit, and the count at which the next unit takes over; past these it is years
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number, number][] = [
  ['second', 1, 60],
  ['minute', 60, 60],
  ['hour', 3600, 24],
  ['day', 86400, 7],
  ['week', 7 * 86400, 4],
  ['month', 30 * 86400, 12],
]

interface RelativeParts {
  unit: Intl.RelativeTimeFormatUnit
  /** Whole units, rounded on the magnitude so past and future round alike. */
  count: number
  isFuture: boolean
  unitSecs: number
}

function pickRelativeUnit(diffMs: number): RelativeParts {
  const isFuture = diffMs > 0
  const absSecs = Math.abs(diffMs) / 1000
  for (const [unit, unitSecs, limit] of RELATIVE_UNITS) {
    const count = Math.round(absSecs / unitSecs)
    if (count < limit) return { unit, count, isFuture, unitSecs }
  }
  const unitSecs = 365 * 86400
  return { unit: 'year', count: Math.round(absSecs / unitSecs), isFuture, unitSecs }
}

/**
 * Gets relative time string (e.g., "2 hours ago", "in 3 days")
 */
function getRelativeTime(date: Date, now: number, locale?: string): string {
  const { unit, count, isFuture } = pickRelativeUnit(date.getTime() - now)

  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    const signed = isFuture || count === 0 ? count : -count
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(signed, unit)
  }

  // Fallback for environments without Intl.RelativeTimeFormat
  if (unit === 'second') return 'just now'
  const phrase = `${count} ${unit}${count === 1 ? '' : 's'}`
  return isFuture ? `in ${phrase}` : `${phrase} ago`
}

const MAX_TICK_MS = 3_600_000

/** How often a live DateTime re-renders: per displayed unit for relative text, else `refreshMs`. */
function liveTickMs(date: Date | null, format: DateTimeFormat, now: number, refreshMs: number) {
  if (!date || format !== 'relative') return refreshMs
  return Math.min(pickRelativeUnit(date.getTime() - now).unitSecs * 1000, MAX_TICK_MS)
}

function formatDate(
  value: number | Date | string | null | undefined,
  format: DateTimeFormat,
  opts: FormatDateTimeOptions
): string {
  const date = toDate(value)
  if (!date) return opts.fallback ?? '-'
  if (format === 'relative') return getRelativeTime(date, opts.now ?? Date.now(), opts.locale)
  return absoluteText(date, format, opts)
}

/** Current time in ms, refreshed every `tickFor(now)` ms while `tracking`; undefined otherwise. */
function useNow(tracking: boolean, tickFor: (now: number) => number): number | undefined {
  const [now, setNow] = useState(() => Date.now())
  const tickMs = tickFor(now)
  useEffect(() => {
    if (!tracking) return
    let isActive = true
    const tick = () => {
      if (isActive) setNow(Date.now())
    }
    // `now` still holds the mount time when tracking turns on later; catch up before the first tick.
    queueMicrotask(tick)
    const id = setInterval(tick, tickMs)
    return () => {
      isActive = false
      clearInterval(id)
    }
  }, [tracking, tickMs])
  return tracking ? now : undefined
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
 *
 * A null, undefined or unparseable `value` renders `fallback` ('-' by default).
 */
export function DateTime({
  value,
  format = 'datetime',
  customFormat,
  isUTC = false,
  hour12,
  seconds,
  variant,
  isLive,
  live = false,
  refreshMs = 1000,
  fallback = '-',
  color = 'inherit',
  className,
  ...props
}: DateTimeProps) {
  const now = useNow(isLive ?? live, (at) => liveTickMs(toDate(value), format, at, refreshMs))
  const text = formatDate(value ?? now, format, { isUTC, hour12, seconds, fallback, now })

  // Route through Typography (shared text substrate) when a variant is given;
  // otherwise render a plain inheriting Text (backward-compatible default).
  if (variant) {
    return (
      <Typography variant={variant} color={color} className={className} {...props}>
        {text}
      </Typography>
    )
  }

  return (
    <Text className={cn(colorStyles[color], className)} {...props}>
      {text}
    </Text>
  )
}

/**
 * Formats a date outside of React components, with the same rules as `DateTime`.
 *
 * @example
 * formatDateTime(date, 'time', { hour12: false, seconds: true, locale: 'en-GB' })
 */
export function formatDateTime(
  value: number | Date | string | null | undefined,
  format?: DateTimeFormat,
  options?: FormatDateTimeOptions
): string
/**
 * Formats a date with the positional `isUTC` and `fallback` arguments kept for existing callers.
 * Prefer the options form.
 */
export function formatDateTime(
  value: number | Date | string | null | undefined,
  format?: DateTimeFormat,
  isUTC?: boolean,
  fallback?: string
): string
export function formatDateTime(
  value: number | Date | string | null | undefined,
  format: DateTimeFormat = 'datetime',
  options: boolean | FormatDateTimeOptions = {},
  fallback: string = '-'
): string {
  const opts = typeof options === 'boolean' ? { isUTC: options } : options
  return formatDate(value, format, { fallback, ...opts })
}
