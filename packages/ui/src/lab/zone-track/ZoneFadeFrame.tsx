import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { Surface } from '../../components/ui/surface'
import { bestTextColor } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'

export const MODES: ThemeMode[] = ['dark', 'light']

/**
 * Ink resolved from the unit's own mode: a nested light Surface does not set `.light`, so
 * class-based text colours would keep painting the toolbar theme.
 */
export function modeInk(mode: ThemeMode) {
  const colors = getSemanticColors(mode)
  return { primary: colors['text-primary'], secondary: colors['text-secondary'] }
}

/** One option in one theme, on that theme's `surface-base`. */
export function ModeUnit({
  mode,
  title,
  children,
}: {
  mode: ThemeMode
  title: string
  children: ReactNode
}) {
  const ink = modeInk(mode)
  return (
    <Surface
      theme={mode}
      level="base"
      className="gap-3 rounded-md p-4"
      style={{ width: 480 }}
      testID={`zone-fade-unit-${mode}`}
    >
      <Text className="text-sm font-semibold" style={{ color: ink.primary }}>
        {`${title} (${mode})`}
      </Text>
      {children}
    </Surface>
  )
}

export function UnitRow({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap gap-4 p-2">{children}</View>
}

export function Caption({ mode, children }: { mode: ThemeMode; children: string }) {
  return (
    <Text className="font-mono text-[10px]" style={{ color: modeInk(mode).secondary }}>
      {children}
    </Text>
  )
}

/** A swatch labelled with its ramp step inside, and a caption below for its ratios. */
export function Swatch({
  mode,
  fill,
  label,
  caption,
}: {
  mode: ThemeMode
  fill: string
  label: string
  caption?: string
}) {
  return (
    <View className="w-20 items-center gap-0.5">
      <View
        className="min-h-9 w-20 items-center justify-center rounded-sm px-0.5 py-0.5"
        style={{ backgroundColor: fill }}
      >
        <Text className="text-center font-mono text-[9px]" style={{ color: bestTextColor(fill) }}>
          {label}
        </Text>
      </View>
      {caption != null && <Caption mode={mode}>{caption}</Caption>}
    </View>
  )
}
