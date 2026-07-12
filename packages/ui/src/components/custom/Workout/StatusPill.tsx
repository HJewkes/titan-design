// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { StatusDot, type StatusDotVariant } from './StatusDot'

const t = getSemanticColors('dark')

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
  return t[statusToken[status]]
}

/**
 * Verdict pill: a glowing status dot + colored verdict text, in a tinted,
 * bordered capsule. Composes {@link StatusDot} for the dot so the glow/color
 * stays consistent with the atom. Tint and border are derived from the same
 * semantic token via `alpha()` — no per-status raw hex.
 */
export function StatusPill({ status, label, className, style, ...props }: StatusPillProps) {
  const color = statusPillColor(status)
  const text = label ?? defaultLabel[status]

  return (
    <View
      testID="status-pill"
      className={className}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          alignSelf: 'flex-start',
          paddingVertical: 7,
          paddingHorizontal: 13,
          borderRadius: 9,
          backgroundColor: alpha(color, 0.14),
          borderWidth: 1,
          borderColor: alpha(color, 0.4),
        },
        style,
      ]}
      {...props}
    >
      <View accessibilityElementsHidden>
        <StatusDot variant={statusDotVariant[status]} glow />
      </View>
      <Text testID="status-pill-label" style={{ fontSize: 13, fontWeight: '800', color }}>
        {text}
      </Text>
    </View>
  )
}
