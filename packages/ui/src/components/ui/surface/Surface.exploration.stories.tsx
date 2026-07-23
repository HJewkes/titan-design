import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  TEXT,
  categoricalPalette,
  primitiveRamps,
  shift,
  PAPER,
  paperFill,
  DESK_BG,
  PaperSheet,
  PaperSwatchRow,
  deriveSurfaceRamp,
} from './surface-lab-shared'

// ===========================================================================
// NORTH STAR · SURFACE SYSTEM — the LOCKED final direction. See
// `coordination/design-explorations/surface-system-north-star.md` for the full
// rationale. Locked decisions:
//   • Base ramp = warm TAPERED, DERIVED (not hand-picked): deriveSurfaceRamp
//     (shellL*=9, steps=[4.5,2.5,2,1.5], warmth R−B 6→1.5) → inset #13100D /
//     shell #1C1916 / base #252321 / elevated #2A2827 / raised #2D2C2B /
//     overlay #302F2E. See `SurfaceRampSystem` below.
//   • Separation = alpha-white hairline (.06/.09/.14); shadows demoted to
//     floating overlays (not per-plane rims).
//   • Texture = static dither ~.02α + grain ≤.04α, one feTurbulence tile,
//     paint-once (never animated).
//   • Paper = accent treatment on HERO surfaces ONLY, categorical `dark`
//     variant + brand orange (`-600 #B94A00` on paper / `-400 #FF7900` text).
//     See `LayeredPaper` + `PaperWithBrand` below.
//
// Option-COMPARISON stories that led to these decisions have moved to
// `Surface.archive.stories.tsx` (Lab/Archive/Surface): Ramps, SeparationTreatments,
// TextureOptions, NeutralVsWarm, WarmthCurves, AtScaleComparison, AlphaLayering,
// SkeuomorphicCard, WarmthCurvesAtScale, PaperModels, TopBarTreatments, FrameRecess.
//
// This story file now holds ONLY the three locked North Star §1 stories:
// SurfaceRampSystem (the derivation), LayeredPaper, PaperWithBrand.
// ===========================================================================

