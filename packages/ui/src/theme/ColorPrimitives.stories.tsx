import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  primitiveColors,
  primitiveRamps,
  surfaceRampDark,
  backgroundFrameDark,
  categoricalPalette,
  CATEGORICAL_CVD_SAFE_MAX,
} from './tokens/primitives'
import {
  SWATCH_BORDER,
  SectionIntro,
  SectionTitle,
  ScaleRow,
  contrast,
  CVD_MATRICES,
  simulateCvd,
} from './color-story-kit'

/**
 * Foundations/Color/Primitives — the raw material, and how it is validated.
 *
 * This half holds the scales themselves and nothing about what they mean. The
 * organisations OF these scales — surfaces, categorical, status, brand,
 * fatigue and the rest — live in the sibling `Foundations/Color/Palettes`.
 *
 * This page is a MENU: everything on it is something you may legitimately
 * reach for today and that survives the migration ahead. The older
 * `primitiveColors` scales — `charcoal`, `neutral`, `redVivid`, and the support
 * `blue`/`red` — are deliberately NOT rendered here even though they still have
 * call sites in `semantic.ts`, because TD-07.14 deletes them. A swatch on a
 * menu is an invitation, and no annotation is loud enough to cancel that; the
 * intro carries a one-line pointer instead, so a reader who comes looking for
 * charcoal learns where it went rather than assuming an oversight.
 *
 * The semantic tokens those scales currently back are still documented, with
 * swatches, in `Foundations/Color/Palettes` — which is what the coverage guard
 * checks, and why removing the scale rows here costs no coverage.
 */
const meta: Meta = {
  title: 'Foundations/Color/Primitives',
  tags: ['autodocs'],
}

export default meta

// ============================================================================
// 1. Ramps
// ============================================================================

const CHROMATIC_RAMPS: Array<[keyof typeof primitiveRamps, string]> = [
  ['red', 'Red'],
  ['orange', 'Orange'],
  ['amber', 'Amber'],
  ['green', 'Green'],
  ['cyan', 'Cyan'],
  ['blue', 'Blue'],
  ['magenta', 'Magenta'],
]

const KEYWORDS = [
  { name: 'white', value: primitiveColors.white },
  { name: 'black', value: primitiveColors.black },
] as const

/**
 * The dark surface planes, darkest first — the greys you may actually pick.
 *
 * Shown here as a ramp (values only) because a menu of raw scales with no greys
 * on it would be a lie. The depth semantics, the L* spacing rationale and the
 * per-plane semantic aliases live in the full `Foundations/Color/Palettes`
 * surface story, and are deliberately not duplicated.
 */
const SURFACE_STEPS: Record<string, string> = {
  frame: backgroundFrameDark,
  inset: surfaceRampDark.inset,
  background: surfaceRampDark.background,
  base: surfaceRampDark.base,
  elevated: surfaceRampDark.elevated,
  raised: surfaceRampDark.raised,
  overlay: surfaceRampDark.overlay,
}

