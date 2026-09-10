// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { resolveColor } from '../../../theme/resolve-color'
import { Pill, type PillTone } from '../../ui/pill'
import { StatusDot, type StatusDotVariant } from './StatusDot'

/**
 * Auto-regulation verdict — the human-readable read-once summary of a set's
 * velocity-loss state.
 * - `productive` — in the band, keep going (success)
 * - `threshold`  — VL20 reached, approaching fatigue (warning)
 * - `stop`       — VL28+, terminate the set (error)
 */
export type StatusPillStatus = 'productive' | 'threshold' | 'stop'

export interface StatusPillProps extends ViewProps {
  status: StatusPillStatus
  /** Overrides the default verdict text for the status. */
  label?: string
  className?: string
}

const statusToken: Record<StatusPillStatus, 'status-success' | 'status-warning' | 'status-error'> =
  {
    productive: 'status-success',
    threshold: 'status-warning',
    stop: 'status-error',
  }

const statusTone: Record<StatusPillStatus, PillTone> = {
  productive: 'success',
  threshold: 'warning',
  stop: 'error',
}

const statusDotVariant: Record<StatusPillStatus, StatusDotVariant> = {
  productive: 'success',
  threshold: 'warning',
  stop: 'error',
}

const defaultLabel: Record<StatusPillStatus, string> = {
  productive: 'Productive',
  threshold: 'Threshold',
  stop: 'Stop',
}

/** Resolved semantic color for a verdict status. */
export function statusPillColor(status: StatusPillStatus): string {
  return resolveColor(statusToken[status])
}

/**
 * Verdict pill: a glowing status dot + coloured verdict text in a tinted
 * capsule. A `Pill` preset — tone, tint and border all come from the pill's
 * semantic tone, so no per-status colour is computed here.
 */
export function StatusPill({ status, label, className, ...props }: StatusPillProps) {
  return (
    <Pill
      testID="status-pill"
      tone={statusTone[status]}
      size="lg"
      rounded={false}
      className={['gap-2 px-3 py-1.5 rounded-lg', className].filter(Boolean).join(' ')}
      textClassName="font-sans font-extrabold"
      leading={
        <View accessibilityElementsHidden>
          <StatusDot variant={statusDotVariant[status]} glow />
        </View>
      }
      {...props}
    >
      {label ?? defaultLabel[status]}
    </Pill>
  )
}
