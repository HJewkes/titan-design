import { View, type ViewProps } from 'react-native'
import { cn } from '../../utils/cn'
import { Indicator, type IndicatorColor, type IndicatorPulse } from '../ui/indicator'
import { Typography, type TypographyColor } from '../custom/Typography'

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
  {
    label: string
    color: IndicatorColor
    pulse: boolean | IndicatorPulse
    textColor: TypographyColor
  }
> = {
  // live = vivid green with an expanding ring; rest = solid amber (no pulse — operator); idle is dim.
  live: { label: 'LIVE', color: 'success', pulse: 'ping', textColor: 'primary' },
  rest: { label: 'REST', color: 'warning', pulse: false, textColor: 'primary' },
  idle: { label: 'IDLE', color: 'default', pulse: false, textColor: 'secondary' },
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
      <Indicator size="md" color={cfg.color} pulse={cfg.pulse} />
      <Typography variant="monoLabel" color={cfg.textColor} className="text-[11px]">
        {label ?? cfg.label}
      </Typography>
    </View>
  )
}
