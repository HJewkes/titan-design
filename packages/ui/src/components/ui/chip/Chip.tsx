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
  /** Right element (count, icon). Renders before the delete button. */
  rightElement?: React.ReactNode
  /**
   * Pressed state of a toggle chip. Needs `onPress`; leave undefined for a plain chip.
   * Selected paints the `solid` face; unselected never does, so `variant="solid"` falls back to `subtle`.
   */
  isSelected?: boolean
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

/**
 * Chip keeps its squared corners; the padding is the unified squish ramp
 * (AW-142), which Chip already measured at every rung.
 */
const sizeStyles: Record<ChipSize, { container: string; text: string; deleteButton: string }> = {
  sm: {
    container: 'px-squish-x-sm py-squish-y-sm rounded',
    text: 'text-xs',
    deleteButton: 'ml-1 -mr-0.5',
  },
  md: {
    container: 'px-squish-x-md py-squish-y-md rounded-md',
    text: 'text-sm',
    deleteButton: 'ml-1.5 -mr-1',
  },
  lg: {
    container: 'px-squish-x-lg py-squish-y-lg rounded-md',
    text: 'text-base',
    deleteButton: 'ml-2 -mr-1',
  },
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
  rightElement,
  isSelected,
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
      variant={chipFace(variant, isSelected)}
      tone={colorToTone[color]}
      rounded={false}
      onPress={onPress}
      isDisabled={isDisabled}
      leading={leftElement && <View className="mr-1.5">{leftElement}</View>}
      trailing={
        <ChipTrailing
          rightElement={rightElement}
          onDelete={onDelete}
          isDisabled={isDisabled}
          deleteClassName={sizes.deleteButton}
        />
      }
      {...toggleProps(Boolean(onPress), isSelected, isDisabled)}
      className={cn(
        'self-auto gap-0',
        variant === 'outline' || isSelected !== undefined ? 'border' : 'border-0',
        sizes.container,
        onPress && 'web:cursor-pointer web:hover:opacity-80 active:opacity-70',
        isDisabled && 'cursor-not-allowed',
        // Pill's neutral solid is text-primary, near-black in light; a selected toggle reads grey[700] there.
        isSelected && color === 'default' && 'bg-interactive-selected-solid',
        className
      )}
      textClassName={cn('font-sans font-medium', sizes.text)}
      {...props}
    >
      {children}
    </Pill>
  )
}

// Solid is the selected cue, so an unselected toggle painting it would show no state change.
function chipFace(variant: ChipVariant, isSelected: boolean | undefined): PillVariant {
  if (isSelected) return 'solid'
  if (isSelected === false && variant === 'solid') return 'subtle'
  return variant
}

// A plain or non-pressable chip gets no aria-pressed: the attribute would announce it as a toggle, or fail axe on a View.
function toggleProps(isPressable: boolean, isSelected: boolean | undefined, isDisabled: boolean) {
  if (!isPressable || isSelected === undefined) return {}
  return {
    accessibilityState: { selected: isSelected, disabled: isDisabled },
    'aria-pressed': isSelected,
  }
}

function ChipTrailing({
  rightElement,
  onDelete,
  isDisabled,
  deleteClassName,
}: {
  rightElement: React.ReactNode
  onDelete: (() => void) | undefined
  isDisabled: boolean
  deleteClassName: string
}) {
  return (
    <>
      {rightElement && <View className="ml-1.5">{rightElement}</View>}
      {onDelete && (
        <DeleteButton onDelete={onDelete} isDisabled={isDisabled} className={deleteClassName} />
      )}
    </>
  )
}
