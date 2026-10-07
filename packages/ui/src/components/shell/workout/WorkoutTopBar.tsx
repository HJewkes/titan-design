import { Indicator, type IndicatorColor, type IndicatorPulse } from '../../ui/indicator'
import { Pill } from '../../ui/pill'
import { Typography, type TypographyColor } from '../../ui/typography'
import { TopBar } from '../TopBar'
import { type SessionState } from './SessionStatePill'
import { DeviceMenu } from './DeviceMenu'
import { type Device } from './DeviceRow'

export interface WorkoutTopBarProps {
  /** Global session state → the status pill. */
  state: SessionState
  /** Devices for the connection glyph + dropdown. */
  devices: Device[]
  /** The moment to display in the clock (Date/timestamp). Omit for a live ticking clock. */
  time?: number | Date
  /** Brand subtitle. Default "wall dashboard". */
  subtitle?: string
  /** Force the subtitle on/off; defaults to container-responsive. */
  showSubtitle?: boolean
  /** Force the clock on/off; defaults to container-responsive. */
  showClock?: boolean
  onSelectDevice?: (device: Device) => void
  className?: string
}

const sessionStateConfig: Record<
  SessionState,
  { label: string; color: IndicatorColor; pulse: boolean | IndicatorPulse; text: TypographyColor }
> = {
  // live = vivid green with an expanding ring; rest = solid amber (no pulse — operator); idle is dim.
  live: { label: 'LIVE', color: 'live', pulse: 'ping', text: 'primary' },
  rest: { label: 'REST', color: 'warning', pulse: false, text: 'primary' },
  idle: { label: 'IDLE', color: 'default', pulse: false, text: 'secondary' },
}

/** The session-state readout as a neutral Pill; the dot carries the state, the label stays quiet. */
function SessionStateReadout({ state }: { state: SessionState }) {
  const cfg = sessionStateConfig[state]
  return (
    <Pill
      tone="neutral"
      variant="subtle"
      size="sm"
      className="gap-inline-md"
      leading={<Indicator size="md" color={cfg.color} pulse={cfg.pulse} />}
      testID="session-state-pill"
    >
      <Typography variant="monoLabel" color={cfg.text} className="text-[11px]">
        {cfg.label}
      </Typography>
    </Pill>
  )
}

/**
 * The workout app's top bar — the generic {@link TopBar} with the workout's own
 * chrome in its `trailing` slot: session state, then the device menu. The bar
 * adds its dividers and the clock; this component only supplies the items.
 */
export function WorkoutTopBar({
  state,
  devices,
  time,
  subtitle,
  showSubtitle,
  showClock,
  onSelectDevice,
  className,
}: WorkoutTopBarProps) {
  return (
    <TopBar
      brand="voltras"
      subtitle={subtitle}
      showSubtitle={showSubtitle}
      showClock={showClock}
      time={time}
      className={className}
      trailing={[
        <SessionStateReadout key="state" state={state} />,
        <DeviceMenu key="devices" devices={devices} onSelectDevice={onSelectDevice} />,
      ]}
    />
  )
}
