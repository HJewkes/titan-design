import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  primitiveColors,
  primitiveRamps,
  surfaceRampDark,
  backgroundFrameDark,
  categoricalPalette,
  getCategoricalColor,
  CATEGORICAL_CVD_SAFE_MAX,
  divergingScale,
  sequentialEffort,
  discreteRainbow,
  bestTextColor,
} from './tokens/primitives'
import { semanticColorsLight, semanticColorsDark, getSemanticColors } from './tokens/semantic'
import { WORKOUT_TOKENS } from './workout-tokens'
import { WORKOUT_PILL_DELOAD } from './extracted-colors-dataviz'
import { SPINNER_PRIMARY } from './extracted-colors-ui'
import {
  SILVER,
  RED_LIGHT,
  RED_MID,
  RED_DEEP,
  DRIFT_GREY,
  GRIND_THRESHOLD,
  ghostLineColor,
} from '../components/custom/Fatigue/fatigue-tokens'

/**
 * Foundations/Color — the documentation of record for the token layer.
 *
 * ORDER IS THE ARGUMENT. The stories run canonical-first: the OKLCH tonal ramps
 * (the single source of truth for every chromatic hex) and the v0.10.0 surface
 * ramp lead; the derived scales follow; the semantic roles that reference them
 * come next; superseded material (the pre-ramp `primitiveColors`, the Paul-Tol
 * rainbow) sits at the bottom, labelled. Storybook sorts the sidebar
 * alphabetically, so each story carries a numbered `name` to hold that order.
 *
 * `color-stories.coverage.test.ts` reads this file as text and fails if a
 * semantic token ships without a swatch here, or if a surface token lands off
 * the ramp.
 */
const meta: Meta = {
  title: 'Foundations/Color/Palette',
  tags: ['autodocs'],
}

export default meta

const t = getSemanticColors('dark')

/**
 * Hairline around every swatch, so a swatch whose fill matches the page still
 * reads as one. Sourced from the token layer rather than a literal — the color
 * stories should not be where raw hexes creep back in.
 */
const SWATCH_BORDER = semanticColorsDark['border-default']

// ---------------------------------------------------------------------------
// shared swatch primitives
// ---------------------------------------------------------------------------

function SectionIntro({ children }: { children: ReactNode }) {
  return <Text className="text-text-secondary mb-6">{children}</Text>
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="text-lg font-bold text-text-primary mb-3 mt-2">{children}</Text>
}

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

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ padding: 10, backgroundColor: t['surface-raised'], borderRadius: 8 }}>
      <Text className="text-text-secondary" style={{ fontSize: 9, marginBottom: 6 }}>
        {label}
      </Text>
      {children}
    </View>
  )
}

// ============================================================================
// 1. Tonal ramps — the source of truth
// ============================================================================

const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

const RAMP_NAMES: Array<[keyof typeof primitiveRamps, string]> = [
  ['red', 'Red'],
  ['orange', 'Orange'],
  ['amber', 'Amber'],
  ['green', 'Green'],
  ['cyan', 'Cyan'],
  ['blue', 'Blue'],
  ['magenta', 'Magenta'],
]

