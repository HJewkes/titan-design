import { View, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../utils/cn'
import { Indicator } from '../ui/indicator'
import { BluetoothIcon } from './icons'

export type DeviceConnState = 'connected' | 'degraded' | 'lost'

export interface DeviceIndicatorProps extends ViewProps {
  /** Aggregate connection state (worst-of the bound devices) → glyph color. */
  status?: DeviceConnState
  /** Show a red alert badge (e.g. a device dropped mid-set). */
  alert?: boolean
  /** Tap handler. When omitted the glyph is non-interactive (e.g. inside a PopoverTrigger). */
  onPress?: () => void
  /** Accessible label (names the glyph / the wrapping trigger button). */
  label?: string
  className?: string
}

// currentColor drives the stroke → color the wrapper's text token by state.
const statusTextClass: Record<DeviceConnState, string> = {
  connected: 'text-status-success',
  degraded: 'text-status-warning',
  lost: 'text-status-error',
}

/**
 * The device/BLE connection glyph — a color-coded bluetooth mark, no label.
 * Opens the DeviceMenu when tapped. S1 · DeviceIndicator.
 */
export function DeviceIndicator({
  status = 'connected',
  alert = false,
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
        'relative w-[26px] h-[28px] items-center justify-center rounded-[7px]',
        statusTextClass[status],
        className
      )}
      {...props}
    >
      {/* the SVG title names the wrapping trigger button (RNW drops aria-label on non-accessible Views) */}
      <BluetoothIcon size={18} color="currentColor" title={label} />
      {alert ? (
        <View className="absolute -top-0.5 -right-0.5">
          <Indicator size="sm" color="error" ring />
        </View>
      ) : null}
    </Wrapper>
  )
}
