import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { primitiveColors, discreteRainbow, primitiveRamps, categoricalPalette } from './tokens/primitives'
import { semanticColorsLight, semanticColorsDark } from './tokens/semantic'

const meta: Meta = {
  title: 'Design Tokens/Colors',
  tags: ['autodocs'],
}

export default meta

interface ColorSwatchProps {
  name: string
  value: string
  textColor?: string
}

function ColorSwatch({ name, value, textColor = '#FFFFFF' }: ColorSwatchProps) {
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
          borderColor: '#374151',
        }}
      />
      <View>
        <Text className="font-semibold text-text-primary text-sm">
          {name}
        </Text>
        <Text className="text-text-secondary text-xs">
          {displayValue}
        </Text>
      </View>
    </View>
  )
}

function ColorScale({ name, colors }: { name: string; colors: Record<string | number, string> }) {
  return (
    <View style={{ marginBottom: 32 }}>
      <Text className="text-lg font-bold text-text-primary mb-3">
        {name}
      </Text>
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
                borderColor: '#374151',
              }}
            />
            <Text className="text-text-secondary text-xs mt-1">
              {shade}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export const PrimitiveColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">
        Primitive Colors
      </Text>
      <Text className="text-text-secondary mb-6">
        Raw color values. Use semantic tokens instead when building components.
      </Text>

      <ColorScale name="Orange (Primary Brand)" colors={primitiveColors.accent} />
      <ColorScale name="Steel (Secondary Brand)" colors={primitiveColors.steel} />
      <ColorScale name="Blue" colors={primitiveColors.blue} />
      <ColorScale name="Green" colors={primitiveColors.green} />
      <ColorScale name="Teal (Success)" colors={primitiveColors.teal} />
      <ColorScale name="Red (Error)" colors={primitiveColors.red} />
      <ColorScale name="Sky (Info)" colors={primitiveColors.sky} />
      <ColorScale name="Neutral" colors={primitiveColors.neutral} />
      <ColorScale name="Charcoal (Dark Backgrounds)" colors={primitiveColors.charcoal} />
    </View>
  ),
}

export const BrandColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">
        Brand Colors
      </Text>

      <View style={{ gap: 16 }}>
        <ColorSwatch name="brand-primary" value={semanticColorsLight['brand-primary']} />
        <ColorSwatch name="brand-primary-light" value={semanticColorsLight['brand-primary-light']} />
        <ColorSwatch name="brand-primary-dark" value={semanticColorsLight['brand-primary-dark']} />
        <ColorSwatch name="brand-secondary" value={semanticColorsLight['brand-secondary']} />
        <ColorSwatch name="brand-secondary-light" value={semanticColorsLight['brand-secondary-light']} />
        <ColorSwatch name="brand-secondary-dark" value={semanticColorsLight['brand-secondary-dark']} />
      </View>
    </View>
  ),
}

export const StatusColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">
        Status Colors
      </Text>

      <View style={{ gap: 16 }}>
        <ColorSwatch name="status-success" value={semanticColorsLight['status-success']} />
        <ColorSwatch name="status-error" value={semanticColorsLight['status-error']} />
        <ColorSwatch name="status-warning" value={semanticColorsLight['status-warning']} />
        <ColorSwatch name="status-info" value={semanticColorsLight['status-info']} />
      </View>
    </View>
  ),
}

export const TextColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">
        Text Colors (Dark Mode)
      </Text>

      <View style={{ gap: 16 }}>
        <ColorSwatch name="text-primary" value={semanticColorsDark['text-primary']} />
        <ColorSwatch name="text-secondary" value={semanticColorsDark['text-secondary']} />
        <ColorSwatch name="text-tertiary" value={semanticColorsDark['text-tertiary']} />
        <ColorSwatch name="text-disabled" value={semanticColorsDark['text-disabled']} />
        <ColorSwatch name="text-link" value={semanticColorsDark['text-link']} />
      </View>
    </View>
  ),
}

export const SurfaceColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">
        Surface Colors (Dark Mode)
      </Text>

      <View style={{ gap: 16 }}>
        <ColorSwatch name="surface-base" value={semanticColorsDark['surface-base']} />
        <ColorSwatch name="surface-elevated" value={semanticColorsDark['surface-elevated']} />
        <ColorSwatch name="surface-raised" value={semanticColorsDark['surface-raised']} />
        <ColorSwatch name="surface-input" value={semanticColorsDark['surface-input']} />
        <ColorSwatch name="background-base" value={semanticColorsDark['background-base']} />
        <ColorSwatch name="background-default" value={semanticColorsDark['background-default']} />
      </View>
    </View>
  ),
}

