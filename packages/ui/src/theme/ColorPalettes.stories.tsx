import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  primitiveColors,
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
import { semanticColorsLight, semanticColorsDark } from './tokens/semantic'
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
import { SWATCH_BORDER, SectionIntro, SectionTitle, ColorSwatch, Demo } from './color-story-kit'

/**
 * Foundations/Color/Palettes — the organisations of the primitives into meaning.
 *
 * The raw scales and their accessibility validation live in the sibling
 * `Foundations/Color/Primitives`. Everything here is an ASSIGNMENT: a depth
 * ladder, a qualitative series, an ordered magnitude scale, a semantic role.
 * Ordered so the assignments that the most surfaces depend on come first.
 *
 * `color-stories.coverage.test.ts` reads this file as text (together with the
 * Primitives story) and fails if a semantic token ships without a swatch, or
 * if a surface token lands off the ramp.
 */
const meta: Meta = {
  title: 'Foundations/Color/Palettes',
  tags: ['autodocs'],
}

export default meta

// ============================================================================
// 1. Surface ramp
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
  name: '1. Surface Ramp (Dark)',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Surface Ramp (Dark Mode)</Text>
      <SectionIntro>
        The v0.10.0 surface foundation, and the assignment the most surfaces depend on. Depth is
        an <Text className="font-semibold">ordered ramp</Text>, not a set of unrelated fills —
        planes are spaced by perceptual lightness (L*) on a diminishing taper, so &quot;one step
        up&quot; is the same visual distance anywhere in the stack. Listed darkest first. Several
        semantic tokens deliberately share a plane (shown per row); that aliasing is what lets a
        component say what it <Text className="italic">is</Text> rather than how deep it sits.
      </SectionIntro>

      <View style={{ gap: 14 }}>
        {SURFACE_PLANES.map((plane) => (
          <SurfacePlaneRow key={plane.hex} {...plane} />
        ))}
      </View>

      <Text className="text-text-secondary text-xs mt-8">
        This ramp is derived, not hand-picked, which is why it sits here rather than with the raw
        scales — the greys it is built from are in Foundations/Color/Primitives. To apply it at
        runtime use <Text className="font-semibold text-text-primary">&lt;Surface level&gt;</Text>{' '}
        and <Text className="font-semibold text-text-primary">useOnSurfaceColor</Text> rather than
        reading tokens directly — see Components/Atoms/Surface. Shadow and glow treatments layered
        on top of these planes are in Foundations/Shadows; the legacy numeric elevation scale is
        in Foundations/Elevation.
      </Text>
    </View>
  ),
}

// ============================================================================
// 2. Categorical palette
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
  name: '2. Categorical Palette',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Categorical Palette</Text>
      <SectionIntro>
        Seven hues in one canonical order —{' '}
        <Text className="font-semibold">blue → magenta → red → orange → green → cyan → amber</Text>{' '}
        — expressed as references into the tonal ramps. The sequence is nested-stable: a chart
        with N series takes the first N colors and a series&apos; index does not shift as N
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
        rather than indexing the array — it wraps past the end. The contrast and colorblind
        validation for this palette is in Foundations/Color/Primitives → Accessibility.
      </Text>
    </View>
  ),
}

// ============================================================================
// 3. Diverging scale
// ============================================================================

const DIVERGING_LABELS = ['under', 'maintenance', 'optimal', 'approaching', 'over'] as const

export const DivergingScale: StoryObj = {
  name: '3. Diverging Scale — Training Status',
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
// 4. Sequential effort scale
// ============================================================================

export const SequentialEffortScale: StoryObj = {
  name: '4. Sequential Effort Scale',
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
// 5. Fatigue / ROM palette — silver → red
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
  name: '5. Fatigue / ROM Palette — Silver → Red',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Fatigue / ROM Palette</Text>
      <SectionIntro>
        <Text className="font-semibold">
          Silver when the rep is right, shades of red when there is an issue.
        </Text>{' '}
        One scheme shared by the two live-quality readouts — the ROM progression bars and the
        ghost-spark current line. Deliberately no greens and no ambers: those languages belong to
        the verdict tones and the velocity-loss bands (stories 3 and 4), and reusing them here
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
        A controlled rep (grind signature below GRIND_THRESHOLD = {GRIND_THRESHOLD}) stays in the
        silver family, dimming toward DRIFT_GREY with tempo deviation — a &quot;drifting but not
        failing&quot; cue that never becomes a color. At or above the threshold the line runs
        light → mid → deep by severity.
      </Text>
      <View style={{ flexDirection: 'row', gap: 32 }}>
        <FatigueRampStrip
          title="controlled — silver dimming toward drift"
          stops={GHOST_CONTROLLED}
        />
        <FatigueRampStrip title="collapsing — light → mid → deep" stops={GHOST_COLLAPSING} />
      </View>

      <Text className="text-text-secondary text-xs mt-8">
        <Text className="font-semibold text-text-primary">Open question (TD-07.14):</Text>{' '}
        DRIFT_GREY is `neutral[600]` #4B5563, and the unified warm grey ramp assigns it no
        destination — the 15-row fold maps the other greys but skips this one. It needs an
        assignment before that migration lands. Note that the recovered spec records DRIFT_GREY as
        `charcoal[500]` #1C1C1C; that is stale, `fatigue-tokens.ts` on main reads `neutral[600]`,
        which puts it in the expensive half of the fold rather than the cheap one.
      </Text>
    </View>
  ),
}

