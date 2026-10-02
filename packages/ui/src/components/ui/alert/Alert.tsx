import React from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Button, ButtonText } from '../button'
import { Eyebrow } from '../eyebrow'

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
  /** Consumer label above the title or message ("Suggested", "Insight"), in the status text colour. */
  eyebrow?: React.ReactNode
  /** Trailing slot after the content and before dismiss, e.g. one `Button size="sm"` or a `Pill`. */
  action?: React.ReactNode
  /** Full-width row below the content, inside the content column. */
  footer?: React.ReactNode
  /** With {@link onClose}, renders a text link button with this label in place of the `×`. */
  dismissLabel?: string
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
    solid: 'bg-status-success',
    onSolid: 'text-on-status-success',
    border: 'border-status-success',
    icon: 'text-status-success',
    text: 'text-status-success',
    subtleText: 'text-on-status-success-subtle',
  },
  info: {
    subtle: 'bg-status-info-subtle',
    outline: 'border-2 border-status-info bg-transparent',
    solid: 'bg-status-info',
    onSolid: 'text-on-status-info',
    border: 'border-status-info',
    icon: 'text-status-info',
    text: 'text-status-info',
    subtleText: 'text-on-status-info-subtle',
  },
  warning: {
    subtle: 'bg-status-warning-subtle',
    outline: 'border-2 border-status-warning bg-transparent',
    solid: 'bg-status-warning',
    onSolid: 'text-on-status-warning',
    border: 'border-status-warning',
    icon: 'text-status-warning',
    text: 'text-status-warning',
    subtleText: 'text-on-status-warning-subtle',
  },
  error: {
    subtle: 'bg-status-error-subtle',
    outline: 'border-2 border-status-error bg-transparent',
    solid: 'bg-status-error',
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

type StatusTone = (typeof statusColors)[AlertStatus]

interface ToneProps {
  status: AlertStatus
  variant: AlertVariant
}

/** The status text class for a variant: on-colour on solid, readable ink on subtle, the status hue on outline. */
function toneClass(colors: StatusTone, variant: AlertVariant, outline: string) {
  if (variant === 'solid') return colors.onSolid
  return variant === 'subtle' ? colors.subtleText : outline
}

function alertFrameClass({ status, variant }: ToneProps, isCompact: boolean, className?: string) {
  const colors = statusColors[status]
  return cn(
    isCompact
      ? 'flex-row items-center px-inset-md py-inset-sm rounded-lg'
      : 'flex-row items-start p-inset-lg rounded-lg',
    colors[variant],
    // A compact `subtle` pill gets a hairline status border so it reads as a
    // defined cue on a dark wall (the CueFlag look); other variants carry their own.
    isCompact && variant === 'subtle' && cn('border', colors.border),
    className
  )
}

interface AlertGlyphProps extends ToneProps {
  isCompact: boolean
  icon?: React.ReactNode
}

function AlertGlyph({ status, variant, isCompact, icon }: AlertGlyphProps) {
  const colors = statusColors[status]
  return (
    <View className={isCompact ? 'mr-2' : 'mr-3 mt-0.5'}>
      {icon || (
        <Text
          className={cn(
            'font-bold',
            isCompact ? 'text-base' : 'text-lg',
            toneClass(colors, variant, colors.icon)
          )}
        >
          {defaultIcons[status]}
        </Text>
      )}
    </View>
  )
}

type AlertContentProps = ToneProps & Pick<AlertProps, 'eyebrow' | 'message' | 'footer' | 'children'>

function AlertContent({ status, variant, eyebrow, message, footer, children }: AlertContentProps) {
  const colors = statusColors[status]
  const textClass = toneClass(colors, variant, colors.text)
  return (
    <View className="flex-1 gap-stack-sm">
      {eyebrow != null && <Eyebrow className={textClass}>{eyebrow}</Eyebrow>}
      {message != null && (
        <Text className={cn('text-sm font-semibold', textClass)} testID="alert-message">
          {message}
        </Text>
      )}
      {children}
      {footer}
    </View>
  )
}

type AlertDismissProps = ToneProps & Pick<AlertProps, 'onClose' | 'dismissLabel'>

function AlertDismiss({ status, variant, onClose, dismissLabel }: AlertDismissProps) {
  if (!onClose) return null
  if (dismissLabel) {
    return (
      <Button variant="link" size="sm" onPress={onClose} className="ml-3 self-center">
        <ButtonText>{dismissLabel}</ButtonText>
      </Button>
    )
  }
  const solidClass = variant === 'solid' ? cn(statusColors[status].onSolid, 'opacity-70') : null
  return (
    <Pressable
      onPress={onClose}
      accessibilityRole="button"
      accessibilityLabel="Close alert"
      className="ml-2 p-1 rounded web:hover:bg-scrim-press active:bg-scrim-press-strong"
    >
      <Text className={cn('text-lg', solidClass ?? 'text-text-secondary')}>×</Text>
    </Pressable>
  )
}

/**
 * Alert component for displaying status messages.
 *
 * `accessibilityRole` defaults to `alert`; pass `role="status"` for a non-urgent suggestion so a
 * screen reader does not interrupt (`summary` renders a `section` that fails axe on web).
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
  icon,
  showIcon = true,
  action,
  onClose,
  dismissLabel,
  className,
  ...props
}: AlertProps) {
  const tone = { status, variant }
  const isCompact = size === 'compact'
  const { eyebrow, message, footer, children, ...viewProps } = props
  return (
    <View
      accessibilityRole="alert"
      className={alertFrameClass(tone, isCompact, className)}
      {...viewProps}
    >
      {showIcon && <AlertGlyph {...tone} isCompact={isCompact} icon={icon} />}
      <AlertContent {...tone} {...{ eyebrow, message, footer, children }} />
      {action != null && <View className="ml-3 self-center">{action}</View>}
      <AlertDismiss {...tone} onClose={onClose} dismissLabel={dismissLabel} />
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
  return <Text className={cn('font-semibold text-text-primary', className)}>{children}</Text>
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
