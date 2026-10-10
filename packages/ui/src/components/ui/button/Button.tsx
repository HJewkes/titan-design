import React, { forwardRef } from 'react'
import { Pressable, Text, View, ActivityIndicator, type PressableProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { useHitTarget } from '../../../hooks/useHitTarget'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { resolveColor, type ColorToken } from '../../../theme/resolve-color'
import { useSurfaceMode } from '../surface'

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'

// The tone recipe (decision 0003): a solid label reads the fill's `on-*` token; every
// text emphasis (outline, ghost, link) reads `text-{tone}`, never the base tone, which
// is the mark the outline border draws. The same token names the className and the
// inline colour, so the two paths cannot drift apart (TD-415).
const solidLabelToken: Record<ButtonColor, ColorToken> = {
  primary: 'on-brand-primary',
  secondary: 'on-brand-secondary',
  success: 'on-status-success',
  error: 'on-status-error',
  warning: 'on-status-warning',
  info: 'on-status-info',
}

const textLabelToken: Record<ButtonColor, ColorToken> = {
  primary: 'text-brand',
  secondary: 'text-brand-secondary',
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
}

const markToken: Record<ButtonColor, ColorToken> = {
  primary: 'brand-primary',
  secondary: 'brand-secondary',
  success: 'status-success',
  error: 'status-error',
  warning: 'status-warning',
  info: 'status-info',
}

function labelToken(variant: ButtonVariant, color: ButtonColor): ColorToken {
  return variant === 'solid' ? solidLabelToken[color] : textLabelToken[color]
}

/**
 * Inline colours for raw RN, where the Tailwind text classes are dropped. On web
 * `resolveColor` gives the CSS variable, so the label follows the `.light` class the
 * way the className does; on native it gives the hex of the nearest Surface's mode.
 */
function inlineStyle(variant: ButtonVariant, color: ButtonColor, mode: ThemeMode) {
  const style: Record<string, string> = { color: resolveColor(labelToken(variant, color), mode) }
  if (variant === 'outline') style.borderColor = resolveColor(markToken[color], mode)
  return style
}

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  /** Visual style variant */
  variant?: ButtonVariant
  /** Size of the button */
  size?: ButtonSize
  /** Color scheme */
  color?: ButtonColor
  /** Whether this is an icon-only button (square aspect ratio) */
  isIconButton?: boolean
  /** Whether the button is disabled */
  isDisabled?: boolean
  /** Whether the button is in a loading state */
  isLoading?: boolean
  /** Loading text to display */
  loadingText?: string
  /** Whether the button should take full width */
  fullWidth?: boolean
  /** Additional className for styling */
  className?: string
  /** Button content */
  children?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, Record<ButtonColor, string>> = {
  // Fill from `*-solid`, not the base tone: `brand-secondary` and `status-error` are
  // dark steps, too dark for any label to read on (AW-141).
  solid: {
    // Hover and active step down the ramp from the rest fill (decision 0003); the
    // light `brand-primary-dark` equals the rest fill, so it is no hover at all.
    primary:
      'bg-brand-primary-solid active:bg-brand-primary-active active:scale-[0.98] web:hover:bg-brand-primary-hover web:active:scale-[0.98]',
    secondary:
      'bg-brand-secondary-solid active:bg-brand-secondary-dark active:scale-[0.98] web:hover:bg-brand-secondary-dark web:active:scale-[0.98]',
    success:
      'bg-status-success-solid active:opacity-90 active:scale-[0.98] web:hover:opacity-90 web:active:scale-[0.98]',
    error:
      'bg-status-error-solid active:opacity-90 active:scale-[0.98] web:hover:opacity-90 web:active:scale-[0.98]',
    warning:
      'bg-status-warning-solid active:opacity-90 active:scale-[0.98] web:hover:opacity-90 web:active:scale-[0.98]',
    info: 'bg-status-info-solid active:opacity-90 active:scale-[0.98] web:hover:opacity-90 web:active:scale-[0.98]',
  },
  outline: {
    primary:
      'border-2 border-brand-primary bg-transparent active:bg-brand-primary-subtle active:scale-[0.98] web:hover:bg-brand-primary-subtle web:active:scale-[0.98]',
    secondary:
      'border-2 border-brand-secondary bg-transparent active:bg-brand-secondary-subtle active:scale-[0.98] web:hover:bg-brand-secondary-subtle web:active:scale-[0.98]',
    success:
      'border-2 border-status-success bg-transparent active:bg-status-success-subtle active:scale-[0.98] web:hover:bg-status-success-subtle web:active:scale-[0.98]',
    error:
      'border-2 border-status-error bg-transparent active:bg-status-error-subtle active:scale-[0.98] web:hover:bg-status-error-subtle web:active:scale-[0.98]',
    warning:
      'border-2 border-status-warning bg-transparent active:bg-status-warning-subtle active:scale-[0.98] web:hover:bg-status-warning-subtle web:active:scale-[0.98]',
    info: 'border-2 border-status-info bg-transparent active:bg-status-info-subtle active:scale-[0.98] web:hover:bg-status-info-subtle web:active:scale-[0.98]',
  },
  ghost: {
    primary:
      'bg-transparent active:bg-brand-primary-subtle active:scale-[0.98] web:hover:bg-brand-primary-subtle web:active:scale-[0.98]',
    secondary:
      'bg-transparent active:bg-brand-secondary-subtle active:scale-[0.98] web:hover:bg-brand-secondary-subtle web:active:scale-[0.98]',
    success:
      'bg-transparent active:bg-status-success-subtle active:scale-[0.98] web:hover:bg-status-success-subtle web:active:scale-[0.98]',
    error:
      'bg-transparent active:bg-status-error-subtle active:scale-[0.98] web:hover:bg-status-error-subtle web:active:scale-[0.98]',
    warning:
      'bg-transparent active:bg-status-warning-subtle active:scale-[0.98] web:hover:bg-status-warning-subtle web:active:scale-[0.98]',
    info: 'bg-transparent active:bg-status-info-subtle active:scale-[0.98] web:hover:bg-status-info-subtle web:active:scale-[0.98]',
  },
  link: {
    primary: 'bg-transparent',
    secondary: 'bg-transparent',
    success: 'bg-transparent',
    error: 'bg-transparent',
    warning: 'bg-transparent',
    info: 'bg-transparent',
  },
}

function textStyles(variant: ButtonVariant, color: ButtonColor): string {
  const label = `text-${labelToken(variant, color)}`
  return variant === 'link' ? `${label} web:hover:underline` : label
}

// Pixel-identical to the px-4/py-1.5/min-h-[32px] triples these replaced — the
// control tokens were measured off this component (AW-142). `sm` sits at 32px,
// below the 44pt hit-target floor, so it carries a hit box instead (TD-10).
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-control-x-sm py-control-y-sm min-h-control-sm',
  md: 'px-control-x-md py-control-y-md min-h-control-md',
  lg: 'px-control-x-lg py-control-y-lg min-h-control-lg',
}

