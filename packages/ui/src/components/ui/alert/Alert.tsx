import React, { createContext, useContext } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { useSurfaceMode } from '../surface'

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
   * Convenience single-line content: renders as **status-colored, bold** text (the
   * on-colour on `solid`) — the batteries-included cue message, so a `compact` cue is just
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
    /** Text/glyph colour on the `solid` fill — the status's on-colour. */
    onSolid: string
    /**
     * Light-mode on-colour where the light `on-status-*` token (white) misses AA on the
     * `-solid` fill: amber 500 (3.64:1) and blue 500 (3.12:1). `text-primary` clears both
     * (4.83:1, 5.60:1); white stays on success and error (4.56:1, 4.57:1). TD-412 owns the
     * token values; this is the pairing that reads until it sets them.
     */
    onSolidLight?: string
    border: string
    icon: string
    text: string
    /** Label ON the `subtle` fill — see AW-133; the base token is too deep to read there. */
    subtleText: string
  }
> = {
  success: {
    subtle: 'bg-status-success-subtle',
    outline: 'border-2 border-status-success bg-transparent',
    solid: 'bg-status-success-solid',
    onSolid: 'text-on-status-success',
    border: 'border-status-success',
    icon: 'text-status-success',
    text: 'text-status-success',
    subtleText: 'text-on-status-success-subtle',
  },
  info: {
    subtle: 'bg-status-info-subtle',
    outline: 'border-2 border-status-info bg-transparent',
    solid: 'bg-status-info-solid',
    onSolid: 'text-on-status-info',
    onSolidLight: 'text-text-primary',
    border: 'border-status-info',
    icon: 'text-status-info',
    text: 'text-status-info',
    subtleText: 'text-on-status-info-subtle',
  },
  warning: {
    subtle: 'bg-status-warning-subtle',
    outline: 'border-2 border-status-warning bg-transparent',
    solid: 'bg-status-warning-solid',
    onSolid: 'text-on-status-warning',
    onSolidLight: 'text-text-primary',
    border: 'border-status-warning',
    icon: 'text-status-warning',
    text: 'text-status-warning',
    subtleText: 'text-on-status-warning-subtle',
  },
  error: {
    subtle: 'bg-status-error-subtle',
    outline: 'border-2 border-status-error bg-transparent',
    solid: 'bg-status-error-solid',
    onSolid: 'text-on-status-error',
    border: 'border-status-error',
    icon: 'text-status-error',
    text: 'text-status-error',
    subtleText: 'text-on-status-error-subtle',
  },
}

// Default icons for each status
const defaultIcons: Record<AlertStatus, string> = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
}

/** The on-colour class of the enclosing `solid` Alert, or `null` outside one. */
const AlertSolidContext = createContext<string | null>(null)

type StatusClasses = (typeof statusColors)[AlertStatus]

/**
 * The classes the message, title, description and glyph read: the fill's on-colour on
 * `solid` (per theme), the subtle on-colour on `subtle`, the status colour on `outline`.
 */
function labelClasses(colors: StatusClasses, variant: AlertVariant, mode: 'dark' | 'light') {
  if (variant === 'solid') {
    const onSolid = (mode === 'light' && colors.onSolidLight) || colors.onSolid
    return { onSolid, label: onSolid, glyph: onSolid }
  }
  if (variant === 'subtle')
    return { onSolid: null, label: colors.subtleText, glyph: colors.subtleText }
  return { onSolid: null, label: colors.text, glyph: colors.icon }
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
  const { onSolid, label, glyph } = labelClasses(colors, variant, useSurfaceMode())
  const isCompact = size === 'compact'

  return (
    <View
      accessibilityRole="alert"
      className={cn(
        isCompact
          ? 'flex-row items-center px-inset-md py-inset-sm rounded-lg'
          : 'flex-row items-start p-inset-lg rounded-lg',
        colors[variant],
        // A compact `subtle` pill gets a hairline status border so it reads as a
        // defined cue on a dark wall (the CueFlag look); other variants carry their own.
        isCompact && variant === 'subtle' && cn('border', colors.border),
        className
      )}
      {...props}
    >
      {showIcon && (
        <View className={isCompact ? 'mr-2' : 'mr-3'}>
          {icon || (
            <Text
              className={cn(
                'font-bold',
                // The default glyph's line box equals the first text line's (20px), so the
                // two centre together; compact centres the row instead.
                isCompact ? 'text-base' : 'text-lg leading-5',
                glyph
              )}
            >
              {defaultIcons[status]}
            </Text>
          )}
        </View>
      )}

      <AlertSolidContext.Provider value={onSolid}>
        <View className="flex-1 gap-stack-sm">
          {message != null && (
            <Text className={cn('text-sm font-semibold', label)} testID="alert-message">
              {message}
            </Text>
          )}
          {children}
        </View>
      </AlertSolidContext.Provider>

      {onClose && (
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close alert"
          className="ml-2 p-1 rounded web:hover:bg-scrim-press active:bg-scrim-press-strong"
        >
          <Text
            className={cn('text-lg', onSolid ? cn(onSolid, 'opacity-70') : 'text-text-secondary')}
          >
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
 * Title for Alert component. Reads the on-colour inside a `solid` Alert.
 */
export function AlertTitle({ children, className }: AlertTitleProps) {
  const onSolid = useContext(AlertSolidContext)
  return (
    <Text className={cn('font-semibold leading-5', onSolid ?? 'text-text-primary', className)}>
      {children}
    </Text>
  )
}

export interface AlertDescriptionProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Description for Alert component. Reads the on-colour inside a `solid` Alert.
 */
export function AlertDescription({ children, className }: AlertDescriptionProps) {
  const onSolid = useContext(AlertSolidContext)
  return (
    <Text className={cn('text-sm', onSolid ?? 'text-text-secondary', className)}>{children}</Text>
  )
}
