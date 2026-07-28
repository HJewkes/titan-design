import React, { forwardRef } from 'react'
import { Pressable, View, Text, type PressableProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type SwitchSize = 'sm' | 'md' | 'lg'

export interface SwitchProps extends Omit<PressableProps, 'children'> {
  /** Whether the switch is on */
  isChecked?: boolean
  /** Whether the switch is disabled */
  isDisabled?: boolean
  /** Switch size */
  size?: SwitchSize
  /** Label text */
  label?: string
  /** Label position */
  labelPosition?: 'left' | 'right'
  /** Callback when switch state changes */
  onCheckedChange?: (checked: boolean) => void
  /** Additional className */
  className?: string
}

const sizeStyles: Record<SwitchSize, { track: string; thumb: string; translate: string }> = {
  sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
  md: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
  lg: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'translate-x-6' },
}

/**
 * Switch component for toggling boolean values.
 *
 * @example
 * <Switch
 *   isChecked={enabled}
 *   onCheckedChange={setEnabled}
 *   label="Enable notifications"
 * />
 */
export const Switch = forwardRef<View, SwitchProps>(function Switch(
  {
    isChecked = false,
    isDisabled = false,
    size = 'md',
    label,
    labelPosition = 'right',
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

  const switchElement = (
    <View
      className={cn(
        'rounded-full p-0.5 transition-colors',
        styles.track,
        isChecked ? 'bg-brand-primary' : 'bg-hairline-strong'
      )}
    >
      <View
        className={cn(
          'rounded-full bg-white shadow-sm transition-transform',
          styles.thumb,
          isChecked && styles.translate
        )}
      />
    </View>
  )

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      onPress={handlePress}
      accessibilityRole="switch"
      accessibilityState={{ checked: isChecked, disabled: isDisabled }}
      accessibilityLabel={label}
      className={cn(
        'flex-row items-center gap-2',
        isDisabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {label && labelPosition === 'left' && (
        <Text className="text-text-primary font-medium">{label}</Text>
      )}
      {switchElement}
      {label && labelPosition === 'right' && (
        <Text className="text-text-primary font-medium">{label}</Text>
      )}
    </Pressable>
  )
})
