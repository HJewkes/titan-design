import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  primitiveColors,
  discreteRainbow,
  primitiveRamps,
  categoricalPalette,
  surfaceRampDark,
  backgroundFrameDark,
} from './tokens/primitives'
import { semanticColorsLight, semanticColorsDark } from './tokens/semantic'

const meta: Meta = {
  title: 'Foundations/Color/Palette',
  tags: ['autodocs'],
}

export default meta

/**
 * Hairline around every swatch, so a swatch whose fill matches the page still
 * reads as one. Sourced from the token layer rather than a literal — the color
 * stories should not be where raw hexes creep back in.
 */
const SWATCH_BORDER = semanticColorsDark['border-default']

interface ColorSwatchProps {
  name: string
  value: string
}

function ColorSwatch({ name, value }: ColorSwatchProps) {
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

function ColorScale({ name, colors }: { name: string; colors: Record<string | number, string> }) {
  return (
    <View style={{ marginBottom: 32 }}>
      <Text className="text-lg font-bold text-text-primary mb-3">{name}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Object.entries(colors).map(([shade, color]) => (
          <View key={shade} style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 8,
                backgroundColor: color,
                borderWidth: 1,
                borderColor: SWATCH_BORDER,
              }}
            />
            <Text className="text-text-secondary text-xs mt-1">{shade}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export const PrimitiveColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">Primitive Colors</Text>
      <Text className="text-text-secondary mb-6">
        Raw color values. Chromatic hues live as OKLCH tonal ramps (see the Tonal Ramps story);
        these are the achromatic and support scales. Use semantic tokens when building components.
      </Text>

      <ColorScale name="Blue" colors={primitiveColors.blue} />
      <ColorScale name="Red" colors={primitiveColors.red} />
      <ColorScale name="Red Vivid" colors={primitiveColors.redVivid} />
      <ColorScale name="Neutral" colors={primitiveColors.neutral} />
      <ColorScale name="Charcoal (Dark Backgrounds)" colors={primitiveColors.charcoal} />
    </View>
  ),
}

/**
 * Modifier suffixes a semantic token family can carry.
 *
 * Rendered as a matrix rather than a flat swatch list: the useful question is
 * almost always "what is the subtle/dark form of THIS role", which a flat list
 * buries. Columns are derived from the shipped tokens, so a new modifier shows
 * up here without editing the story.
 */
const VARIANT_SUFFIXES = ['light', 'dark', 'subtle', 'hover', 'active', 'muted'] as const

function variantsOf(base: string, palette: Record<string, string>) {
  return [
    { suffix: 'base', name: base },
    ...VARIANT_SUFFIXES.map((s) => ({ suffix: s, name: `${base}-${s}` })),
  ].filter(({ name }) => name in palette)
}

function VariantMatrix({
  bases,
  palette,
}: {
  bases: readonly string[]
  palette: Record<string, string>
}) {
  return (
    <View style={{ gap: 20 }}>
      {bases.map((base) => (
        <View key={base}>
          <Text className="font-semibold text-text-primary text-sm mb-2">{base}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {variantsOf(base, palette).map(({ suffix, name }) => (
              <View key={name} style={{ alignItems: 'center', width: 76 }}>
                <View
                  style={{
                    width: 76,
                    height: 44,
                    borderRadius: 6,
                    backgroundColor: palette[name],
                    borderWidth: 1,
                    borderColor: SWATCH_BORDER,
                  }}
                />
                <Text className="text-text-secondary text-xs mt-1">{suffix}</Text>
                <Text className="text-text-tertiary text-xs">{palette[name].toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}

export const BrandColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Brand Colors</Text>
      <Text className="text-text-secondary mb-6">
        Each brand role and its modifiers. <Text className="font-semibold">hover</Text> and{' '}
        <Text className="font-semibold">active</Text> are interaction states —{' '}
        <Text className="font-semibold">subtle</Text> is a tint for fills behind text.
      </Text>
      <VariantMatrix bases={['brand-primary', 'brand-secondary']} palette={semanticColorsLight} />
    </View>
  ),
}

export const StatusColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Status Colors</Text>
      <Text className="text-text-secondary mb-6">
        Status roles and their modifiers. <Text className="font-semibold">status-error-vivid</Text>{' '}
        is a separate, higher-chroma role (not a modifier of status-error) reserved for destructive
        emphasis.
      </Text>
      <VariantMatrix
        bases={[
          'status-success',
          'status-error',
          'status-error-vivid',
          'status-warning',
          'status-info',
          'status-live',
        ]}
        palette={semanticColorsLight}
      />
    </View>
  ),
}

export const TextColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">Text Colors (Dark Mode)</Text>

      <View style={{ gap: 16 }}>
        <ColorSwatch name="text-primary" value={semanticColorsDark['text-primary']} />
        <ColorSwatch name="text-secondary" value={semanticColorsDark['text-secondary']} />
        <ColorSwatch name="text-tertiary" value={semanticColorsDark['text-tertiary']} />
        <ColorSwatch name="text-disabled" value={semanticColorsDark['text-disabled']} />
        <ColorSwatch name="text-link" value={semanticColorsDark['text-link']} />
        <ColorSwatch name="text-link-hover" value={semanticColorsDark['text-link-hover']} />
        <ColorSwatch name="text-inverse" value={semanticColorsDark['text-inverse']} />
      </View>
    </View>
  ),
}

/**
 * The dark surface ramp, darkest plane first.
 *
 * Order and `lStar` mirror `surfaceRampDark` in tokens/primitives.ts, plus the
 * out-of-ramp `backgroundFrameDark` bezel that sits below it. Written as an
 * explicit ordered list because object key order is not a contract and depth
 * order is the whole point of this story. `surface.coverage.test.ts` asserts
 * every ramp step appears here.
 */
const SURFACE_PLANES = [
  { hex: backgroundFrameDark, lStar: 3.79, role: 'Frame / bezel — chrome outside the ramp' },
  { hex: surfaceRampDark.inset, lStar: 4.5, role: 'Sub-shell well / pressed' },
  { hex: surfaceRampDark.background, lStar: 9, role: 'Shell' },
  { hex: surfaceRampDark.base, lStar: 13.5, role: 'Main content plane' },
  { hex: surfaceRampDark.elevated, lStar: 17, role: 'Nav / rail' },
  { hex: surfaceRampDark.raised, lStar: 20, role: 'Cards' },
  { hex: surfaceRampDark.overlay, lStar: 22.5, role: 'Hero / popover' },
] as const

/** Semantic tokens resolving to `hex`, derived at render so the mapping can't drift. */
function tokensResolvingTo(hex: string): string[] {
  return Object.entries(semanticColorsDark)
    .filter(([name, value]) => /^(surface|background)-/.test(name) && value === hex)
    .map(([name]) => name)
    .sort()
}

function SurfacePlaneRow({ hex, lStar, role }: { hex: string; lStar: number; role: string }) {
  const tokens = tokensResolvingTo(hex)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View
        style={{
          width: 96,
          height: 56,
          borderRadius: 8,
          backgroundColor: hex,
          borderWidth: 1,
          borderColor: SWATCH_BORDER,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text className="font-semibold text-text-primary text-sm">
          {hex.toUpperCase()}{' '}
          <Text className="text-text-tertiary text-xs font-normal">L*{lStar}</Text>
        </Text>
        <Text className="text-text-secondary text-xs">{role}</Text>
        <Text className="text-text-tertiary text-xs mt-1">
          {tokens.length > 0 ? tokens.join(' · ') : '— no semantic alias'}
        </Text>
      </View>
    </View>
  )
}

export const SurfaceColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Surface Ramp (Dark Mode)</Text>
      <Text className="text-text-secondary mb-6">
        Depth is an <Text className="font-semibold">ordered ramp</Text>, not a set of unrelated
        fills — planes are spaced by perceptual lightness (L*), so &quot;one step up&quot; is the
        same visual distance anywhere in the stack. Listed darkest first. Several semantic tokens
        deliberately share a plane (shown per row); that aliasing is what lets a component say what
        it <Text className="italic">is</Text> rather than how deep it sits.
      </Text>

      <View style={{ gap: 14 }}>
        {SURFACE_PLANES.map((plane) => (
          <SurfacePlaneRow key={plane.hex} {...plane} />
        ))}
      </View>

      <Text className="text-text-secondary text-xs mt-8">
        To apply these at runtime use{' '}
        <Text className="font-semibold text-text-primary">&lt;Surface level&gt;</Text> and{' '}
        <Text className="font-semibold text-text-primary">useOnSurfaceColor</Text> rather than
        reading tokens directly — see Components/Atoms/Surface. Shadow and glow treatments layered
        on top of these planes are in Foundations/Shadows; the legacy numeric elevation scale is in
        Foundations/Elevation.
      </Text>
    </View>
  ),
}

export const ResultColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Result/Outcome Colors</Text>
      <Text className="text-text-secondary mb-6">
        Colors for indicating positive, negative, or neutral outcomes. Distinct from status: these
        encode the <Text className="italic">direction of a change</Text> (did this get better?), not
        a system state.
      </Text>

      <VariantMatrix
        bases={['result-improve', 'result-degrade', 'result-inconclusive', 'result-neutral']}
        palette={semanticColorsLight}
      />
    </View>
  ),
}

