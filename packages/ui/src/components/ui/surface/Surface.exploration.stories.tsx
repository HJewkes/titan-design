import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { categoricalPalette, primitiveRamps } from '../../../theme/tokens/primitives'

// ===========================================================================
// DESIGN EXPLORATION — NOT shipped tokens. These stories exist to compare dark
// surface RAMP options and SEPARATION treatments VISUALLY before we change any
// semantic token. See `coordination/design-explorations/surface-system-north-star.md`.
// Round 2 (pending MODERN-THEMES research): texture (gradient / noise / paper)
// and the refined-skeuomorphic recipe with real gradients.
// ===========================================================================

interface Ramp {
  name: string
  /** darkest (shell/background) → lightest (overlay/card), 5 planes. */
  planes: [string, string, string, string, string]
  note: string
}

// Each ramp is 5 planes at ~even perceptual spacing (except CURRENT, shown to
// make the cludge visible next to the fixes). Sources: SURF-PERCEPTION / -GUARDRAILS.
const RAMPS: Ramp[] = [
  {
    name: 'Neutral · even ΔL*≈4',
    planes: ['#0F0F0F', '#181818', '#212121', '#2B2B2B', '#343434'],
    note: 'pure gray, drop-in — likely pick (charcoal+orange brand)',
  },
  {
    name: 'Blue-black · cool tint',
    planes: ['#0C0F13', '#16191D', '#1F2226', '#282B30', '#32343A'],
    note: 'OKLCH C≈0.010 — reads "technical", avoids dead-gray',
  },
  {
    name: 'Warm charcoal',
    planes: ['#0F0E0C', '#1A1714', '#232019', '#2C2823', '#35302B'],
    note: 'faint warm bias — pairs with orange brand',
  },
  {
    name: 'Material · alpha-overlay',
    planes: ['#101010', '#1C1C1C', '#252525', '#2F2F2F', '#393939'],
    note: 'white-alpha (0/5/9/13/17%) over one base — runtime-generatable',
  },
  {
    name: 'CURRENT · the cludge',
    planes: ['#101010', '#161616', '#191919', '#1C1C1C', '#1C1C1C'],
    note: 'ΔL* 1.5 steps + overlay≡raised collision — the problem',
  },
]

const TEXT = { primary: '#F3F4F6', secondary: '#9CA3AF', tertiary: '#6B7280' }

type Separation = 'tonal' | 'hairline' | 'skeuo'

