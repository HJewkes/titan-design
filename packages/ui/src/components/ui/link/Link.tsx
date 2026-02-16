import React from 'react'
import { Text, Pressable, type TextProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type LinkUnderline = 'always' | 'hover' | 'none'
export type LinkColor = 'default' | 'primary' | 'secondary' | 'inherit'

export interface LinkProps extends Omit<TextProps, 'onPress'> {
  /** URL to navigate to (for accessibility) */
  href?: string
  /** Underline behavior */
  underline?: LinkUnderline
  /** Link color */
  color?: LinkColor
  /** Whether the link opens in a new tab/window */
  isExternal?: boolean
  /** Press handler */
  onPress?: () => void
  /** Whether the link is disabled */
  isDisabled?: boolean
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

const colorStyles: Record<LinkColor, string> = {
  default: 'text-text-link',
  primary: 'text-brand-primary',
  secondary: 'text-brand-secondary',
  inherit: '',
}

const underlineStyles: Record<LinkUnderline, string> = {
  always: 'underline',
  hover: 'no-underline web:hover:underline',
  none: 'no-underline',
}

/**
 * Link component for navigation.
 *
 * @example
 * <Link href="https://example.com">Visit Site</Link>
 * <Link href="https://example.com" isExternal>External Link ↗</Link>
 * <Link onPress={() => navigate('/page')}>Go to Page</Link>
 */
export function Link({
  href,
  underline = 'hover',
  color = 'default',
  isExternal = false,
  onPress,
  isDisabled = false,
  className,
  children,
  ...props
}: LinkProps) {
  const handlePress = () => {
    if (isDisabled) return
    onPress?.()
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="link"
      accessibilityHint={isExternal ? 'Opens in new window' : undefined}
    >
      <Text
        className={cn(
          'font-medium',
          colorStyles[color],
          underlineStyles[underline],
          isDisabled && 'opacity-50 cursor-not-allowed',
          'web:cursor-pointer active:opacity-70',
          className
        )}
        {...props}
      >
        {children}
        {isExternal && ' ↗'}
      </Text>
    </Pressable>
  )
}