/**
 * LEGACY — superseded. The Paul-Tol `discreteRainbow` scale behind the `data-1..10`
 * tokens is no longer used by any component; charts and qualitative series now use
 * the {@link CategoricalPalette} (CVD-safe, nested-stable). Kept only to document the
 * still-defined `--color-data-N` tokens; see `CategoricalPalette` for current work.
 */
export const LegacyDataVisualizationColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">
        Data Visualization Colors — Legacy
      </Text>
      <Text className="text-text-secondary mb-6">
        SUPERSEDED. Paul Tol&apos;s discrete-rainbow scale behind the `data-1..10` tokens — no
        longer used by any component. Use the Categorical Palette (below) for charts and qualitative
        series; this is retained only to document the still-defined tokens.
      </Text>

      <View style={{ gap: 16 }}>
        <ColorSwatch name="data-1" value={semanticColorsLight['data-1']} />
        <ColorSwatch name="data-2" value={semanticColorsLight['data-2']} />
        <ColorSwatch name="data-3" value={semanticColorsLight['data-3']} />
        <ColorSwatch name="data-4" value={semanticColorsLight['data-4']} />
        <ColorSwatch name="data-5" value={semanticColorsLight['data-5']} />
        <ColorSwatch name="data-6" value={semanticColorsLight['data-6']} />
        <ColorSwatch name="data-7" value={semanticColorsLight['data-7']} />
        <ColorSwatch name="data-8" value={semanticColorsLight['data-8']} />
        <ColorSwatch name="data-9" value={semanticColorsLight['data-9']} />
        <ColorSwatch name="data-10" value={semanticColorsLight['data-10']} />
      </View>

      <Text className="text-lg font-bold text-text-primary mt-8 mb-3">
        Full Discrete Rainbow Palette
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {discreteRainbow.map((color, index) => (
          <View
            key={index}
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              backgroundColor: color,
              borderWidth: 1,
              borderColor: SWATCH_BORDER,
            }}
          />
        ))}
      </View>
    </View>
  ),
}