// ============================================================================
// 6–9. Semantic roles
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
  name: '6. Status Colors',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Status Colors</Text>
      <SectionIntro>
        Status roles and their modifiers. <Text className="font-semibold">status-error-vivid</Text>{' '}
        is a separate, higher-chroma role (not a modifier of status-error) reserved for
        destructive emphasis. It is the one status family still sourced from the redVivid support
        scale rather than the OKLCH ramps, and it is on its way out: under TD-07.14 redVivid
        retires, status-error-vivid collapses onto status-error&apos;s red[600], and the
        Indicator&apos;s emphasis moves to a glow derived from red[500].
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
  name: '7. Brand Colors',
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
  name: '8. Result / Outcome Colors',
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
  name: '9. Text & Border Colors (Dark)',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Text & Border Colors</Text>
      <SectionIntro>
        The dark-mode text and border roles. Today the border family is the charcoal grey ramp
        assigned to line-work, and text-tertiary and the link colors come from the neutral and
        blue support scales — all three of which are pending migration (TD-07.14): the greys fold
        into one warm grey ramp and the links move to the OKLCH blue. These are the roles that
        will move most, because the mid-grey text steps shift furthest. Prefer{' '}
        <Text className="font-semibold">useOnSurfaceColor</Text> for text sitting on a{' '}
        <Text className="font-semibold">&lt;Surface&gt;</Text> — it picks the right text role for
        the plane instead of hardcoding one, which is also what makes the migration survivable.
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
// 10. Roles in use
// ============================================================================

// Sourced from the real semantic-token layer (not re-derived) so the story can't
// silently desync if semantic.ts changes. deload/spinner come from the same
// extracted-colors modules the components consume.
const SEM = {
  success: semanticColorsDark['status-success'],
  warning: semanticColorsDark['status-warning'],
  error: semanticColorsDark['status-error'],
  info: semanticColorsDark['status-info'],
  deload: WORKOUT_PILL_DELOAD,
  brand: semanticColorsDark['brand-primary'],
  brandDark: semanticColorsDark['brand-primary-dark'],
  brandSecondary: semanticColorsDark['brand-secondary'],
  spinner: SPINNER_PRIMARY,
  neutral: primitiveColors.neutral[500],
} as const

export const RolesInUse: StoryObj = {
  name: '10. Roles in Use — Component Examples',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Roles in Use</Text>
      <SectionIntro>
        The same palettes as they land in shipped components — which palette a surface reaches for
        is as much of the system as the values themselves.
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
// 11. Data-viz rainbow — superseded assignment, tokens still defined
// ============================================================================

/**
 * SUPERSEDED ASSIGNMENT — kept because the `data-1..10` semantic tokens are
 * still defined and still emit `--color-data-N` CSS vars, and an undocumented
 * shipped token is exactly what `color-stories.coverage.test.ts` exists to
 * prevent. This is not a legacy PRIMITIVE shelf — it is a live token family
 * whose assignment has been replaced by {@link CategoricalPalette} for all new
 * work. Retiring the `data-N` tokens would let this story go.
 */
export const LegacyDataVisualizationColors: StoryObj = {
  name: '11. Data Visualization (Superseded)',
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">
        Data Visualization — Superseded
      </Text>
      <SectionIntro>
        <Text className="font-semibold">Do not use for new work.</Text> Paul Tol&apos;s
        discrete-rainbow scale behind the `data-1..10` tokens — no longer consumed by any
        component. Use the Categorical Palette (story 2) for charts and qualitative series. This
        story exists because the tokens are still shipped, and a shipped token without a swatch is
        the drift the coverage test guards against; it goes away when the tokens do.
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
