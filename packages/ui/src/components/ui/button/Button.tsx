import React, { forwardRef } from 'react'
import { Pressable, Text, View, ActivityIndicator, type PressableProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { semanticColorsDark } from '../../../theme/tokens/semantic'

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'

/** Inline color map for RNW where Tailwind text classes get dropped */
const textColorMap: Record<ButtonVariant, Record<ButtonColor, string>> = {
  solid: {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    success: '#FFFFFF',
    error: '#FFFFFF',
    warning: '#FFFFFF',
    info: '#FFFFFF',
  },
  outline: {
    primary: semanticColorsDark['brand-primary'],
    secondary: semanticColorsDark['brand-secondary'],
    success: semanticColorsDark['status-success'],
    error: semanticColorsDark['status-error'],
    warning: semanticColorsDark['status-warning'],
    info: semanticColorsDark['status-info'],
  },
  ghost: {
    primary: semanticColorsDark['brand-primary'],
    secondary: semanticColorsDark['brand-secondary'],
    success: semanticColorsDark['status-success'],
    error: semanticColorsDark['status-error'],
    warning: semanticColorsDark['status-warning'],
    info: semanticColorsDark['status-info'],
  },
  link: {
    primary: semanticColorsDark['brand-primary'],
    secondary: semanticColorsDark['brand-secondary'],
    success: semanticColorsDark['status-success'],
    error: semanticColorsDark['status-error'],
    warning: semanticColorsDark['status-warning'],
    info: semanticColorsDark['status-info'],
  },
}

/** Inline border color map for outline variant */
const borderColorMap: Record<ButtonColor, string> = {
  primary: semanticColorsDark['brand-primary'],
  secondary: semanticColorsDark['brand-secondary'],
  success: semanticColorsDark['status-success'],
  error: semanticColorsDark['status-error'],
  warning: semanticColorsDark['status-warning'],
  info: semanticColorsDark['status-info'],
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
  solid: {
    primary:
      'bg-brand-primary active:bg-brand-primary-dark active:scale-[0.98] web:hover:bg-brand-primary-dark web:active:scale-[0.98]',
    secondary:
      'bg-brand-secondary active:bg-brand-secondary-dark active:scale-[0.98] web:hover:bg-brand-secondary-dark web:active:scale-[0.98]',
    success:
      'bg-status-success active:opacity-90 active:scale-[0.98] web:hover:opacity-90 web:active:scale-[0.98]',
    error:
      'bg-status-error active:opacity-90 active:scale-[0.98] web:hover:opacity-90 web:active:scale-[0.98]',
    warning:
      'bg-status-warning active:opacity-90 active:scale-[0.98] web:hover:opacity-90 web:active:scale-[0.98]',
    info: 'bg-status-info active:opacity-90 active:scale-[0.98] web:hover:opacity-90 web:active:scale-[0.98]',
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

const textStyles: Record<ButtonVariant, Record<ButtonColor, string>> = {
  solid: {
    primary: 'text-white',
    secondary: 'text-white',
    success: 'text-white',
    error: 'text-white',
    warning: 'text-white',
    info: 'text-white',
  },
  outline: {
    primary: 'text-brand-primary',
    secondary: 'text-brand-secondary',
    success: 'text-status-success',
    error: 'text-status-error',
    warning: 'text-status-warning',
    info: 'text-status-info',
  },
  ghost: {
    primary: 'text-brand-primary',
    secondary: 'text-brand-secondary',
    success: 'text-status-success',
    error: 'text-status-error',
    warning: 'text-status-warning',
    info: 'text-status-info',
  },
  link: {
    primary: 'text-brand-primary web:hover:underline',
    secondary: 'text-brand-secondary web:hover:underline',
    success: 'text-status-success web:hover:underline',
    error: 'text-status-error web:hover:underline',
    warning: 'text-status-warning web:hover:underline',
    info: 'text-status-info web:hover:underline',
  },
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 min-h-[32px]',
  md: 'px-5 py-2 min-h-[40px]',
  lg: 'px-6 py-2.5 min-h-[48px]',
}

// Icon button sizes (square aspect ratio)
const iconButtonSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-8 h-8 p-0',
  md: 'w-10 h-10 p-0',
  lg: 'w-12 h-12 p-0',
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
    ...props
  },
  ref
) {
  const disabled = isDisabled || isLoading

  const inlineStyle: Record<string, string> = {
    color: textColorMap[variant][color],
  }
  if (variant === 'outline') {
    inlineStyle.borderColor = borderColorMap[color]
  }

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
      style={inlineStyle}
      {...props}
    >
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={variant === 'solid' ? semanticColorsDark['on-brand-primary'] : undefined}
          className="mr-2"
        />
      )}
      {isLoading && loadingText ? (
        <Text
          className={cn('font-semibold', textSizeStyles[size], textStyles[variant][color])}
          style={{ color: textColorMap[variant][color] }}
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
