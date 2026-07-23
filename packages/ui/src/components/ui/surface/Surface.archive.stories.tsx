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
} from './surface-lab-shared'

// ===========================================================================
// ARCHIVE · SURFACE — decision-COMPARISON stories that led to the locked Surface
// System direction (see `Lab/North Star/1 · Surface System` /
// `Surface.exploration.stories.tsx`). These are the OPTIONS considered, not the
// final pick — kept for provenance, not for active reference.
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
