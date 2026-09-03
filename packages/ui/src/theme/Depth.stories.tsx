import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { greyRamp } from './tokens/primitives'
import { getSemanticColors } from './tokens/semantic'
import {
  getElevationSurface,
  getElevationShadow,
  getBaseSurfaceColor,
  FLOATING_ELEVATION_MIN,
  type ElevationLevel,
} from './elevation'
import { paperSheet, insetWell, barPaper } from './materials'
import { SectionIntro, SectionTitle } from './color-story-kit'

const t = getSemanticColors('dark')

/**
 * Foundations/Depth — how a surface says how far away it is.
 *
 * There are exactly three mechanisms, and which one applies is not a taste call:
 *
 *   TONE      how deep a plane sits          — the grey ramp
 *   HAIRLINE  where one plane ends           — alpha, self-normalising
 *   MATERIAL  what a plane is made of        — paper, well
 *
 * Drop-shadow is deliberately not on that list for anything inline. This page
 * exists because the system previously had a fourth mechanism — a neumorphic
 * dual-opposing shadow — that could not work here and was removed in TD-07.16.
 */
const meta: Meta = {
  title: 'Foundations/Depth',
  tags: ['autodocs'],
}
export default meta

const CONTENT_LEVELS: ElevationLevel[] = [0, 1, 2, 3]
const FLOATING_LEVELS: ElevationLevel[] = [4, 5]
const base = getBaseSurfaceColor('dark')

function Swatch({
  label,
  note,
  style,
}: {
  label: string
  note: string
  style: Record<string, unknown>
}) {
  return (
    <View style={{ width: 190 }}>
      <View
        style={{
          height: 92,
          borderRadius: 10,
          padding: 10,
          justifyContent: 'flex-end',
          ...style,
        }}
      >
        <Text className="text-text-primary" style={{ fontSize: 12, fontWeight: '600' }}>
          {label}
        </Text>
      </View>
      <Text className="text-text-tertiary" style={{ fontSize: 9, marginTop: 4, lineHeight: 13 }}>
        {note}
      </Text>
    </View>
  )
}

export const Mechanisms: StoryObj = {
  name: '1. The three mechanisms',
  render: () => (
    <View style={{ padding: 24, backgroundColor: greyRamp[975] }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Depth</Text>
      <SectionIntro>
        Three mechanisms, in the order you should reach for them. A surface that needs to read as
        deeper takes a TONE; one that needs an edge takes a HAIRLINE; one that needs to feel
        physical takes a MATERIAL. Drop-shadow is not on the list for anything that is not floating
        — see section 3 for why.
      </SectionIntro>

      <SectionTitle>Tone — the grey ramp</SectionTitle>
      <Text className="text-text-secondary text-xs mb-3">
        The primary cue and the only one that works identically on web and native. Every plane is a
        ramp step.
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
        {[975, 950, 925, 900, 875, 850].map((step) => (
          <Swatch
            key={step}
            label={`grey-${step}`}
            note=""
            style={{ backgroundColor: greyRamp[step as keyof typeof greyRamp] }}
          />
        ))}
      </View>

      <SectionTitle>Hairline — where a plane ends</SectionTitle>
      <Text className="text-text-secondary text-xs mb-3">
        Alpha-white, so it composites toward white by the same amount on any background and holds a
        near-constant ΔL* wherever it lands. A solid border swings wildly across the ramp; this does
        not. It is the default separator, and it is what replaced the solid dark border tokens.
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
        {(['hairline-subtle', 'hairline-default', 'hairline-strong'] as const).map((token) => (
          <Swatch
            key={token}
            label={token.replace('hairline-', '')}
            note={t[token]}
            style={{
              backgroundColor: greyRamp[925],
              borderWidth: 1,
              borderColor: t[token],
            }}
          />
        ))}
      </View>

      <SectionTitle>Material — what a plane is made of</SectionTitle>
      <Text className="text-text-secondary text-xs mb-3">
        Used sparingly. Paper is for HERO surfaces only and takes muted tones only — vivid colour is
        ink ON paper, never the paper itself. There are no levels of paper; one treatment, or the
        texture stops meaning anything.
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
        <Swatch
          label="paperSheet"
          note="tonal fill (ΔL* ≤ 3) + grain + dither + rim + contact shadow. Hero surfaces."
          style={paperSheet(greyRamp[875]) as Record<string, unknown>}
        />
        <Swatch
          label="insetWell"
          note="inner top cut + a light line on the floor. The floor rim is the half that says 'below'."
          style={insetWell(greyRamp[950]) as Record<string, unknown>}
        />
        <Swatch
          label="barPaper"
          note="the same grain curve, tuned for a small saturated element."
          style={{
            ...(barPaper(t['status-info']) as Record<string, unknown>),
            backgroundColor: t['status-info'],
          }}
        />
      </View>
      <Text className="text-text-tertiary text-xs">
        Materials are web/RNW only — `backgroundImage` and multi-layer `boxShadow` are ignored on
        native. Every material keeps a solid `backgroundColor` underneath so a surface never depends
        on one, and a material must never be the only thing carrying meaning.
      </Text>
    </View>
  ),
}

export const Elevation: StoryObj = {
  name: '2. Elevation — tone below, shadow only when floating',
  render: () => (
    <View style={{ padding: 24, backgroundColor: greyRamp[975] }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Elevation</Text>
      <SectionIntro>
        Levels 0–3 are separated by TONE ALONE. They cast no shadow, because a dark-on-dark drop
        shadow is inert — it costs a composite layer and shows nothing. From{' '}
        <Text className="font-semibold">{FLOATING_ELEVATION_MIN}</Text> up the element is genuinely
        floating over a backdrop, where a large soft shadow describes separation rather than rank,
        and there the shadow returns.
      </SectionIntro>

      <SectionTitle>Content levels — tone only</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
        {CONTENT_LEVELS.map((lv) => (
          <Swatch
            key={lv}
            label={`elevation ${lv}`}
            note={`${getElevationSurface(base, lv, 'dark')} · no shadow`}
            style={{
              backgroundColor: getElevationSurface(base, lv, 'dark'),
              borderWidth: 1,
              borderColor: t['hairline-default'],
              ...(getElevationShadow(base, lv, 'dark') as Record<string, unknown>),
            }}
          />
        ))}
      </View>

      <SectionTitle>Floating levels — shadow returns, always with a ring</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 24, marginBottom: 8 }}>
        {FLOATING_LEVELS.map((lv) => (
          <Swatch
            key={lv}
            label={`elevation ${lv}`}
            note={`${getElevationSurface(base, lv, 'dark')} · casts a shadow`}
            style={{
              backgroundColor: getElevationSurface(base, lv, 'dark'),
              borderWidth: 1,
              borderColor: t['hairline-strong'],
              ...(getElevationShadow(base, lv, 'dark') as Record<string, unknown>),
            }}
          />
        ))}
      </View>
      <Text className="text-text-tertiary text-xs">
        A floating surface should carry a hairline ring as well as its shadow — the shadow places it
        above the page, the ring gives it an edge that survives on a panel where the shadow is
        washed out by glare.
      </Text>
    </View>
  ),
}

