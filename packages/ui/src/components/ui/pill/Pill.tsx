import React from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type PillVariant = 'solid' | 'subtle' | 'outline'
/** Semantic tone. `brand-secondary` is the accent, not a second brand. */
export type PillTone =
  | 'neutral'
  | 'brand'
  | 'brand-secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
/** Legacy palette names, kept so existing `color=` call sites keep working. */
export type PillColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
export type PillSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface PillProps extends ViewProps {
  /** Pill content */
  children?: React.ReactNode
  /** Visual variant */
  variant?: PillVariant
  /** Semantic tone */
  tone?: PillTone
  /** @deprecated Use `tone` — `color` maps onto it and is kept for call-site compatibility. */
  color?: PillColor
  /** Size */
  size?: PillSize
  /** Fully rounded (default true) or slight radius */
  rounded?: boolean
  /** Leading slot: `'dot'` renders a tone-matched dot, any node renders as-is. */
  leading?: React.ReactNode | 'dot'
  /** @deprecated Use `leading`. */
  leftElement?: React.ReactNode
  /** Trailing slot (dismiss affordance, counter) */
  trailing?: React.ReactNode
  /** Press handler (makes pill interactive) */
  onPress?: () => void
  /** Non-interactive and dimmed */
  isDisabled?: boolean
  /** Additional className on the container */
  className?: string
  /** Additional className on the label, for presets that own their typography */
  textClassName?: string
}

const colorToTone: Record<PillColor, PillTone> = {
  default: 'neutral',
  primary: 'brand',
  secondary: 'brand-secondary',
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
}

const toneStyles: Record<PillVariant, Record<PillTone, string>> = {
  solid: {
    neutral: 'bg-hairline-strong border-transparent text-text-inverse',
    brand: 'bg-brand-primary border-transparent text-text-inverse',
    'brand-secondary': 'bg-brand-secondary border-transparent text-text-inverse',
    success: 'bg-status-success border-transparent text-text-inverse',
    warning: 'bg-status-warning border-transparent text-text-inverse',
    error: 'bg-status-error border-transparent text-text-inverse',
    info: 'bg-status-info border-transparent text-text-inverse',
  },
  subtle: {
    // Alpha-white rather than a ramp step: a pill sits on whatever plane its
    // host is, and an alpha fill composites by the same amount on all of them.
    // A `surface-*` fill would vanish on the plane it names. Borderless like the
    // six coloured tones — the fill carries the capsule, not a ring.
    neutral: 'bg-hairline-subtle border-transparent text-text-secondary',
    brand: 'bg-brand-primary-subtle border-transparent text-brand-primary',
    'brand-secondary': 'bg-brand-secondary-subtle border-transparent text-brand-secondary',
    success: 'bg-status-success-subtle border-transparent text-status-success',
    warning: 'bg-status-warning-subtle border-transparent text-status-warning',
    error: 'bg-status-error-subtle border-transparent text-status-error',
    info: 'bg-status-info-subtle border-transparent text-status-info',
  },
  outline: {
    neutral: 'border-hairline text-text-secondary',
    brand: 'border-brand-primary text-brand-primary',
    'brand-secondary': 'border-brand-secondary text-brand-secondary',
    success: 'border-status-success text-status-success',
    warning: 'border-status-warning text-status-warning',
    error: 'border-status-error text-status-error',
    info: 'border-status-info text-status-info',
  },
}

const dotToneStyles: Record<PillTone, string> = {
  neutral: 'bg-text-tertiary',
  brand: 'bg-brand-primary',
  'brand-secondary': 'bg-brand-secondary',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
  info: 'bg-status-info',
}

const sizeStyles: Record<PillSize, { container: string; text: string }> = {
  xs: { container: 'px-1 py-px', text: 'text-3xs' },
  sm: { container: 'px-2 py-0.5', text: 'text-2xs' },
  md: { container: 'px-2 py-1', text: 'text-2xs' },
  lg: { container: 'px-2.5 py-1', text: 'text-sm' },
  xl: { container: 'px-4 py-1.5', text: 'text-base' },
}

function PillDot({ tone }: { tone: PillTone }) {
  return (
    <View
      className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotToneStyles[tone])}
      accessibilityElementsHidden
      testID="pill-dot"
    />
  )
}

function containerClasses(p: PillProps, tone: PillTone) {
  return cn(
    'flex-row items-center gap-1 border self-start shrink-0',
    p.rounded === false ? 'rounded' : 'rounded-full',
    toneStyles[p.variant ?? 'subtle'][tone],
    sizeStyles[p.size ?? 'sm'].container,
    p.isDisabled && 'opacity-50',
    p.className
  )
}

function PillContent({ tone, ...p }: PillProps & { tone: PillTone }) {
  const textClasses = cn(
    'font-heading font-semibold text-inherit',
    sizeStyles[p.size ?? 'sm'].text,
    p.textClassName
  )
  const slot = p.leading ?? p.leftElement
  return (
    <>
      {slot === 'dot' ? <PillDot tone={tone} /> : slot}
      {typeof p.children === 'string' ? (
        <Text className={textClasses}>{p.children}</Text>
      ) : (
        p.children
      )}
      {p.trailing}
    </>
  )
}

/**
 * The single pill primitive: a capsule of tone-coloured label with optional
 * leading and trailing slots. `Badge`, `Chip`, `StatusPill` and
 * `MuscleGroupChip` are presets over it.
 *
 * @example
 * <Pill tone="success" leading="dot">Active</Pill>
 */
export function Pill(props: PillProps) {
  const {
    variant,
    tone,
    color,
    size,
    rounded,
    leading,
    leftElement,
    trailing,
    onPress,
    isDisabled,
    className,
    textClassName,
    children,
    ...viewProps
  } = props
  const resolvedTone = tone ?? (color ? colorToTone[color] : 'neutral')
  const classes = containerClasses(props, resolvedTone)
  const content = <PillContent {...props} tone={resolvedTone} />

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        className={classes}
        {...viewProps}
      >
        {content}
      </Pressable>
    )
  }

  return (
    <View className={classes} {...viewProps}>
      {content}
    </View>
  )
}
