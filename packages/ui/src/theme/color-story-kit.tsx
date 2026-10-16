/**
 * Shared render parts for the Foundations/Color stories.
 *
 * The colour documentation spans two sibling titles — `Foundations/Color/
 * Primitives` (the raw scales and their validation) and `Foundations/Color/
 * Palettes` (the organisations of those scales into meaning). Both draw the
 * same swatch, scale and section furniture, so it lives here rather than being
 * copied into each.
 *
 * NOT a `.stories.tsx`, so Storybook's glob skips it. Note that
 * `color-stories.coverage.test.ts` scans the STORY files as text for token
 * names — a token whose only mention is in this file would not count as
 * documented, which is correct: the swatch has to be in a story to be seen.
 */
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { bestTextColor } from './tokens/primitives'
import { semanticColorsDark } from './tokens/semantic'

/**
 * Hairline around every swatch, so a swatch whose fill matches the page still
 * reads as one. Sourced from the token layer rather than a literal — the color
 * stories should not be where raw hexes creep back in.
 */
export const SWATCH_BORDER = semanticColorsDark['hairline-default']

export function SectionIntro({ children }: { children: ReactNode }) {
  return <Text className="text-text-secondary mb-6">{children}</Text>
}

export function SectionTitle({ children }: { children: string }) {
  return <Text className="text-lg font-bold text-text-primary mb-3 mt-2">{children}</Text>
}

export function ColorSwatch({ name, value }: { name: string; value: string }) {
  const displayValue = value.startsWith('rgba') ? value : value.toUpperCase()

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          backgroundColor: value,
          borderWidth: 1,
          borderColor: SWATCH_BORDER,
        }}
      />
      <View>
        <Text className="font-semibold text-text-primary text-sm">{name}</Text>
        <Text className="text-text-secondary text-xs">{displayValue}</Text>
      </View>
    </View>
  )
}

/**
 * One scale as a labelled row of steps with the hex under each.
 *
 * Steps come from the object itself rather than a fixed list, so a scale with
 * the 11-step OKLCH shape and one with the legacy 10-step shape both render
 * without the story knowing which it has.
 */
export function ScaleRow({
  name,
  scale,
  note,
}: {
  name: string
  scale: Record<string | number, string>
  note?: string
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text className="font-semibold text-text-primary text-sm">{name}</Text>
      {note ? <Text className="text-text-tertiary text-xs mb-1">{note}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
        {Object.entries(scale).map(([step, hex]) => (
          <View key={step} style={{ alignItems: 'center', width: 62 }}>
            <View
              style={{
                width: 62,
                height: 46,
                borderRadius: 6,
                backgroundColor: hex,
                borderWidth: 1,
                borderColor: SWATCH_BORDER,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: bestTextColor(hex), fontSize: 10, fontWeight: '700' }}>
                {step}
              </Text>
            </View>
            <Text className="text-text-tertiary" style={{ fontSize: 8, marginTop: 2 }}>
              {hex.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View
      style={{
        padding: 10,
        backgroundColor: semanticColorsDark['surface-raised'],
        borderRadius: 8,
      }}
    >
      <Text className="text-text-secondary" style={{ fontSize: 9, marginBottom: 6 }}>
        {label}
      </Text>
      {children}
    </View>
  )
}

export { contrast } from './color-checks'