export const WhyNotNeumorphism: StoryObj = {
  name: '3. Why not neumorphism',
  render: () => (
    <View style={{ padding: 24, backgroundColor: greyRamp[975] }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Why not neumorphism</Text>
      <SectionIntro>
        The system used to ship a neumorphic builder — a dark shadow bottom-right paired with a
        light rim top-left. It was removed rather than retuned, and the reason is a lightness budget
        rather than a preference, so it is worth being able to see.
      </SectionIntro>

      <Text className="text-text-secondary text-xs mb-4">
        Neumorphism needs a MID-TONE ground (roughly 75–90% lightness) so the dark half has
        somewhere to fall and the light half has somewhere to rise. Our surfaces sit near 10%. Below
        them there is almost nothing left — so the dark half disappears and the treatment collapses
        to a one-sided rim, which reads as a smudge rather than as depth.
      </Text>

      <View style={{ flexDirection: 'row', gap: 24 }}>
        <View>
          <Text className="text-text-secondary text-xs mb-2">
            On a mid-tone ground — both halves have room
          </Text>
          <View
            style={{
              backgroundColor: greyRamp[300],
              padding: 26,
              borderRadius: 12,
              flexDirection: 'row',
              gap: 16,
            }}
          >
            <View
              style={
                {
                  width: 110,
                  height: 66,
                  borderRadius: 10,
                  backgroundColor: greyRamp[300],
                  boxShadow: '3px 3px 6px rgba(0,0,0,0.35), -3px -3px 6px rgba(255,255,255,0.55)',
                } as Record<string, unknown>
              }
            />
          </View>
        </View>

        <View>
          <Text className="text-text-secondary text-xs mb-2">
            On our ground — the dark half has nowhere to go
          </Text>
          <View
            style={{
              backgroundColor: greyRamp[925],
              padding: 26,
              borderRadius: 12,
              flexDirection: 'row',
              gap: 16,
            }}
          >
            <View
              style={
                {
                  width: 110,
                  height: 66,
                  borderRadius: 10,
                  backgroundColor: greyRamp[925],
                  boxShadow: '3px 3px 6px rgba(0,0,0,0.35), -3px -3px 6px rgba(255,255,255,0.12)',
                } as Record<string, unknown>
              }
            />
          </View>
        </View>

        <View>
          <Text className="text-text-secondary text-xs mb-2">What we do instead</Text>
          <View
            style={{
              backgroundColor: greyRamp[925],
              padding: 26,
              borderRadius: 12,
              flexDirection: 'row',
              gap: 16,
            }}
          >
            <View
              style={{
                width: 110,
                height: 66,
                borderRadius: 10,
                backgroundColor: greyRamp[900],
                borderWidth: 1,
                borderColor: t['hairline-default'],
              }}
            />
          </View>
        </View>
      </View>

      <Text className="text-text-tertiary text-xs mt-4">
        Same treatment, same offsets, different ground. The middle panel is the one that shipped.
        The right panel is one tone step plus a hairline — cheaper, and it survives glare.
      </Text>
    </View>
  ),
}
