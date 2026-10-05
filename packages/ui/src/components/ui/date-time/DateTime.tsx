import { useEffect, useState } from 'react'
import { Text, type TextProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography, type TypographyVariant } from '../../ui/typography'

export type DateTimeFormat =
  | 'date' // 2024-01-15
  | 'time' // 14:30
  | 'datetime' // 2024-01-15 14:30
  | 'relative' // 2 hours ago
  | 'short' // Jan 15
  | 'medium' // Jan 15, 2024
  | 'long' // January 15, 2024
  | 'full' // Monday, January 15, 2024

export interface DateTimeProps
  extends
    TextProps,
    Pick<FormatDateTimeOptions, 'isUTC' | 'hour12' | 'seconds' | 'locale' | 'fallback'> {
  /**
   * Date value (timestamp in ms, Date object, or ISO string). Optional when `isLive`: without a
   * value a live DateTime shows the current time (a clock).
   */
  value?: number | Date | string | null | undefined
  /** Display format */
  format?: DateTimeFormat
  /**
   * @deprecated Never applied. Use `format` with `hour12`, `seconds` and `locale`, or render
   * the string from `formatDateTime` inside `Typography`. Removed in 0.23.0.
   */
  customFormat?: string
  /** Render through Typography with this variant (e.g. 'mono'); plain inheriting Text when omitted. */
  variant?: TypographyVariant
  /**
   * Re-render on an interval. With `value` and `format="relative"` the text stays relative to the
   * current time ("5 minutes ago" becomes "6 minutes ago"); without `value` it is a clock.
   */
  isLive?: boolean
  /** @deprecated Use `isLive`. Removed in 0.23.0; `isLive` wins when both are passed. */
  live?: boolean
  /** Refresh interval in ms when `isLive` (default 1000). */
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

/**
 * Gets relative time string (e.g., "2 hours ago", "in 3 days")
 */
function getRelativeTime(date: Date, now: number, locale?: string): string {
  const diffSecs = Math.round((date.getTime() - now) / 1000)
  const [unit, amount] = pickRelativeUnit(diffSecs)

  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(amount, unit)
  }

  // Fallback for environments without Intl.RelativeTimeFormat
  if (unit === 'second') return 'just now'
  const abs = Math.abs(amount)
  const phrase = `${abs} ${unit}${abs === 1 ? '' : 's'}`
  return diffSecs > 0 ? `in ${phrase}` : `${phrase} ago`
}

function pickRelativeUnit(diffSecs: number): [Intl.RelativeTimeFormatUnit, number] {
  for (const [unit, perUnit, limit] of RELATIVE_UNITS) {
    const amount = Math.round(diffSecs / perUnit)
    if (Math.abs(amount) < limit) return [unit, amount]
  }
  return ['year', Math.round(diffSecs / (365 * 86400))]
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

/** Current time in ms, refreshed every `refreshMs` while `tracking`; undefined otherwise. */
function useNow(tracking: boolean, refreshMs: number): number | undefined {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!tracking) return
    const id = setInterval(() => setNow(Date.now()), refreshMs)
    return () => clearInterval(id)
  }, [tracking, refreshMs])
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
  locale,
  variant,
  isLive,
  live = false,
  refreshMs = 1000,
  fallback = '-',
  color = 'inherit',
  className,
  ...props
}: DateTimeProps) {
  const now = useNow(isLive ?? live, refreshMs)
  const shown = value ?? now
  const text = formatDate(shown, format, { isUTC, hour12, seconds, locale, fallback, now })

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
 * Utility function to format dates outside of React components. Pass an options object as the
 * third argument; the positional `isUTC` and `fallback` arguments remain for existing callers.
 *
 * @example
 * formatDateTime(date, 'time', { hour12: false, seconds: true, locale: 'en-GB' })
 */
export function formatDateTime(
  value: number | Date | string | null | undefined,
  format: DateTimeFormat = 'datetime',
  options: boolean | FormatDateTimeOptions = {},
  fallback: string = '-'
): string {
  const opts = typeof options === 'boolean' ? { isUTC: options } : options
  return formatDate(value, format, { fallback, ...opts })
}
