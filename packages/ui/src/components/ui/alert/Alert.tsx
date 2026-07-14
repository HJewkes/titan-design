import React from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type AlertStatus = 'success' | 'info' | 'warning' | 'error'
export type AlertVariant = 'subtle' | 'outline' | 'solid'
export type AlertSize = 'default' | 'compact'

export interface AlertProps extends ViewProps {
  /** Alert status type */
  status?: AlertStatus
  /** Visual variant */
  variant?: AlertVariant
  /**
   * Density. `default` — the padded callout (icon + title/description block).
   * `compact` — a single-line **cue pill** (tighter padding, center-aligned, and a
   * hairline status border on the `subtle` variant): the across-the-room live coaching
   * cue (absorbs the R2 `CueFlag` — e.g. a velocity-loss threshold warning). Pair with
   * the {@link message} prop for the batteries-included colored one-liner.
   */
  size?: AlertSize
  /**
   * Convenience single-line content: renders as **status-colored, bold** text (white on
   * `solid`) — the batteries-included cue message, so a `compact` cue is just
   * `<Alert status="warning" size="compact" message="VL20 · …" />` with no need to
   * hand-color the text (RN doesn't cascade color). Renders before {@link children},
   * which stay available for richer content.
   */
  message?: string
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

const statusColors: Record<
  AlertStatus,
  {
    subtle: string
    outline: string
    solid: string
    border: string
    icon: string
    text: string
  }
> = {
  success: {
    subtle: 'bg-status-success-subtle',
    outline: 'border-2 border-status-success bg-transparent',
    solid: 'bg-status-success',
    border: 'border-status-success',
    icon: 'text-status-success',
    text: 'text-status-success',
  },
  info: {
    subtle: 'bg-status-info-subtle',
    outline: 'border-2 border-status-info bg-transparent',
    solid: 'bg-status-info',
    border: 'border-status-info',
    icon: 'text-status-info',
    text: 'text-status-info',
  },
  warning: {
    subtle: 'bg-status-warning-subtle',
    outline: 'border-2 border-status-warning bg-transparent',
    solid: 'bg-status-warning',
    border: 'border-status-warning',
    icon: 'text-status-warning',
    text: 'text-status-warning',
  },
  error: {
    subtle: 'bg-status-error-subtle',
    outline: 'border-2 border-status-error bg-transparent',
    solid: 'bg-status-error',
    border: 'border-status-error',
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
  size = 'default',
  message,
  icon,
  showIcon = true,
  onClose,
  className,
  children,
  ...props
}: AlertProps) {
  const colors = statusColors[status]
  const isSolid = variant === 'solid'
  const isCompact = size === 'compact'

  return (
    <View
      accessibilityRole="alert"
      className={cn(
        isCompact
          ? 'flex-row items-center px-3 py-2 rounded-lg'
          : 'flex-row items-start p-4 rounded-lg',
        colors[variant],
        // A compact `subtle` pill gets a hairline status border so it reads as a
        // defined cue on a dark wall (the CueFlag look); other variants carry their own.
        isCompact && variant === 'subtle' && cn('border', colors.border),
        className
      )}
      {...props}
    >
      {showIcon && (
        <View className={isCompact ? 'mr-2' : 'mr-3 mt-0.5'}>
          {icon || (
            <Text
              className={cn(
                'font-bold',
                isCompact ? 'text-base' : 'text-lg',
                isSolid ? 'text-white' : colors.icon
              )}
            >
              {defaultIcons[status]}
            </Text>
          )}
        </View>
      )}

      <View className="flex-1">
        {message != null && (
          <Text
            className={cn('text-sm font-semibold', isSolid ? 'text-white' : colors.text)}
            testID="alert-message"
          >
            {message}
          </Text>
        )}
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
  return <Text className={cn('font-semibold text-text-primary mb-1', className)}>{children}</Text>
}

export interface AlertDescriptionProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Description for Alert component.
 */
export function AlertDescription({ children, className }: AlertDescriptionProps) {
  return <Text className={cn('text-sm text-text-secondary', className)}>{children}</Text>
}
