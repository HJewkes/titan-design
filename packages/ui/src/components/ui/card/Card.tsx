import React, { useMemo, useState } from 'react'
import { View, Text, Pressable, type ViewProps, type ViewStyle } from 'react-native'
import { cn } from '../../../utils/cn'
import { liftStyle, type LiftStep } from '../../../theme/lift'
import { Surface } from '../surface/Surface'
import { SurfaceContext, type SurfaceContextValue } from '../surface/SurfaceContext'
import { useResolvedSurface } from '../surface/resolveSurface'

export type CardVariant = 'elevated' | 'outline' | 'filled' | 'accent' | 'subtle'
/** Planes to lift above the enclosing Surface. */
export type CardElevation = 1 | 2 | 3

export interface CardProps extends ViewProps {
  /**
   * How the card separates from its host:
   *  - `elevated` (default): lifts `elevation` planes and wears the lift (rim + shadow).
   *  - `accent`: as `elevated`, plus a left stripe.
   *  - `filled`: lifts `elevation` planes, tone only — for tiles nested in a lifted card.
   *  - `outline`: stays on the host plane with a hairline-strong edge — status borders.
   *  - `subtle`: stays on the host plane with a hairline-subtle edge.
   */
  variant?: CardVariant
  /** Planes to lift above the enclosing Surface (default 2: page → the card plane). */
  elevation?: CardElevation
  /** Whether the card is interactive (hoverable/pressable) */
  isInteractive?: boolean
  /** Whether the card is in a loading state (renders skeleton) */
  isLoading?: boolean
  /** Callback when card is pressed (makes card interactive) */
  onPress?: () => void
  /** Custom border color (hex, rgb, or CSS color). Useful for status cards. */
  borderColor?: string
  /**
   * Custom background color. The one way to override the plane: a `bg-*`
   * className is discarded because the plane is written into `style`.
   */
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

const EDGE_CLASS: Record<CardVariant, string> = {
  elevated: '',
  accent: '',
  filled: '',
  outline: 'border border-hairline-strong',
  subtle: 'border border-hairline-subtle',
}

const LIFTED: Record<CardVariant, boolean> = {
  elevated: true,
  accent: true,
  filled: false,
  outline: false,
  subtle: false,
}

const STAYS_ON_HOST: Record<CardVariant, boolean> = {
  elevated: false,
  accent: false,
  filled: false,
  outline: true,
  subtle: true,
}

/** The card's plane and treatment, hover lifting one more plane when clickable. */
function useCardDepth(variant: CardVariant, elevation: CardElevation, hovered: boolean) {
  const raise = STAYS_ON_HOST[variant] ? undefined : elevation
  const resolved = useResolvedSurface({ raise, lift: LIFTED[variant] })
  const depthStyle = useMemo(() => {
    if (!hovered || !LIFTED[variant]) return resolved.depthStyle
    const hoverStep = Math.min(3, resolved.step + 1) as LiftStep
    return liftStyle(hoverStep, resolved.mode)
  }, [hovered, variant, resolved])
  return { ...resolved, depthStyle }
}

/**
 * Card component for containing related content. Sits `elevation` planes above
 * the enclosing Surface and publishes its own plane, so a card nested in a card
 * steps up again (and clamps at the top of the ramp).
 *
 * Lift sparingly: a card lifts off the page, but a small card lifted off a
 * small card reads as clutter. Inside a card, organise with `CardInset`, a
 * `filled` tile, or a divider, and keep a second lift for something that
 * genuinely floats over the first.
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
  const depth = useCardDepth(variant, elevation, isHovered && isClickable)

  const baseClassName = cn(
    'rounded-lg overflow-hidden relative',
    borderColor ? 'border' : EDGE_CLASS[variant],
    isClickable && 'web:cursor-pointer web:transition-all web:duration-150',
    isClickable && 'web:hover:-translate-y-0.5 active:scale-[0.99]',
    isLoading && 'pointer-events-none animate-pulse',
    className
  )

  const mergedStyle = useMemo(() => {
    const own: ViewStyle & Record<string, unknown> = {
      backgroundColor: bgColor || depth.backgroundColor,
      borderRadius: 8,
      overflow: 'hidden',
      ...depth.depthStyle,
    }
    if (variant === 'accent') {
      own.borderLeftWidth = accentWidth ?? 3
      own.borderLeftColor = accentColor ?? 'var(--color-brand-primary)'
    }
    if (borderColor) own.borderColor = borderColor
    return style ? [own, style] : own
  }, [style, depth, bgColor, borderColor, variant, accentWidth, accentColor])

  const context = useMemo<SurfaceContextValue>(
    () => ({ mode: depth.mode, level: depth.plane }),
    [depth.mode, depth.plane]
  )

  const content = isLoading ? (
    <SkeletonBody
      hasHeader={skeletonHasHeader}
      hasFooter={skeletonHasFooter}
      contentLines={skeletonContentLines}
    />
  ) : (
    children
  )

  return (
    <SurfaceContext.Provider value={context}>
      {isClickable ? (
        <Pressable
          onPress={onPress}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
          accessibilityRole="button"
          className={baseClassName}
          style={mergedStyle}
          {...props}
        >
          {content}
        </Pressable>
      ) : (
        <View className={baseClassName} style={mergedStyle} {...props}>
          {content}
        </View>
      )}
    </SurfaceContext.Provider>
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
  return <View className={cn('px-6 py-6', className)}>{children}</View>
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
  return <Text className={cn('mt-1.5 text-sm text-text-secondary', className)}>{children}</Text>
}

export interface CardContentProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Content section of a Card.
 */
export function CardContent({ children, className }: CardContentProps) {
  return <View className={cn('px-6 py-4', className)}>{children}</View>
}

export interface CardFooterProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Footer section of a Card.
 */
export function CardFooter({ children, className }: CardFooterProps) {
  return <View className={cn('px-6 py-4 flex-row items-center gap-2', className)}>{children}</View>
}

interface SkeletonBodyProps {
  hasHeader: boolean
  hasFooter: boolean
  contentLines: number
}

function SkeletonBody({ hasHeader, hasFooter, contentLines }: SkeletonBodyProps) {
  return (
    <>
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
    </>
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
    <Card variant="elevated" className={cn('animate-pulse', className)}>
      <SkeletonBody hasHeader={hasHeader} hasFooter={hasFooter} contentLines={contentLines} />
    </Card>
  )
}

export interface CardInsetProps extends ViewProps {
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * A sunken well inside a Card: one plane down from the card with the inset
 * recess. Nest one inside another to step down again (clamps at the frame).
 *
 * @example
 * <Card>
 *   <CardContent>
 *     <CardInset className="p-4">
 *       <Text>This content appears inset/sunken</Text>
 *     </CardInset>
 *   </CardContent>
 * </Card>
 */
export function CardInset({ className, children, ...props }: CardInsetProps) {
  return (
    <Surface pressed className={cn('rounded', className)} rounded={false} {...props}>
      {children}
    </Surface>
  )
}