// The separation treatment applied to every nested plane. `tonal` leans on the
// fill step alone; `hairline` adds a surface-independent alpha-white ring;
// `skeuo` adds a top rim-light + a soft ambient shadow (first cut — gradient
// fill comes in round 2). RNW maps shadow* → CSS box-shadow.
function sepStyle(sep: Separation): object {
  if (sep === 'hairline') return { borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
  if (sep === 'skeuo')
    // opaque top rim (light-from-above) + a modest ambient — one web-string boxShadow.
    return { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 8px rgba(0,0,0,0.45)' }
  return {}
}

function Eyebrow({ children }: { children: string }) {
  return (
    <Text style={{ color: TEXT.tertiary, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
      {children}
    </Text>
  )
}

// A mini wall lockup rendered under a given ramp + separation, so the plane
// boundaries (shell → page → rail → stage → card) are exactly what you judge.
function SurfaceScene({
  ramp,
  separation,
  showName = true,
}: {
  ramp: Ramp
  separation: Separation
  showName?: boolean
}) {
  const p = ramp.planes
  const sep = sepStyle(separation)
  return (
    <View style={{ width: 420, gap: 4 }}>
      {showName && (
        <Text style={{ color: TEXT.primary, fontSize: 12, fontWeight: '600' }}>{ramp.name}</Text>
      )}
      {showName && <Text style={{ color: TEXT.tertiary, fontSize: 10 }}>{ramp.note}</Text>}
      {/* shell = darkest plane */}
      <View
        style={{
          backgroundColor: p[0],
          borderRadius: 12,
          padding: 10,
          flexDirection: 'row',
          gap: 10,
          height: 210,
          marginTop: 4,
        }}
      >
        <View style={{ width: 36, alignItems: 'center', paddingTop: 8 }}>
          <Eyebrow>NAV</Eyebrow>
        </View>
        {/* page = base plane */}
        <View
          style={{
            flex: 1,
            backgroundColor: p[1],
            borderRadius: 10,
            padding: 10,
            flexDirection: 'row',
            gap: 10,
            ...sep,
          }}
        >
          {/* rail = elevated plane */}
          <View
            style={{
              width: 120,
              backgroundColor: p[2],
              borderRadius: 8,
              padding: 10,
              gap: 7,
              ...sep,
            }}
          >
            <Eyebrow>SESSION</Eyebrow>
            {['Bench 3/3', 'Row 1/3', 'Curl 0/3'].map((r) => (
              <Text key={r} style={{ color: TEXT.primary, fontSize: 12 }}>
                {r}
              </Text>
            ))}
          </View>
          {/* stage = raised plane, holding a card = overlay plane */}
          <View
            style={{ flex: 1, backgroundColor: p[3], borderRadius: 8, padding: 10, gap: 8, ...sep }}
          >
            <Eyebrow>LIVE</Eyebrow>
            <View style={{ backgroundColor: p[4], borderRadius: 6, padding: 10, gap: 3, ...sep }}>
              <Text style={{ color: TEXT.primary, fontSize: 13, fontWeight: '600' }}>
                Cable Row
              </Text>
              <Text style={{ color: TEXT.secondary, fontSize: 11 }}>set 2 · 8 reps · 0.42 m/s</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const meta: Meta = {
  title: 'Lab/Surface Exploration',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

// Compare the RAMP options — same scene + alpha-hairline separation, five ramps.
// Judge: can you cleanly read shell → page → rail → stage → card on each? The
// CURRENT ramp is included so the cludge is visible next to the fixes.
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

// Compare SEPARATION treatments — same neutral ramp, three treatments side by
// side: tonal-only (fill step), alpha hairline, and first-cut skeuomorphic
// (rim + soft shadow). Judge which reads cleanest without muddying.
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

// ===========================================================================
// ROUND 2 — refined skeuomorphic + texture (MODERN-THEMES recipe). Depth lives
// in OPAQUE fills + a 1px rim + an outside-the-box shadow — never translucency
// (that's what tanked glass/aura). Uses titan's proven RNW paint pattern:
// `backgroundImage: linear-gradient(...)` + web-string `boxShadow`.
// ===========================================================================

/** Shift every channel of a #RRGGBB hex by d (clamped) — for the gradient stops. */
function shift(hex: string, d: number): string {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, v))
  const parts = [c(((n >> 16) & 255) + d), c(((n >> 8) & 255) + d), c((n & 255) + d)]
  return '#' + parts.map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** Top-lighter → bottom-darker fill. Dialed UP here for the comparison; the
 *  real ship value is subtler (ΔL*≈2–3, i.e. shift ≈ 6/-3). */
function gradientFill(hex: string): string {
  return `linear-gradient(180deg, ${shift(hex, 12)} 0%, ${shift(hex, -7)} 100%)`
}

/** A static feTurbulence noise tile as a data-URI at alpha `a` — anti-banding
 *  dither (~0.02) or faint material grain (~0.035). Paint-once, never animated. */
function noise(a: number): string {
  return (
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E` +
    `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E` +
    `%3Crect width='140' height='140' filter='url(%23n)' opacity='${a}'/%3E%3C/svg%3E")`
  )
}

const RIM = 'inset 0 1px 0 rgba(255,255,255,0.14)'
const AMBIENT =
  '0 1px 2px rgba(0,0,0,0.35), 0 10px 24px rgba(0,0,0,0.30), 0 24px 48px rgba(0,0,0,0.20)'

// Each depth cue ISOLATED so its contribution is legible, then the full stack.
// Values are dialed UP for the comparison — real ship values are subtler.
type CardVariant = 'flat' | 'gradient' | 'rim' | 'grain' | 'full'
function cardStyle(base: string, variant: CardVariant): object {
  switch (variant) {
    case 'flat':
      return { backgroundColor: base }
    case 'gradient':
      return { backgroundColor: base, backgroundImage: gradientFill(base) }
    case 'rim':
      return { backgroundColor: base, boxShadow: RIM }
    case 'grain':
      return { backgroundColor: base, backgroundImage: noise(0.06) }
    default:
      return {
        backgroundColor: base,
        backgroundImage: `${noise(0.05)}, ${gradientFill(base)}`,
        boxShadow: `${RIM}, ${AMBIENT}`,
      }
  }
}

function SampleCard({
  base,
  variant,
  label,
}: {
  base: string
  variant: CardVariant
  label: string
}) {
  return (
    <View style={{ gap: 6, width: 240 }}>
      <Text style={{ color: TEXT.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
        {label}
      </Text>
      <View style={{ borderRadius: 12, padding: 16, gap: 6, ...cardStyle(base, variant) }}>
        <Text style={{ color: TEXT.primary, fontSize: 15, fontWeight: '600' }}>
          Seated Cable Row
        </Text>
        <Text style={{ color: TEXT.secondary, fontSize: 12 }}>set 2 · 8 reps · 0.42 m/s</Text>
        <Text style={{ color: TEXT.tertiary, fontSize: 12 }}>
          tertiary — large only (APCA gate)
        </Text>
      </View>
    </View>
  )
}

// Each depth cue ISOLATED (gradient / rim / grain), then the FULL stack — so you
// can judge what each contributes. Dialed up for legibility; ship values subtler.
export const SkeuomorphicCard: Story = {
  render: () => {
    const base = RAMPS[0].planes[2] // neutral · elevated
    const variants: { v: CardVariant; label: string }[] = [
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

// Texture on a large field: flat vs anti-banding dither vs faint grain, plus a
// gradient panel with/without dither (the banding case). Judge richness vs mud —
// text stays opaque on top so its contrast never changes.
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

// ===========================================================================
// LAYERED CONSTRUCTION-PAPER — matte, tactile, crisp-edged stacked "sheets".
// Rare in web systems for practical reasons (collage offset/rotation fights grid
// layouts; torn edges need image assets; the contact shadows that SELL paper die
// on near-black). A clean version works: matte grain + a crisp top rim + a
// defined contact shadow + slight offset/rotation, on tones lifted OFF near-black
// (so the shadow reads) with a warm bias + a brand-orange accent sheet.
// ===========================================================================

const PAPER: Record<string, string> = {
  charcoal: '#2A2723',
  charcoalLo: '#221F1B',
  warm: '#332D26',
  orange: '#7A3B16',
  teal: '#1F3A38',
  mustard: '#4A3A16',
}
const PAPER_SHADOW = 'inset 0 1px 0 rgba(255,255,255,0.13), 0 5px 14px rgba(0,0,0,0.55)'
function paperFill(tone: string): object {
  return { backgroundColor: tone, backgroundImage: noise(0.06), boxShadow: PAPER_SHADOW }
}

/** The "desk" the sheets sit on — a touch brighter than near-black so the dark
 *  contact shadows have something to read against, plus a faint matte grain. */
const DESK_BG: object = { backgroundColor: '#242019', backgroundImage: noise(0.025) }

function PaperSheet({
  tone,
  w,
  h,
  left,
  top,
  rotate,
  children,
}: {
  tone: string
  w: number
  h: number
  left: number
  top: number
  rotate: number
  children?: ReactNode
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: w,
        height: h,
        borderRadius: 4,
        padding: 14,
        gap: 6,
        transform: [{ rotate: `${rotate}deg` }],
        ...paperFill(tone),
      }}
    >
      {children}
    </View>
  )
}

// A stacked collage (warm sheets + a brand-orange accent) + a matte paper-tone
// palette. React to the AESTHETIC — chase it (likely as an accent-card treatment,
// not the whole shell) or admire and move on. Ships nothing; pure exploration.
export const LayeredPaper: Story = {
  render: () => (
    <View style={{ ...DESK_BG, padding: 40, gap: 44 }}>
      {/* hero collage — overlapping matte sheets, slight offset + rotation */}
      <View style={{ height: 260, width: 560, position: 'relative' }}>
        <PaperSheet tone={PAPER.charcoalLo} w={250} h={170} left={0} top={44} rotate={-3} />
        <PaperSheet tone={PAPER.warm} w={260} h={190} left={110} top={0} rotate={2}>
          <Text style={{ color: TEXT.tertiary, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
            LIVE
          </Text>
          <Text style={{ color: '#F3F0EC', fontSize: 17, fontWeight: '700' }}>
            Seated Cable Row
          </Text>
          <Text style={{ color: '#C9C2B8', fontSize: 12 }}>set 2 · 8 reps · 0.42 m/s</Text>
        </PaperSheet>
        <PaperSheet tone={PAPER.orange} w={150} h={110} left={322} top={72} rotate={-1}>
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
          MATTE PAPER TONES · grain + rim + contact shadow
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

// ===========================================================================
// PAPER × OUR ACTUAL PALETTE — does the paper treatment survive the real brand /
// categorical colors? The categorical `dark` variant (deep shades built to sit
// under white text) IS essentially a paper palette — so the ramp work is REUSED,
// not thrown out. `default` (vivid) is too neon for matte paper; `dark` reads as
// colored construction paper. Brand orange: use the deep `-600` on surfaces,
// keep the vivid `-400` for text/accents/glow.
// ===========================================================================

function PaperSwatchRow({ label, tones }: { label: string; tones: readonly string[] }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: TEXT.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {tones.map((tone, i) => (
          <View
            key={i}
            style={{
              width: 84,
              height: 84,
              borderRadius: 4,
              padding: 8,
              justifyContent: 'flex-end',
              ...paperFill(tone),
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' }}>
              {tone}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

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
