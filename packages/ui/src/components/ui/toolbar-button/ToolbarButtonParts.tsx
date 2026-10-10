import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { cn } from '../../../utils/cn'
import { Surface } from '../surface'

interface ToolbarIconProps {
  size?: number
  width?: number
  height?: number
  color?: string
  style?: { color?: string; width?: number; height?: number }
}

export function ToolbarButtonIcon({ icon, color }: { icon: React.ReactNode; color: string }) {
  return (
    <View className="w-5 h-5 items-center justify-center">
      {React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<ToolbarIconProps>, {
            size: 20,
            width: 20,
            height: 20,
            color,
            style: {
              color,
              width: 20,
              height: 20,
            },
          })
        : icon}
    </View>
  )
}

export function ToolbarButtonMenu({
  onClose,
  children,
}: {
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <>
      {/* Backdrop */}
      <Pressable
        onPress={onClose}
        focusable={false}
        tabIndex={-1}
        aria-hidden
        style={StyleSheet.absoluteFill}
        className="z-40"
      />
      {/* Menu Content — floating: overlay plane + lift, no ring. */}
      <Surface
        elevation={4}
        rounded={false}
        className={cn(
          'absolute z-50 top-full left-0 mt-1',
          'rounded-lg min-w-[150px] overflow-hidden'
        )}
      >
        {children}
      </Surface>
    </>
  )
}