const meta: Meta = {
  title: 'Lab/North Star/1 · Surface System',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

// THE derived ramp — the one formula the shipped tokens come from. Base = warm
// tapered, DERIVED (not hand-picked): shellL*=9, diminishing steps [4.5,2.5,2,1.5],
// warmth R−B tapered 6→1.5.
export const SurfaceRampSystem: Story = {
  render: () => {
    const planes = deriveSurfaceRamp() // shipped: shellL*=9, diminishing steps [4.5,2.5,2,1.5]
    return (
      <View style={{ backgroundColor: '#000', padding: 32, gap: 16 }}>
        <Text style={{ color: TEXT.primary, fontSize: 14, fontWeight: '700' }}>
          Surface ramp — shell L*9, DIMINISHING steps 4.5·2.5·2·1.5, warmth tapered 6 → 1.5
        </Text>
        <Text style={{ color: TEXT.tertiary, fontSize: 11, maxWidth: 660 }}>
          Compressed span (L*9→19.5, like Apple's 3-level backgrounds) with diminishing steps
          (like Material's overlay elevation) — the frame→content jump is biggest, upper planes
          converge and lean on the hairline + shadow + paper for separation (§4), not lightness.
          Shell leaves darkening headroom; the inset sits BELOW it (sub-shell band for wells + shadows).
        </Text>
        {planes.map((p, i) => {
          const dL = i === 0 ? null : p.L - planes[i - 1].L
          const ink = p.L > 42 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)'
          const sub = p.L > 42 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'
          return (
            <View
              key={p.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                backgroundColor: p.hex,
                borderRadius: 8,
                paddingVertical: 14,
                paddingHorizontal: 18,
                borderWidth: p.name === 'inset' ? 1 : 0,
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <Text style={{ color: ink, fontSize: 14, fontWeight: '700', width: 120 }}>
                {p.name}
              </Text>
              <Text style={{ color: sub, fontSize: 11, width: 160 }}>{p.role}</Text>
              <Text style={{ color: ink, fontSize: 12, fontWeight: '600', width: 90 }}>
                {p.hex.toUpperCase()}
              </Text>
              <Text style={{ color: sub, fontSize: 11, width: 70 }}>L* {p.L.toFixed(1)}</Text>
              <Text style={{ color: sub, fontSize: 11, width: 80 }}>
                {dL == null ? '—' : `ΔL* ${dL.toFixed(1)}`}
              </Text>
              <Text style={{ color: sub, fontSize: 11 }}>R−B {p.rb.toFixed(1)}</Text>
            </View>
          )
        })}
      </View>
    )
  },
}

// A stacked collage (warm sheets + a brand-orange accent) + a matte paper-tone
// palette. FINAL: paper as a hero-surface accent treatment, not the whole shell.
export const LayeredPaper: Story = {
  render: () => (
    <View style={{ ...DESK_BG, padding: 40, gap: 44 }}>
      {/* hero collage — overlapping matte sheets, slight offset + rotation */}
      <View style={{ height: 260, width: 560, position: 'relative' }}>
        <PaperSheet tone={PAPER.base} w={250} h={170} left={0} top={44} rotate={-3} />
        <PaperSheet tone={PAPER.elevated} w={260} h={190} left={110} top={0} rotate={2}>
          <Text style={{ color: TEXT.tertiary, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
            LIVE
          </Text>
          <Text style={{ color: '#F3F0EC', fontSize: 17, fontWeight: '700' }}>
            Seated Cable Row
          </Text>
          <Text style={{ color: '#C9C2B8', fontSize: 12 }}>set 2 · 8 reps · 0.42 m/s</Text>
        </PaperSheet>
        <PaperSheet tone={PAPER.accent} w={150} h={110} left={322} top={72} rotate={-1}>
          <Text style={{ color: '#FCE9D8', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
            LOAD
          </Text>
          <Text style={{ color: '#FFF3E8', fontSize: 26, fontWeight: '800' }}>75</Text>
          <Text style={{ color: '#F0C9A6', fontSize: 11 }}>lbs · +5</Text>
        </PaperSheet>
      </View>

      {/* matte paper-tone palette */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: TEXT.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
          MATTE PAPER TONES · derived ramp + brand accent, grain + rim + contact shadow
        </Text>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          {Object.entries(PAPER).map(([name, tone]) => (
            <View
              key={name}
              style={{
                width: 92,
                height: 92,
                borderRadius: 4,
                padding: 8,
                justifyContent: 'flex-end',
                ...paperFill(tone),
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 10 }}>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  ),
}

// PAPER × OUR ACTUAL PALETTE — does the paper treatment survive the real brand /
// categorical colors? The categorical `dark` variant IS essentially a paper
// palette — so the ramp work is REUSED. FINAL: `dark` variant + brand orange -600
// on surface, vivid -400 for text/accents/glow.
export const PaperWithBrand: Story = {
  render: () => {
    const dark = categoricalPalette.dark
    return (
      <View style={{ ...DESK_BG, padding: 40, gap: 34 }}>
        <PaperSwatchRow
          label="CATEGORICAL · DEFAULT (vivid — too neon for matte paper)"
          tones={categoricalPalette.default}
        />
        <PaperSwatchRow label="CATEGORICAL · DARK (reads as colored paper ✓)" tones={dark} />
        {/* a collage built from the REAL dark-variant colors + brand orange-600 */}
        <View style={{ height: 240, width: 560, position: 'relative' }}>
          <PaperSheet tone={shift(dark[5], -16)} w={250} h={160} left={0} top={44} rotate={-3} />
          <PaperSheet tone={dark[0]} w={250} h={182} left={110} top={0} rotate={2}>
            <Text
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 9,
                fontWeight: '700',
                letterSpacing: 1,
              }}
            >
              LIVE
            </Text>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Seated Cable Row</Text>
            <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12 }}>
              set 2 · 8 reps · 0.42 m/s
            </Text>
          </PaperSheet>
          <PaperSheet
            tone={primitiveRamps.orange[600]}
            w={150}
            h={110}
            left={322}
            top={66}
            rotate={-1}
          >
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
              LOAD
            </Text>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>75</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>lbs · +5</Text>
          </PaperSheet>
        </View>
      </View>
    )
  },
}
