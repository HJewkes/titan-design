import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  primitiveColors,
  primitiveRamps,
  categoricalPalette,
  CATEGORICAL_CVD_SAFE_MAX,
} from './tokens/primitives'
import { semanticColorsDark } from './tokens/semantic'
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
 * There is deliberately no "legacy" section. Every scale here still has
 * unmigrated call sites in `semantic.ts`, so all of it is accurate for main
 * today — but the whole of `primitiveColors` (the greys and the support
 * chromatics) is slated for retirement into a unified warm grey ramp under
 * TD-07.14. A scale that is on its way out is documented with its destination,
 * not filed under a tombstone heading where nobody reads it.
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

/** Where the pending-migration work is specified. Repeated in the per-scale notes. */
const MIGRATION_SPEC = 'coordination/design-explorations/foundations/warm-grey-ramp/ (TD-07.14)'

/**
 * The standing caveat over every `primitiveColors` scale below.
 *
 * Deliberately at the top rather than per-swatch: the reader needs to know the
 * whole family is moving BEFORE they pick a step out of it, and a note attached
 * only to individual rows is one that gets skimmed past.
 */
function MigrationNotice() {
  return (
    <View
      style={{
        borderLeftWidth: 3,
        borderLeftColor: semanticColorsDark['status-warning'],
        paddingLeft: 12,
        paddingVertical: 8,
        marginBottom: 24,
      }}
    >
      <Text className="font-semibold text-text-primary text-sm mb-1">
        Pending migration — do not build new work on primitiveColors
      </Text>
      <Text className="text-text-secondary text-xs">
        The OKLCH ramps below are the destination. Everything under{' '}
        <Text className="font-semibold">Grey ramps</Text> and{' '}
        <Text className="font-semibold">Support chromatic scales</Text> comes from the older
        `primitiveColors` family, which is slated to retire into a unified warm grey ramp plus the
        OKLCH ramps. Those scales still have unmigrated call sites in `semantic.ts`, so the
        swatches are accurate for main today — they are not yet deprecated, and they are not
        endorsed either. Spec: {MIGRATION_SPEC}.
      </Text>
    </View>
  )
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
        <Text className="font-semibold">Foundations/Color/Palettes</Text> documents.
      </SectionIntro>

      <MigrationNotice />

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

      <SectionTitle>Grey ramps — pending migration</SectionTitle>
      <Text className="text-text-secondary text-xs mb-4">
        Two cold, hand-authored achromatic scales (every step R=G=B). Both fold into the single
        warm `grey` ramp under TD-07.14, which also absorbs the dark surface planes — so the
        end state is one grey ramp, not three. Neither is the surface system today.
      </Text>
      <ScaleRow
        name="Charcoal"
        scale={primitiveColors.charcoal}
        note="TODAY: backs the border family — border-default (400), border-subtle (500), border-strong (300), border-prominent (200), divider (400). Distinct from the dark SURFACE ramp, which is a separate derived depth ladder documented in Palettes. GOING: folds into the warm grey ramp; ΔE 1.6–3.8 per step, so borders and dividers barely move — the cheap half of the migration."
      />
      <ScaleRow
        name="Neutral"
        scale={primitiveColors.neutral}
        note="TODAY: backs text-tertiary and the fatigue palette's silver (300) / drift-grey (600) pair. GOING: also folds into the warm grey ramp, but this is the EXPENSIVE half — neutral is markedly cool and its mid steps are the text/muted-text/input greys, so they shift visibly (ΔE 9.8 at 400, 11.7 at 600, 13.7 at 900). Deliberate, not an error."
      />

      <SectionTitle>Support chromatic scales — pending migration</SectionTitle>
      <Text className="text-text-secondary text-xs mb-4">
        Pre-date the OKLCH ramps and are still referenced directly by `semantic.ts` via the `p`
        alias — which is why a search for `primitiveColors.blue` finds nothing and they look
        unused. They are not endorsed; each has a named destination in the OKLCH ramps.
      </Text>
      <ScaleRow
        name="Red Vivid"
        scale={primitiveColors.redVivid}
        note="TODAY: the whole status-error-vivid family — base (500), light (400), dark (700). GOING: retired outright. status-error-vivid collapses onto red[600] (= status-error), and the Indicator's emphasis moves to a glow shadow derived from red[500] rather than a second, higher-chroma red."
      />
      <ScaleRow
        name="Blue (support)"
        scale={primitiveColors.blue}
        note="TODAY: text-link (600), text-link-hover (700 light / 400 dark), border-focus and border-input-focus (600). GOING: to primitiveRamps.blue — text-link (dark) to blue[500], border-focus and border-input-focus to blue[600]. The periwinkle #828DF8 link colour dies with it."
      />
      <ScaleRow
        name="Red (support)"
        scale={primitiveColors.red}
        note="TODAY: border-input-error — 600 in light, 500 in dark. GOING: to primitiveRamps.red."
      />

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
