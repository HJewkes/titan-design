import React, { createContext, useContext, useMemo } from 'react'
import { View, Pressable, type ViewProps, type ViewStyle } from 'react-native'
import { cn } from '../../../utils/cn'

type AppBarVariant = 'glass' | 'solid' | 'transparent'
type AppBarPosition = 'sticky' | 'fixed' | 'static'
type AppBarSize = 'sm' | 'md' | 'lg'

const AppBarContext = createContext<{
  variant: AppBarVariant
  size: AppBarSize
}>({ variant: 'solid', size: 'md' })

export interface AppBarProps extends ViewProps {
  position?: AppBarPosition
  variant?: AppBarVariant
  size?: AppBarSize
  className?: string
  children: React.ReactNode
}

const sizeStyles: Record<AppBarSize, string> = {
  sm: 'h-12 text-sm',
  md: 'h-[73px] text-base',
  lg: 'h-20 text-lg',
}

const variantStyles: Record<AppBarVariant, string> = {
  glass: 'backdrop-blur-lg bg-background-base/80 border-b border-border/50 shadow-sm',
  solid: 'bg-surface-base border-b border-border',
  transparent: 'bg-transparent',
}

const positionStyles: Record<AppBarPosition, string> = {
  sticky: 'sticky top-0 z-50',
  fixed: 'fixed top-0 left-0 right-0 z-50',
  static: '',
}

/**
 * AppBar layout component for headers and navigation bars.
 * Uses slot-based composition with AppBarBrand, AppBarNav, and AppBarActions.
 *
 * @example
 * <AppBar position="sticky" variant="glass">
 *   <AppBarBrand onClick={goHome}>
 *     <h1>My App</h1>
 *   </AppBarBrand>
 *   <AppBarNav>
 *     <a href="/dashboard">Dashboard</a>
 *   </AppBarNav>
 *   <AppBarActions>
 *     <Button>Action</Button>
 *   </AppBarActions>
 * </AppBar>
 */
const sizeHeightValues: Record<AppBarSize, number> = {
  sm: 48,
  md: 73,
  lg: 80,
}

const variantInlineStyles: Record<AppBarVariant, ViewStyle> = {
  glass: {
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    backgroundColor: 'rgba(16, 17, 20, 0.8)',
  } as ViewStyle,
  solid: {
    backgroundColor: 'var(--color-surface-base, #1a1a1a)',
  } as ViewStyle,
  transparent: {},
}

export function AppBar({
  position = 'sticky',
  variant = 'solid',
  size = 'md',
  className,
  style,
  children,
  ...props
}: AppBarProps) {
  const computedStyle = useMemo<ViewStyle>(
    () => ({
      height: sizeHeightValues[size],
      ...variantInlineStyles[variant],
    }),
    [size, variant]
  )

  return (
    <AppBarContext.Provider value={{ variant, size }}>
      <View
        accessibilityRole={'banner' as any}
        className={cn(
          'flex flex-row items-center justify-between px-6 gap-4',
          sizeStyles[size],
          variantStyles[variant],
          positionStyles[position],
          className
        )}
        style={[computedStyle, style as ViewStyle]}
        {...props}
      >
        {children}
      </View>
    </AppBarContext.Provider>
  )
}

export interface AppBarBrandProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

/**
 * Left-aligned brand slot for AppBar.
 * When onClick is provided, renders as a Pressable for home navigation.
 */
export function AppBarBrand({ children, onClick, className }: AppBarBrandProps) {
  const baseClassName = cn('flex flex-row items-center gap-2 min-w-0', className)

  if (onClick) {
    return (
      <Pressable
        onPress={onClick}
        accessibilityRole="button"
        className={cn(baseClassName, 'web:cursor-pointer')}
      >
        {children}
      </Pressable>
    )
  }

  return (
    <View className={baseClassName}>
      {children}
    </View>
  )
}

export interface AppBarNavProps {
  children: React.ReactNode
  className?: string
}

/**
 * Center navigation slot for AppBar.
 * Hidden on small screens by default.
 */
export function AppBarNav({ children, className }: AppBarNavProps) {
  return (
    <View className={cn('hidden web:flex flex-row items-center gap-4', className)}>
      {children}
    </View>
  )
}

export interface AppBarActionsProps {
  children: React.ReactNode
  className?: string
}

/**
 * Right-aligned actions slot for AppBar.
 */
export function AppBarActions({ children, className }: AppBarActionsProps) {
  return (
    <View
      className={cn('flex flex-row items-center gap-3 ml-auto', className)}
      style={{ marginLeft: 'auto' }}
    >
      {children}
    </View>
  )
}

const sizeHeightMap: Record<AppBarSize, string> = {
  sm: 'top-12',
  md: 'top-[73px]',
  lg: 'top-20',
}

export interface AppBarSubHeaderProps extends ViewProps {
  children: React.ReactNode
  variant?: AppBarVariant
  className?: string
}

/**
 * Secondary bar rendered below the main AppBar.
 * Inherits variant from parent AppBar context if not explicitly set.
 */
export function AppBarSubHeader({
  children,
  variant: variantOverride,
  className,
  style,
  ...props
}: AppBarSubHeaderProps) {
  const { variant: parentVariant, size } = useContext(AppBarContext)
  const resolvedVariant = variantOverride ?? parentVariant

  const subHeaderStyle = useMemo<ViewStyle>(
    () => ({
      top: sizeHeightValues[size],
      ...variantInlineStyles[resolvedVariant],
    }),
    [size, resolvedVariant]
  )

  return (
    <View
      className={cn(
        'flex flex-row items-center justify-between px-6 py-2 text-sm',
        'sticky z-40',
        sizeHeightMap[size],
        variantStyles[resolvedVariant],
        className
      )}
      style={[subHeaderStyle, style as ViewStyle]}
      {...props}
    >
      {children}
    </View>
  )
}
