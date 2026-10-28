import React from 'react'
import { Pressable } from 'react-native'
import { cn } from '../../../utils/cn'
import { Surface } from '../surface'

interface SelectPopoverProps {
  onClose: () => void
  children: React.ReactNode
}

export function SelectPopover({ onClose, children }: SelectPopoverProps) {
  return (
    <>
      <Pressable
        onPress={onClose}
        focusable={false}
        tabIndex={-1}
        aria-hidden
        className="fixed inset-0 z-overlay"
        style={{ position: 'absolute' }}
      />
      <Surface
        elevation={4}
        rounded={false}
        className={cn(
          'absolute z-popover top-full left-0 right-0 mt-1',
          'rounded-md max-h-60 overflow-hidden'
        )}
      >
        {children}
      </Surface>
    </>
  )
}
