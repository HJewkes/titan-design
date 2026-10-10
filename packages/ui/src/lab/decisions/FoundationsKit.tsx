import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { compositeOver } from '../../theme/color-checks'
import { cn } from '../../utils/cn'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { AA, fmt, type Cell, type Swatch } from './foundations'

/**
 * Each frame paints its own mode: the mode's semantic map is set as local custom properties, so
 * `text-text-primary` and every component token resolve in that mode whatever the toolbar theme,
 * and a light frame also carries `.light`. A plain custom-property map, which is what nativewind's
 * `vars()` returns on web: importing `vars` pulls a CommonJS chunk that leaves a static Storybook
 * build blank.
 */
const MODE_VARS: Record<ThemeMode, object> = {
  dark: modeVars('dark'),
  light: modeVars('light'),
}

function modeVars(mode: ThemeMode) {
  const colors = getSemanticColors(mode) as Record<string, string>
  return Object.fromEntries(Object.entries(colors).map(([k, v]) => [`--color-${k}`, v]))
}

/** The frame is the whole story canvas, so a light frame never sits on a dark page. */
export function ModeFrame({
  mode,
  testID,
  children,
}: {
  mode: ThemeMode
  testID: string
  children: ReactNode
}) {
  return (
    <View
      className={cn('min-h-screen gap-stack-lg bg-background-base p-gutter-sm', mode)}
      style={MODE_VARS[mode]}
      testID={testID}
    >
      {children}
    </View>
  )
}

export function FrameHeader({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View className="gap-stack-sm">
      <Text className="text-base font-semibold text-text-primary" accessibilityRole="header">
        {title}
      </Text>
      {lines.map((line) => (
        <Text key={line} className="text-sm text-text-primary">
          {line}
        </Text>
      ))}
    </View>
  )
}

export function Caption({ children }: { children: ReactNode }) {
  return <Text className="font-mono text-[11px] leading-4 text-text-primary">{children}</Text>
}

/** A plane as a tile: its own background, its children set on it. */
export function PlaneTile({
  hex,
  className,
  testID,
  children,
}: {
  hex: string
  className?: string
  testID?: string
  children: ReactNode
}) {
  return (
    <View
      className={cn('gap-stack-sm rounded-md p-inset-sm', className)}
      style={{ backgroundColor: hex }}
      testID={testID}
    >
      {children}
    </View>
  )
}

/**
 * Shipped components paint a cell through the `error` tone: its tokens are overridden locally,
 * and ToolBadge's neutral subtle pair is overridden with the cell's subtle pair.
 */
export function CellCarrier({
  solid,
  subtle,
  children,
}: {
  solid?: Cell
  subtle?: Cell
  children: ReactNode
}) {
  const overrides: Record<`--${string}`, string> = {}
  if (solid) {
    overrides['--color-status-error-solid'] = solid.fill
    overrides['--color-status-error'] = solid.fill
    overrides['--color-on-status-error'] = solid.on.hex
  }
  if (subtle) {
    overrides['--color-status-error-subtle'] = subtle.fill
    overrides['--color-on-status-error-subtle'] = subtle.on.hex
    overrides['--color-hairline-subtle'] = subtle.fill
    overrides['--color-text-primary'] = subtle.on.hex
  }
  return (
    <View className="flex-row flex-wrap items-center gap-inline-sm" style={overrides}>
      {children}
    </View>
  )
}

/** A fill on a plane with its label live on it: only for cells that clear AA there. */
export function LiveChip({ cell, plane }: { cell: Cell; plane: string }) {
  return (
    <View
      className="self-start rounded-md px-squish-x-sm py-squish-y-md"
      style={{ backgroundColor: compositeOver(cell.fill, plane) }}
    >
      <Text className="text-xs font-semibold" style={{ color: cell.on.hex }}>
        {`${cell.fillLabel} + ${cell.on.label}`}
      </Text>
    </View>
  )
}

/**
 * A pair the owner must see but whose label misses AA: the fill and the label colour as two
 * blocks, no text on the fill, the measured ratio beside them (contrast baseline is shrink-only).
 */
export function MissSwatch({ fill, label, ratio }: { fill: Swatch; label: Swatch; ratio: number }) {
  return (
    <View className="flex-row items-center gap-inline-sm">
      <View className="h-8 w-12 rounded-md" style={{ backgroundColor: fill.hex }} />
      <View
        className="h-8 w-3 rounded-sm border border-hairline-strong"
        style={{ backgroundColor: label.hex }}
      />
      <Caption>{`${fill.label} + ${label.label}: ${fmt(ratio)} ${ratio >= AA ? 'AA' : 'misses AA'}`}</Caption>
    </View>
  )
}
