import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { compositeOver } from '../../theme/color-checks'
import { cn } from '../../utils/cn'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { AA, fmt, type SurfacePair, type Swatch } from './surface-family'

/**
 * Each frame paints its own mode: the mode's semantic map is set as local custom properties, so
 * `text-text-primary` and every component token resolve in that mode whatever the toolbar theme.
 * A plain custom-property map, which is what nativewind's `vars()` returns on web: importing
 * `vars` pulls a CommonJS chunk that leaves a static Storybook build blank.
 */
const MODE_VARS: Record<ThemeMode, object> = {
  dark: modeVars('dark'),
  light: modeVars('light'),
}

function modeVars(mode: ThemeMode) {
  const colors = getSemanticColors(mode) as Record<string, string>
  return Object.fromEntries(Object.entries(colors).map(([k, v]) => [`--color-${k}`, v]))
}

/** `isPage` makes the frame the whole story canvas, so a light frame never sits on a dark page. */
export function ModeFrame({
  mode,
  isPage = false,
  children,
}: {
  mode: ThemeMode
  isPage?: boolean
  children: ReactNode
}) {
  return (
    <View
      className={cn(
        'gap-stack-md bg-background-base p-gutter-sm',
        isPage ? 'min-h-screen' : 'rounded-lg'
      )}
      style={MODE_VARS[mode]}
      testID={`frame-${mode}`}
    >
      {children}
    </View>
  )
}

export function FrameHeader({ title, summary }: { title: string; summary: string }) {
  return (
    <View className="gap-stack-sm">
      <Text className="text-base font-semibold text-text-primary" accessibilityRole="header">
        {title}
      </Text>
      <Text className="text-sm text-text-primary">{summary}</Text>
    </View>
  )
}

export function Caption({ children }: { children: ReactNode }) {
  return <Text className="font-mono text-[11px] leading-4 text-text-primary">{children}</Text>
}

/**
 * Real components paint the family through the `error` tone: its tokens are overridden locally
 * with the pair, so the Badge, Pill, Alert and Button below are the shipped components.
 */
export function HueCarrier({
  pair,
  kind,
  children,
}: {
  pair: SurfacePair
  kind: 'solid' | 'subtle'
  children: ReactNode
}) {
  const overrides: Record<`--${string}`, string> =
    kind === 'solid'
      ? {
          '--color-status-error-solid': pair.fill,
          '--color-status-error': pair.fill,
          '--color-on-status-error': pair.on.hex,
        }
      : {
          '--color-status-error-subtle': pair.fill,
          '--color-on-status-error-subtle': pair.on.hex,
        }
  return (
    <View className="flex-row flex-wrap items-center gap-inline-sm" style={overrides}>
      {children}
    </View>
  )
}

/** A fill on a plane with its label set live on it: only for pairs that clear AA. */
export function LiveChip({ pair, plane }: { pair: SurfacePair; plane: string }) {
  return (
    <View
      className="rounded-md px-squish-x-sm py-squish-y-md"
      style={{ backgroundColor: compositeOver(pair.fill, plane) }}
    >
      <Text className="text-xs font-semibold" style={{ color: pair.on.hex }}>
        {pair.fillLabel}
      </Text>
    </View>
  )
}

/**
 * A pair the owner must see but whose label misses AA: the fill and the label colour as two
 * blocks, no text on the fill, the measured ratio beside them (contrast baseline is shrink-only).
 */
export function MissSwatch({ fill, label, ratio }: { fill: Swatch; label: Swatch; ratio: number }) {
  const verdict = ratio >= AA ? 'AA' : 'misses AA'
  return (
    <View className="flex-row items-center gap-inline-sm">
      <View className="h-8 w-12 rounded-md" style={{ backgroundColor: fill.hex }} />
      <View
        className="h-8 w-3 rounded-sm border border-hairline-strong"
        style={{ backgroundColor: label.hex }}
      />
      <Caption>{`${fill.label} + ${label.label}: ${fmt(ratio)} ${verdict}`}</Caption>
    </View>
  )
}