export const ResultColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">
        Result/Outcome Colors
      </Text>
      <Text className="text-text-secondary mb-6">
        Colors for indicating positive, negative, or neutral outcomes.
      </Text>

      <View style={{ gap: 16 }}>
        <ColorSwatch name="result-improve" value={semanticColorsLight['result-improve']} />
        <ColorSwatch name="result-improve-light" value={semanticColorsLight['result-improve-light']} />
        <ColorSwatch name="result-degrade" value={semanticColorsLight['result-degrade']} />
        <ColorSwatch name="result-degrade-light" value={semanticColorsLight['result-degrade-light']} />
        <ColorSwatch name="result-inconclusive" value={semanticColorsLight['result-inconclusive']} />
        <ColorSwatch name="result-inconclusive-light" value={semanticColorsLight['result-inconclusive-light']} />
        <ColorSwatch name="result-neutral" value={semanticColorsLight['result-neutral']} />
      </View>
    </View>
  ),
}

export const DataVisualizationColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">
        Data Visualization Colors
      </Text>
      <Text className="text-text-secondary mb-6">
        Colors optimized for charts and data visualization. Based on Paul Tol&apos;s color schemes.
      </Text>

      <View style={{ gap: 16 }}>
        <ColorSwatch name="data-1" value={semanticColorsLight['data-1']} />
        <ColorSwatch name="data-2" value={semanticColorsLight['data-2']} />
        <ColorSwatch name="data-3" value={semanticColorsLight['data-3']} textColor="#000000" />
        <ColorSwatch name="data-4" value={semanticColorsLight['data-4']} />
        <ColorSwatch name="data-5" value={semanticColorsLight['data-5']} />
        <ColorSwatch name="data-6" value={semanticColorsLight['data-6']} />
        <ColorSwatch name="data-7" value={semanticColorsLight['data-7']} textColor="#000000" />
        <ColorSwatch name="data-8" value={semanticColorsLight['data-8']} textColor="#000000" />
        <ColorSwatch name="data-9" value={semanticColorsLight['data-9']} textColor="#000000" />
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
              borderColor: '#374151',
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
                borderColor: '#374151',
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
      <Text className="text-2xl font-bold text-text-primary mb-6">
        Tonal Ramps (Foundations)
      </Text>
      <Text className="text-text-secondary mb-6">
        Seven OKLCH-generated hue ramps, 11 perceptual steps each (50 → 950). Built with hue-torsion and a
        chroma arc; amber absorbs the former yellow (lemon → warm body) and cyan absorbs the former steel.
      </Text>

      <ColorScale name="Red" colors={primitiveRamps.red} />
      <ColorScale name="Orange" colors={primitiveRamps.orange} />
      <ColorScale name="Amber (yellow-merged)" colors={primitiveRamps.amber} />
      <ColorScale name="Green" colors={primitiveRamps.green} />
      <ColorScale name="Cyan (steel-merged)" colors={primitiveRamps.cyan} />
      <ColorScale name="Blue" colors={primitiveRamps.blue} />
      <ColorScale name="Magenta" colors={primitiveRamps.magenta} />
    </View>
  ),
}

export const CategoricalPalette: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">
        Categorical Palette
      </Text>
      <Text className="text-text-secondary mb-6">
        Ordered, colorblind-safe qualitative series (worst-case deut/protanopia floor 8 through the first
        six colors; the 7th is extended — pair it with a legend). Series index is stable. Use{' '}
        <Text className="font-semibold">default</Text> on neutral/light surfaces (also legible under black
        text) and <Text className="font-semibold">dark</Text> where white text sits on the swatch.
      </Text>

      <CategoricalRow name="Default" colors={categoricalPalette.default} />
      <CategoricalRow name="Dark (white text)" colors={categoricalPalette.dark} />
    </View>
  ),
}

export const BorderColors: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-6">
        Border Colors (Dark Mode)
      </Text>

      <View style={{ gap: 16 }}>
        <ColorSwatch name="border-default" value={semanticColorsDark['border-default']} />
        <ColorSwatch name="border-subtle" value={semanticColorsDark['border-subtle']} />
        <ColorSwatch name="border-strong" value={semanticColorsDark['border-strong']} />
        <ColorSwatch name="border-focus" value={semanticColorsDark['border-focus']} />
        <ColorSwatch name="border-input" value={semanticColorsDark['border-input']} />
        <ColorSwatch name="border-input-hover" value={semanticColorsDark['border-input-hover']} />
        <ColorSwatch name="border-input-focus" value={semanticColorsDark['border-input-focus']} />
        <ColorSwatch name="border-input-error" value={semanticColorsDark['border-input-error']} />
      </View>
    </View>
  ),
}
