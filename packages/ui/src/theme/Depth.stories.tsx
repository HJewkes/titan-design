import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { greyRamp } from './tokens/primitives'
import { getSemanticColors } from './tokens/semantic'
import {
  ELEVATION_PLANE,
  FLOATING_ELEVATION_MIN,
  getElevationSurface,
  getElevationShadow,
  type ElevationLevel,
} from './elevation'
import { liftStyle, LIFT_RIM_ALPHA } from './lift'
import { paperSheet, insetWell, barPaper } from './materials'
import { useSurfaceMode } from './surface-context'
import { PLANE_ORDER, surfaceBackground, type SurfaceLevel } from './surface-planes'
import { StoryPage, StorySpecimen, StorySpecimens } from '../lab/story-canvas'

/**
 * The toolbar theme, read from the canvas's SurfaceContext. Specimens sit on a page that
 * follows the theme, so they resolve their planes, lift and hairlines in the same mode;
 * a literal `'dark'` here painted dark specimens inside the light page.
 */
function useDepthTheme() {
  const mode = useSurfaceMode()
  return {
    mode,
    t: getSemanticColors(mode),
    plane: (level: SurfaceLevel) => surfaceBackground(level, mode),
  }
}

/**
 * Foundations/Depth — how a surface says how far away it is.
 *
 * Four mechanisms, and which one applies is not a taste call:
 *
 *   TONE      which plane a surface sits on       — the grey ramp
 *   LIFT      that it rests ON the plane below    — rim-light + ambient shadow
 *   HAIRLINE  where one plane ends                — alpha, self-normalising
 *   MATERIAL  what a plane is made of             — paper, well
 *
 * Tone and lift travel together: every lifted plane wears both. This page
 * previously taught that levels 0–3 separate by tone alone and that drop-shadow
 * belongs to floating overlays only (TD-07.16). That was reversed on 2026-09-08:
 * the upper ramp steps are ΔL* 2.5–3 apart, too tight for tone to carry the
 * separation on its own, and a soft ambient shadow is not inert on a dark plane
 * once a rim-light gives the edge something to fall from.
 */
const meta: Meta = {
  title: 'Foundations/Depth',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}
export default meta

const CONTENT_LEVELS: ElevationLevel[] = [0, 1, 2, 3]
const FLOATING_LEVELS: ElevationLevel[] = [4, 5]

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
      <Text className="text-text-tertiary" style={{ fontSize: 10, marginTop: 4, lineHeight: 14 }}>
        {note}
      </Text>
    </View>
  )
}

/** The page the app draws: the `base` plane, the page gutter, sections `section-sm` apart. */
function DepthPage({
  title,
  intro,
  children,
}: {
  title: string
  intro: ReactNode
  children: ReactNode
}) {
  return (
    <StoryPage
      header={
        <View className="gap-stack-md">
          <Text className="text-2xl font-bold text-text-primary">{title}</Text>
          {intro}
        </View>
      }
    >
      <StorySpecimens>{children}</StorySpecimens>
    </StoryPage>
  )
}

function DepthSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <StorySpecimen
      className="gap-stack-md"
      label={<Text className="text-lg font-bold text-text-primary">{title}</Text>}
    >
      {children}
    </StorySpecimen>
  )
}

function Intro({ children }: { children: ReactNode }) {
  return <Text className="text-text-secondary">{children}</Text>
}

function Note({ children }: { children: ReactNode }) {
  return <Text className="text-text-secondary text-xs">{children}</Text>
}

