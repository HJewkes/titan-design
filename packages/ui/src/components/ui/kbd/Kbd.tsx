import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../typography'

export type KbdSize = 'sm' | 'md'

export interface KbdProps {
  /** One keycap per entry, e.g. `['⌘', 'K']`. */
  keys: string[]
  size?: KbdSize
  /** Overrides the spoken name derived from `keys`. */
  accessibilityLabel?: string
  className?: string
}

const KEY_NAMES: Record<string, string> = {
  '⌘': 'Command',
  '⇧': 'Shift',
  '⌥': 'Option',
  '⌃': 'Control',
  '↵': 'Enter',
  '⏎': 'Enter',
  '⌫': 'Backspace',
  '⎋': 'Escape',
  Esc: 'Escape',
  '↑': 'Up arrow',
  '↓': 'Down arrow',
  '←': 'Left arrow',
  '→': 'Right arrow',
  '⇥': 'Tab',
}

const keycapStyles: Record<KbdSize, string> = {
  sm: 'h-5 min-w-5 px-1',
  md: 'h-6 min-w-6 px-1.5',
}

const glyphStyles: Record<KbdSize, string> = {
  sm: '',
  md: 'text-sm',
}

function spokenName(keys: string[]): string {
  return keys.map((key) => KEY_NAMES[key] ?? key).join(' ')
}

/**
 * Kbd — a display-only keyboard shortcut hint, one keycap per key. The root
 * carries the spoken name ("Command K") and the glyphs are hidden from
 * assistive tech, so a screen reader says the shortcut once.
 */
export function Kbd({ keys, size = 'sm', accessibilityLabel, className }: KbdProps) {
  if (keys.length === 0) return null

  return (
    <View
      // RNW drops a label on a role-less View; `image` keeps the name on the root.
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? spokenName(keys)}
      className={cn('flex-row items-center gap-1', className)}
    >
      {keys.map((key, index) => (
        <View
          key={`${key}-${index}`}
          testID="kbd-key"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className={cn(
            'items-center justify-center rounded border border-hairline-strong bg-surface-raised',
            keycapStyles[size]
          )}
        >
          <Typography variant="mono" color="primary" className={glyphStyles[size]}>
            {key}
          </Typography>
        </View>
      ))}
    </View>
  )
}
