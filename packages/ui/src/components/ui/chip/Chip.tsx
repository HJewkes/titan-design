import React from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type ChipVariant = 'solid' | 'subtle' | 'outline'
export type ChipColor = 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
export type ChipSize = 'sm' | 'md' | 'lg'

export interface ChipProps extends ViewProps {
  /** Visual variant */
  variant?: ChipVariant
  /** Color scheme */
  color?: ChipColor
  /** Size */
  size?: ChipSize
  /** Left element (icon, avatar) */
  leftElement?: React.ReactNode
  /** Whether the chip is dismissible */
  onDelete?: () => void
  /** Whether the chip is clickable */
  onPress?: () => void
  /** Whether the chip is disabled */
  isDisabled?: boolean
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

const colorStyles: Record<ChipColor, Record<ChipVariant, string>> = {
  default: {
    solid: 'bg-neutral-600 text-white',
    subtle: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
    outline: 'border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200',
  },
  primary: {
    solid: 'bg-brand-primary text-white',
    subtle: 'bg-brand-primary-subtle text-brand-primary',
    outline: 'border border-brand-primary text-brand-primary',
  },
  secondary: {
    solid: 'bg-brand-secondary text-white',
    subtle: 'bg-brand-secondary-subtle text-brand-secondary',
    outline: 'border border-brand-secondary text-brand-secondary',
  },
  success: {
    solid: 'bg-status-success text-white',
    subtle: 'bg-status-success-subtle text-status-success',
    outline: 'border border-status-success text-status-success',
  },
  error: {
    solid: 'bg-status-error text-white',
    subtle: 'bg-status-error-subtle text-status-error',
    outline: 'border border-status-error text-status-error',
  },
  warning: {
    solid: 'bg-status-warning text-white',
    subtle: 'bg-status-warning-subtle text-status-warning',
    outline: 'border border-status-warning text-status-warning',
  },
  info: {
    solid: 'bg-status-info text-white',
    subtle: 'bg-status-info-subtle text-status-info',
    outline: 'border border-status-info text-status-info',
  },
}

const sizeStyles: Record<ChipSize, { container: string; text: string; deleteButton: string }> = {
  sm: { container: 'px-2 py-0.5 rounded', text: 'text-xs', deleteButton: 'ml-1 -mr-0.5' },
  md: { container: 'px-3 py-1 rounded-md', text: 'text-sm', deleteButton: 'ml-1.5 -mr-1' },
  lg: { container: 'px-4 py-1.5 rounded-md', text: 'text-base', deleteButton: 'ml-2 -mr-1' },
}

/**
 * Chip component for tags, labels, and filters.
 *
 * @example
 * <Chip>Default</Chip>
 * <Chip color="primary" variant="subtle">Primary Subtle</Chip>
 * <Chip onDelete={() => {}}>Dismissible</Chip>
 * <Chip onPress={() => {}}>Clickable</Chip>
 */
export function Chip({
  variant = 'subtle',
  color = 'default',
  size = 'md',
  leftElement,
  onDelete,
  onPress,
  isDisabled = false,
  className,
  children,
  ...props
}: ChipProps) {
  const sizes = sizeStyles[size]
  const isClickable = !!onPress

  const content = (
    <>
      {leftElement && <View className="mr-1.5">{leftElement}</View>}
      <Text className={cn('font-medium', sizes.text)}>
        {children}
      </Text>
      {onDelete && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.()
            onDelete()
          }}
          accessibilityRole="button"
          accessibilityLabel="Remove"
          disabled={isDisabled}
          className={cn(
            sizes.deleteButton,
            'rounded-full p-0.5 web:hover:bg-black/10 active:bg-black/20'
          )}
        >
          <Text className="text-xs leading-none">×</Text>
        </Pressable>
      )}
    </>
  )

  const baseClassName = cn(
    'flex-row items-center',
    sizes.container,
    colorStyles[color][variant],
    isClickable && 'web:cursor-pointer web:hover:opacity-80 active:opacity-70',
    isDisabled && 'opacity-50 cursor-not-allowed',
    className
  )

  if (isClickable) {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        className={baseClassName}
        {...props}
      >
        {content}
      </Pressable>
    )
  }

  return (
    <View className={baseClassName} {...props}>
      {content}
    </View>
  )
}