export const Mechanisms: StoryObj = {
  name: '1. The four mechanisms',
  render: function Render() {
    const { mode, t, plane } = useDepthTheme()
    return (
      <DepthPage
        title="Depth"
        intro={
          <Intro>
            Four mechanisms, in the order you should reach for them. A surface that sits higher
            takes a TONE and, with it, a LIFT; one that only needs an edge takes a HAIRLINE; one
            that needs to feel physical takes a MATERIAL. Tone is the only cue that works
            identically on web and native, so it is never optional; the others sit on top of it.
          </Intro>
        }
      >
        <DepthSection title="Tone — the grey ramp">
          <Note>
            Every plane is a ramp step. Nothing derives a colour between two steps: the elevation
            levels in section 2 index this list, they do not lighten a base.
          </Note>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {PLANE_ORDER.map((level) => (
              <Swatch key={level} label={level} note="" style={{ backgroundColor: plane(level) }} />
            ))}
          </View>
        </DepthSection>

        <DepthSection title="Lift — resting on the plane below">
          <Note>
            A crisp 1px top rim-light at {LIFT_RIM_ALPHA[mode]} in this theme (in dark, one grade
            under paperSheet&apos;s 0.20 hero rim, chosen side by side in Lab/Depth) plus a soft
            ambient shadow that grows with the planes crossed. Both are lit from above. This is what
            separates a card from the page when the tone step alone is ΔL* 3. It is not a hairline
            ring: a ring is an edge, and stays the divider&apos;s job.
          </Note>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Swatch
              label="tone only"
              note="raised on base: the step is there, but the card is not resting on anything."
              style={{ backgroundColor: plane('raised') }}
            />
            <Swatch
              label="tone + rim"
              note="the rim gives the top edge a lit lip."
              style={{
                backgroundColor: plane('raised'),
                boxShadow: `inset 0 1px 0 rgba(255,255,255,${LIFT_RIM_ALPHA[mode]})`,
              }}
            />
            <Swatch
              label="tone + rim + shadow"
              note="the default for any lifted plane: liftStyle(2)."
              style={{
                backgroundColor: plane('raised'),
                ...(liftStyle(2, mode) as Record<string, unknown>),
              }}
            />
          </View>
        </DepthSection>

        <DepthSection title="Hairline — where a plane ends">
          <Note>
            Alpha-white, so it composites toward white by the same amount on any background and
            holds a near-constant ΔL* wherever it lands. It is the divider, the table rule, and the
            opt-in edge of an `outline` card. It is not the default edge of a lifted card.
          </Note>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {(['hairline-subtle', 'hairline-default', 'hairline-strong'] as const).map((token) => (
              <Swatch
                key={token}
                label={token.replace('hairline-', '')}
                note={t[token]}
                style={{
                  backgroundColor: plane('base'),
                  borderWidth: 1,
                  borderColor: t[token],
                }}
              />
            ))}
          </View>
        </DepthSection>

        <DepthSection title="Material — what a plane is made of">
          <Note>
            Used sparingly. Paper is for HERO surfaces only and takes muted tones only; vivid colour
            is ink ON paper, never the paper itself. There are no levels of paper. The lift above is
            paper&apos;s rim and contact shadow without the grain: the same light, one grade
            quieter.
          </Note>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Swatch
              label="paperSheet"
              note="grain + rim + contact shadow. Hero surfaces."
              style={paperSheet(plane('raised'), mode) as Record<string, unknown>}
            />
            <Swatch
              label="insetWell"
              note="inner top cut + a light line on the floor. Also the recess of every pressed surface."
              style={insetWell(plane('background'), mode) as Record<string, unknown>}
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
            Lift and materials are web/RNW only — `backgroundImage` and multi-layer `boxShadow` are
            ignored on native, which gets one shadow. Every treatment keeps a solid
            `backgroundColor` underneath, so a surface never depends on one, and a treatment is
            never the only thing carrying meaning.
          </Text>
        </DepthSection>
      </DepthPage>
    )
  },
}

