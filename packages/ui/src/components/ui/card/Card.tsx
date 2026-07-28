import React, { useMemo, useState } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { 
  getElevationSurface, 
  getElevationShadow, 
  getBaseSurfaceColor,
  getValidatedElevation,
  type ElevationLevel 
} from '../../../theme'
import { useTheme } from '../../../utils/useTheme'

export type CardVariant = 'elevated' | 'outline' | 'filled' | 'accent' | 'subtle'
export type CardElevation = 1 | 2 | 3  // subtle, standard, prominent

export interface CardProps extends ViewProps {
  /** Visual variant */
  variant?: CardVariant
  /** Elevation level (1=subtle, 2=standard, 3=prominent) */
  elevation?: CardElevation
  /** Whether the card is interactive (hoverable/pressable) */
  isInteractive?: boolean
  /** Whether the card is in a loading state (renders skeleton) */
  isLoading?: boolean
  /** Callback when card is pressed (makes card interactive) */
  onPress?: () => void
  /** Custom border color (hex, rgb, or CSS color). Useful for status cards. */
  borderColor?: string
  /** Custom background color (hex, rgb, or CSS color). Useful for colored cards. */
  bgColor?: string
  /** Accent stripe color for accent variant (CSS color or hex) */
  accentColor?: string
  /** Accent stripe width for accent variant in pixels (default: 3) */
  accentWidth?: number
  /** Additional className */
  className?: string
  children?: React.ReactNode
  /** Show header skeleton when loading (default: true) */
  skeletonHasHeader?: boolean
  /** Show footer skeleton when loading (default: false) */
  skeletonHasFooter?: boolean
  /** Number of content lines in skeleton when loading (default: 3) */
  skeletonContentLines?: number
}

const variantStyles: Record<CardVariant, string> = {
  elevated: '', // Will be set dynamically via elevation system
  outline: 'border-2 border-hairline-strong',  // Thicker border with stronger contrast
  filled: '', // Will be set dynamically via elevation system
  accent: 'border border-hairline',
  subtle: 'border border-hairline-subtle',
}

/**
 * Card component for containing related content.
 *
 * @example
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <Text>Card content goes here</Text>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 *
 * // Interactive card
 * <Card isInteractive onPress={() => console.log('pressed')}>
 *   <CardContent>Click me</CardContent>
 * </Card>
 */
export function Card({
  variant = 'elevated',
  elevation = 2,
  isInteractive = false,
  isLoading = false,
  onPress,
  borderColor,
  bgColor,
  accentColor,
  accentWidth,
  className,
  children,
  style,
  skeletonHasHeader = true,
  skeletonHasFooter = false,
  skeletonContentLines = 3,
  ...props
}: CardProps) {
  const isClickable = isInteractive || !!onPress
  const [isHovered, setIsHovered] = useState(false)
  const theme = useTheme()

  // Get elevation level (validate and clamp to card's allowed range)
  const elevationLevel = useMemo(() => {
    const validated = getValidatedElevation('card', elevation as ElevationLevel)
    // Map variant to elevation if needed
    if (variant === 'outline' || variant === 'accent' || variant === 'subtle') {
      return 1 as ElevationLevel  // These border variants use subtle elevation
    }
    return validated
  }, [variant, elevation])

  // Get base surface color for theme
  const baseColor = useMemo(() => getBaseSurfaceColor(theme), [theme])

  // Calculate surface color and shadow from elevation
  const surfaceColor = useMemo(() => {
    // Outline variant in light mode uses a specific off-white for clear visibility
    if ((variant === 'outline' || variant === 'accent') && theme === 'light') {
      return '#FAFAFA'  // Matches --color-surface-elevated in light mode
    }
    // Subtle variant uses the base surface color without elevation lift
    if (variant === 'subtle') {
      return getElevationSurface(baseColor, 0 as ElevationLevel, theme)
    }
    return getElevationSurface(baseColor, elevationLevel, theme)
  }, [baseColor, elevationLevel, theme, variant])

  const shadowStyle = useMemo(() => {
    // Only apply hover shadow if card is actually clickable
    const shouldHover = isHovered && isClickable
    return getElevationShadow(baseColor, elevationLevel, theme, shouldHover)
  }, [baseColor, elevationLevel, theme, isHovered, isClickable])

  // Render skeleton content when loading, otherwise render children
  const cardContent = isLoading ? (
    <>
      {skeletonHasHeader && (
        <CardHeader>
          <View className="h-5 w-1/3 bg-interactive-disabled rounded" />
          <View className="mt-2 h-4 w-2/3 bg-interactive-disabled rounded" />
        </CardHeader>
      )}
      <CardContent>
        {Array.from({ length: skeletonContentLines }).map((_, i) => (
          <View
            key={i}
            className={cn(
              'h-4 bg-interactive-disabled rounded',
              i < skeletonContentLines - 1 ? 'mb-2 w-full' : 'w-4/5'
            )}
          />
        ))}
      </CardContent>
      {skeletonHasFooter && (
        <CardFooter>
          <View className="h-9 w-24 bg-interactive-disabled rounded" />
        </CardFooter>
      )}
    </>
  ) : (
    children
  )

  const baseClassName = cn(
    'rounded-lg overflow-hidden relative',
    // Apply variant styles, but only use default border color if no custom borderColor
    variant === 'outline'
      ? borderColor
        ? 'border-2'  // Just the border width, color via style
        : variantStyles[variant]  // Full variant styles including color
      : variantStyles[variant],
    // Remove Tailwind shadow classes - we're using elevation shadows via style prop
    isClickable && 'web:cursor-pointer web:transition-all web:duration-150',
    isClickable && 'web:hover:-translate-y-0.5 active:scale-[0.99]',
    isLoading && 'pointer-events-none animate-pulse',
    className
  )

  // Accent variant: left stripe via borderLeft override
  const accentStyle = useMemo(() => variant === 'accent' ? {
    borderLeftWidth: accentWidth ?? 3,
    borderLeftColor: accentColor ?? 'var(--color-brand-primary)',
  } : {}, [variant, accentWidth, accentColor])

  // Merge styles: background color from elevation + shadow style + custom colors + custom style
  const mergedStyle = useMemo(() => {
    const elevationStyle: Record<string, any> = {
      backgroundColor: bgColor || surfaceColor,
      borderRadius: 8,
      overflow: 'hidden' as const,
      ...shadowStyle,
      ...accentStyle,
    }

    // Add custom border color if provided
    if (borderColor) {
      elevationStyle.borderColor = borderColor
    }

    if (!style) return elevationStyle
    // User style takes precedence over elevation defaults (e.g. maxWidth, custom bg)
    return [elevationStyle, style]
  }, [style, surfaceColor, shadowStyle, borderColor, bgColor, accentStyle])

  if (isClickable) {
    return (
      <Pressable
        onPress={onPress}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        accessibilityRole="button"
        className={baseClassName}
        style={mergedStyle}
        {...props}
      >
        {cardContent}
      </Pressable>
    )
  }

  return (
    <View className={baseClassName} style={mergedStyle} {...props}>
      {cardContent}
    </View>
  )
}

