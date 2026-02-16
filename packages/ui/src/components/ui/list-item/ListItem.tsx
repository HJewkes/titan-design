import React from 'react'
import { View, Text, Pressable, type ViewProps, type PressableProps } from 'react-native'
import { cn } from '../../../utils/cn'

// --- ListItem (container) ---

export interface ListItemProps extends PressableProps {
  className?: string
  children: React.ReactNode
}

export function ListItem({ className, children, onPress, ...props }: ListItemProps) {
  const Container = onPress ? Pressable : View
  const containerProps = onPress ? { onPress, ...props } : props

  return (
    <Container
      className={cn('flex-row items-center py-3 px-4 min-h-[48px]', className)}
      {...(containerProps as any)}
    >
      {children}
    </Container>
  )
}

// --- ListItemIcon (leading slot) ---

export interface ListItemIconProps extends ViewProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  className?: string
}

export function ListItemIcon({ icon: Icon, className, ...props }: ListItemIconProps) {
  return (
    <View className={cn('mr-3 items-center justify-center', className)} {...props}>
      <Icon size={20} className="text-text-secondary" />
    </View>
  )
}

// --- ListItemContent (title + subtitle) ---

export interface ListItemContentProps extends ViewProps {
  title: string
  subtitle?: string
  className?: string
}

export function ListItemContent({ title, subtitle, className, ...props }: ListItemContentProps) {
  return (
    <View className={cn('flex-1 justify-center', className)} {...props}>
      <Text className="text-sm font-medium text-text-primary">{title}</Text>
      {subtitle && (
        <Text className="text-xs text-text-secondary mt-0.5">{subtitle}</Text>
      )}
    </View>
  )
}

// --- ListItemTrailing (right-side slot) ---

export interface ListItemTrailingProps extends ViewProps {
  className?: string
  children: React.ReactNode
}

export function ListItemTrailing({ className, children, ...props }: ListItemTrailingProps) {
  return (
    <View className={cn('ml-3 items-center justify-center', className)} {...props}>
      {children}
    </View>
  )
}

// --- ListItemDivider ---

export interface ListItemDividerProps extends ViewProps {
  inset?: boolean
  className?: string
}

export function ListItemDivider({ inset = true, className, ...props }: ListItemDividerProps) {
  return (
    <View
      className={cn('h-px bg-divider', inset ? 'ml-14' : '', className)}
      {...props}
    />
  )
}
