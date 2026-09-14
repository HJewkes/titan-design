import React from 'react'
import { ActivityIndicator, View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { SPINNER_PRIMARY, SPINNER_SECONDARY } from '../../../theme/extracted-colors-ui'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../surface'

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

// `default` is the only entry that themes: the other three are fixed marks (the
// extracted spinner pair and pure white). ActivityIndicator needs a literal colour,
// which `getSemanticColors(mode)` gives while still tracking the theme (VW-316).
function colorMap(mode: ThemeMode): Record<SpinnerColor, string> {
  return {
    primary: SPINNER_PRIMARY,
    secondary: SPINNER_SECONDARY,
    white: primitiveColors.white,
    default: getSemanticColors(mode)['result-neutral'],
  }
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
  const mode = useSurfaceMode()
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      className={cn('items-center justify-center', containerSizes[size], className)}
      {...props}
    >
      <ActivityIndicator size={sizeMap[size]} color={colorMap(mode)[color]} />
    </View>
  )
}
