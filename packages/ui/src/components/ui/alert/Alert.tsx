import React from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type AlertStatus = 'success' | 'info' | 'warning' | 'error'
export type AlertVariant = 'subtle' | 'outline' | 'solid'

export interface AlertProps extends ViewProps {
  /** Alert status type */
  status?: AlertStatus
  /** Visual variant */
  variant?: AlertVariant
  /** Custom icon element */
  icon?: React.ReactNode
  /** Whether to show the default icon */
  showIcon?: boolean
  /** Callback when close button is pressed */
  onClose?: () => void
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

const statusColors: Record<AlertStatus, {
  subtle: string
  outline: string
  solid: string
  icon: string
  text: string
}> = {
  success: {
    subtle: 'bg-status-success-subtle',
    outline: 'border-2 border-status-success bg-transparent',
    solid: 'bg-status-success',
    icon: 'text-status-success',
    text: 'text-status-success',
  },
  info: {
    subtle: 'bg-status-info-subtle',
    outline: 'border-2 border-status-info bg-transparent',
    solid: 'bg-status-info',
    icon: 'text-status-info',
    text: 'text-status-info',
  },
  warning: {
    subtle: 'bg-status-warning-subtle',
    outline: 'border-2 border-status-warning bg-transparent',
    solid: 'bg-status-warning',
    icon: 'text-status-warning',
    text: 'text-status-warning',
  },
  error: {
    subtle: 'bg-status-error-subtle',
    outline: 'border-2 border-status-error bg-transparent',
    solid: 'bg-status-error',
    icon: 'text-status-error',
    text: 'text-status-error',
  },
}

// Default icons for each status
const defaultIcons: Record<AlertStatus, string> = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
}

/**
 * Alert component for displaying status messages.
 *
 * @example
 * <Alert status="success">
 *   <AlertTitle>Success!</AlertTitle>
 *   <AlertDescription>Your changes have been saved.</AlertDescription>
 * </Alert>
 *
 * <Alert status="error" variant="solid" onClose={() => {}}>
 *   <AlertDescription>Something went wrong.</AlertDescription>
 * </Alert>
 */
export function Alert({
  status = 'info',
  variant = 'subtle',
  icon,
  showIcon = true,
  onClose,
  className,
  children,
  ...props
}: AlertProps) {
  const colors = statusColors[status]
  const isSolid = variant === 'solid'

  return (
    <View
      accessibilityRole="alert"
      className={cn(
        'flex-row items-start p-4 rounded-lg',
        colors[variant],
        className
      )}
      {...props}
    >
      {showIcon && (
        <View className="mr-3 mt-0.5">
          {icon || (
            <Text
              className={cn(
                'text-lg font-bold',
                isSolid ? 'text-white' : colors.icon
              )}
            >
              {defaultIcons[status]}
            </Text>
          )}
        </View>
      )}

      <View className="flex-1">
        {children}
      </View>

      {onClose && (
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close alert"
          className="ml-2 p-1 rounded web:hover:bg-black/10 active:bg-black/20"
        >
          <Text className={cn('text-lg', isSolid ? 'text-white/70' : 'text-text-secondary')}>
            ×
          </Text>
        </Pressable>
      )}
    </View>
  )
}

export interface AlertTitleProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Title for Alert component.
 */
export function AlertTitle({ children, className }: AlertTitleProps) {
  return (
    <Text className={cn('font-semibold text-text-primary mb-1', className)}>
      {children}
    </Text>
  )
}

export interface AlertDescriptionProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Description for Alert component.
 */
export function AlertDescription({ children, className }: AlertDescriptionProps) {
  return (
    <Text className={cn('text-sm text-text-secondary', className)}>
      {children}
    </Text>
  )
}
