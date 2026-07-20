import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { categoricalPalette, primitiveRamps } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'

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

// ---------------------------------------------------------------------------
// Color math shared by the NEUTRAL-vs-WARM comparison + the ALPHA-LAYERING demo.
// ---------------------------------------------------------------------------

const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')
const channels = (hex: string) => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16))

/** True CIELAB L* (perceptual lightness) — the surface-separation metric. */
function lstar(hex: string): number {
  const lin = channels(hex)
    .map((c) => c / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  return y <= 0.008856 ? y * 903.3 : 116 * Math.cbrt(y) - 16
}

/** Inverse of `lstar` for a NEUTRAL gray: L* → the sRGB channel value (0..255).
 *  The lightness half of the surface-ramp system. */
function grayForL(L: number): number {
  const Y = L > 8 ? ((L + 16) / 116) ** 3 : L / 903.3 // L* → relative luminance (gray: Y = linear)
  const s = Y <= 0.0031308 ? 12.92 * Y : 1.055 * Y ** (1 / 2.4) - 0.055
  return s * 255
}

/** Flatten an alpha `tint` over an opaque `base` → the resulting opaque hex.
 *  This is what an "elevation = white overlay" model actually paints. */
function over(base: string, a: number, tint: [number, number, number] = [255, 255, 255]): string {
  const b = channels(base)
  return toHex(b[0] * (1 - a) + tint[0] * a, b[1] * (1 - a) + tint[1] * a, b[2] * (1 - a) + tint[2] * a)
}

// The two candidate base ramps, L*-matched. Neutral = pure gray (R=G=B). Warm
// = a "greige" tint that GROWS with plane lightness (R up, B down) so the warmth
// reads more as planes lift — the look we used in the audiobook app.
const NEUTRAL_RAMP = ['#0F0F0F', '#181818', '#212121', '#2B2B2B', '#343434']

/** Warm ramp derived from NEUTRAL_RAMP at warmth intensity `w`, keeping L* ~matched. */
function warmRamp(w: number): string[] {
  return NEUTRAL_RAMP.map((hex) => {
    const v = channels(hex)[0] // neutral → all channels equal
    const t = v * w
    return toHex(v + t * 0.7, v + t * 0.15, v - t * 0.7)
  })
}

const WARM_SUBTLE = warmRamp(0.1)
const WARM_MEDIUM = warmRamp(0.18)
const WARM_STRONG = warmRamp(0.28)

/** Apply the greige warm tint to an arbitrary hex at intensity `w` (0 = identity),
 *  so a neutral template can be re-temperatured while keeping its lightness. */
function warmTint(hex: string, w: number): string {
  if (!w) return hex
  const [r, g, b] = channels(hex)
  const v = (r + g + b) / 3
  const t = v * w
  return toHex(r + t * 0.7, g + t * 0.15, b - t * 0.7)
}

// --- Warmth CURVE control -------------------------------------------------
// The earlier warm ramps tie warmth to lightness (warmth GROWS toward the top,
// so bright planes curve tan). These decouple it: set the R−B warmth explicitly
// per plane so the curve can stay flat — or even cool off — as planes lighten.

/** Re-temperature a hex to an EXACT R−B warmth (0 = neutral), preserving its L*. */
function withWarmth(hex: string, rb: number): string {
  const [r, g, b] = channels(hex)
  const v = (r + g + b) / 3
  return toHex(v + rb / 2, v + rb * 0.08, v - rb / 2)
}

/** A base ramp whose R−B warmth ramps linearly from `startRB` (darkest plane) to
 *  `endRB` (lightest). start=end → constant; end<start → cools toward the top. */
function warmCurve(startRB: number, endRB: number): string[] {
  const n = NEUTRAL_RAMP.length
  return NEUTRAL_RAMP.map((hex, i) => withWarmth(hex, startRB + ((endRB - startRB) * i) / (n - 1)))
}

// The three finalists as one list — drives the at-scale + paper comparisons.
const PALETTES: { name: string; ramp: string[]; w: number }[] = [
  { name: 'Neutral', ramp: NEUTRAL_RAMP, w: 0 },
  { name: 'Warm · subtle', ramp: WARM_SUBTLE, w: 0.1 },
  { name: 'Warm · medium', ramp: WARM_MEDIUM, w: 0.18 },
]

// Matte paper template (neutral). Warm variants come from warmTint(...,w) so all
// three are LIGHTNESS-matched — only temperature differs.
const PAPER_TONES = { back: '#222222', mid: '#2A2A2A', light: '#353535', lighter: '#424242' }
const PAPER_DESK = '#1F1F1F'
const PAPER_ACCENT = '#B94A00' // brand orange-600 on-surface; vivid -400 stays for content

/** A paper plane: matte fill + grain + top rim + a contact shadow. `sheet` = a
 *  raised leaf (stronger shadow) vs a container resting on the desk. */
function paperPlane(tone: string, sheet: boolean): object {
  return {
    backgroundColor: tone,
    backgroundImage: noise(0.05),
    boxShadow: sheet
      ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 5px 12px rgba(0,0,0,0.45)'
      : 'inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 6px rgba(0,0,0,0.28)',
  }
}

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

// ===========================================================================
// NEUTRAL vs WARM — the base-ramp decision. Blue-grey is out (too common). This
// compares pure neutral against three warmth intensities, then shows the two
// finalists (neutral + warm-medium) AT SCALE and as LAYERED PAPER, so the choice
// is made against real density, not a swatch. L*/ΔL* labels prove the warm ramp
// is perceptually L*-matched to neutral (same separation, different temperature).
// ===========================================================================

// A 5-plane ramp shown as a solid strip with per-plane L* + step ΔL* — so you can
// see the SEPARATION (ΔL*) is identical while only the TEMPERATURE changes.
function RampBar({
  name,
  planes,
  note,
  warmth,
}: {
  name: string
  planes: string[]
  note?: string
  /** show the R−B warmth readout (0 = neutral) instead of the step ΔL*. */
  warmth?: boolean
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: TEXT.primary, fontSize: 12, fontWeight: '600' }}>{name}</Text>
      {note && <Text style={{ color: TEXT.tertiary, fontSize: 10 }}>{note}</Text>}
      <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden' }}>
        {planes.map((p, i) => {
          const L = lstar(p)
          const [r, , b] = channels(p)
          const d = i === 0 ? null : L - lstar(planes[i - 1])
          const ink = L > 42 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.85)'
          return (
            <View
              key={i}
              style={{ width: 104, height: 88, backgroundColor: p, padding: 8, justifyContent: 'flex-end' }}
            >
              <Text style={{ color: ink, fontSize: 11, fontWeight: '600' }}>{p.toUpperCase()}</Text>
              <Text style={{ color: ink, fontSize: 10, opacity: 0.8 }}>L* {L.toFixed(1)}</Text>
              {warmth ? (
                <Text style={{ color: ink, fontSize: 10, opacity: 0.8 }}>R−B {r - b}</Text>
              ) : (
                d != null && (
                  <Text style={{ color: ink, fontSize: 10, opacity: 0.8 }}>ΔL* {d.toFixed(1)}</Text>
                )
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

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

// WARMTH CURVE — the earlier warm ramps tie warmth to lightness, so the BRIGHT
// planes read warmest (the "tan at the top" the eye caught). These candidates
// decouple it: `grows` keeps that curve, `flat` holds one warmth on every plane,
// `tapered` starts warm and cools toward the highlights. Top = base ramps with an
// R−B (warmth) readout so the curve is explicit; bottom = the same curves as
// paper, to judge warmth at the bright tones where it actually shows.
const WARMTH_CANDIDATES: { name: string; note: string; s: number; e: number }[] = [
  { name: 'Neutral', note: 'R−B 0 — reference', s: 0, e: 0 },
  { name: 'Warm · faint (grows 1→3.5)', note: 'between neutral and subtle', s: 1, e: 3.5 },
  { name: 'Warm · subtle (grows 2→7) — current', note: 'today’s subtle; brights curve tan', s: 2, e: 7 },
  { name: 'Warm · flat (constant 3.5)', note: 'same warmth every plane; brights stay put', s: 3.5, e: 3.5 },
  { name: 'Warm · tapered (5→2)', note: 'warm base, near-neutral highlights', s: 5, e: 2 },
]

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

// One dense lockup (top bar · rail w/ session list · stage · live card · nested
// chip · metric tiles), rendered through a SKIN so the SAME markup can be shown
// as the structural `hairline` system OR the `paper` accent aesthetic.
interface Skin {
  outer: object
  bar: object
  rail: object
  stage: object
  card: object
  tile: object
  chip: object
  ink: { primary: string; secondary: string; tertiary: string }
  dotOff: string
}
const HAIR = { borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
const SESSION_ROWS: [string, number, number][] = [
  ['Smith Bench', 3, 3],
  ['Cable Row', 2, 3],
  ['Bayesian Curl', 0, 3],
  ['French Press', 0, 3],
  ['Lat Raise', 0, 2],
]

// Structural skin: flat planes off the base ramp + one alpha-white hairline.
function hairlineSkin(ramp: string[]): Skin {
  return {
    outer: { backgroundColor: ramp[0] },
    bar: { backgroundColor: ramp[2], ...HAIR },
    rail: { backgroundColor: ramp[1], ...HAIR },
    stage: { backgroundColor: ramp[3], ...HAIR },
    card: { backgroundColor: ramp[4], ...HAIR },
    tile: { backgroundColor: ramp[4], ...HAIR },
    chip: { backgroundColor: ramp[0], ...HAIR },
    ink: TEXT,
    dotOff: ramp[3],
  }
}

// Paper skin: matte grained sheets separated by contact shadow, not by ramp step
// — containers rest on the desk, the live card + tiles are raised leaves.
function paperSkin(w: number): Skin {
  const t = (tone: string) => warmTint(tone, w)
  const container = paperPlane(t(PAPER_TONES.back), false)
  return {
    outer: { backgroundColor: t(PAPER_DESK), backgroundImage: noise(0.025) },
    bar: container,
    rail: container,
    stage: container,
    card: paperPlane(t(PAPER_TONES.light), true),
    tile: paperPlane(t(PAPER_TONES.mid), true),
    chip: paperPlane(t(PAPER_TONES.lighter), true),
    ink: { primary: '#F4F1EC', secondary: 'rgba(255,255,255,0.72)', tertiary: 'rgba(255,255,255,0.5)' },
    dotOff: t(PAPER_TONES.lighter),
  }
}

// Paper skin driven by a warmth CURVE: each plane's R−B is set from its own
// lightness (desk = startRB, brightest sheet = endRB), so `tapered` keeps the
// bright hero card/chip near-neutral while the shadows stay warm.
function paperSkinCurve(startRB: number, endRB: number): Skin {
  const loL = lstar(PAPER_DESK)
  const hiL = lstar(PAPER_TONES.lighter)
  const t = (hex: string) => {
    const frac = Math.max(0, Math.min(1, (lstar(hex) - loL) / (hiL - loL)))
    return withWarmth(hex, startRB + (endRB - startRB) * frac)
  }
  const container = paperPlane(t(PAPER_TONES.back), false)
  return {
    outer: { backgroundColor: t(PAPER_DESK), backgroundImage: noise(0.025) },
    bar: container,
    rail: container,
    stage: container,
    card: paperPlane(t(PAPER_TONES.light), true),
    tile: paperPlane(t(PAPER_TONES.mid), true),
    chip: paperPlane(t(PAPER_TONES.lighter), true),
    ink: { primary: '#F4F1EC', secondary: 'rgba(255,255,255,0.72)', tertiary: 'rgba(255,255,255,0.5)' },
    dotOff: t(PAPER_TONES.lighter),
  }
}

function Lockup({ skin }: { skin: Skin }) {
  const ink = skin.ink
  const eyebrow = (s: string) => (
    <Text style={{ color: ink.tertiary, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>{s}</Text>
  )
  const tile = (label: string, value: string, unit: string) => (
    <View key={label} style={{ flex: 1, borderRadius: 8, padding: 10, gap: 2, ...skin.tile }}>
      {eyebrow(label)}
      <Text style={{ color: ink.primary, fontSize: 20, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: ink.tertiary, fontSize: 10 }}>{unit}</Text>
    </View>
  )
  return (
    <View style={{ width: 620, borderRadius: 16, padding: 12, gap: 10, ...skin.outer }}>
      <View style={{ borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...skin.bar }}>
        <Text style={{ color: ink.primary, fontSize: 14, fontWeight: '700' }}>Upper Body · Push/Pull</Text>
        <Text style={{ color: ink.secondary, fontSize: 12 }}>34:12 · 6 exercises</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ width: 190, borderRadius: 10, padding: 12, gap: 10, ...skin.rail }}>
          {eyebrow('SESSION')}
          {SESSION_ROWS.map(([name, done, total]) => (
            <View key={name} style={{ gap: 5 }}>
              <Text style={{ color: done > 0 ? ink.primary : ink.tertiary, fontSize: 12 }}>{name}</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {Array.from({ length: total }).map((_, i) => (
                  <View key={i} style={{ width: 16, height: 5, borderRadius: 3, backgroundColor: i < done ? '#FF7900' : skin.dotOff }} />
                ))}
              </View>
            </View>
          ))}
        </View>
        <View style={{ flex: 1, borderRadius: 10, padding: 12, gap: 10, ...skin.stage }}>
          {eyebrow('LIVE')}
          <View style={{ borderRadius: 10, padding: 14, gap: 6, ...skin.card }}>
            <Text style={{ color: ink.primary, fontSize: 18, fontWeight: '700' }}>Seated Cable Row</Text>
            <Text style={{ color: ink.secondary, fontSize: 13 }}>set 2 · 8 reps · 0.42 m/s</Text>
            <View style={{ alignSelf: 'flex-start', marginTop: 2, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, ...skin.chip }}>
              <Text style={{ color: '#FF7900', fontSize: 12, fontWeight: '700' }}>75 lb · +5</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {tile('VOLUME', '4.2k', 'lb · session')}
            {tile('TEMPO', '2·0·1', 'ecc·pause·con')}
            {tile('FATIGUE', '12%', 'vs set 1')}
          </View>
        </View>
      </View>
    </View>
  )
}

// AT SCALE × TREATMENT — the 3 finalists (neutral / warm-subtle / warm-medium),
// each rendered TWICE: as-is (hairline system) and with the paper treatment. Six
// panels, so temperature AND treatment are judged against real density.
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

// WARMTH CURVES × AT SCALE (paper) — the two curves the eye asked for, rendered
// as the full paper lockup so warmth is judged on the surfaces you actually read.
// Faint = a hair of warmth that grows mildly; tapered = warm shadows, near-neutral
// bright hero (card/tiles/chip) so nothing goes tan. Neutral shown for reference.
const CURVE_AT_SCALE: { name: string; skin: Skin }[] = [
  { name: 'Neutral (reference)', skin: paperSkinCurve(0, 0) },
  { name: 'Warm · faint (grows 1→3.5)', skin: paperSkinCurve(1, 3.5) },
  { name: 'Warm · subtle (grows, ≈2→7)', skin: paperSkin(0.1) },
  { name: 'Warm · medium (grows, ≈3.5→13)', skin: paperSkin(0.18) },
  { name: 'Warm · tapered (5→2) — warm shadows, cool highlights', skin: paperSkinCurve(5, 2) },
]

export const WarmthCurvesAtScale: Story = {
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

// The layered-paper accent across the 3 finalists. Neutral = "cardstock /
// concrete" (colder, clinical); warm-subtle = greige; warm-medium = "kraft".
// All three are LIGHTNESS-matched (one template, re-temperatured) so only warmth
// changes. Judge which desk + sheets feels like a premium object.
function PaperCollage({ tones, desk, accent }: { tones: string[]; desk: string; accent: string }) {
  return (
    <View style={{ width: 300, height: 250, borderRadius: 12, padding: 4, backgroundColor: desk, backgroundImage: noise(0.025), position: 'relative' }}>
      <PaperSheet tone={tones[1]} w={190} h={150} left={12} top={54} rotate={-3} />
      <PaperSheet tone={tones[0]} w={200} h={168} left={64} top={10} rotate={2}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>LIVE</Text>
        <Text style={{ color: '#F4F1EC', fontSize: 16, fontWeight: '700' }}>Seated Cable Row</Text>
        <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12 }}>set 2 · 8 reps · 0.42 m/s</Text>
      </PaperSheet>
      <PaperSheet tone={accent} w={116} h={92} left={172} top={132} rotate={-1}>
        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>LOAD</Text>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>75</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>lb · +5</Text>
      </PaperSheet>
    </View>
  )
}

const PAPER_SUBTITLE: Record<string, string> = {
  Neutral: 'cardstock / concrete',
  'Warm · subtle': 'greige',
  'Warm · medium': 'kraft',
}

export const PaperModels: Story = {
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

// ===========================================================================
// ALPHA LAYERING — the "elevation = one base + white-overlay steps" model. The
// user likes the idea; this shows the real technical tradeoff so it's a choice,
// not a surprise. Each strip flattens the overlay to the opaque hex it produces.
//
// PRO: one base + one alpha scale generates every plane, works over ANY base,
//   nests predictably, themes by swapping one color. Great for a hairline/state
//   layer that must sit on unknown backgrounds.
// CON (visible below): a WHITE overlay pulls every plane toward neutral as it
//   lightens — so a WARM base loses its warmth exactly where planes are lightest
//   (row 2). Compare the ΔR-B spread top vs bottom. Fix = tint the overlay warm
//   (row 3) or hand-pick opaque stops (row 4, full temperature control).
// ===========================================================================

const OVERLAY_ALPHAS = [0, 0.06, 0.12, 0.18, 0.24]
function AlphaStrip({
  label,
  base,
  tint,
  opaque,
}: {
  label: string
  base?: string
  tint?: [number, number, number]
  opaque?: string[]
}) {
  const planes = opaque ?? OVERLAY_ALPHAS.map((a) => over(base as string, a, tint))
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: TEXT.secondary, fontSize: 11 }}>{label}</Text>
      <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden' }}>
        {planes.map((p, i) => {
          const [r, , b] = channels(p)
          const ink = lstar(p) > 42 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'
          return (
            <View key={i} style={{ width: 118, height: 78, backgroundColor: p, padding: 8, justifyContent: 'flex-end' }}>
              <Text style={{ color: ink, fontSize: 11, fontWeight: '600' }}>{p.toUpperCase()}</Text>
              <Text style={{ color: ink, fontSize: 10, opacity: 0.8 }}>R−B {r - b}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

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

// ===========================================================================
// SURFACE RAMP SYSTEM — the one formula the shipped tokens are derived from, so
// the ramp is a system, not arbitrary hand-picks. Grounded in how real dark UIs
// actually elevate (Material's DIMINISHING white-overlay steps; Apple's 3-level
// COMPRESSED backgrounds) — NOT a constant big step, which piles into a stark
// bright top and over-relies on lightness (breaking §4's hairline-first thesis).
//   • LIGHTNESS — CIELAB L* off a shell with DIMINISHING steps: the frame→content
//     jump is biggest, each higher plane adds LESS, total span stays COMPRESSED
//     (~L*9→19.5) so the hero is a moderate charcoal, not near-white. shellL* is
//     chosen to leave DARKENING HEADROOM below it (an inset / cast shadow sits one
//     step under the shell, still a real colour, never #000).
//   • WARMTH — the locked TAPERED curve via `withWarmth`: R−B high in the shadow
//     end, tapering to ~neutral highlights, so bright content surfaces never go tan.
//   • SEPARATION is MULTI-CHANNEL — the tight upper steps are carried by the alpha
//     hairline + shadow + paper (§4), NOT by lightness alone.
// Shipped: shellL*=9, steps [4.5,2.5,2,1.5] (→ base #252321 … overlay #302F2E).
// ===========================================================================

interface SurfacePlane {
  name: string
  role: string
  L: number
  rb: number
  hex: string
}
function deriveSurfaceRamp(
  shellL = 9,
  steps = [4.5, 2.5, 2, 1.5],
  rbShadow = 6,
  rbHilite = 1.5
): SurfacePlane[] {
  const cum: number[] = []
  let L = shellL
  for (const s of steps) {
    L += s
    cum.push(L)
  }
  const Lmax = L
  const levels: [string, string, number][] = [
    ['inset', 'sub-shell well / pressed', shellL - steps[0]],
    ['background', 'shell / frame', shellL],
    ['base', 'main content plane', cum[0]],
    ['elevated', 'nav / rail', cum[1]],
    ['raised', 'cards', cum[2]],
    ['overlay', 'hero / popover', cum[3]],
  ]
  return levels.map(([name, role, l]) => {
    const f = Math.max(0, Math.min(1, (l - shellL) / (Lmax - shellL))) // 0 at shell → 1 at overlay
    const rb = rbShadow + (rbHilite - rbShadow) * f // tapered warmth (withWarmth)
    const g = clampByte(grayForL(l))
    return { name, role, L: l, rb, hex: withWarmth(toHex(g, g, g), rb) }
  })
}

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

// ===========================================================================
// TOP-BAR TREATMENTS — the two options side by side, IN CONTEXT (shell frame +
// left nav + content plane), so the bottom edge of each bar is judged against
// what it actually meets. V1 = flat shell (top bar is FRAME, matches the nav).
// V2 = gradient anchored at the bottom to the content plane (top bar is content
// chrome; lifted at the top edge — the screen bezel — melting into content below).
// ===========================================================================

const HAIRLINE = 'rgba(255,255,255,0.09)'
function NavCol({ full }: { full?: boolean }) {
  const c = getSemanticColors('dark')
  return (
    <View
      style={{
        width: 56,
        backgroundColor: c['background-base'],
        borderRightWidth: 1,
        borderColor: HAIRLINE,
        alignItems: 'center',
        paddingTop: full ? 16 : 14,
        gap: 16,
      }}
    >
      {full && (
        <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#FF7900', transform: [{ rotate: '45deg' }], marginBottom: 4 }} />
      )}
      <Text style={{ color: '#FF7900', fontSize: 10, fontWeight: '700' }}>LIVE</Text>
      <Text style={{ color: TEXT.tertiary, fontSize: 10 }}>HIST</Text>
      <Text style={{ color: TEXT.tertiary, fontSize: 10 }}>PLAN</Text>
    </View>
  )
}
function TopBarRow({ barStyle }: { barStyle: object }) {
  return (
    <View
      style={{
        height: 46,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 10,
        borderBottomWidth: 1,
        borderColor: HAIRLINE,
        ...barStyle,
      }}
    >
      <Text style={{ color: '#F3F4F6', fontSize: 14, fontWeight: '800', letterSpacing: 1 }}>
        VOLTRAS
      </Text>
      <Text style={{ color: TEXT.tertiary, fontSize: 12 }}>/ wall dashboard</Text>
      <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ED573' }} />
        <Text style={{ color: '#F3F4F6', fontSize: 12, fontWeight: '700' }}>LIVE</Text>
      </View>
    </View>
  )
}
function ContentPane({ note }: { note: string }) {
  const c = getSemanticColors('dark')
  return (
    <View style={{ flex: 1, backgroundColor: c['surface-base'], padding: 18 }}>
      <Text style={{ color: '#F3F4F6', fontSize: 22, fontWeight: '700' }}>Cable Chest Press</Text>
      <Text style={{ color: TEXT.secondary, fontSize: 13, marginTop: 4 }}>content plane · surface-base</Text>
      <Text style={{ color: TEXT.tertiary, fontSize: 12, marginTop: 10 }}>{note}</Text>
    </View>
  )
}

// `spine` = left nav is FULL-HEIGHT (the frame spine) and the top bar spans only
// the content column — so the bar's bottom only ever meets `base`, no nav mismatch.
// Default = the current full-width bar (bar spans over the darker nav too).
function TopBarDemo({ label, barStyle, spine }: { label: string; barStyle: object; spine?: boolean }) {
  const c = getSemanticColors('dark')
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: TEXT.secondary, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <View
        style={{
          width: 720,
          height: 240,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: c['background-base'],
          flexDirection: spine ? 'row' : 'column',
        }}
      >
        {spine ? (
          <>
            <NavCol full />
            <View style={{ flex: 1 }}>
              <TopBarRow barStyle={barStyle} />
              <ContentPane note="top bar spans ONLY the content — bottom = base matches everywhere" />
            </View>
          </>
        ) : (
          <>
            <TopBarRow barStyle={barStyle} />
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <NavCol />
              <ContentPane note="content plane (base) — a lighter plane than the shell top bar; the hairline handles it" />
            </View>
          </>
        )}
      </View>
    </View>
  )
}

export const TopBarTreatments: Story = {
  render: () => {
    const c = getSemanticColors('dark')
    // All gradients bottom-anchored to surface-base (seamless into content); only the
    // TOP stop changes. The strong ones concentrate the glow near the top edge (fades
    // to base by ~55%) so most of the bar is flat base and only the bezel edge lifts.
    // Top bar STAYS on the shell plane (matches the left nav = frame). Options are
    // MUCH subtler sheens now, and layered over the shared paper GRAIN tile (comma-
    // separated backgroundImage: grain first, then the sheen gradient under it).
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

// ===========================================================================
// FRAME + RECESSED CONTENT — the top bar + left nav are ONE flat bezel plane (no
// per-element rim/shadow → no junction artifacts over the nav); the main content
// is a WELL recessed into it via an inner shadow on its TOP + LEFT edges (the sides
// touching the frame), never on the screen-edge sides. Since the shell is now
// PURELY the frame, it drops to a dark bezel — the recess reads better against it.
// ===========================================================================

function FrameDemo({
  label,
  bezel,
  contentStyle,
  grain,
}: {
  label: string
  bezel: string
  contentStyle: object
  grain?: boolean
}) {
  const c = getSemanticColors('dark')
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: TEXT.secondary, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <View
        style={{
          width: 720,
          height: 240,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: bezel,
          ...(grain ? { backgroundImage: noise(0.05) } : {}),
        }}
      >
        {/* top bar — bezel, no hairline */}
        <View style={{ height: 46, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 }}>
          <Text style={{ color: '#F3F4F6', fontSize: 14, fontWeight: '800', letterSpacing: 1 }}>VOLTRAS</Text>
          <Text style={{ color: TEXT.tertiary, fontSize: 12 }}>/ wall dashboard</Text>
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ED573' }} />
            <Text style={{ color: '#F3F4F6', fontSize: 12, fontWeight: '700' }}>LIVE</Text>
          </View>
        </View>
        {/* row: nav (bezel) + recessed content well */}
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ width: 56, alignItems: 'center', paddingTop: 14, gap: 16 }}>
            <Text style={{ color: '#FF7900', fontSize: 10, fontWeight: '700' }}>LIVE</Text>
            <Text style={{ color: TEXT.tertiary, fontSize: 10 }}>HIST</Text>
            <Text style={{ color: TEXT.tertiary, fontSize: 10 }}>PLAN</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: c['surface-base'], ...contentStyle }}>
            <View style={{ padding: 18 }}>
              <Text style={{ color: '#F3F4F6', fontSize: 22, fontWeight: '700' }}>Cable Chest Press</Text>
              <Text style={{ color: TEXT.secondary, fontSize: 13, marginTop: 4 }}>content well · surface-base</Text>
              <Text style={{ color: TEXT.tertiary, fontSize: 12, marginTop: 10 }}>
                recessed into the frame — inner shadow on top + left only
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

// inner shadow on TOP + LEFT edges only (negative spread hugs each edge, none on
// the screen-edge sides); optional 1px rim-light lip at the very top of the recess.
const RECESS = 'inset 0 10px 14px -8px rgba(0,0,0,0.75), inset 10px 0 14px -8px rgba(0,0,0,0.75)'
const RECESS_RIM = `inset 0 1px 0 rgba(255,255,255,0.06), ${RECESS}`

export const FrameRecess: Story = {
  render: () => {
    const c = getSemanticColors('dark')
    const HAIR = 'rgba(255,255,255,0.09)'
    return (
      <View style={{ backgroundColor: '#000', padding: 32, gap: 18 }}>
        <FrameDemo
          label="A · Current — shell frame (#1C1916) + hairline separators (baseline)"
          bezel={c['background-base']}
          contentStyle={{ borderTopWidth: 1, borderLeftWidth: 1, borderColor: HAIR }}
        />
        <FrameDemo
          label="B · DARK BEZEL (#100D0A) + recessed content (inner shadow top+left), NO hairline"
          bezel="#100D0A"
          contentStyle={{ boxShadow: RECESS } as object}
          grain
        />
        <FrameDemo
          label="C · + top rim-light lip on the recess (full paper standard: rim + shadow)"
          bezel="#100D0A"
          contentStyle={{ boxShadow: RECESS_RIM } as object}
          grain
        />
        <FrameDemo
          label="D · even darker bezel (#0B0908) — how far the frame can drop"
          bezel="#0B0908"
          contentStyle={{ boxShadow: RECESS_RIM } as object}
          grain
        />
      </View>
    )
  },
}
