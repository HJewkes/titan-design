import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../utils/cn'
import { Indicator, type IndicatorColor } from '../ui/indicator'

export type SessionState = 'live' | 'rest' | 'idle'

export interface SessionStatePillProps extends ViewProps {
  /** Session state → dot color + pulse + label. */
  state: SessionState
  /** Override the default label (LIVE / REST / IDLE). */
  label?: string
  className?: string
}

const stateConfig: Record<
  SessionState,
  { label: string; color: IndicatorColor; pulse: boolean; textClass: string }
> = {
  // live pulses (S1: green, animated); rest is solid amber (no pulse — operator); idle is dim.
  live: { label: 'LIVE', color: 'success', pulse: true, textClass: 'text-text-primary' },
  rest: { label: 'REST', color: 'warning', pulse: false, textClass: 'text-text-primary' },
  idle: { label: 'IDLE', color: 'default', pulse: false, textClass: 'text-text-secondary' },
}

/**
 * The global session-state readout (dot + label). Shared: the top bar's status
 * and the Live-view header both use it (this is the ledger's "StatusPill",
 * Family C — built once). S1 · SessionStatePill.
 */
export function SessionStatePill({ state, label, className, ...props }: SessionStatePillProps) {
  const cfg = stateConfig[state]
  return (
    <View className={cn('flex-row items-center gap-2', className)} {...props}>
      <Indicator size="md" color={cfg.color} pulse={cfg.pulse} glow={cfg.pulse} />
      <Text className={cn('font-mono font-bold text-[11px] tracking-[0.5px]', cfg.textClass)}>
        {label ?? cfg.label}
      </Text>
    </View>
  )
}
