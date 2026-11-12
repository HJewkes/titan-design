import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../surface'
import { progressColor, type ProgressColor } from './progressColor'

export { progressColor, type ProgressColor }

export type ProgressSize = 'sm' | 'md' | 'lg'
export type ProgressVariant = 'linear' | 'circular'

export interface ProgressProps extends ViewProps {
  /** Current value (0-100) */
  value?: number
  /** Maximum value */
  max?: number
  /** Whether the progress is indeterminate */
  isIndeterminate?: boolean
  /** Size of the progress bar */
  size?: ProgressSize
  /** Color of the progress */
  color?: ProgressColor
  /** Whether to show the value label */
  showValue?: boolean
  /** Custom value format function */
  formatValue?: (value: number, max: number) => string
  /** Label text */
  label?: string
  /** Fixed track width in pixels (default: full width) */
  trackWidth?: number
  /** Custom hex color override for the fill bar */
  customColor?: string
  /** Additional className */
  className?: string
}

const sizeStyles: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const colorStyles: Record<ProgressColor, string> = {
  primary: 'bg-brand-primary',
  secondary: 'bg-brand-secondary',
  success: 'bg-status-success',
  error: 'bg-status-error',
  warning: 'bg-status-warning',
  info: 'bg-status-info',
}

// `-muted` rather than `-subtle`: the track is structural — it has to show the
// bar's full extent behind the fill — and the lightest rung disappears on the
// dark base. Replaces a `/20` modifier that emitted no rule (VW-308).
const trackColorStyles: Record<ProgressColor, string> = {
  primary: 'bg-brand-primary-muted',
  secondary: 'bg-brand-secondary-muted',
  success: 'bg-status-success-muted',
  error: 'bg-status-error-muted',
  warning: 'bg-status-warning-muted',
  info: 'bg-status-info-muted',
}

// A progressbar must have a name (axe aria-progressbar-name); the Spinner's 'Loading' is the precedent.
function progressName(...candidates: (string | undefined)[]): string {
  return candidates.find((name) => name !== undefined) ?? 'Progress'
}

/**
 * Linear progress bar component.
 *
 * @example
 * // Determinate progress
 * <Progress value={75} />
 *
 * @example
 * // With label and value
 * <Progress value={45} label="Uploading..." showValue />
 *
 * @example
 * // Indeterminate progress
 * <Progress isIndeterminate />
 */
export function Progress({
  value = 0,
  max = 100,
  isIndeterminate = false,
  size = 'md',
  color = 'primary',
  showValue = false,
  formatValue = (v, m) => `${Math.round((v / m) * 100)}%`,
  label,
  trackWidth,
  customColor,
  className,
  accessibilityLabel,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  // Light draws the track neutral; a tone wash under a same-hue fill hides the extent (TD-490).
  const trackClass = useSurfaceMode() === 'light' ? 'bg-hairline' : trackColorStyles[color]

  return (
    <View className={cn('w-full gap-stack-sm', className)} {...props}>
      {/* Label and Value Row */}
      {(label || showValue) && (
        <View className="flex-row justify-between items-center">
          {label && <Text className="text-sm text-text-secondary">{label}</Text>}
          {showValue && !isIndeterminate && (
            <Text className="text-sm font-medium text-text-primary">{formatValue(value, max)}</Text>
          )}
        </View>
      )}

      {/* Progress Track */}
      <View
        className={cn(
          'rounded-full overflow-hidden',
          trackWidth ? undefined : 'w-full',
          trackClass,
          sizeStyles[size]
        )}
        style={trackWidth ? { width: trackWidth } : undefined}
        accessibilityRole="progressbar"
        // The track carries the role, so it carries the name; RNW drops a label on the plain wrapper.
        accessibilityLabel={progressName(accessibilityLabel, label)}
        accessibilityValue={{
          min: 0,
          max: max,
          now: isIndeterminate ? undefined : value,
        }}
      >
        {/* Progress Fill */}
        <View
          className={cn(
            'h-full rounded-full',
            !customColor && colorStyles[color],
            isIndeterminate && 'animate-pulse w-1/3'
          )}
          style={{
            ...(isIndeterminate ? {} : { width: `${percentage}%` }),
            ...(customColor ? { backgroundColor: customColor } : {}),
          }}
        />
      </View>
    </View>
  )
}

export interface CircularProgressProps extends ViewProps {
  /** Current value (0-100) */
  value?: number
  /** Maximum value */
  max?: number
  /** Whether the progress is indeterminate */
  isIndeterminate?: boolean
  /** Size of the progress circle (diameter) */
  size?: number
  /** Stroke width */
  strokeWidth?: number
  /** Color of the progress */
  color?: ProgressColor
  /** Whether to show the value in center */
  showValue?: boolean
  /** Custom value format function */
  formatValue?: (value: number, max: number) => string
  /**
   * Custom center content (a numeral, a timer readout, an icon). When provided it
   * replaces the {@link showValue} text — the ring becomes a generic container for
   * any centered element. See {@link CircularTimer} for the batteries-included timer.
   */
  children?: React.ReactNode
  /**
   * Fill the parent container (responsive) instead of drawing a fixed `size` box.
   * The SVG uses a `0 0 size size` viewBox scaled to the container, so `size` still
   * sets the geometry proportions (radius, stroke) while the ring grows/shrinks with
   * its parent — e.g. a wall column. Default false (fixed `size` px).
   */
  fill?: boolean
  /** Additional className */
  className?: string
}

/**
 * Circular progress indicator component.
 *
 * @example
 * <CircularProgress value={75} showValue />
 */
export function CircularProgress({
  value = 0,
  max = 100,
  isIndeterminate = false,
  size = 48,
  strokeWidth = 4,
  color = 'primary',
  showValue = false,
  formatValue = (v, m) => `${Math.round((v / m) * 100)}%`,
  children,
  fill = false,
  className,
  accessibilityLabel,
  ...props
}: CircularProgressProps) {
  const surfaceMode = useSurfaceMode()
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const center = size / 2
  // Fixed: a `size × size` px box. Fill: fill the parent, staying square, and let
  // the `0 0 size size` viewBox scale the geometry to fit (a responsive ring).
  const boxStyle = fill ? { width: '100%' as const, aspectRatio: 1 } : { width: size, height: size }

  return (
    <View
      className={cn('items-center justify-center', className)}
      style={boxStyle}
      accessibilityRole="progressbar"
      accessibilityLabel={progressName(accessibilityLabel)}
      accessibilityValue={{
        min: 0,
        max: max,
        now: isIndeterminate ? undefined : value,
      }}
      {...props}
    >
      {/* SVG implementation for web — width/height 100% so it scales with `boxStyle`. */}
      <View className={cn(isIndeterminate && 'animate-spin')} style={boxStyle}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
          style={{ position: 'absolute' }}
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={getSemanticColors(surfaceMode)['hairline-default']}
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={progressColor(color, surfaceMode)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isIndeterminate ? circumference * 0.75 : strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
            style={{ transition: 'stroke-dashoffset 300ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
      </View>

      {/* Center: custom children take precedence over the showValue readout. */}
      {children != null ? (
        <View
          style={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {children}
        </View>
      ) : (
        showValue &&
        !isIndeterminate && (
          <Text
            className="text-xs font-semibold text-text-primary absolute"
            style={{ fontSize: Math.max(size * 0.22, 10) }}
          >
            {formatValue(value, max)}
          </Text>
        )
      )}
    </View>
  )
}

export {
  ProgressSteps,
  type ProgressStepsProps,
  type ProgressStepsVariant,
  type ProgressStepState,
} from './ProgressSteps'
