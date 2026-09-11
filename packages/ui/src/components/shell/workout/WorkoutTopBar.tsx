import { TopBar } from '../TopBar'
import { SessionStatePill, type SessionState } from './SessionStatePill'
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
        <SessionStatePill key="state" state={state} />,
        <DeviceMenu key="devices" devices={devices} onSelectDevice={onSelectDevice} />,
      ]}
    />
  )
}
