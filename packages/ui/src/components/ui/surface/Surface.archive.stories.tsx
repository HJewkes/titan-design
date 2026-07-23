import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  TEXT,
  RAMPS,
  SurfaceScene,
  Separation,
  noise,
  shift,
  NEUTRAL_RAMP,
  WARM_SUBTLE,
  WARM_MEDIUM,
  WARM_STRONG,
  RampBar,
  WARMTH_CANDIDATES,
  warmCurve,
  withWarmth,
  PaperCollage,
  PAPER_TONES,
  PAPER_DESK,
  PAPER_ACCENT,
  PALETTES,
  hairlineSkin,
  paperSkin,
  Lockup,
  AlphaStrip,
  SampleCard,
  CURVE_AT_SCALE,
  warmTint,
  PAPER_SUBTITLE,
  getSemanticColors,
  TopBarDemo,
  FrameDemo,
  recessShadow,
} from './surface-lab-shared'

// ===========================================================================
// ARCHIVE · SURFACE — decision-COMPARISON stories that led to the locked Surface
// System direction (see `Lab/North Star/1 · Surface System` /
// `Surface.exploration.stories.tsx`). These are the OPTIONS considered, not the
// final pick — kept for provenance, not for active reference. Includes
// SkeuomorphicCard, WarmthCurvesAtScale, PaperModels, TopBarTreatments, and
// FrameRecess — later exploration threads moved here from North Star §1.
// See `coordination/design-explorations/surface-system-north-star.md`.
// ===========================================================================

const meta: Meta = {
  title: 'Lab/Archive/Surface',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

// Compare the RAMP options — same scene + alpha-hairline separation, five ramps.
// SUPERSEDED by the derived warm-tapered ramp (`SurfaceRampSystem`).
export const Ramps: Story = {
  render: () => (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 28,
        backgroundColor: '#000',
        padding: 28,
      }}
    >
      {RAMPS.map((r) => (
        <SurfaceScene key={r.name} ramp={r} separation="hairline" />
      ))}
    </View>
  ),
}

// Compare SEPARATION treatments — tonal-only, alpha hairline, skeuomorphic rim.
// DECIDED: alpha-white hairline; shadows demoted to floating overlays.
export const SeparationTreatments: Story = {
  render: () => {
    const neutral = RAMPS[0]
    const treatments: { sep: Separation; label: string }[] = [
      { sep: 'tonal', label: 'Tonal only — fill step, no border' },
      { sep: 'hairline', label: 'Alpha hairline — rgba(255,255,255,0.09)' },
      { sep: 'skeuo', label: 'Skeuomorphic — rim + soft shadow (gradient pending)' },
    ]
    return (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 28,
          backgroundColor: '#000',
          padding: 28,
        }}
      >
        {treatments.map(({ sep, label }) => (
          <View key={sep} style={{ gap: 6 }}>
            <Text style={{ color: TEXT.primary, fontSize: 12, fontWeight: '600' }}>{label}</Text>
            <SurfaceScene ramp={neutral} separation={sep} showName={false} />
          </View>
        ))}
      </View>
    )
  },
}

// Texture on a large field: flat vs dither vs grain vs gradient(+dither). DECIDED:
// static dither ~.02α + grain ≤.04α, one feTurbulence tile, paint-once.
export const TextureOptions: Story = {
  render: () => {
    const base = RAMPS[0].planes[1]
    const panel = (bg: object, label: string) => (
      <View key={label} style={{ gap: 6, width: 260 }}>
        <Text style={{ color: TEXT.tertiary, fontSize: 10, fontWeight: '700' }}>{label}</Text>
        <View
          style={{ height: 150, borderRadius: 12, padding: 16, justifyContent: 'flex-end', ...bg }}
        >
          <Text style={{ color: TEXT.primary, fontSize: 14, fontWeight: '600' }}>Aa Readable</Text>
          <Text style={{ color: TEXT.secondary, fontSize: 12 }}>text sits opaque on top</Text>
        </View>
      </View>
    )
    return (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 20,
          backgroundColor: '#000',
          padding: 32,
        }}
      >
        {panel({ backgroundColor: base }, 'FLAT')}
        {panel({ backgroundColor: base, backgroundImage: noise(0.02) }, 'DITHER (α .02)')}
        {panel({ backgroundColor: base, backgroundImage: noise(0.04) }, 'GRAIN (α .04)')}
        {panel(
          {
            backgroundColor: base,
            backgroundImage: `linear-gradient(180deg, ${shift(base, 10)}, ${shift(base, -6)})`,
          },
          'GRADIENT (banding risk)'
        )}
        {panel(
          {
            backgroundColor: base,
            backgroundImage: `${noise(0.03)}, linear-gradient(180deg, ${shift(base, 10)}, ${shift(base, -6)})`,
          },
          'GRADIENT + DITHER (fixed)'
        )}
      </View>
    )
  },
}

