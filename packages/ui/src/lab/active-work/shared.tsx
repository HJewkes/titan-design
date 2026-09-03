/**
 * Shared helpers + atoms for the active-work Lab specimens.
 * Presentational only; composes titan primitives (Indicator/Typography/cn).
 */
import { View } from 'react-native'
import { cn } from '../../utils/cn'
import { Typography } from '../../components/custom/Typography'
import { Indicator } from '../../components/ui/indicator'
import type { InitiativeState, TaskSeverity } from './data/aw-data'

/** Initiative state → semantic text/border token + Indicator color. */
export const STATE_META: Record<
  InitiativeState,
  { label: string; text: string; dot: 'success' | 'warning' | 'default' | 'info' }
> = {
  focused: { label: 'Focused', text: 'text-brand-primary', dot: 'info' },
  backburner: { label: 'Backburner', text: 'text-text-secondary', dot: 'default' },
  paused: { label: 'Paused', text: 'text-status-warning', dot: 'warning' },
  done: { label: 'Done', text: 'text-text-tertiary', dot: 'success' },
}

/** Task severity → label + text token + Indicator color. */
export const SEVERITY_META: Record<
  TaskSeverity,
  { label: string; text: string; dot: 'error-vivid' | 'error' | 'warning' | 'info' }
> = {
  critical: { label: 'Critical', text: 'text-status-error-vivid', dot: 'error-vivid' },
  high: { label: 'High', text: 'text-status-error', dot: 'error' },
  medium: { label: 'Medium', text: 'text-status-warning', dot: 'warning' },
  low: { label: 'Low', text: 'text-text-tertiary', dot: 'info' },
}

/** A labeled status dot (composes Indicator — never hand-roll dots). */
export function DotLabel({
  color,
  label,
  className,
  labelClass,
}: {
  color: React.ComponentProps<typeof Indicator>['color']
  label: string
  className?: string
  labelClass?: string
}) {
  return (
    <View className={cn('flex-row items-center gap-[6px]', className)}>
      <Indicator size="sm" color={color} />
      <Typography
        variant="caption"
        color="inherit"
        className={cn('text-text-secondary', labelClass)}
      >
        {label}
      </Typography>
    </View>
  )
}

/** Uppercase micro-label above a value — the standard stat/section eyebrow. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Typography
      variant="overline"
      color="inherit"
      className={cn(
        'text-[10px] font-semibold uppercase tracking-[0.6px] text-text-tertiary',
        className
      )}
    >
      {children}
    </Typography>
  )
}

/** Compact integer formatter: 1234 → "1.2k", 1048576 → "1.0M". */
export function compact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

/** A signed compact char delta: +514689 → "+515k". */
export function signedCompact(n: number): string {
  return (n >= 0 ? '+' : '') + compact(n)
}

/** ISO date/datetime → "Jul 12" style short label. */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Days-ago label from an ISO date, relative to a fixed "now" for determinism. */
export function daysAgo(iso: string | null | undefined, now = NOW): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const days = Math.floor((now - then) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  const mo = Math.floor(days / 30)
  return `${mo}mo ago`
}

/** Fixed reference "now" so specimens render deterministically (2026-07-12). */
export const NOW = new Date('2026-07-12T18:00:00Z').getTime()

/** A tiny inline sparkline of cumulative values, drawn with plain Views (bars). */
export function MiniBars({
  values,
  className,
  barClass = 'bg-brand-primary',
}: {
  values: number[]
  className?: string
  barClass?: string
}) {
  const max = Math.max(1, ...values.map((v) => Math.abs(v)))
  return (
    <View className={cn('h-[22px] flex-row items-end gap-[2px]', className)}>
      {values.slice(-24).map((v, i) => {
        const h = Math.max(2, Math.round((Math.abs(v) / max) * 22))
        return (
          <View
            key={i}
            style={{ height: h }}
            className={cn('w-[3px] rounded-t-[1px]', v < 0 ? 'bg-status-error' : barClass)}
          />
        )
      })}
    </View>
  )
}
