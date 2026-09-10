import React from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Pill, type PillTone, type PillVariant } from '../pill'

export type ChipVariant = 'solid' | 'subtle' | 'outline'
export type ChipColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
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

const colorToTone: Record<ChipColor, PillTone> = {
  default: 'neutral',
  primary: 'brand',
  secondary: 'brand-secondary',
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
}

/** Chip keeps its own geometry and squared corners; Pill supplies the rest. */
const sizeStyles: Record<ChipSize, { container: string; text: string; deleteButton: string }> = {
  sm: { container: 'px-2 py-0.5 rounded', text: 'text-xs', deleteButton: 'ml-1 -mr-0.5' },
  md: { container: 'px-3 py-1 rounded-md', text: 'text-sm', deleteButton: 'ml-1.5 -mr-1' },
  lg: { container: 'px-4 py-1.5 rounded-md', text: 'text-base', deleteButton: 'ml-2 -mr-1' },
}

function DeleteButton({
  onDelete,
  isDisabled,
  className,
}: {
  onDelete: () => void
  isDisabled: boolean
  className: string
}) {
  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.()
        onDelete()
      }}
      accessibilityRole="button"
      accessibilityLabel="Remove"
      disabled={isDisabled}
      className={cn(
        className,
        'rounded-full p-0.5 web:hover:bg-hairline-subtle active:bg-hairline-strong'
      )}
    >
      <Text className="text-xs leading-none text-inherit">×</Text>
    </Pressable>
  )
}

/**
 * Chip — a `Pill` preset for tags, labels, and filters.
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

  return (
    <Pill
      variant={variant as PillVariant}
      tone={colorToTone[color]}
      rounded={false}
      onPress={onPress}
      isDisabled={isDisabled}
      leading={leftElement && <View className="mr-1.5">{leftElement}</View>}
      trailing={
        onDelete && (
          <DeleteButton
            onDelete={onDelete}
            isDisabled={isDisabled}
            className={sizes.deleteButton}
          />
        )
      }
      className={cn(
        'self-auto gap-0',
        variant === 'outline' ? 'border' : 'border-0',
        sizes.container,
        onPress && 'web:cursor-pointer web:hover:opacity-80 active:opacity-70',
        isDisabled && 'cursor-not-allowed',
        className
      )}
      textClassName={cn('font-sans font-medium', sizes.text)}
      {...props}
    >
      {children}
    </Pill>
  )
}