/** One hue: a labelled row of all 11 perceptual steps, with the hex under each. */
function RampRow({ name, ramp }: { name: string; ramp: Record<number, string> }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text className="font-semibold text-text-primary text-sm mb-1">{name}</Text>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {RAMP_STEPS.map((step) => (
          <View key={step} style={{ alignItems: 'center', width: 62 }}>
            <View
              style={{
                width: 62,
                height: 46,
                borderRadius: 6,
                backgroundColor: ramp[step],
                borderWidth: 1,
                borderColor: SWATCH_BORDER,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: bestTextColor(ramp[step]), fontSize: 10, fontWeight: '700' }}>
                {step}
              </Text>
            </View>
            <Text className="text-text-tertiary" style={{ fontSize: 8, marginTop: 2 }}>
              {ramp[step].toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export const TonalRamps: StoryObj = {
  name: '1. Tonal Ramps — Source of Truth',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Tonal Ramps</Text>
      <SectionIntro>
        Seven OKLCH-generated hue ramps, 11 perceptual steps each (50 → 950), built with
        hue-torsion and a chroma arc anchored through the brand/semantic hexes. These are the{' '}
        <Text className="font-semibold">single source of truth for every chromatic hex</Text> in
        titan — the categorical, diverging, effort and fatigue palettes below are all references
        into these steps rather than duplicated values, so re-tuning a ramp moves them together.
        Amber absorbs the former yellow (lemon → warm body) and cyan absorbs the former steel.
      </SectionIntro>

      {RAMP_NAMES.map(([key, name]) => (
        <RampRow key={key} name={name} ramp={primitiveRamps[key]} />
      ))}
    </View>
  ),
}

// ============================================================================
// 2. Surface ramp — canonical (v0.10.0)
// ============================================================================

/**
 * The dark surface ramp, darkest plane first.
 *
 * Order and `lStar` mirror `surfaceRampDark` in tokens/primitives.ts, plus the
 * out-of-ramp `backgroundFrameDark` bezel that sits below it. Written as an
 * explicit ordered list because object key order is not a contract and depth
 * order is the whole point of this story. `color-stories.coverage.test.ts`
 * asserts every ramp step appears here.
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

export const SurfaceRamp: StoryObj = {
  name: '2. Surface Ramp (Dark) — Canonical',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Surface Ramp (Dark Mode)</Text>
      <SectionIntro>
        The v0.10.0 surface foundation. Depth is an{' '}
        <Text className="font-semibold">ordered ramp</Text>, not a set of unrelated fills — planes
        are spaced by perceptual lightness (L*) on a diminishing taper, so &quot;one step up&quot;
        is the same visual distance anywhere in the stack. Listed darkest first. Several semantic
        tokens deliberately share a plane (shown per row); that aliasing is what lets a component
        say what it <Text className="italic">is</Text> rather than how deep it sits.
      </SectionIntro>

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
        Foundations/Elevation. The pre-ramp `charcoal` scale (story 13) is superseded by this ramp.
      </Text>
    </View>
  ),
}

// ============================================================================
// 3. Categorical palette
// ============================================================================

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
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: bestTextColor(color), fontSize: 12, fontWeight: '700' }}>
                {index + 1}
              </Text>
            </View>
            <Text className="text-text-secondary text-xs mt-1">{color.toUpperCase()}</Text>
            <Text className="text-text-tertiary" style={{ fontSize: 9 }}>
              {index < CATEGORICAL_CVD_SAFE_MAX ? 'CVD-safe' : 'extended'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export const CategoricalPalette: StoryObj = {
  name: '3. Categorical Palette',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Categorical Palette</Text>
      <SectionIntro>
        Seven hues in one canonical order —{' '}
        <Text className="font-semibold">blue → magenta → red → orange → green → cyan → amber</Text>{' '}
        — expressed as references into the tonal ramps above. The sequence is nested-stable: a
        chart with N series takes the first N colors and a series&apos; index does not shift as N
        changes. The worst-case deuteranopia/protanopia ΔE floor of 8 holds through the first{' '}
        {CATEGORICAL_CVD_SAFE_MAX} (
        <Text className="font-semibold">CATEGORICAL_CVD_SAFE_MAX</Text>); the 7th is extended and
        wants a legend or a second encoding. Two variants ship:{' '}
        <Text className="font-semibold">default</Text> (vivid, for neutral/light surfaces, legible
        under black text) and <Text className="font-semibold">dark</Text> (deeper, for white text
        on a filled swatch). A third &quot;light&quot; variant was dropped — `default` doubles as
        it.
      </SectionIntro>

      <CategoricalRow name="Default (black text)" colors={categoricalPalette.default} />
      <CategoricalRow name="Dark (white text)" colors={categoricalPalette.dark} />

      <Text className="text-text-secondary text-xs">
        Read a series color with{' '}
        <Text className="font-semibold text-text-primary">getCategoricalColor(index, variant)</Text>{' '}
        rather than indexing the array — it wraps past the end.
      </Text>
    </View>
  ),
}

// ============================================================================
// 4. Categorical accessibility
// ============================================================================

// --- color math (self-contained; drives the accessibility panel) ---
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
const contrast = (a: string, b: string) => {
  const [l1, l2] = [relLum(a), relLum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
// Machado-2009 dichromacy simulation (severity 1.0)
const CVD = {
  deuteranopia: [
    0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881,
  ],
  protanopia: [
    0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998,
  ],
} as const
const simulate = (M: readonly number[], hex: string) => {
  const [r, g, b] = hexToRgb(hex).map(lin)
  const out = [
    M[0] * r + M[1] * g + M[2] * b,
    M[3] * r + M[4] * g + M[5] * b,
    M[6] * r + M[7] * g + M[8] * b,
  ].map(gamma)
  return '#' + out.map(toHex).join('')
}

export const CategoricalAccessibility: StoryObj = {
  name: '4. Categorical Accessibility — Contrast + CVD',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Categorical Accessibility</Text>
      <SectionIntro>
        In-place text contrast and colorblind simulation for the categorical series. Converging
        strips across two swatches signal a collision for that viewer; all pairs hold ΔE ≥ 8
        through the first {CATEGORICAL_CVD_SAFE_MAX}.
      </SectionIntro>

      {(['default', 'dark'] as const).map((variant) => {
        const colors = categoricalPalette[variant]
        const textColor = variant === 'dark' ? primitiveColors.white : primitiveColors.black
        return (
          <View key={variant} style={{ marginBottom: 22 }}>
            <Text
              className="text-lg font-bold text-text-primary mb-2"
              style={{ textTransform: 'capitalize' }}
            >
              {variant}
            </Text>
            {/* swatches with in-place text + contrast ratio */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
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
            {/* CVD simulation strips */}
            {(['deuteranopia', 'protanopia'] as const).map((mode) => (
              <View key={mode} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                <Text className="text-text-secondary" style={{ fontSize: 9, width: 96 }}>
                  {mode}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {colors.map((hex, i) => (
                    <View
                      key={i}
                      style={{
                        width: 56,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: simulate(CVD[mode], hex),
                      }}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )
      })}
    </View>
  ),
}

// ============================================================================
// 5. Diverging scale
// ============================================================================

const DIVERGING_LABELS = ['under', 'maintenance', 'optimal', 'approaching', 'over'] as const

export const DivergingScale: StoryObj = {
  name: '5. Diverging Scale — Training Status',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Diverging Scale</Text>
      <SectionIntro>
        The BodyMap training-status scale (under → optimal → over), as ramp references. A true
        diverging shape — `optimal` is the lightest center and the extremes go darker — so the
        signal reads in <Text className="font-semibold">lightness</Text> (colorblind-robust,
        worst-case ΔE ≈ 10.9) and the direction reads on the blue↔red axis, the CVD-safe hue pair.
        Every stop clears 4.5:1 under black text, so there is no per-cell white/black flipping.
      </SectionIntro>

      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
        {DIVERGING_LABELS.map((label, i) => (
          <View
            key={label}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 6,
              backgroundColor: divergingScale[i],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{ color: bestTextColor(divergingScale[i]), fontSize: 11, fontWeight: '700' }}
            >
              {label}
            </Text>
            <Text style={{ color: bestTextColor(divergingScale[i]), fontSize: 9 }}>
              {divergingScale[i].toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  ),
}

// ============================================================================
// 6. Sequential effort scale
// ============================================================================

export const SequentialEffortScale: StoryObj = {
  name: '6. Sequential Effort Scale',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Sequential Effort Scale</Text>
      <SectionIntro>
        Ordinal low → high intensity (green → amber → orange → red), as ramp references.
        IntensityBar uses all six; VelocityStrip/RPE sub-samples it. Adjacent pairs clear a
        deut/protan ΔE ≥ 4.5 while the hue walk stays smooth — the amber-200 → amber-300 →
        orange-400 run steps the yellow→orange transition gradually rather than lurching. Order
        encodes magnitude, which is what lets it tolerate the green↔red CVD pair.
      </SectionIntro>

      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
        {sequentialEffort.map((hex, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 5,
              backgroundColor: hex,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: bestTextColor(hex), fontSize: 11, fontWeight: '700' }}>
              {i + 1}
            </Text>
            <Text style={{ color: bestTextColor(hex), fontSize: 9 }}>{hex.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <SectionTitle>Production 4-band sub-sample (VelocityStrip / RPE)</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Object.entries(WORKOUT_TOKENS.scale).map(([band, hex]) => (
          <View key={band} style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 78,
                height: 40,
                borderRadius: 5,
                backgroundColor: hex,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: bestTextColor(hex), fontSize: 10, fontWeight: '700' }}>
                {band}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  ),
}

// ============================================================================
// 7. Fatigue / ROM palette — silver → red
// ============================================================================

/**
 * Sourced from the SHIPPED `fatigue-tokens.ts` exports, not re-derived here: the
 * ROM chart and the ghost-spark line share one scheme, and a story that copied
 * the values would be free to drift from the components it documents.
 */
const FATIGUE_SWATCHES = [
  { name: 'SILVER — neutral[300]', value: SILVER, role: 'on-track / at-or-above working range' },
  { name: 'DRIFT_GREY — neutral[600]', value: DRIFT_GREY, role: 'controlled but drifting' },
  { name: 'RED_LIGHT — red[400]', value: RED_LIGHT, role: 'below working range' },
  { name: 'RED_MID — red[600]', value: RED_MID, role: 'collapsing' },
  { name: 'RED_DEEP — red[800]', value: RED_DEEP, role: 'below the short threshold' },
] as const

/** The real `ghostLineColor()` output sampled across the two control signals. */
const GHOST_CONTROLLED = [0, 0.25, 0.5, 0.75, 1].map((deviation) => ({
  label: `drift ${deviation.toFixed(2)}`,
  hex: ghostLineColor(deviation, 0),
}))
const GHOST_COLLAPSING = [0.35, 0.5, 0.65, 0.8, 1].map((grind) => ({
  label: `grind ${grind.toFixed(2)}`,
  hex: ghostLineColor(0, grind),
}))

function FatigueRampStrip({
  title,
  stops,
}: {
  title: string
  stops: Array<{ label: string; hex: string }>
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text className="text-text-secondary text-xs mb-2">{title}</Text>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {stops.map(({ label, hex }) => (
          <View key={label} style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 64,
                height: 40,
                borderRadius: 6,
                backgroundColor: hex,
                borderWidth: 1,
                borderColor: SWATCH_BORDER,
              }}
            />
            <Text className="text-text-tertiary" style={{ fontSize: 8, marginTop: 2 }}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export const FatigueRomPalette: StoryObj = {
  name: '7. Fatigue / ROM Palette — Silver → Red',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Fatigue / ROM Palette</Text>
      <SectionIntro>
        <Text className="font-semibold">
          Silver when the rep is right, shades of red when there is an issue.
        </Text>{' '}
        One scheme shared by the two live-quality readouts — the ROM progression bars and the
        ghost-spark current line. Deliberately no greens and no ambers: those languages belong to
        the verdict tones and the velocity-loss bands (stories 5 and 6), and reusing them here
        would make &quot;fine&quot; and &quot;fast&quot; look like the same claim. Every stop is a
        reference into the tonal ramps.
      </SectionIntro>

      <View style={{ gap: 14, marginBottom: 28 }}>
        {FATIGUE_SWATCHES.map(({ name, value, role }) => (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
              <Text className="text-text-secondary text-xs">
                {value.toUpperCase()} · {role}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <SectionTitle>ghostLineColor() — the shipped mix, sampled</SectionTitle>
      <Text className="text-text-secondary text-xs mb-3">
        A controlled rep (grind signature below GRIND_THRESHOLD ={' '}
        {GRIND_THRESHOLD}) stays in the silver family, dimming toward DRIFT_GREY with tempo
        deviation — a &quot;drifting but not failing&quot; cue that never becomes a color. At or
        above the threshold the line runs light → mid → deep by severity.
      </Text>
      <View style={{ flexDirection: 'row', gap: 32 }}>
        <FatigueRampStrip title="controlled — silver dimming toward drift" stops={GHOST_CONTROLLED} />
        <FatigueRampStrip title="collapsing — light → mid → deep" stops={GHOST_COLLAPSING} />
      </View>
    </View>
  ),
}

// ============================================================================
// 8–11. Semantic roles
// ============================================================================

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

export const StatusColors: StoryObj = {
  name: '8. Status Colors',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Status Colors</Text>
      <SectionIntro>
        Status roles and their modifiers. <Text className="font-semibold">status-error-vivid</Text>{' '}
        is a separate, higher-chroma role (not a modifier of status-error) reserved for
        destructive emphasis.
      </SectionIntro>
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

export const BrandColors: StoryObj = {
  name: '9. Brand Colors',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Brand Colors</Text>
      <SectionIntro>
        Each brand role and its modifiers. <Text className="font-semibold">hover</Text> and{' '}
        <Text className="font-semibold">active</Text> are interaction states —{' '}
        <Text className="font-semibold">subtle</Text> is a tint for fills behind text.
      </SectionIntro>
      <VariantMatrix bases={['brand-primary', 'brand-secondary']} palette={semanticColorsLight} />
    </View>
  ),
}

export const ResultColors: StoryObj = {
  name: '10. Result / Outcome Colors',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Result / Outcome Colors</Text>
      <SectionIntro>
        Colors for indicating positive, negative, or neutral outcomes. Distinct from status: these
        encode the <Text className="italic">direction of a change</Text> (did this get better?),
        not a system state.
      </SectionIntro>
      <VariantMatrix
        bases={['result-improve', 'result-degrade', 'result-inconclusive', 'result-neutral']}
        palette={semanticColorsLight}
      />
    </View>
  ),
}

export const TextAndBorderColors: StoryObj = {
  name: '11. Text & Border Colors (Dark)',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Text & Border Colors</Text>
      <SectionIntro>
        The dark-mode text and border roles. Prefer{' '}
        <Text className="font-semibold">useOnSurfaceColor</Text> for text sitting on a{' '}
        <Text className="font-semibold">&lt;Surface&gt;</Text> — it picks the right text role for
        the plane instead of hardcoding one.
      </SectionIntro>

      <SectionTitle>Text</SectionTitle>
      <View style={{ gap: 16, marginBottom: 28 }}>
        <ColorSwatch name="text-primary" value={semanticColorsDark['text-primary']} />
        <ColorSwatch name="text-secondary" value={semanticColorsDark['text-secondary']} />
        <ColorSwatch name="text-tertiary" value={semanticColorsDark['text-tertiary']} />
        <ColorSwatch name="text-disabled" value={semanticColorsDark['text-disabled']} />
        <ColorSwatch name="text-link" value={semanticColorsDark['text-link']} />
        <ColorSwatch name="text-link-hover" value={semanticColorsDark['text-link-hover']} />
        <ColorSwatch name="text-inverse" value={semanticColorsDark['text-inverse']} />
      </View>

      <SectionTitle>Border</SectionTitle>
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
        <ColorSwatch name="divider" value={semanticColorsDark['divider']} />
      </View>
    </View>
  ),
}

// ============================================================================
// 12. Component examples — the roles in use
// ============================================================================

// Sourced from the real semantic-token layer (not re-derived) so the story can't
// silently desync if semantic.ts changes. deload/spinner come from the same
// extracted-colors modules the components consume.
const SEM = {
  success: t['status-success'],
  warning: t['status-warning'],
  error: t['status-error'],
  info: t['status-info'],
  deload: WORKOUT_PILL_DELOAD,
  brand: t['brand-primary'],
  brandDark: t['brand-primary-dark'],
  brandSecondary: t['brand-secondary'],
  spinner: SPINNER_PRIMARY,
  neutral: primitiveColors.neutral[500],
} as const

export const ComponentExamples: StoryObj = {
  name: '12. Component Examples — Roles in Use',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Component Examples</Text>
      <SectionIntro>
        The same palettes as they land in shipped components — which scale a surface reaches for is
        as much of the system as the values themselves.
      </SectionIntro>

      <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* BodyMap muscle heatmap — training-status diverging */}
        <Demo label="BodyMap · training status (diverging)">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 132, gap: 4 }}>
            {(
              [
                ['Chest', 4],
                ['Quads', 2],
                ['Back', 3],
                ['Delts', 0],
                ['Biceps', 4],
                ['Calves', 1],
              ] as const
            ).map(([muscle, idx]) => (
              <View
                key={muscle}
                style={{
                  width: 40,
                  backgroundColor: divergingScale[idx],
                  borderRadius: 5,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: bestTextColor(divergingScale[idx]),
                    fontSize: 8,
                    fontWeight: '700',
                    textAlign: 'center',
                  }}
                >
                  {muscle}
                </Text>
              </View>
            ))}
          </View>
        </Demo>
        {/* StatusDot — semantic */}
        <Demo label="StatusDot · semantic">
          <View style={{ gap: 6 }}>
            {(
              [
                ['ok', SEM.success],
                ['warn', SEM.warning],
                ['err', SEM.error],
                ['info', SEM.info],
                ['neutral', SEM.neutral],
              ] as const
            ).map(([label, color]) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
                <Text className="text-text-secondary" style={{ fontSize: 11 }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </Demo>
        {/* WorkoutPill — status */}
        <Demo label="WorkoutPill · status">
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', maxWidth: 220 }}>
            {(
              [
                ['Done', SEM.success],
                ['Now', SEM.brand],
                ['Next', SEM.neutral],
                ['Deload', SEM.deload],
              ] as const
            ).map(([label, color]) => (
              <View
                key={label}
                style={{
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: color,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
              </View>
            ))}
          </View>
        </Demo>
        {/* StrengthTrend legend — series → semantic */}
        <Demo label="StrengthTrend · series">
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {(
              [
                ['1RM', SEM.brand],
                ['vel', SEM.success],
                ['miss', SEM.error],
                ['RPE', SEM.warning],
                ['alt', SEM.brandSecondary],
                ['prev', SEM.brandDark],
              ] as const
            ).map(([label, color]) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 14, height: 3, backgroundColor: color, borderRadius: 2 }} />
                <Text className="text-text-secondary" style={{ fontSize: 10 }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </Demo>
        {/* Treemap — ordered categorical */}
        <Demo label="Treemap · categorical">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 140, gap: 2 }}>
            {[46, 30, 30, 24, 24, 24, 20].map((h, i) => (
              <View
                key={i}
                style={{
                  height: h,
                  flexGrow: 1,
                  flexBasis: h > 40 ? 60 : 40,
                  backgroundColor: getCategoricalColor(i),
                  borderRadius: 3,
                }}
              />
            ))}
          </View>
        </Demo>
        {/* Spinner */}
        <Demo label="Spinner">
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 3,
              borderColor: SWATCH_BORDER,
              borderTopColor: SEM.spinner,
            }}
          />
        </Demo>
        {/* IntensityBar — full effort scale */}
        <Demo label="IntensityBar · effort">
          <View style={{ flexDirection: 'row', gap: 2, width: 132 }}>
            {sequentialEffort.map((hex, i) => (
              <View key={i} style={{ flex: 1, height: 20, backgroundColor: hex, borderRadius: 2 }} />
            ))}
          </View>
        </Demo>
        {/* ROM bars — the fatigue silver/red scheme */}
        <Demo label="RomProgressionChart · fatigue">
          <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 40 }}>
            {(
              [
                [34, SILVER],
                [32, SILVER],
                [33, SILVER],
                [26, RED_LIGHT],
                [22, RED_LIGHT],
                [14, RED_DEEP],
              ] as const
            ).map(([h, color], i) => (
              <View
                key={i}
                style={{ width: 14, height: h, backgroundColor: color, borderRadius: 2 }}
              />
            ))}
          </View>
        </Demo>
      </View>
    </View>
  ),
}

// ============================================================================
// 13–14. Legacy — superseded, kept only to document still-defined tokens
// ============================================================================

/**
 * LEGACY — superseded by {@link primitiveRamps} (chromatic) and
 * {@link surfaceRampDark} (achromatic dark planes).
 *
 * `primitiveColors.blue`/`red`/`redVivid` predate the OKLCH ramps and are NOT
 * the source of truth for any chromatic hex; `charcoal` predates the surface
 * ramp. `neutral` is the exception — it is still live (it backs `text-tertiary`,
 * several borders, and the fatigue palette's silver/drift pair) and is shown
 * here for that reason, not as legacy.
 */
export const LegacyPrimitives: StoryObj = {
  name: '13. Legacy Primitives',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Primitive Colors — Legacy</Text>
      <SectionIntro>
        <Text className="font-semibold">Superseded.</Text> These pre-date the OKLCH tonal ramps
        (story 1) and the surface ramp (story 2), which are the source of truth for chromatic
        hexes and dark planes respectively. Do not reach for them in new work —{' '}
        <Text className="font-semibold">blue-500 #3B82F6</Text> and{' '}
        <Text className="font-semibold">red-500 #EF4444</Text> in particular are the old
        Tailwind-derived values, not the shipped brand hues, and{' '}
        <Text className="font-semibold">charcoal</Text> is superseded by the surface ramp
        (components still referencing it directly are a tracked migration).{' '}
        <Text className="font-semibold">Neutral</Text> is the one live scale here: it backs
        text-tertiary, several borders, and the fatigue silver/drift pair.
      </SectionIntro>

      <ColorScale name="Neutral — still live" colors={primitiveColors.neutral} />
      <ColorScale name="Charcoal — superseded by the surface ramp" colors={primitiveColors.charcoal} />
      <ColorScale name="Blue — superseded by primitiveRamps.blue" colors={primitiveColors.blue} />
      <ColorScale name="Red — superseded by primitiveRamps.red" colors={primitiveColors.red} />
      <ColorScale
        name="Red Vivid — superseded by primitiveRamps.red"
        colors={primitiveColors.redVivid}
      />
    </View>
  ),
}

/**
 * LEGACY — superseded. The Paul-Tol `discreteRainbow` scale behind the `data-1..10`
 * tokens is no longer used by any component; charts and qualitative series now use
 * the {@link CategoricalPalette} (CVD-safe, nested-stable). Kept only to document the
 * still-defined `--color-data-N` tokens.
 */
export const LegacyDataVisualizationColors: StoryObj = {
  name: '14. Legacy Data Visualization (Rainbow)',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">
        Data Visualization Colors — Legacy
      </Text>
      <SectionIntro>
        <Text className="font-semibold">Superseded.</Text> Paul Tol&apos;s discrete-rainbow scale
        behind the `data-1..10` tokens — no longer used by any component. Use the Categorical
        Palette (story 3) for charts and qualitative series; this is retained only to document the
        still-defined tokens.
      </SectionIntro>

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