export const Ramps: StoryObj = {
  name: '1. Ramps — Source of Truth',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Ramps</Text>
      <SectionIntro>
        Every raw colour value titan ships, as ordered scales. Nothing here carries meaning — a
        ramp step becomes a border or a status only when a semantic token or a palette references
        it, which is what{' '}
        <Text className="font-semibold">Foundations/Color/Palettes</Text> documents. Everything on
        this page is current and safe to pick.
      </SectionIntro>

      <Text className="text-text-tertiary text-xs mb-6">
        Looking for <Text className="font-semibold">charcoal</Text>,{' '}
        <Text className="font-semibold">neutral</Text>, <Text className="font-semibold">redVivid</Text>{' '}
        or the support <Text className="font-semibold">blue</Text>/
        <Text className="font-semibold">red</Text> scales? They are intentionally not shown — all
        five retire into a unified warm grey ramp plus the OKLCH ramps under TD-07.14. They still
        have call sites in `semantic.ts`, so the semantic tokens they back are real and documented
        in Palettes; the raw scales are not on the menu because you should not be picking from
        them. Spec: coordination/design-explorations/foundations/warm-grey-ramp/.
      </Text>

      <SectionTitle>Chromatic — OKLCH tonal ramps</SectionTitle>
      <Text className="text-text-secondary text-xs mb-4">
        Seven OKLCH-generated hue ramps, 11 perceptual steps each (50 → 950), built with
        hue-torsion and a chroma arc anchored through the brand/semantic hexes. These are the
        source of truth for chromatic hexes: the categorical, diverging, effort and fatigue
        palettes are all references into these steps rather than duplicated values, so re-tuning a
        ramp moves them together. Amber absorbs the former yellow (lemon → warm body) and cyan
        absorbs the former steel.
      </Text>
      {CHROMATIC_RAMPS.map(([key, name]) => (
        <ScaleRow key={key} name={name} scale={primitiveRamps[key]} />
      ))}

      <SectionTitle>Achromatic — the dark surface ramp</SectionTitle>
      <Text className="text-text-secondary text-xs mb-4">
        The greys. A derived depth ladder rather than a generated hue ramp — spaced by perceptual
        lightness so one step is the same visual distance anywhere in the stack. Shown here as
        values; the depth semantics and the semantic tokens aliasing each plane are in the
        Palettes surface story, and are not repeated. Apply them with{' '}
        <Text className="font-semibold">&lt;Surface level&gt;</Text>, not by reading a step.
      </Text>
      <ScaleRow name="Surface (dark)" scale={SURFACE_STEPS} />

      <SectionTitle>Keywords</SectionTitle>
      <Text className="text-text-secondary text-xs mb-4">
        Absolute values with no scale. `transparent` is the third and encodes absence — it has no
        swatch because there is nothing to show.
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {KEYWORDS.map(({ name, value }) => (
          <View key={name} style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 62,
                height: 46,
                borderRadius: 6,
                backgroundColor: value,
                borderWidth: 1,
                borderColor: SWATCH_BORDER,
              }}
            />
            <Text className="text-text-secondary text-xs mt-1">{name}</Text>
            <Text className="text-text-tertiary" style={{ fontSize: 8 }}>
              {value.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  ),
}

// ============================================================================
// 2. Accessibility — contrast + CVD
// ============================================================================

/** The mid-step of each chromatic ramp — the band most fills and strokes land on. */
const RAMP_MIDS = CHROMATIC_RAMPS.map(([key, name]) => ({
  name,
  hex: primitiveRamps[key][500],
}))

/**
 * Width of the mode-label gutter. The swatch rows are indented by the same
 * amount so each simulation strip sits directly under the colour it simulates —
 * the comparison is worthless if the reader has to count across to pair them.
 */
const CVD_LABEL_WIDTH = 96

function CvdStrips({ colors, width }: { colors: readonly string[]; width: number }) {
  return (
    <>
      {(['deuteranopia', 'protanopia'] as const).map((mode) => (
        <View key={mode} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
          <Text className="text-text-secondary" style={{ fontSize: 9, width: CVD_LABEL_WIDTH }}>
            {mode}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {colors.map((hex, i) => (
              <View
                key={i}
                style={{
                  width,
                  height: 14,
                  borderRadius: 3,
                  backgroundColor: simulateCvd(CVD_MATRICES[mode], hex),
                }}
              />
            ))}
          </View>
        </View>
      ))}
    </>
  )
}

export const Accessibility: StoryObj = {
  name: '2. Accessibility — Contrast + CVD',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Accessibility</Text>
      <SectionIntro>
        How the raw material behaves for viewers who cannot separate the hues, and under text.
        Dichromacy is simulated with the Machado-2009 matrices at severity 1.0. Converging strips
        across two swatches mean those two are the same colour to that viewer — which is a
        problem only where hue is carrying the meaning on its own.
      </SectionIntro>

      <SectionTitle>Ramp mid-steps (500)</SectionTitle>
      <Text className="text-text-secondary text-xs mb-3">
        The seven hues at the step most fills land on. Red/orange/amber and green/cyan compress
        toward each other under both dichromacies — which is exactly why the categorical palette
        below fans its picks across lightness instead of taking all seven at 500, and why the
        ordered scales in Palettes encode magnitude in lightness rather than hue.
      </Text>
      <View
        style={{ flexDirection: 'row', gap: 6, marginBottom: 6, paddingLeft: CVD_LABEL_WIDTH }}
      >
        {RAMP_MIDS.map(({ name, hex }) => (
          <View key={name} style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 76,
                height: 40,
                borderRadius: 6,
                backgroundColor: hex,
                borderWidth: 1,
                borderColor: SWATCH_BORDER,
              }}
            />
            <Text className="text-text-secondary" style={{ fontSize: 9, marginTop: 2 }}>
              {name}
            </Text>
          </View>
        ))}
      </View>
      <CvdStrips colors={RAMP_MIDS.map((r) => r.hex)} width={76} />

      <View style={{ height: 28 }} />

      <SectionTitle>Categorical series — in-place text contrast</SectionTitle>
      <Text className="text-text-secondary text-xs mb-3">
        The palette that has to survive this test in production. All pairs hold ΔE ≥ 8 through the
        first {CATEGORICAL_CVD_SAFE_MAX}; the 7th is extended and wants a legend. The palette
        itself is documented in Palettes — this is the validation of it.
      </Text>
      {(['default', 'dark'] as const).map((variant) => {
        const colors = categoricalPalette[variant]
        const textColor = variant === 'dark' ? primitiveColors.white : primitiveColors.black
        return (
          <View key={variant} style={{ marginBottom: 22 }}>
            <Text
              className="font-semibold text-text-primary text-sm mb-2"
              style={{ textTransform: 'capitalize' }}
            >
              {variant}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                gap: 6,
                marginBottom: 6,
                paddingLeft: CVD_LABEL_WIDTH,
              }}
            >
              {colors.map((hex, i) => (
                <View key={i} style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 56,
                      height: 40,
                      borderRadius: 6,
                      backgroundColor: hex,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: textColor, fontSize: 11, fontWeight: '700' }}>Aa</Text>
                  </View>
                  <Text className="text-text-secondary" style={{ fontSize: 8, marginTop: 2 }}>
                    {contrast(hex, textColor).toFixed(1)}:1
                  </Text>
                </View>
              ))}
            </View>
            <CvdStrips colors={colors} width={56} />
          </View>
        )
      })}
    </View>
  ),
}
