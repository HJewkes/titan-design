import React from 'react'
import { View, Text, Image, type ViewProps, type ImageSourcePropType } from 'react-native'
import { cn } from '../../../utils/cn'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface AvatarProps extends ViewProps {
  /** Avatar size */
  size?: AvatarSize
  /** Image source */
  source?: ImageSourcePropType
  /** Fallback text (usually initials) */
  fallback?: string
  /** Alt text for accessibility */
  alt?: string
  /** Additional className */
  className?: string
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; image: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs', image: 'w-6 h-6' },
  sm: { container: 'w-8 h-8', text: 'text-xs', image: 'w-8 h-8' },
  md: { container: 'w-10 h-10', text: 'text-sm', image: 'w-10 h-10' },
  lg: { container: 'w-12 h-12', text: 'text-base', image: 'w-12 h-12' },
  xl: { container: 'w-16 h-16', text: 'text-lg', image: 'w-16 h-16' },
  '2xl': { container: 'w-20 h-20', text: 'text-xl', image: 'w-20 h-20' },
}

/**
 * Avatar component for user/entity representation.
 *
 * @example
 * // With image
 * <Avatar source={{ uri: 'https://example.com/avatar.jpg' }} alt="User" />
 *
 * // With fallback initials
 * <Avatar fallback="JD" />
 *
 * // With badge
 * <AvatarGroup>
 *   <Avatar source={source1} />
 *   <Avatar source={source2} />
 *   <AvatarBadge />
 * </AvatarGroup>
 */
export function Avatar({
  size = 'md',
  source,
  fallback,
  alt,
  className,
  ...props
}: AvatarProps) {
  const styles = sizeStyles[size]
  const hasImage = source !== undefined

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={alt || fallback || 'Avatar'}
      className={cn(
        'items-center justify-center rounded-full overflow-hidden',
        'bg-border-strong',
        styles.container,
        className
      )}
      {...props}
    >
      {hasImage ? (
        <Image
          source={source}
          className={cn('rounded-full', styles.image)}
          accessibilityLabel={alt}
        />
      ) : fallback ? (
        <Text className={cn('font-semibold text-text-primary', styles.text)}>
          {fallback}
        </Text>
      ) : (
        <View className="w-full h-full bg-surface-raised" />
      )}
    </View>
  )
}

export interface AvatarBadgeProps {
  /** Badge color */
  color?: 'success' | 'error' | 'warning' | 'default'
  /** Additional className */
  className?: string
}

const badgeColors: Record<string, string> = {
  success: 'bg-status-success',
  error: 'bg-status-error',
  warning: 'bg-status-warning',
  default: 'bg-border-strong',
}

/**
 * Status badge for Avatar (e.g., online indicator).
 */
export function AvatarBadge({ color = 'success', className }: AvatarBadgeProps) {
  return (
    <View
      className={cn(
        'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-base',
        badgeColors[color],
        className
      )}
    />
  )
}

export interface AvatarGroupProps {
  children: React.ReactNode
  /** Maximum avatars to show before +N indicator */
  max?: number
  /** Size of avatars */
  size?: AvatarSize
  /** Additional className */
  className?: string
}

/**
 * Group of avatars with stacking effect.
 */
export function AvatarGroup({
  children,
  max,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children)
  const visibleChildren = max ? childArray.slice(0, max) : childArray
  const remainingCount = max ? Math.max(0, childArray.length - max) : 0

  return (
    <View className={cn('flex-row', className)}>
      {visibleChildren.map((child, index) => (
        <View
          key={index}
          className={cn(
            'border-2 border-surface-base rounded-full',
            index > 0 && '-ml-2'
          )}
        >
          {React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<any>, { size })
            : child}
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          className={cn(
            'border-2 border-surface-base rounded-full -ml-2',
            'items-center justify-center bg-surface-raised',
            sizeStyles[size].container
          )}
        >
          <Text className={cn('font-semibold text-text-secondary', sizeStyles[size].text)}>
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  )
}