function CategoricalRow({ name, colors }: { name: string; colors: readonly string[] }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text className="text-lg font-bold text-text-primary mb-3">
        {name} <Text className="text-text-secondary text-sm">({colors.length})</Text>
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {colors.map((color, index) => (
          <View key={index} style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                backgroundColor: color,
                borderWidth: 1,
                borderColor: SWATCH_BORDER,
              }}
            />
            <Text className="text-text-secondary text-xs mt-1">{color.toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export const TonalRamps: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">Tonal Ramps (Foundations)</Text>
      <Text className="text-text-secondary mb-6">
        Seven OKLCH-generated hue ramps, 11 perceptual steps each (50 → 950). Built with hue-torsion
        and a chroma arc; amber absorbs the former yellow (lemon → warm body) and cyan absorbs the
        former steel.
      </Text>

      <ColorScale name="Red" colors={primitiveRamps.red} />
      <ColorScale name="Orange" colors={primitiveRamps.orange} />
      <ColorScale name="Amber" colors={primitiveRamps.amber} />
      <ColorScale name="Green" colors={primitiveRamps.green} />
      <ColorScale name="Cyan" colors={primitiveRamps.cyan} />
      <ColorScale name="Blue" colors={primitiveRamps.blue} />
      <ColorScale name="Magenta" colors={primitiveRamps.magenta} />
    </View>
  ),
}

export const CategoricalPalette: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">Categorical Palette</Text>
      <Text className="text-text-secondary mb-6">
        Ordered, colorblind-safe qualitative series (worst-case deut/protanopia floor 8 through the
        first six colors; the 7th is extended — pair it with a legend). Series index is stable. Use{' '}
        <Text className="font-semibold">default</Text> on neutral/light surfaces (also legible under
        black text) and <Text className="font-semibold">dark</Text> where white text sits on the
        swatch.
      </Text>

      <CategoricalRow name="Default" colors={categoricalPalette.default} />
      <CategoricalRow name="Dark (white text)" colors={categoricalPalette.dark} />
    </View>
  ),
}

export const BorderColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">Border Colors (Dark Mode)</Text>

      <View style={{ gap: 16 }}>
        <ColorSwatch name="border-default" value={semanticColorsDark['border-default']} />
        <ColorSwatch name="border-subtle" value={semanticColorsDark['border-subtle']} />
        <ColorSwatch name="border-strong" value={semanticColorsDark['border-strong']} />
        <ColorSwatch name="border-prominent" value={semanticColorsDark['border-prominent']} />
        <ColorSwatch name="border-focus" value={semanticColorsDark['border-focus']} />
        <ColorSwatch name="border-input" value={semanticColorsDark['border-input']} />
        <ColorSwatch name="border-input-hover" value={semanticColorsDark['border-input-hover']} />
        <ColorSwatch name="border-input-focus" value={semanticColorsDark['border-input-focus']} />
        <ColorSwatch name="border-input-error" value={semanticColorsDark['border-input-error']} />
      </View>
    </View>
  ),
}
