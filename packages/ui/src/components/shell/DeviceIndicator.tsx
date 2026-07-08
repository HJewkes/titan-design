import { View, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../utils/cn'
import { BluetoothIcon } from '../icons'

export type DeviceConnState = 'connected' | 'degraded' | 'lost'

export interface DeviceIndicatorProps extends ViewProps {
  /** Aggregate connection state (worst-of the bound devices) → glyph color. */
  status?: DeviceConnState
  /** Tap handler. When omitted the glyph is non-interactive (e.g. inside a PopoverTrigger). */
  onPress?: () => void
  /** Accessible label (names the glyph / the wrapping trigger button). */
  label?: string
  className?: string
}

// currentColor drives the stroke → color the wrapper's text token by state (vivid, matches LIVE).
// The glyph color alone carries the fault (red on lost) — no separate alert badge.
const statusTextClass: Record<DeviceConnState, string> = {
  connected: 'text-status-success',
  degraded: 'text-status-warning',
  lost: 'text-status-error-vivid',
}

/**
 * The device/BLE connection glyph — a color-coded bluetooth mark, no label.
 * Opens the DeviceMenu when tapped. S1 · DeviceIndicator.
 */
export function DeviceIndicator({
  status = 'connected',
  onPress,
  label = 'Devices',
  className,
  ...props
}: DeviceIndicatorProps) {
  const Wrapper = onPress ? Pressable : View
  return (
    <Wrapper
      accessibilityLabel={label}
      {...(onPress ? { onPress, accessibilityRole: 'button' } : {})}
      className={cn(
        'w-[26px] h-[28px] items-center justify-center rounded-[7px]',
        statusTextClass[status],
        className
      )}
      {...props}
    >
      {/* the SVG title names the wrapping trigger button (RNW drops aria-label on non-accessible Views) */}
      <BluetoothIcon size={18} color="currentColor" title={label} />
    </Wrapper>
  )
}