export interface CardHeaderProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Header section of a Card.
 */
export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <View className={cn('px-6 py-6', className)}>
      {children}
    </View>
  )
}

export interface CardTitleProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Title for CardHeader.
 */
export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <Text
      accessibilityRole="header"
      className={cn('text-lg font-semibold text-text-primary font-heading', className)}
    >
      {children}
    </Text>
  )
}

export interface CardDescriptionProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Description for CardHeader.
 */
export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <Text className={cn('mt-1.5 text-sm text-text-secondary', className)}>
      {children}
    </Text>
  )
}

export interface CardContentProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Content section of a Card.
 */
export function CardContent({ children, className }: CardContentProps) {
  return (
    <View className={cn('px-6 py-4', className)}>
      {children}
    </View>
  )
}

export interface CardFooterProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Footer section of a Card.
 */
export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <View className={cn('px-6 py-4 flex-row items-center gap-2', className)}>
      {children}
    </View>
  )
}

export interface CardSkeletonProps {
  /** Whether to show header skeleton */
  hasHeader?: boolean
  /** Whether to show footer skeleton */
  hasFooter?: boolean
  /** Number of content lines */
  contentLines?: number
  /** Additional className */
  className?: string
}

/**
 * Skeleton placeholder for Card loading state.
 */
export function CardSkeleton({
  hasHeader = true,
  hasFooter = false,
  contentLines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <Card variant="elevated" elevation={2} className={cn('animate-pulse', className)}>
      {hasHeader && (
        <CardHeader>
          <View className="h-5 w-1/3 bg-interactive-disabled rounded" />
          <View className="mt-2 h-4 w-2/3 bg-interactive-disabled rounded" />
        </CardHeader>
      )}
      <CardContent>
        {Array.from({ length: contentLines }).map((_, i) => (
          <View
            key={i}
            className={cn(
              'h-4 bg-interactive-disabled rounded',
              i < contentLines - 1 ? 'mb-2 w-full' : 'w-4/5'
            )}
          />
        ))}
      </CardContent>
      {hasFooter && (
        <CardFooter>
          <View className="h-9 w-24 bg-interactive-disabled rounded" />
        </CardFooter>
      )}
    </Card>
  )
}

export interface CardInsetProps extends ViewProps {
  /** Elevation level for inset (-2=deep, -1=shallow) */
  elevation?: -2 | -1
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Inset element within a Card. Applies pressed neumorphic shadow
 * to create a sunken/recessed appearance.
 * 
 * @example
 * <Card elevation={2}>
 *   <CardContent>
 *     <CardInset elevation={-1}>
 *       <Text>This content appears inset/sunken</Text>
 *     </CardInset>
 *   </CardContent>
 * </Card>
 */
export function CardInset({
  elevation = -1,
  className,
  children,
  style,
  ...props
}: CardInsetProps) {
  const theme = useTheme()
  const baseColor = useMemo(() => getBaseSurfaceColor(theme), [theme])
  const surfaceColor = useMemo(() => {
    return getElevationSurface(baseColor, elevation as ElevationLevel, theme)
  }, [baseColor, elevation, theme])
  const shadowStyle = useMemo(() => {
    return getElevationShadow(baseColor, elevation as ElevationLevel, theme)
  }, [baseColor, elevation, theme])
  
  return (
    <View
      className={cn('rounded', className)}
      style={[{ backgroundColor: surfaceColor }, shadowStyle, style]}
      {...props}
    >
      {children}
    </View>
  )
}
