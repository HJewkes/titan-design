import React, { createContext, useContext } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type RadioSize = 'sm' | 'md' | 'lg'
export type RadioColor = 'primary' | 'secondary' | 'success' | 'error'

interface RadioGroupContextType {
  value: string | null
  onChange: (value: string) => void
  name?: string
  isDisabled?: boolean
  size?: RadioSize
  color?: RadioColor
}

const RadioGroupContext = createContext<RadioGroupContextType | null>(null)

export interface RadioGroupProps extends ViewProps {
  /** Current selected value */
  value: string | null
  /** Callback when value changes */
  onChange: (value: string) => void
  /** Group name for form submission */
  name?: string
  /** Whether all radios are disabled */
  isDisabled?: boolean
  /** Size for all radios */
  size?: RadioSize
  /** Color for all radios */
  color?: RadioColor
  /** Orientation of the group */
  orientation?: 'horizontal' | 'vertical'
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg'
  /** Label for the group */
  label?: string
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

const gapStyles = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
}

/**
 * RadioGroup component for grouping radio buttons.
 *
 * @example
 * <RadioGroup value={selected} onChange={setSelected}>
 *   <Radio value="option1">Option 1</Radio>
 *   <Radio value="option2">Option 2</Radio>
 *   <Radio value="option3">Option 3</Radio>
 * </RadioGroup>
 */
export function RadioGroup({
  value,
  onChange,
  name,
  isDisabled = false,
  size = 'md',
  color = 'primary',
  orientation = 'vertical',
  gap = 'md',
  label,
  className,
  children,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onChange, name, isDisabled, size, color }}>
      <View
        className={cn(className)}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        {...props}
      >
        {label && (
          <Text className="text-sm font-medium text-text-primary mb-2">
            {label}
          </Text>
        )}
        <View
          className={cn(
            orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
            gapStyles[gap]
          )}
        >
          {children}
        </View>
      </View>
    </RadioGroupContext.Provider>
  )
}

export interface RadioProps extends ViewProps {
  /** Value of this radio option */
  value: string
  /** Whether this radio is disabled */
  isDisabled?: boolean
  /** Size override */
  size?: RadioSize
  /** Color override */
  color?: RadioColor
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

const sizeConfig: Record<RadioSize, { outer: string; inner: string; text: string }> = {
  sm: { outer: 'w-4 h-4', inner: 'w-2 h-2', text: 'text-sm' },
  md: { outer: 'w-5 h-5', inner: 'w-2.5 h-2.5', text: 'text-base' },
  lg: { outer: 'w-6 h-6', inner: 'w-3 h-3', text: 'text-lg' },
}

const colorStyles: Record<RadioColor, { checked: string; unchecked: string }> = {
  primary: { checked: 'border-brand-primary bg-brand-primary', unchecked: 'border-hairline-strong' },
  secondary: { checked: 'border-brand-secondary bg-brand-secondary', unchecked: 'border-hairline-strong' },
  success: { checked: 'border-status-success bg-status-success', unchecked: 'border-hairline-strong' },
  error: { checked: 'border-status-error bg-status-error', unchecked: 'border-hairline-strong' },
}

/**
 * Radio button component.
 *
 * @example
 * <Radio value="option1">Option 1</Radio>
 */
export function Radio({
  value,
  isDisabled: radioDisabled,
  size: radioSize,
  color: radioColor,
  className,
  children,
  ...props
}: RadioProps) {
  const context = useContext(RadioGroupContext)

  if (!context) {
    throw new Error('Radio must be used within a RadioGroup')
  }

  const { value: selectedValue, onChange, isDisabled: groupDisabled, size: groupSize, color: groupColor } = context

  const isDisabled = radioDisabled ?? groupDisabled ?? false
  const size = radioSize ?? groupSize ?? 'md'
  const color = radioColor ?? groupColor ?? 'primary'
  const isChecked = selectedValue === value

  const { outer, inner, text } = sizeConfig[size]
  const { checked, unchecked } = colorStyles[color]

  const handlePress = () => {
    if (!isDisabled) {
      onChange(value)
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: isChecked, disabled: isDisabled }}
      className={cn(
        'flex-row items-center',
        isDisabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {/* Radio circle */}
      <View
        className={cn(
          'rounded-full border-2 items-center justify-center',
          'transition-colors duration-150',
          outer,
          isChecked ? checked : unchecked,
          !isDisabled && !isChecked && 'web:hover:border-brand-primary'
        )}
      >
        {/* Inner dot */}
        {isChecked && (
          <View className={cn('rounded-full bg-white', inner)} />
        )}
      </View>

      {/* Label */}
      {children && (
        <Text className={cn('ml-2 text-text-primary', text)}>
          {children}
        </Text>
      )}
    </Pressable>
  )
}