// NEUTRAL vs WARM — the base-ramp decision. DECIDED: warm (tapered), not neutral.
export const NeutralVsWarm: Story = {
  render: () => (
    <View style={{ backgroundColor: '#000', padding: 32, gap: 22 }}>
      <RampBar name="Neutral · pure gray" planes={NEUTRAL_RAMP} note="R=G=B — the safe drop-in" />
      <RampBar
        name="Warm · subtle"
        planes={WARM_SUBTLE}
        note="barely-there greige — reads neutral in isolation, warm only in a stack"
      />
      <RampBar
        name="Warm · medium  ← candidate"
        planes={WARM_MEDIUM}
        note="clear temperature, still restrained — pairs with the orange brand"
      />
      <RampBar
        name="Warm · strong"
        planes={WARM_STRONG}
        note="audiobook-app level — tan/greige, cozy but starts to tint content"
      />
    </View>
  ),
}

// WARMTH CURVE options — grows / flat / tapered. DECIDED: tapered (5→2), warm
// shadows cooling to near-neutral highlights.
export const WarmthCurves: Story = {
  render: () => (
    <View style={{ backgroundColor: '#000', padding: 32, gap: 28 }}>
      <View style={{ gap: 16 }}>
        {WARMTH_CANDIDATES.map((c) => (
          <RampBar key={c.name} name={c.name} planes={warmCurve(c.s, c.e)} note={c.note} warmth />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 30 }}>
        {WARMTH_CANDIDATES.map((c) => {
          const keys = [PAPER_TONES.back, PAPER_TONES.mid, PAPER_TONES.light, PAPER_TONES.lighter]
          const tones = keys.map((h, i) => withWarmth(h, c.s + ((c.e - c.s) * i) / 3))
          return (
            <View key={c.name} style={{ gap: 8 }}>
              <Text style={{ color: TEXT.secondary, fontSize: 11 }}>{c.name}</Text>
              <PaperCollage tones={[tones[2], tones[0]]} desk={withWarmth(PAPER_DESK, c.s)} accent={PAPER_ACCENT} />
            </View>
          )
        })}
      </View>
    </View>
  ),
}

// AT SCALE × TREATMENT — the 3 finalists, each as-is (hairline) vs paper. Superseded
// once the derived tapered ramp + hairline + hero-only paper were locked.
export const AtScaleComparison: Story = {
  render: () => (
    <View style={{ backgroundColor: '#000', padding: 32, gap: 30 }}>
      {PALETTES.map((pal) => (
        <View key={pal.name} style={{ gap: 12 }}>
          <Text style={{ color: TEXT.primary, fontSize: 14, fontWeight: '700' }}>{pal.name.toUpperCase()}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ color: TEXT.secondary, fontSize: 11 }}>as-is · hairline system</Text>
              <Lockup skin={hairlineSkin(pal.ramp)} />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={{ color: TEXT.secondary, fontSize: 11 }}>paper treatment</Text>
              <Lockup skin={paperSkin(pal.w)} />
            </View>
          </View>
        </View>
      ))}
    </View>
  ),
}

// ALPHA LAYERING — "elevation = base + white-overlay" tradeoff. DECIDED against:
// a white overlay fades a warm base's temperature as it lightens; the derived
// ramp hand-picks opaque stops instead (full temperature control).
export const AlphaLayering: Story = {
  render: () => (
    <View style={{ backgroundColor: '#000', padding: 32, gap: 20 }}>
      <Text style={{ color: TEXT.primary, fontSize: 13, fontWeight: '700' }}>
        Elevation = base + white-alpha overlay — R−B is the warmth (0 = neutral)
      </Text>
      <AlphaStrip label="Neutral base #181818 + white α — stays neutral (R−B = 0 throughout) ✓" base="#181818" />
      <AlphaStrip
        label="Warm base #1A1714 + WHITE α — warmth FADES as it lightens (R−B shrinks) ✗"
        base="#1A1714"
      />
      <AlphaStrip
        label="Warm base #1A1714 + WARM-white α rgba(255,248,240) — warmth holds ✓"
        base="#1A1714"
        tint={[255, 248, 240]}
      />
      <AlphaStrip label="Opaque hand-picked warm ramp — full temperature control (no overlay) ✓" opaque={WARM_MEDIUM} />
    </View>
  ),
}

// Each depth cue ISOLATED (gradient / rim / grain), then the FULL stack. NOTE:
// the FULL variant's rim+ambient-shadow recipe predates the "shadows demoted to
// floating overlays" decision — superseded by the alpha-hairline separation call.
export const SkeuomorphicCard: Story = {
  name: 'P1 · Skeuomorphic card cues',
  render: () => {
    const base = RAMPS[0].planes[2] // neutral · elevated
    const variants: { v: 'flat' | 'gradient' | 'rim' | 'grain' | 'full'; label: string }[] = [
      { v: 'flat', label: 'FLAT — solid fill' },
      { v: 'gradient', label: 'GRADIENT — fill only' },
      { v: 'rim', label: 'RIM — top highlight only' },
      { v: 'grain', label: 'GRAIN — texture only' },
      { v: 'full', label: 'FULL — gradient + rim + grain' },
    ]
    return (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 20,
          backgroundColor: RAMPS[0].planes[0],
          padding: 32,
        }}
      >
        {variants.map(({ v, label }) => (
          <SampleCard key={v} base={base} variant={v} label={label} />
        ))}
      </View>
    )
  },
}

