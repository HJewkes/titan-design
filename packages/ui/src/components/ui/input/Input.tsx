import React, { forwardRef, useState } from 'react'
import { TextInput, View, Text, Pressable, type TextInputProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type InputSize = 'sm' | 'md' | 'lg'
export type InputVariant = 'outline' | 'filled' | 'underline'

export interface InputProps extends Omit<TextInputProps, 'editable'> {
  /** Input size */
  size?: InputSize
  /** Visual variant */
  variant?: InputVariant
  /** Whether the input is disabled */
  isDisabled?: boolean
  /** Whether the input has an error */
  isInvalid?: boolean
  /** Whether the input is read-only */
  isReadOnly?: boolean
  /** Whether the input is required */
  isRequired?: boolean
  /** Whether this is a multiline textarea */
  multiline?: boolean
  /** Number of visible lines for multiline */
  numberOfLines?: number
  /** Label text */
  label?: string
  /** Helper text shown below input */
  helperText?: string
  /** Error message (shown when isInvalid is true) */
  errorMessage?: string
  /** Left element/icon */
  leftElement?: React.ReactNode
  /** Right element/icon */
  rightElement?: React.ReactNode
  /** Additional className for the container */
  className?: string
  /** Additional className for the input */
  inputClassName?: string
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-4 text-lg',
}

const multilineSizeStyles: Record<InputSize, string> = {
  sm: 'min-h-[80px] px-3 py-2 text-sm',
  md: 'min-h-[100px] px-4 py-3 text-base',
  lg: 'min-h-[120px] px-4 py-3 text-lg',
}

const variantStyles: Record<
  InputVariant,
  { base: string; focus: string; hover: string; error: string }
> = {
  outline: {
    base: 'border border-border-input rounded-md bg-transparent',
    hover: 'web:hover:border-border-input-hover',
    focus: 'border-border-input-focus',
    error: 'border-border-input-error',
  },
  filled: {
    base: 'border border-transparent rounded-md bg-surface-input',
    hover: 'web:hover:border-border-input-hover',
    focus: 'border-border-input-focus bg-transparent',
    error: 'border-border-input-error',
  },
  underline: {
    base: 'border-b border-border-input rounded-none bg-transparent',
    hover: 'web:hover:border-border-input-hover',
    focus: 'border-border-input-focus',
    error: 'border-border-input-error',
  },
}

/**
 * Input component for text entry.
 *
 * @example
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   helperText="We'll never share your email"
 * />
 *
 * // With error state
 * <Input
 *   label="Password"
 *   isInvalid
 *   errorMessage="Password is required"
 * />
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    size = 'md',
    variant = 'outline',
    isDisabled = false,
    isInvalid = false,
    isReadOnly = false,
    isRequired = false,
    multiline = false,
    numberOfLines = 4,
    label,
    helperText,
    errorMessage,
    leftElement,
    rightElement,
    className,
    inputClassName,
    onFocus,
    onBlur,
    ...props
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = (e: any) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e: any) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  const showError = isInvalid && errorMessage
  const showHelper = !showError && helperText

  return (
    <View className={cn('w-full', className)}>
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-text-primary">
          {label}
          {isRequired && <Text className="text-status-error ml-0.5">*</Text>}
        </Text>
      )}

      <View
        className={cn(
          'flex-row transition-colors duration-150',
          multiline ? 'items-start' : 'items-center',
          variantStyles[variant].base,
          !isDisabled && !isInvalid && variantStyles[variant].hover,
          isFocused && variantStyles[variant].focus,
          isInvalid && variantStyles[variant].error,
          isDisabled && 'opacity-40 cursor-not-allowed'
        )}
      >
        {leftElement && <View className={cn('pl-3 pr-1', multiline && 'pt-3')}>{leftElement}</View>}

        <TextInput
          ref={ref}
          editable={!isDisabled && !isReadOnly}
          accessibilityLabel={label}
          accessibilityState={{
            disabled: isDisabled,
          }}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor="var(--color-text-tertiary)"
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            'flex-1 text-text-primary',
            multiline ? multilineSizeStyles[size] : sizeStyles[size],
            leftElement && 'pl-1',
            rightElement && 'pr-1',
            inputClassName
          )}
          {...props}
        />

        {rightElement && (
          <View className={cn('pl-1 pr-3', multiline && 'pt-3')}>{rightElement}</View>
        )}
      </View>

      {showHelper && <Text className="mt-1.5 text-xs text-text-secondary">{helperText}</Text>}

      {showError && <Text className="mt-1.5 text-xs text-status-error">{errorMessage}</Text>}
    </View>
  )
})

export interface InputGroupProps {
  children: React.ReactNode
  className?: string
}

/**
 * Container for grouping related inputs.
 */
export function InputGroup({ children, className }: InputGroupProps) {
  return <View className={cn('flex-col gap-4', className)}>{children}</View>
}

export interface PasswordInputProps extends Omit<InputProps, 'secureTextEntry' | 'rightElement'> {
  /** Custom show password icon */
  showIcon?: React.ReactNode
  /** Custom hide password icon */
  hideIcon?: React.ReactNode
}

/**
 * Password input with visibility toggle.
 *
 * @example
 * <PasswordInput
 *   label="Password"
 *   placeholder="Enter your password"
 * />
 */
export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(function PasswordInput(
  { showIcon, hideIcon, ...props },
  ref
) {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible(!isVisible)

  // Default eye icons (simple SVG-like views)
  const defaultShowIcon = (
    <View className="w-5 h-5 items-center justify-center">
      <View className="w-3 h-3 rounded-full border-2 border-text-secondary" />
      <View className="absolute w-1.5 h-1.5 rounded-full bg-text-secondary" />
    </View>
  )

  const defaultHideIcon = (
    <View className="w-5 h-5 items-center justify-center">
      <View className="w-3 h-3 rounded-full border-2 border-text-secondary" />
      <View className="absolute w-1.5 h-1.5 rounded-full bg-text-secondary" />
      <View className="absolute w-5 h-0.5 bg-text-secondary rotate-45" />
    </View>
  )

  return (
    <Input
      ref={ref}
      secureTextEntry={!isVisible}
      rightElement={
        <Pressable
          onPress={toggleVisibility}
          accessibilityRole="button"
          accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
          className="p-1 rounded active:opacity-70"
        >
          {isVisible ? hideIcon || defaultHideIcon : showIcon || defaultShowIcon}
        </Pressable>
      }
      {...props}
    />
  )
})