export const Elevation: StoryObj = {
  name: '2. Elevation — planes on the ramp, lifted',
  render: function Render() {
    const { mode, t } = useDepthTheme()
    return (
      <DepthPage
        title="Elevation"
        intro={
          <>
            <Intro>
              A level is a ramp plane plus the lift that plane wears. Level 0 is the page. Levels
              1–3 climb one plane each and lift; from {FLOATING_ELEVATION_MIN} up the element is
              floating over a backdrop, so it stays on the overlay plane and the shadow does the
              separating. In a component the numbers are RELATIVE to the enclosing Surface, clamped
              at overlay, so a card inside a card cannot leave the ramp.
            </Intro>
            <Note>
              Lift sparingly, and only over something much larger. A card lifts off the page; a
              small card lifted off a small card reads as clutter, not depth. Inside a lifted
              surface, organise with an inset well (`CardInset`, `Surface pressed`), a tone-only
              `filled` tile, or a hairline divider, and save a second lift for a surface that
              genuinely floats over the first.
            </Note>
          </>
        }
      >
        <DepthSection title="Content levels — tone + lift">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {CONTENT_LEVELS.map((lv) => (
              <Swatch
                key={lv}
                label={`elevation ${lv}`}
                note={`${ELEVATION_PLANE[lv]} · ${getElevationSurface(lv, mode)}${lv > 0 ? ` · liftStyle(${lv})` : ' · the page'}`}
                // Level 0 IS the page, so a solid swatch on the page would be an
                // invisible rectangle. A dashed outline gives the row a fourth slot
                // and says why it has nothing to draw.
                style={
                  lv === 0
                    ? {
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: t['hairline-default'],
                      }
                    : {
                        backgroundColor: getElevationSurface(lv, mode),
                        ...(getElevationShadow(lv, mode) as Record<string, unknown>),
                      }
                }
              />
            ))}
          </View>
        </DepthSection>

        <DepthSection title="Floating levels — overlay plane, larger shadow, no ring">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
            {FLOATING_LEVELS.map((lv) => (
              <Swatch
                key={lv}
                label={`elevation ${lv}`}
                note={`${ELEVATION_PLANE[lv]} · ${getElevationSurface(lv, mode)} · three ambient layers`}
                style={{
                  backgroundColor: getElevationSurface(lv, mode),
                  ...(getElevationShadow(lv, mode) as Record<string, unknown>),
                }}
              />
            ))}
          </View>
          <Text className="text-text-tertiary text-xs">
            A floating surface carries the same rim as a card, not a hairline ring. The rim is the
            edge that survives glare; a ring on top of it would be a second edge saying the same
            thing.
          </Text>
        </DepthSection>

        <DepthSection title="Recessed levels — one and two planes down">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {([-1, -2] as ElevationLevel[]).map((lv) => (
              <Swatch
                key={lv}
                label={`elevation ${lv}`}
                note={`${ELEVATION_PLANE[lv]} · ${getElevationSurface(lv, mode)} · insetWell recess`}
                style={{
                  backgroundColor: getElevationSurface(lv, mode),
                  ...(getElevationShadow(lv, mode) as Record<string, unknown>),
                }}
              />
            ))}
          </View>
        </DepthSection>
      </DepthPage>
    )
  },
}

export const WhyNotNeumorphism: StoryObj = {
  name: '3. Why not neumorphism',
  render: () => (
    <DepthPage
      title="Why not neumorphism"
      intro={
        <>
          <Intro>
            The system used to ship a neumorphic builder — a dark shadow bottom-right paired with a
            light rim top-left. It was removed rather than retuned, and the reason is a lightness
            budget rather than a preference, so it is worth being able to see.
          </Intro>
          <Note>
            Neumorphism needs a MID-TONE ground (roughly 75–90% lightness) so the dark half has
            somewhere to fall and the light half has somewhere to rise. Our surfaces sit near 10%.
            Below them there is almost nothing left — so the dark half disappears and the treatment
            collapses to a one-sided rim, which reads as a smudge rather than as depth. The lift
            keeps the one half that works (the top rim) and moves the shadow to where there IS room:
            straight down, onto the plane below.
          </Note>
        </>
      }
    >
      <StorySpecimens direction="row">
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
                backgroundColor: greyRamp[875],
                ...(liftStyle(2, 'dark') as Record<string, unknown>),
              }}
            />
          </View>
        </View>
      </StorySpecimens>

      <Text className="text-text-tertiary text-xs">
        Same treatment, same offsets, different ground. The middle panel is the one that shipped.
        The right panel is two ramp steps plus the lift: the rim from above, the shadow below.
      </Text>
    </DepthPage>
  ),
}
