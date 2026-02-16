import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type ProgressSize = 'sm' | 'md' | 'lg'
export type ProgressColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
export type ProgressVariant = 'linear' | 'circular'

/** Maps the color prop to a CSS variable reference for inline styles */
const colorVarMap: Record<ProgressColor, string> = {
  primary: 'var(--color-brand-primary)',
  secondary: 'var(--color-brand-secondary)',
  success: 'var(--color-status-success)',
  error: 'var(--color-status-error)',
  warning: 'var(--color-status-warning)',
  info: 'var(--color-status-info)',
}

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

const trackColorStyles: Record<ProgressColor, string> = {
  primary: 'bg-brand-primary/20',
  secondary: 'bg-brand-secondary/20',
  success: 'bg-status-success/20',
  error: 'bg-status-error/20',
  warning: 'bg-status-warning/20',
  info: 'bg-status-info/20',
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
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <View className={cn('w-full', className)} {...props}>
      {/* Label and Value Row */}
      {(label || showValue) && (
        <View className="flex-row justify-between items-center mb-1">
          {label && (
            <Text className="text-sm text-text-secondary">{label}</Text>
          )}
          {showValue && !isIndeterminate && (
            <Text className="text-sm font-medium text-text-primary">
              {formatValue(value, max)}
            </Text>
          )}
        </View>
      )}

      {/* Progress Track */}
      <View
        className={cn(
          'w-full rounded-full overflow-hidden',
          trackColorStyles[color],
          sizeStyles[size]
        )}
        accessibilityRole="progressbar"
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
            colorStyles[color],
            isIndeterminate && 'animate-pulse w-1/3'
          )}
          style={isIndeterminate ? undefined : { width: `${percentage}%` }}
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
  className,
  ...props
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // For web, we use SVG. For native, we use a simplified view-based approach.
  return (
    <View
      className={cn('items-center justify-center', className)}
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: max,
        now: isIndeterminate ? undefined : value,
      }}
      {...props}
    >
      {/* Background circle */}
      <View
        className={cn(
          'absolute rounded-full border-4',
          'border-border-default'
        )}
        style={{
          width: size,
          height: size,
          borderWidth: strokeWidth,
        }}
      />

      {/* Progress arc (simplified) */}
      <View
        className={cn(
          'absolute rounded-full',
          colorStyles[color],
          isIndeterminate && 'animate-spin'
        )}
        style={{
          width: size,
          height: size,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: colorVarMap[color],
          borderRightColor: percentage > 25 ? colorVarMap[color] : 'transparent',
          borderBottomColor: percentage > 50 ? colorVarMap[color] : 'transparent',
          borderLeftColor: percentage > 75 ? colorVarMap[color] : 'transparent',
        }}
      />

      {/* Center value */}
      {showValue && !isIndeterminate && (
        <Text className="text-xs font-semibold text-text-primary">
          {formatValue(value, max)}
        </Text>
      )}
    </View>
  )
}

export interface ProgressStepsProps extends ViewProps {
  /** Current step (0-indexed) */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
  /** Color of completed steps */
  color?: ProgressColor
  /** Size of step indicators */
  size?: ProgressSize
  /** Labels for each step */
  labels?: string[]
  /** Additional className */
  className?: string
}

const stepSizeStyles: Record<ProgressSize, { dot: string; connector: string }> = {
  sm: { dot: 'w-2 h-2', connector: 'h-0.5' },
  md: { dot: 'w-3 h-3', connector: 'h-1' },
  lg: { dot: 'w-4 h-4', connector: 'h-1.5' },
}

/**
 * Step-based progress indicator.
 *
 * @example
 * <ProgressSteps currentStep={2} totalSteps={4} labels={['Cart', 'Shipping', 'Payment', 'Done']} />
 */
export function ProgressSteps({
  currentStep,
  totalSteps,
  color = 'primary',
  size = 'md',
  labels,
  className,
  ...props
}: ProgressStepsProps) {
  const { dot, connector } = stepSizeStyles[size]

  return (
    <View className={cn('w-full', className)} {...props}>
      <View className="flex-row items-center">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <React.Fragment key={index}>
            {/* Step dot */}
            <View
              className={cn(
                'rounded-full',
                dot,
                index <= currentStep ? colorStyles[color] : 'bg-border-strong'
              )}
            />

            {/* Connector line */}
            {index < totalSteps - 1 && (
              <View
                className={cn(
                  'flex-1 mx-1',
                  connector,
                  index < currentStep ? colorStyles[color] : 'bg-border-strong'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Labels */}
      {labels && labels.length > 0 && (
        <View className="flex-row mt-2">
          {labels.map((label, index) => (
            <Text
              key={index}
              className={cn(
                'flex-1 text-xs text-center',
                index <= currentStep ? 'text-text-primary font-medium' : 'text-text-tertiary'
              )}
            >
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}
