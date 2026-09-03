import React, { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { Button, ButtonText } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Progress, CircularProgress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { Toast } from '../components/ui/toast'
import { Switch } from '../components/ui/switch'
import { applyThemePreset, audiobookPreset, defaultPreset } from '../theme/presets'
import type { ThemePreset } from '../theme/presets'

const presets: Record<string, ThemePreset> = {
  default: defaultPreset,
  audiobook: audiobookPreset,
}

function PresetSwitcher({
  activePreset,
  onSwitch,
}: {
  activePreset: string
  onSwitch: (name: string) => void
}) {
  return (
    <View className="flex-row items-center gap-3 p-4 bg-surface-elevated rounded-lg border border-hairline">
      <Text className="text-text-secondary text-sm font-medium">Active Preset:</Text>
      {Object.keys(presets).map((name) => (
        <Pressable
          key={name}
          onPress={() => onSwitch(name)}
          className={`px-4 py-2 rounded-md border ${
            activePreset === name
              ? 'bg-brand-primary border-brand-primary'
              : 'bg-surface-base border-hairline web:hover:bg-interactive-hover'
          }`}
        >
          <Text
            className={`text-sm font-semibold capitalize ${
              activePreset === name ? 'text-on-brand-primary' : 'text-text-primary'
            }`}
          >
            {name}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function usePresetToggle(initial = 'default') {
  const [activePreset, setActivePreset] = useState(initial)

  useEffect(() => {
    const cleanup = applyThemePreset(presets[activePreset])
    return cleanup
  }, [activePreset])

  return { activePreset, setActivePreset }
}

// ---------------------------------------------------------------------------
// SideBySide Story
// ---------------------------------------------------------------------------

function SideBySideShowcase() {
  const { activePreset, setActivePreset } = usePresetToggle()

  return (
    <View className="gap-6 p-6 bg-background-default min-h-screen">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-text-primary font-heading">
          Preset Showcase
        </Text>
        <Text className="text-text-secondary text-base">
          Toggle between presets to see how the entire design system adapts.
        </Text>
      </View>

      <PresetSwitcher activePreset={activePreset} onSwitch={setActivePreset} />

      {/* Typography */}
      <Section title="Typography">
        <Text className="text-3xl font-bold text-text-primary font-heading">
          Heading (font-heading)
        </Text>
        <Text className="text-xl font-semibold text-text-primary font-heading">
          Subheading (font-heading)
        </Text>
        <Text className="text-base text-text-primary font-body">
          Body text using font-body. The quick brown fox jumps over the lazy dog. This
          demonstrates how paragraph text renders under the current preset.
        </Text>
        <Text className="text-sm text-text-secondary font-body">
          Secondary body text for captions and supporting content.
        </Text>
        <Text className="text-sm text-text-primary font-mono">
          {'const monospace = \'font-mono rendering\''}
        </Text>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <View className="gap-3">
          <Text className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Primary
          </Text>
          <View className="flex-row gap-3 flex-wrap">
            <Button variant="solid" color="primary">
              <ButtonText>Solid</ButtonText>
            </Button>
            <Button variant="outline" color="primary">
              <ButtonText>Outline</ButtonText>
            </Button>
            <Button variant="ghost" color="primary">
              <ButtonText>Ghost</ButtonText>
            </Button>
          </View>
          <Text className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Secondary
          </Text>
          <View className="flex-row gap-3 flex-wrap">
            <Button variant="solid" color="secondary">
              <ButtonText>Solid</ButtonText>
            </Button>
            <Button variant="outline" color="secondary">
              <ButtonText>Outline</ButtonText>
            </Button>
            <Button variant="ghost" color="secondary">
              <ButtonText>Ghost</ButtonText>
            </Button>
          </View>
        </View>
      </Section>

      {/* Cards with Badges */}
      <Section title="Cards">
        <View className="flex-row gap-4 flex-wrap">
          <Card className="p-4 gap-3 flex-1 min-w-[260px]">
            <Text className="text-lg font-semibold text-text-primary font-heading">
              Elevated Card
            </Text>
            <Text className="text-text-secondary text-sm">
              Surface elevation and border colors adapt to the active preset.
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              <Badge color="success">Complete</Badge>
              <Badge color="warning">Pending</Badge>
              <Badge color="error">Failed</Badge>
            </View>
          </Card>
          <Card className="p-4 gap-3 flex-1 min-w-[260px]">
            <Text className="text-lg font-semibold text-text-primary font-heading">
              Content Card
            </Text>
            <Text className="text-text-secondary text-sm">
              Brand secondary and info badges shown below for comparison.
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              <Badge color="info">Info</Badge>
              <Badge color="secondary">Secondary</Badge>
            </View>
          </Card>
        </View>
      </Section>

      {/* Input + Switch */}
      <Section title="Inputs">
        <View className="gap-3 max-w-[400px]">
          <Input placeholder="Default input..." />
          <Input placeholder="Disabled input..." isDisabled />
          <View className="flex-row items-center gap-3">
            <Switch />
            <Text className="text-text-primary text-sm">Toggle switch</Text>
          </View>
        </View>
      </Section>

      {/* Progress */}
      <Section title="Progress">
        <View className="gap-4">
          <Progress value={65} label="Primary" showValue color="primary" />
          <Progress value={40} label="Secondary" showValue color="secondary" />
          <Progress value={100} label="Success" showValue color="success" />
          <View className="flex-row gap-4 items-center flex-wrap">
            <CircularProgress value={25} size={48} showValue color="primary" />
            <CircularProgress value={50} size={48} showValue color="secondary" />
            <CircularProgress value={75} size={48} showValue color="success" />
            <CircularProgress value={100} size={48} showValue color="error" />
          </View>
        </View>
      </Section>

      {/* Toasts */}
      <Section title="Toasts">
        <View className="gap-3">
          <Toast title="Operation successful" description="Your changes have been saved." status="success" />
          <Toast title="Something went wrong" description="Please try again later." status="error" />
          <Toast title="Heads up" description="This action cannot be undone." status="warning" />
          <Toast title="New update available" description="Version 2.0 is ready to install." status="info" />
        </View>
      </Section>

      {/* Status Colors */}
      <Section title="Status Colors">
        <View className="flex-row gap-3 flex-wrap">
          <Badge color="success" size="lg">Success</Badge>
          <Badge color="error" size="lg">Error</Badge>
          <Badge color="warning" size="lg">Warning</Badge>
          <Badge color="info" size="lg">Info</Badge>
        </View>
      </Section>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Typography Story
// ---------------------------------------------------------------------------

function TypographyShowcase() {
  const { activePreset, setActivePreset } = usePresetToggle()

  return (
    <View className="gap-6 p-6 bg-background-default min-h-screen">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-text-primary font-heading">
          Typography
        </Text>
        <Text className="text-text-secondary text-base">
          How fonts and text styles change across presets.
        </Text>
      </View>

      <PresetSwitcher activePreset={activePreset} onSwitch={setActivePreset} />

      <Section title="Heading Font (font-heading)">
        <Text className="text-4xl font-bold text-text-primary font-heading">
          H1 - The Art of Design Systems
        </Text>
        <Text className="text-3xl font-bold text-text-primary font-heading">
          H2 - Component Architecture
        </Text>
        <Text className="text-2xl font-semibold text-text-primary font-heading">
          H3 - Token-Driven Theming
        </Text>
        <Text className="text-xl font-semibold text-text-primary font-heading">
          H4 - Cross-Platform Consistency
        </Text>
      </Section>

      <Section title="Body Font (font-body)">
        <Text className="text-base text-text-primary font-body">
          Regular body text. Design systems provide a shared language for product teams.
          By codifying decisions into reusable components and tokens, teams move faster
          while maintaining visual consistency across every surface.
        </Text>
        <Text className="text-base font-semibold text-text-primary font-body">
          Bold body text. Emphasis and hierarchy within paragraph content.
        </Text>
        <Text className="text-base italic text-text-primary font-body">
          Italic body text. Used for quotations, citations, and emphasis.
        </Text>
        <Text className="text-sm text-text-secondary font-body">
          Small / secondary text. Captions, labels, and supporting information
          that supplements the main content without competing for attention.
        </Text>
        <Text className="text-xs text-text-tertiary font-body">
          Extra-small / tertiary text. Timestamps, metadata, fine print.
        </Text>
      </Section>

      <Section title="Monospace Font (font-mono)">
        <View className="bg-surface-elevated rounded-lg p-4 border border-hairline">
          <Text className="text-sm text-text-primary font-mono">
            {'const theme = applyThemePreset(audiobookPreset)'}
          </Text>
          <Text className="text-sm text-text-secondary font-mono">
            {'// Overrides CSS custom properties on :root'}
          </Text>
          <Text className="text-sm text-text-primary font-mono">
            {'export type ThemePreset = { name: string }'}
          </Text>
        </View>
      </Section>

      <Section title="Mixed Typography">
        <Card className="p-5 gap-3">
          <Text className="text-2xl font-bold text-text-primary font-heading">
            Chapter One
          </Text>
          <Text className="text-base text-text-secondary font-body">
            It was a bright cold day in April, and the clocks were striking thirteen.
            Winston Smith, his chin nuzzled into his breast in an effort to escape the
            vile wind, slipped quickly through the glass doors of Victory Mansions,
            though not quickly enough to prevent a swirl of gritty dust from entering
            along with him.
          </Text>
          <Text className="text-xs text-text-tertiary font-mono">
            George Orwell, 1984
          </Text>
        </Card>
      </Section>
    </View>
  )
}

// ---------------------------------------------------------------------------
// ColorPalette Story
// ---------------------------------------------------------------------------

function ColorSwatch({
  label,
  className,
  textClass = 'text-white',
}: {
  label: string
  className: string
  textClass?: string
}) {
  return (
    <View className={`rounded-lg p-3 min-w-[120px] min-h-[60px] justify-end ${className}`}>
      <Text className={`text-xs font-mono font-medium ${textClass}`}>{label}</Text>
    </View>
  )
}

function ColorPaletteShowcase() {
  const { activePreset, setActivePreset } = usePresetToggle()

  return (
    <View className="gap-6 p-6 bg-background-default min-h-screen">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-text-primary font-heading">
          Color Palette
        </Text>
        <Text className="text-text-secondary text-base">
          Semantic color tokens rendered as swatches. Toggle presets to compare palettes.
        </Text>
      </View>

      <PresetSwitcher activePreset={activePreset} onSwitch={setActivePreset} />

      <Section title="Brand Colors">
        <View className="flex-row gap-3 flex-wrap">
          <ColorSwatch label="brand-primary" className="bg-brand-primary" />
          <ColorSwatch label="brand-primary-light" className="bg-brand-primary-light" />
          <ColorSwatch label="brand-primary-dark" className="bg-brand-primary-dark" />
          <ColorSwatch label="brand-primary-subtle" className="bg-brand-primary-subtle" textClass="text-text-primary" />
        </View>
        <View className="flex-row gap-3 flex-wrap mt-2">
          <ColorSwatch label="brand-secondary" className="bg-brand-secondary" />
          <ColorSwatch label="brand-secondary-light" className="bg-brand-secondary-light" />
          <ColorSwatch label="brand-secondary-dark" className="bg-brand-secondary-dark" />
          <ColorSwatch label="brand-secondary-subtle" className="bg-brand-secondary-subtle" textClass="text-text-primary" />
        </View>
      </Section>

      <Section title="Status Colors">
        <View className="flex-row gap-3 flex-wrap">
          <ColorSwatch label="status-success" className="bg-status-success" />
          <ColorSwatch label="status-error" className="bg-status-error" />
          <ColorSwatch label="status-warning" className="bg-status-warning" />
          <ColorSwatch label="status-info" className="bg-status-info" />
        </View>
      </Section>

      <Section title="Text Colors">
        <View className="flex-row gap-3 flex-wrap">
          <View className="rounded-lg p-3 min-w-[120px] min-h-[60px] justify-end bg-surface-elevated border border-hairline">
            <Text className="text-xs font-mono font-medium text-text-primary">text-primary</Text>
          </View>
          <View className="rounded-lg p-3 min-w-[120px] min-h-[60px] justify-end bg-surface-elevated border border-hairline">
            <Text className="text-xs font-mono font-medium text-text-secondary">text-secondary</Text>
          </View>
          <View className="rounded-lg p-3 min-w-[120px] min-h-[60px] justify-end bg-surface-elevated border border-hairline">
            <Text className="text-xs font-mono font-medium text-text-tertiary">text-tertiary</Text>
          </View>
        </View>
      </Section>

      <Section title="Surface Colors">
        <View className="flex-row gap-3 flex-wrap">
          <ColorSwatch label="surface-base" className="bg-surface-base border border-hairline" textClass="text-text-primary" />
          <ColorSwatch label="surface-elevated" className="bg-surface-elevated border border-hairline" textClass="text-text-primary" />
          <ColorSwatch label="surface-raised" className="bg-surface-raised border border-hairline" textClass="text-text-primary" />
          <ColorSwatch label="surface-overlay" className="bg-surface-overlay border border-hairline" textClass="text-text-primary" />
          <ColorSwatch label="surface-input" className="bg-surface-input border border-hairline" textClass="text-text-primary" />
        </View>
      </Section>

      <Section title="Background Colors">
        <View className="flex-row gap-3 flex-wrap">
          <ColorSwatch label="background-base" className="bg-background-base border border-hairline" textClass="text-text-primary" />
          <ColorSwatch label="background-default" className="bg-background-default border border-hairline" textClass="text-text-primary" />
          <ColorSwatch label="background-subtle" className="bg-background-subtle border border-hairline" textClass="text-text-primary" />
        </View>
      </Section>

      <Section title="Border Colors">
        <View className="flex-row gap-3 flex-wrap">
          <View className="rounded-lg p-3 min-w-[120px] min-h-[60px] justify-end bg-surface-base border-2 border-hairline-default">
            <Text className="text-xs font-mono font-medium text-text-primary">hairline-default</Text>
          </View>
          <View className="rounded-lg p-3 min-w-[120px] min-h-[60px] justify-end bg-surface-base border-2 border-hairline-subtle">
            <Text className="text-xs font-mono font-medium text-text-primary">hairline-subtle</Text>
          </View>
          <View className="rounded-lg p-3 min-w-[120px] min-h-[60px] justify-end bg-surface-base border-2 border-hairline-strong">
            <Text className="text-xs font-mono font-medium text-text-primary">hairline-strong</Text>
          </View>
          <View className="rounded-lg p-3 min-w-[120px] min-h-[60px] justify-end bg-surface-base border-2 border-border-focus">
            <Text className="text-xs font-mono font-medium text-text-primary">border-focus</Text>
          </View>
        </View>
      </Section>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Shared Section Component
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-text-primary font-heading border-b border-hairline-subtle pb-2">
        {title}
      </Text>
      {children}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Storybook Meta & Exports
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Lab/Recipes/Theme Preset Showcase',
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

export const SideBySide: StoryObj = {
  render: () => <SideBySideShowcase />,
  name: 'Component Showcase',
}

export const Typography: StoryObj = {
  render: () => <TypographyShowcase />,
  name: 'Typography',
}

export const ColorPalette: StoryObj = {
  render: () => <ColorPaletteShowcase />,
  name: 'Color Palette',
}
