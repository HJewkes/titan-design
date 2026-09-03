import React, { forwardRef } from 'react'
import { Pressable, View, Text, type PressableProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type CheckboxSize = 'sm' | 'md' | 'lg'

export interface CheckboxProps extends Omit<PressableProps, 'children'> {
  /** Whether the checkbox is checked */
  isChecked?: boolean
  /** Whether the checkbox is in indeterminate state */
  isIndeterminate?: boolean
  /** Whether the checkbox is disabled */
  isDisabled?: boolean
  /** Whether the checkbox is invalid */
  isInvalid?: boolean
  /** Checkbox size */
  size?: CheckboxSize
  /** Label text */
  label?: string
  /** Helper text */
  helperText?: string
  /** Value for forms */
  value?: string
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void
  /** Additional className */
  className?: string
}

const sizeStyles: Record<CheckboxSize, { box: string; icon: string; label: string }> = {
  sm: { box: 'w-4 h-4', icon: 'w-2.5 h-2.5', label: 'text-sm' },
  md: { box: 'w-5 h-5', icon: 'w-3 h-3', label: 'text-base' },
  lg: { box: 'w-6 h-6', icon: 'w-3.5 h-3.5', label: 'text-lg' },
}

/**
 * Checkbox component for boolean inputs.
 *
 * @example
 * <Checkbox
 *   isChecked={checked}
 *   onCheckedChange={setChecked}
 *   label="Accept terms and conditions"
 * />
 */
export const Checkbox = forwardRef<View, CheckboxProps>(function Checkbox(
  {
    isChecked = false,
    isIndeterminate = false,
    isDisabled = false,
    isInvalid = false,
    size = 'md',
    label,
    helperText,
    value,
    onCheckedChange,
    className,
    ...props
  },
  ref
) {
  const styles = sizeStyles[size]

  const handlePress = () => {
    if (!isDisabled) {
      onCheckedChange?.(!isChecked)
    }
  }

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      onPress={handlePress}
      accessibilityRole="checkbox"
      accessibilityState={{
        checked: isIndeterminate ? 'mixed' : isChecked,
        disabled: isDisabled,
      }}
      accessibilityLabel={label}
      className={cn('flex-row items-start gap-2', isDisabled && 'opacity-50', className)}
      {...props}
    >
      <View
        className={cn(
          'items-center justify-center rounded border-2 transition-colors',
          styles.box,
          isChecked || isIndeterminate
            ? 'bg-brand-primary border-brand-primary'
            : 'bg-transparent border-hairline',
          isInvalid && 'border-status-error',
          !isDisabled && 'web:hover:border-brand-primary'
        )}
      >
        {isChecked && !isIndeterminate && (
          <View className={cn('bg-white rounded-sm', styles.icon)}>
            {/* Checkmark icon - using a simple view as placeholder */}
            <Text className="text-brand-primary font-bold text-center leading-none">✓</Text>
          </View>
        )}
        {isIndeterminate && <View className={cn('bg-white h-0.5 w-2/3 rounded')} />}
      </View>

      {(label || helperText) && (
        <View className="flex-1">
          {label && (
            <Text className={cn('text-text-primary font-medium', styles.label)}>{label}</Text>
          )}
          {helperText && <Text className="text-xs text-text-secondary mt-0.5">{helperText}</Text>}
        </View>
      )}
    </Pressable>
  )
})

export interface CheckboxGroupProps {
  children: React.ReactNode
  /** Label for the group */
  label?: string
  /** Orientation of checkboxes */
  orientation?: 'horizontal' | 'vertical'
  /** Additional className */
  className?: string
}

/**
 * Container for grouping related checkboxes.
 */
export function CheckboxGroup({
  children,
  label,
  orientation = 'vertical',
  className,
}: CheckboxGroupProps) {
  return (
    <View className={cn('gap-1', className)}>
      {label && <Text className="text-sm font-medium text-text-primary mb-2">{label}</Text>}
      <View className={cn(orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row gap-4')}>
        {children}
      </View>
    </View>
  )
}
