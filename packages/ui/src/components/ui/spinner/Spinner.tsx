import React from 'react'
import { ActivityIndicator, View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'
export type SpinnerColor = 'primary' | 'secondary' | 'white' | 'default'

export interface SpinnerProps extends ViewProps {
  /** Spinner size */
  size?: SpinnerSize
  /** Color scheme */
  color?: SpinnerColor
  /** Accessibility label */
  label?: string
  /** Additional className */
  className?: string
}

const sizeMap: Record<SpinnerSize, 'small' | 'large'> = {
  sm: 'small',
  md: 'small',
  lg: 'large',
  xl: 'large',
}

const colorMap: Record<SpinnerColor, string> = {
  primary: '#5048E5',
  secondary: '#10B981',
  white: '#FFFFFF',
  default: '#6B7280',
}

const containerSizes: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

/**
 * Spinner component for loading states.
 *
 * @example
 * <Spinner size="md" color="primary" />
 *
 * // In a button
 * <Button isLoading>
 *   <Spinner size="sm" color="white" />
 *   <ButtonText>Loading...</ButtonText>
 * </Button>
 */
export function Spinner({
  size = 'md',
  color = 'primary',
  label = 'Loading',
  className,
  ...props
}: SpinnerProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      className={cn('items-center justify-center', containerSizes[size], className)}
      {...props}
    >
      <ActivityIndicator
        size={sizeMap[size]}
        color={colorMap[color]}
      />
    </View>
  )
}