// WARMTH CURVES × AT SCALE (paper) — the two curves rendered as the full paper
// lockup. Superseded by the locked tapered-warmth decision (see SurfaceRampSystem).
export const WarmthCurvesAtScale: Story = {
  name: 'Warmth curves at scale',
  render: () => (
    <View style={{ backgroundColor: '#000', padding: 32, gap: 26 }}>
      {CURVE_AT_SCALE.map((c) => (
        <View key={c.name} style={{ gap: 10 }}>
          <Text style={{ color: TEXT.primary, fontSize: 13, fontWeight: '700' }}>{c.name}</Text>
          <Lockup skin={c.skin} />
        </View>
      ))}
    </View>
  ),
}

// The layered-paper accent across the 3 palette finalists, as tone strips +
// collage. Superseded by the locked choice (see LayeredPaper / PaperWithBrand).
export const PaperModels: Story = {
  name: 'Paper models · 3 palettes',
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 40, backgroundColor: '#141414', padding: 40 }}>
      {PALETTES.map((pal) => {
        const t = (tone: string) => warmTint(tone, pal.w)
        const collage = [t(PAPER_TONES.light), t(PAPER_TONES.back)] // front (hero) + back sheet
        const strip = [PAPER_TONES.back, PAPER_TONES.mid, PAPER_TONES.light, PAPER_TONES.lighter].map(t)
        return (
          <View key={pal.name} style={{ gap: 12 }}>
            <Text style={{ color: TEXT.primary, fontSize: 13, fontWeight: '700' }}>
              {pal.name.toUpperCase()} PAPER · {PAPER_SUBTITLE[pal.name]}
            </Text>
            <PaperCollage tones={collage} desk={t(PAPER_DESK)} accent={PAPER_ACCENT} />
            <RampBar name="tones" planes={strip} />
          </View>
        )
      })}
    </View>
  ),
}

// TOP-BAR TREATMENTS — a later exploration thread (shell bezel / top-bar chrome),
// not one of the four §-locked decisions.
export const TopBarTreatments: Story = {
  name: 'Top-bar treatments',
  render: () => {
    const c = getSemanticColors('dark')
    const shell = c['background-base']
    const GRAIN = noise(0.05)
    const sheen = (a: number) => `linear-gradient(180deg, rgba(255,255,255,${a}), transparent 55%)`
    const bar = (a: number, grain: boolean) => ({
      backgroundColor: shell,
      backgroundImage: grain ? (a ? `${GRAIN}, ${sheen(a)}` : GRAIN) : sheen(a),
    })
    return (
      <View style={{ backgroundColor: '#000', padding: 32, gap: 18 }}>
        <TopBarDemo label="Flat shell — no gradient, no texture (baseline)" barStyle={{ backgroundColor: shell }} />
        <TopBarDemo label="Sheen α.03 (whisper) — no grain" barStyle={bar(0.03, false)} />
        <TopBarDemo label="Sheen α.05 (very subtle) — no grain" barStyle={bar(0.05, false)} />
        <TopBarDemo label="Paper GRAIN only (α.05) — texture, no sheen" barStyle={bar(0, true)} />
        <TopBarDemo label="GRAIN + sheen α.03 — texture + a whisper of bezel light" barStyle={bar(0.03, true)} />
        <TopBarDemo label="GRAIN + sheen α.05" barStyle={bar(0.05, true)} />
      </View>
    )
  },
}

// FRAME + RECESSED CONTENT — the content well recessed into a bezel frame via an
// inner shadow. Later exploration thread, not one of the four locked decisions.
export const FrameRecess: Story = {
  name: 'Frame + recessed content',
  render: () => {
    const row = (label: string, shadow: string) => (
      <FrameDemo
        label={label}
        bezel="#100D0A"
        contentStyle={{ boxShadow: shadow } as object}
        grain
        hairlines="all"
      />
    )
    return (
      <View style={{ backgroundColor: '#000', padding: 32, gap: 18 }}>
        {row('1-deep · SOFT/WIDE (o10 b16) α.90 — all hairlines, no rim', recessShadow(10, 16, -8, 0.9, 0.68, 0))}
        {row('2-deep · GENTLE (o8 b12) α.90 — all hairlines, no rim', recessShadow(8, 12, -7, 0.9, 0.68, 0))}
        {row('4 · CRISP+DEEPER (o6 b7) α.90 — all hairlines, no rim', recessShadow(6, 7, -4, 0.9, 0.68, 0))}
      </View>
    )
  },
}
