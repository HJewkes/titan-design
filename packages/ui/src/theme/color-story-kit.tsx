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
export const SWATCH_BORDER = semanticColorsDark['border-default']

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

// ---------------------------------------------------------------------------
// colour maths — drives the accessibility / CVD panel
// ---------------------------------------------------------------------------

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number]
}
const toHex = (v: number) =>
  Math.round(Math.min(1, Math.max(0, v)) * 255)
    .toString(16)
    .padStart(2, '0')
const lin = (c: number) => (c >= 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92)
const gamma = (c: number) =>
  c >= 0.0031308 ? 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055 : 12.92 * c

const relLum = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two solid colours. */
export function contrast(a: string, b: string): number {
  const [l1, l2] = [relLum(a), relLum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Machado-2009 dichromacy simulation matrices, severity 1.0. */
export const CVD_MATRICES = {
  deuteranopia: [
    0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881,
  ],
  protanopia: [
    0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998,
  ],
} as const

/** How `hex` appears to a viewer with the dichromacy described by `matrix`. */
export function simulateCvd(matrix: readonly number[], hex: string): string {
  const [r, g, b] = hexToRgb(hex).map(lin)
  const out = [
    matrix[0] * r + matrix[1] * g + matrix[2] * b,
    matrix[3] * r + matrix[4] * g + matrix[5] * b,
    matrix[6] * r + matrix[7] * g + matrix[8] * b,
  ].map(gamma)
  return '#' + out.map(toHex).join('')
}