// Icon button sizes (square aspect ratio)
const iconButtonSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-8 h-8 p-0',
  md: 'w-10 h-10 p-0',
  lg: 'w-12 h-12 p-0',
}

// Faces under the 44pt floor: 32px carries a hit box, faces unchanged (TD-10, owner decision A4).
const needsHitTarget: Record<ButtonSize, boolean> = {
  sm: true,
  md: false,
  lg: false,
}

const textSizeStyles: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
}

/**
 * Button component following compound component pattern.
 *
 * @example
 * <Button variant="solid" color="primary">
 *   <ButtonText>Click me</ButtonText>
 * </Button>
 *
 * // Or with icon
 * <Button variant="outline" color="secondary">
 *   <ButtonIcon as={PlusIcon} />
 *   <ButtonText>Add item</ButtonText>
 * </Button>
 */
export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    variant = 'solid',
    size = 'md',
    color = 'primary',
    isIconButton = false,
    isDisabled = false,
    isLoading = false,
    loadingText,
    fullWidth = false,
    className,
    children,
    onLayout,
    ...props
  },
  ref
) {
  const disabled = isDisabled || isLoading
  const hitTarget = useHitTarget({ enabled: needsHitTarget[size], onLayout })
  const mode = useSurfaceMode()

  return (
    <Pressable
      ref={ref}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn(
        // Base styles
        'flex-row items-center justify-center rounded-md transition-all duration-150',
        // Variant + color styles
        variantStyles[variant][color],
        // Label colour lives on the container: ButtonText renders `text-inherit`, so a
        // colour set only on the inner Text never reaches the common `<ButtonText>`
        // child path — which is why solid labels stayed browser-default white (AW-141).
        textStyles(variant, color),
        // Size styles (icon button vs regular)
        isIconButton ? iconButtonSizeStyles[size] : sizeStyles[size],
        // Full width
        fullWidth && 'w-full',
        // Disabled styles - more refined
        disabled && 'opacity-40 cursor-not-allowed active:scale-100 web:active:scale-100',
        // Link variant has no padding
        variant === 'link' && 'px-0 py-0 min-h-0',
        className
      )}
      style={inlineStyle(variant, color, mode)}
      hitSlop={hitTarget.hitSlop}
      onLayout={hitTarget.onLayout}
      {...props}
    >
      {hitTarget.layerProps && <View {...hitTarget.layerProps} />}
      {isLoading && (
        <ActivityIndicator
          size="small"
          // A literal hex for the mode, the path Spinner takes for ActivityIndicator (VW-316).
          color={variant === 'solid' ? getSemanticColors(mode)[solidLabelToken[color]] : undefined}
          className="mr-2"
        />
      )}
      {isLoading && loadingText ? (
        <Text
          className={cn('font-semibold', textSizeStyles[size], textStyles(variant, color))}
          style={{ color: resolveColor(labelToken(variant, color), mode) }}
        >
          {loadingText}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  )
})

export interface ButtonTextProps {
  children: React.ReactNode
  className?: string
}

/**
 * Text component for Button. Use inside Button for consistent styling.
 */
export function ButtonText({ children, className }: ButtonTextProps) {
  return <Text className={cn('font-semibold text-inherit', className)}>{children}</Text>
}

export interface ButtonIconProps {
  /** Icon component to render */
  as: React.ComponentType<{ size?: number; color?: string; className?: string }>
  /** Icon size */
  size?: number
  /** Additional className */
  className?: string
}

/**
 * Icon component for Button. Use inside Button for icons.
 */
export function ButtonIcon({ as: Icon, size = 16, className }: ButtonIconProps) {
  return <Icon size={size} className={cn('text-inherit', className)} />
}

export interface ButtonSpinnerProps {
  className?: string
}

/**
 * Spinner component for Button loading state.
 */
export function ButtonSpinner({ className }: ButtonSpinnerProps) {
  return <ActivityIndicator size="small" className={cn('text-inherit', className)} />
}
