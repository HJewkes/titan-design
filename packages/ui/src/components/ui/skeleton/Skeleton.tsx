import React from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type SkeletonVariant = 'text' | 'circle' | 'rect' | 'rounded'
export type SkeletonAnimation = 'pulse' | 'shimmer' | 'none'

export interface SkeletonProps extends ViewProps {
  /** Shape variant */
  variant?: SkeletonVariant
  /** Animation type */
  animation?: SkeletonAnimation
  /** Width (number for pixels, string for percentages/other) */
  width?: number | string
  /** Height (number for pixels, string for percentages/other) */
  height?: number | string
  /** Border radius (only for 'rect' variant) */
  borderRadius?: number
  /** Additional className */
  className?: string
}

/**
 * Skeleton component for loading placeholders.
 *
 * @example
 * // Text skeleton
 * <Skeleton variant="text" width="60%" />
 *
 * // Avatar skeleton
 * <Skeleton variant="circle" width={48} height={48} />
 *
 * // Card skeleton
 * <Skeleton variant="rounded" width="100%" height={200} />
 */
export function Skeleton({
  variant = 'text',
  animation = 'pulse',
  width,
  height,
  borderRadius,
  className,
  style,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rect: '',
    rounded: 'rounded-lg',
  }

  const animationStyles = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer', // Note: requires custom animation in Tailwind config
    none: '',
  }

  // For circle variant, if only one dimension is provided, make it square
  let finalWidth = width
  let finalHeight = height
  if (variant === 'circle') {
    if (width && !height) finalHeight = width
    if (height && !width) finalWidth = height
  }

  return (
    <View
      accessibilityRole="none"
      accessibilityLabel="Loading..."
      className={cn(
        'bg-interactive-disabled',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={[
        {
          ...(finalWidth !== undefined && { width: finalWidth as number }),
          ...(finalHeight !== undefined && { height: finalHeight as number }),
          ...(borderRadius !== undefined && { borderRadius }),
        },
        style,
      ]}
      {...props}
    />
  )
}

// Convenience components for common patterns

export interface SkeletonTextProps {
  /** Number of lines */
  lines?: number
  /** Last line width (percentage) */
  lastLineWidth?: string
  /** Gap between lines */
  gap?: number
  /** Animation type */
  animation?: SkeletonAnimation
  className?: string
}

/**
 * Multi-line text skeleton.
 */
export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  gap = 8,
  animation = 'pulse',
  className,
}: SkeletonTextProps) {
  return (
    <View className={cn('gap-2', className)} style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          animation={animation}
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </View>
  )
}

export interface SkeletonCircleProps {
  /** Size in pixels */
  size?: number
  /** Animation type */
  animation?: SkeletonAnimation
  className?: string
}

/**
 * Circle skeleton for avatars.
 */
export function SkeletonCircle({
  size = 40,
  animation = 'pulse',
  className,
}: SkeletonCircleProps) {
  return (
    <Skeleton
      variant="circle"
      width={size}
      height={size}
      animation={animation}
      className={className}
    />
  )
}

// Composed skeleton patterns

export interface SkeletonCardProps {
  /** Show image area */
  hasImage?: boolean
  /** Image height */
  imageHeight?: number
  /** Number of text lines */
  lines?: number
  /** Animation type */
  animation?: SkeletonAnimation
  className?: string
}

/**
 * Card skeleton pattern.
 */
export function SkeletonCard({
  hasImage = true,
  imageHeight = 160,
  lines = 3,
  animation = 'pulse',
  className,
}: SkeletonCardProps) {
  return (
    <View className={cn('rounded-lg overflow-hidden bg-surface-elevated', className)}>
      {hasImage && (
        <Skeleton
          variant="rect"
          width="100%"
          height={imageHeight}
          animation={animation}
        />
      )}
      <View className="p-4 gap-3">
        <Skeleton variant="text" width="70%" animation={animation} />
        <SkeletonText lines={lines} animation={animation} />
      </View>
    </View>
  )
}

export interface SkeletonListItemProps {
  /** Show avatar */
  hasAvatar?: boolean
  /** Avatar size */
  avatarSize?: number
  /** Number of text lines */
  lines?: number
  /** Animation type */
  animation?: SkeletonAnimation
  className?: string
}

/**
 * List item skeleton pattern.
 */
export function SkeletonListItem({
  hasAvatar = true,
  avatarSize = 40,
  lines = 2,
  animation = 'pulse',
  className,
}: SkeletonListItemProps) {
  return (
    <View className={cn('flex-row items-center gap-3 p-3', className)}>
      {hasAvatar && (
        <SkeletonCircle size={avatarSize} animation={animation} />
      )}
      <View className="flex-1">
        <SkeletonText lines={lines} animation={animation} />
      </View>
    </View>
  )
}
