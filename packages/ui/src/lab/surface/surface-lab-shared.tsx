import type { ReactNode } from 'react'
import { View, Text, type ViewStyle } from 'react-native'
import { categoricalPalette, primitiveRamps } from '../../theme/tokens/primitives'
import { getSemanticColors } from '../../theme/tokens/semantic'

// ===========================================================================
// SHARED helpers for the Surface design-lab stories (`Surface.exploration.stories.tsx`
// = Lab/North Star/1 · Surface System, `Surface.archive.stories.tsx` = Lab/Archive/Surface).
// NOT shipped tokens/components — pure lab-exploration plumbing, split out so the two
// story files (final direction vs. archived options) can each import only what they use.
// See `coordination/design-explorations/surface-system-north-star.md`.
// ===========================================================================

export interface Ramp {
  name: string
  /** darkest (shell/background) → lightest (overlay/card), 5 planes. */
  planes: [string, string, string, string, string]
  note: string
}

// Each ramp is 5 planes at ~even perceptual spacing (except CURRENT, shown to
// make the cludge visible next to the fixes). Sources: SURF-PERCEPTION / -GUARDRAILS.
export const RAMPS: Ramp[] = [
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

export const TEXT = { primary: '#F3F4F6', secondary: '#9CA3AF', tertiary: '#6B7280' }

// ---------------------------------------------------------------------------
// Color math shared by the NEUTRAL-vs-WARM comparison + the ALPHA-LAYERING demo
// + the shipped ramp derivation.
// ---------------------------------------------------------------------------

export const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
export const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')
export const channels = (hex: string) => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16))

/** True CIELAB L* (perceptual lightness) — the surface-separation metric. */
export function lstar(hex: string): number {
  const lin = channels(hex)
    .map((c) => c / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  return y <= 0.008856 ? y * 903.3 : 116 * Math.cbrt(y) - 16
}

/** Inverse of `lstar` for a NEUTRAL gray: L* → the sRGB channel value (0..255).
 *  The lightness half of the surface-ramp system. */
export function grayForL(L: number): number {
  const Y = L > 8 ? ((L + 16) / 116) ** 3 : L / 903.3 // L* → relative luminance (gray: Y = linear)
  const s = Y <= 0.0031308 ? 12.92 * Y : 1.055 * Y ** (1 / 2.4) - 0.055
  return s * 255
}

/** Flatten an alpha `tint` over an opaque `base` → the resulting opaque hex.
 *  This is what an "elevation = white overlay" model actually paints. */
export function over(
  base: string,
  a: number,
  tint: [number, number, number] = [255, 255, 255]
): string {
  const b = channels(base)
  return toHex(
    b[0] * (1 - a) + tint[0] * a,
    b[1] * (1 - a) + tint[1] * a,
    b[2] * (1 - a) + tint[2] * a
  )
}

// The two candidate base ramps, L*-matched. Neutral = pure gray (R=G=B). Warm
// = a "greige" tint that GROWS with plane lightness (R up, B down) so the warmth
// reads more as planes lift — the look we used in the audiobook app.
export const NEUTRAL_RAMP = ['#0F0F0F', '#181818', '#212121', '#2B2B2B', '#343434']

/** Warm ramp derived from NEUTRAL_RAMP at warmth intensity `w`, keeping L* ~matched. */
export function warmRamp(w: number): string[] {
  return NEUTRAL_RAMP.map((hex) => {
    const v = channels(hex)[0] // neutral → all channels equal
    const t = v * w
    return toHex(v + t * 0.7, v + t * 0.15, v - t * 0.7)
  })
}

export const WARM_SUBTLE = warmRamp(0.1)
export const WARM_MEDIUM = warmRamp(0.18)
export const WARM_STRONG = warmRamp(0.28)

/** Apply the greige warm tint to an arbitrary hex at intensity `w` (0 = identity),
 *  so a neutral template can be re-temperatured while keeping its lightness. */
export function warmTint(hex: string, w: number): string {
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
export function withWarmth(hex: string, rb: number): string {
  const [r, g, b] = channels(hex)
  const v = (r + g + b) / 3
  return toHex(v + rb / 2, v + rb * 0.08, v - rb / 2)
}

/** A base ramp whose R−B warmth ramps linearly from `startRB` (darkest plane) to
 *  `endRB` (lightest). start=end → constant; end<start → cools toward the top. */
export function warmCurve(startRB: number, endRB: number): string[] {
  const n = NEUTRAL_RAMP.length
  return NEUTRAL_RAMP.map((hex, i) => withWarmth(hex, startRB + ((endRB - startRB) * i) / (n - 1)))
}

// The three finalists as one list — drives the at-scale + paper comparisons.
export const PALETTES: { name: string; ramp: string[]; w: number }[] = [
  { name: 'Neutral', ramp: NEUTRAL_RAMP, w: 0 },
  { name: 'Warm · subtle', ramp: WARM_SUBTLE, w: 0.1 },
  { name: 'Warm · medium', ramp: WARM_MEDIUM, w: 0.18 },
]

// Matte paper template (neutral). Warm variants come from warmTint(...,w) so all
// three are LIGHTNESS-matched — only temperature differs.
export const PAPER_TONES = { back: '#222222', mid: '#2A2A2A', light: '#353535', lighter: '#424242' }
export const PAPER_DESK = '#1F1F1F'
export const PAPER_ACCENT = '#B94A00' // brand orange-600 on-surface; vivid -400 stays for content

/** A paper plane: matte fill + grain + top rim + a contact shadow. `sheet` = a
 *  raised leaf (stronger shadow) vs a container resting on the desk. */
export function paperPlane(tone: string, sheet: boolean): object {
  return {
    backgroundColor: tone,
    backgroundImage: noise(0.05),
    boxShadow: sheet
      ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 5px 12px rgba(0,0,0,0.45)'
      : 'inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 6px rgba(0,0,0,0.28)',
  }
}

export type Separation = 'tonal' | 'hairline' | 'skeuo'

// The separation treatment applied to every nested plane. `tonal` leans on the
// fill step alone; `hairline` adds a surface-independent alpha-white ring;
// `skeuo` adds a top rim-light + a soft ambient shadow (first cut — gradient
// fill comes in round 2). RNW maps shadow* → CSS box-shadow.
export function sepStyle(sep: Separation): object {
  if (sep === 'hairline') return { borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
  if (sep === 'skeuo')
    // opaque top rim (light-from-above) + a modest ambient — one web-string boxShadow.
    return { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 8px rgba(0,0,0,0.45)' }
  return {}
}

export function Eyebrow({ children }: { children: string }) {
  return (
    <Text style={{ color: TEXT.tertiary, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
      {children}
    </Text>
  )
}

// A mini wall lockup rendered under a given ramp + separation, so the plane
// boundaries (shell → page → rail → stage → card) are exactly what you judge.
export function SurfaceScene({
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

// ===========================================================================
// ROUND 2 — refined skeuomorphic + texture (MODERN-THEMES recipe). Depth lives
// in OPAQUE fills + a 1px rim + an outside-the-box shadow — never translucency
// (that's what tanked glass/aura). Uses titan's proven RNW paint pattern:
// `backgroundImage: linear-gradient(...)` + web-string `boxShadow`.
// ===========================================================================

/** Shift every channel of a #RRGGBB hex by d (clamped) — for the gradient stops. */
export function shift(hex: string, d: number): string {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, v))
  const parts = [c(((n >> 16) & 255) + d), c(((n >> 8) & 255) + d), c((n & 255) + d)]
  return '#' + parts.map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** Top-lighter → bottom-darker fill. Dialed UP here for the comparison; the
 *  real ship value is subtler (ΔL*≈2–3, i.e. shift ≈ 6/-3). */
export function gradientFill(hex: string): string {
  return `linear-gradient(180deg, ${shift(hex, 12)} 0%, ${shift(hex, -7)} 100%)`
}

/** A static feTurbulence noise tile as a data-URI at alpha `a` — anti-banding
 *  dither (~0.02) or faint material grain (~0.035). Paint-once, never animated. */
export function noise(a: number): string {
  return (
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E` +
    `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E` +
    `%3Crect width='140' height='140' filter='url(%23n)' opacity='${a}'/%3E%3C/svg%3E")`
  )
}

export const RIM = 'inset 0 1px 0 rgba(255,255,255,0.14)'
export const AMBIENT =
  '0 1px 2px rgba(0,0,0,0.35), 0 10px 24px rgba(0,0,0,0.30), 0 24px 48px rgba(0,0,0,0.20)'

// Each depth cue ISOLATED so its contribution is legible, then the full stack.
// Values are dialed UP for the comparison — real ship values are subtler.
export type CardVariant = 'flat' | 'gradient' | 'rim' | 'grain' | 'full'
export function cardStyle(base: string, variant: CardVariant): object {
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

export function SampleCard({
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

// ===========================================================================
// LAYERED CONSTRUCTION-PAPER — matte, tactile, crisp-edged stacked "sheets".
// Rare in web systems for practical reasons (collage offset/rotation fights grid
// layouts; torn edges need image assets; the contact shadows that SELL paper die
// on near-black). A clean version works: matte grain + a crisp top rim + a
// defined contact shadow + slight offset/rotation, on tones lifted OFF near-black
// (so the shadow reads) with a warm bias + a brand-orange accent sheet.
// ===========================================================================

// LOCKED: neutral paper sheets pull straight from the derived surface ramp
// (base/elevated/raised — see `deriveSurfaceRamp` below); the accent sheet is
// the categorical DARK variant's brand orange (-600 on paper surfaces, -400
// reserved for text/accents/glow). Function declarations hoist, so calling
// `deriveSurfaceRamp()` here (defined further down this file) is safe.
const rampPlane = (name: string): string => deriveSurfaceRamp().find((p) => p.name === name)!.hex
export const PAPER: Record<string, string> = {
  base: rampPlane('base'),
  elevated: rampPlane('elevated'),
  raised: rampPlane('raised'),
  accent: primitiveRamps.orange[600], // #B94A00 — brand orange -600
}
export const PAPER_SHADOW = 'inset 0 1px 0 rgba(255,255,255,0.13), 0 5px 14px rgba(0,0,0,0.55)'
export function paperFill(tone: string): object {
  return { backgroundColor: tone, backgroundImage: noise(0.06), boxShadow: PAPER_SHADOW }
}

/** The "desk" the sheets sit on — a touch brighter than near-black so the dark
 *  contact shadows have something to read against, plus a faint matte grain. */
export const DESK_BG: object = { backgroundColor: '#242019', backgroundImage: noise(0.025) }

export function PaperSheet({
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

export function PaperSwatchRow({ label, tones }: { label: string; tones: readonly string[] }) {
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

// Re-exported so consumers can build the categorical-palette-on-paper demo.
export { categoricalPalette, primitiveRamps, getSemanticColors }

// A 5-plane ramp shown as a solid strip with per-plane L* + step ΔL* — so you can
// see the SEPARATION (ΔL*) is identical while only the TEMPERATURE changes.
export function RampBar({
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
              style={{
                width: 104,
                height: 88,
                backgroundColor: p,
                padding: 8,
                justifyContent: 'flex-end',
              }}
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

// WARMTH CURVE candidates — the earlier warm ramps tie warmth to lightness, so the
// BRIGHT planes read warmest (the "tan at the top" the eye caught). These decouple
// it: `grows` keeps that curve, `flat` holds one warmth on every plane, `tapered`
// starts warm and cools toward the highlights.
export const WARMTH_CANDIDATES: { name: string; note: string; s: number; e: number }[] = [
  { name: 'Neutral', note: 'R−B 0 — reference', s: 0, e: 0 },
  { name: 'Warm · faint (grows 1→3.5)', note: 'between neutral and subtle', s: 1, e: 3.5 },
  {
    name: 'Warm · subtle (grows 2→7) — current',
    note: 'today’s subtle; brights curve tan',
    s: 2,
    e: 7,
  },
  {
    name: 'Warm · flat (constant 3.5)',
    note: 'same warmth every plane; brights stay put',
    s: 3.5,
    e: 3.5,
  },
  { name: 'Warm · tapered (5→2)', note: 'warm base, near-neutral highlights', s: 5, e: 2 },
]

// One dense lockup (top bar · rail w/ session list · stage · live card · nested
// chip · metric tiles), rendered through a SKIN so the SAME markup can be shown
// as the structural `hairline` system OR the `paper` accent aesthetic.
export interface Skin {
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
export const HAIR = { borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
export const SESSION_ROWS: [string, number, number][] = [
  ['Smith Bench', 3, 3],
  ['Cable Row', 2, 3],
  ['Bayesian Curl', 0, 3],
  ['French Press', 0, 3],
  ['Lat Raise', 0, 2],
]

// Structural skin: flat planes off the base ramp + one alpha-white hairline.
export function hairlineSkin(ramp: string[]): Skin {
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
export function paperSkin(w: number): Skin {
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
    ink: {
      primary: '#F4F1EC',
      secondary: 'rgba(255,255,255,0.72)',
      tertiary: 'rgba(255,255,255,0.5)',
    },
    dotOff: t(PAPER_TONES.lighter),
  }
}

// Paper skin driven by a warmth CURVE: each plane's R−B is set from its own
// lightness (desk = startRB, brightest sheet = endRB), so `tapered` keeps the
// bright hero card/chip near-neutral while the shadows stay warm.
export function paperSkinCurve(startRB: number, endRB: number): Skin {
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
    ink: {
      primary: '#F4F1EC',
      secondary: 'rgba(255,255,255,0.72)',
      tertiary: 'rgba(255,255,255,0.5)',
    },
    dotOff: t(PAPER_TONES.lighter),
  }
}

export function Lockup({ skin }: { skin: Skin }) {
  const ink = skin.ink
  const eyebrow = (s: string) => (
    <Text style={{ color: ink.tertiary, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
      {s}
    </Text>
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
      <View
        style={{
          borderRadius: 10,
          padding: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...skin.bar,
        }}
      >
        <Text style={{ color: ink.primary, fontSize: 14, fontWeight: '700' }}>
          Upper Body · Push/Pull
        </Text>
        <Text style={{ color: ink.secondary, fontSize: 12 }}>34:12 · 6 exercises</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ width: 190, borderRadius: 10, padding: 12, gap: 10, ...skin.rail }}>
          {eyebrow('SESSION')}
          {SESSION_ROWS.map(([name, done, total]) => (
            <View key={name} style={{ gap: 5 }}>
              <Text style={{ color: done > 0 ? ink.primary : ink.tertiary, fontSize: 12 }}>
                {name}
              </Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {Array.from({ length: total }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 16,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: i < done ? '#FF7900' : skin.dotOff,
                    }}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
        <View style={{ flex: 1, borderRadius: 10, padding: 12, gap: 10, ...skin.stage }}>
          {eyebrow('LIVE')}
          <View style={{ borderRadius: 10, padding: 14, gap: 6, ...skin.card }}>
            <Text style={{ color: ink.primary, fontSize: 18, fontWeight: '700' }}>
              Seated Cable Row
            </Text>
            <Text style={{ color: ink.secondary, fontSize: 13 }}>set 2 · 8 reps · 0.42 m/s</Text>
            <View
              style={{
                alignSelf: 'flex-start',
                marginTop: 2,
                borderRadius: 999,
                paddingVertical: 4,
                paddingHorizontal: 10,
                ...skin.chip,
              }}
            >
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

// WARMTH CURVES × AT SCALE (paper) — the two curves the eye asked for, rendered
// as the full paper lockup so warmth is judged on the surfaces you actually read.
export const CURVE_AT_SCALE: { name: string; skin: Skin }[] = [
  { name: 'Neutral (reference)', skin: paperSkinCurve(0, 0) },
  { name: 'Warm · faint (grows 1→3.5)', skin: paperSkinCurve(1, 3.5) },
  { name: 'Warm · subtle (grows, ≈2→7)', skin: paperSkin(0.1) },
  { name: 'Warm · medium (grows, ≈3.5→13)', skin: paperSkin(0.18) },
  { name: 'Warm · tapered (5→2) — warm shadows, cool highlights', skin: paperSkinCurve(5, 2) },
]

// The layered-paper accent across the 3 finalists. Neutral = "cardstock /
// concrete" (colder, clinical); warm-subtle = greige; warm-medium = "kraft".
// All three are LIGHTNESS-matched (one template, re-temperatured) so only warmth
// changes. Judge which desk + sheets feels like a premium object.
export function PaperCollage({
  tones,
  desk,
  accent,
}: {
  tones: string[]
  desk: string
  accent: string
}) {
  return (
    <View
      style={
        {
          width: 300,
          height: 250,
          borderRadius: 12,
          padding: 4,
          backgroundColor: desk,
          backgroundImage: noise(0.025),
          position: 'relative',
        } as ViewStyle
      }
    >
      <PaperSheet tone={tones[1]} w={190} h={150} left={12} top={54} rotate={-3} />
      <PaperSheet tone={tones[0]} w={200} h={168} left={64} top={10} rotate={2}>
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
        <Text style={{ color: '#F4F1EC', fontSize: 16, fontWeight: '700' }}>Seated Cable Row</Text>
        <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12 }}>
          set 2 · 8 reps · 0.42 m/s
        </Text>
      </PaperSheet>
      <PaperSheet tone={accent} w={116} h={92} left={172} top={132} rotate={-1}>
        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
          LOAD
        </Text>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>75</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>lb · +5</Text>
      </PaperSheet>
    </View>
  )
}

export const PAPER_SUBTITLE: Record<string, string> = {
  Neutral: 'cardstock / concrete',
  'Warm · subtle': 'greige',
  'Warm · medium': 'kraft',
}

// ===========================================================================
// ALPHA LAYERING helper — the "elevation = one base + white-overlay steps" model.
// ===========================================================================

export const OVERLAY_ALPHAS = [0, 0.06, 0.12, 0.18, 0.24]
export function AlphaStrip({
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
            <View
              key={i}
              style={{
                width: 118,
                height: 78,
                backgroundColor: p,
                padding: 8,
                justifyContent: 'flex-end',
              }}
            >
              <Text style={{ color: ink, fontSize: 11, fontWeight: '600' }}>{p.toUpperCase()}</Text>
              <Text style={{ color: ink, fontSize: 10, opacity: 0.8 }}>R−B {r - b}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

// ===========================================================================
// SURFACE RAMP SYSTEM — the one formula the shipped tokens are derived from.
// See the locked-decision block in `Surface.exploration.stories.tsx` for the
// full rationale; this is the pure derivation function.
// ===========================================================================

export interface SurfacePlane {
  name: string
  role: string
  L: number
  rb: number
  hex: string
}
export function deriveSurfaceRamp(
  shellL = 9,
  // S-3 re-space (shipped in @titan-design/react-ui@0.10.0): the top three steps
  // were widened from the original 2.5/2/1.5 taper — elevated/raised/overlay were
  // sub-JND and read as one plane. These defaults now reproduce the SHIPPED tokens
  // exactly: inset #13100D (L*4.5) · background #1C1916 (L*9) · base #252321 (L*13.5)
  // · elevated #2C2A28 (L*17) · raised #31302F (L*20) · overlay #373635 (L*22.5).
  steps = [4.5, 3.5, 3, 2.5],
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

// ===========================================================================
// TOP-BAR TREATMENTS + FRAME/RECESS helpers — later exploration thread (shell
// bezel / top-bar chrome), not one of the four §-locked decisions above. Kept
// here unreviewed — see the (unreviewed) stories that use these.
// ===========================================================================

export const HAIRLINE = 'rgba(255,255,255,0.09)'
export function NavCol({ full }: { full?: boolean }) {
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
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: '#FF7900',
            transform: [{ rotate: '45deg' }],
            marginBottom: 4,
          }}
        />
      )}
      <Text style={{ color: '#FF7900', fontSize: 10, fontWeight: '700' }}>LIVE</Text>
      <Text style={{ color: TEXT.tertiary, fontSize: 10 }}>HIST</Text>
      <Text style={{ color: TEXT.tertiary, fontSize: 10 }}>PLAN</Text>
    </View>
  )
}
export function TopBarRow({ barStyle }: { barStyle: object }) {
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
export function ContentPane({ note }: { note: string }) {
  const c = getSemanticColors('dark')
  return (
    <View style={{ flex: 1, backgroundColor: c['surface-base'], padding: 18 }}>
      <Text style={{ color: '#F3F4F6', fontSize: 22, fontWeight: '700' }}>Cable Chest Press</Text>
      <Text style={{ color: TEXT.secondary, fontSize: 13, marginTop: 4 }}>
        content plane · surface-base
      </Text>
      <Text style={{ color: TEXT.tertiary, fontSize: 12, marginTop: 10 }}>{note}</Text>
    </View>
  )
}

// `spine` = left nav is FULL-HEIGHT (the frame spine) and the top bar spans only
// the content column — so the bar's bottom only ever meets `base`, no nav mismatch.
// Default = the current full-width bar (bar spans over the darker nav too).
export function TopBarDemo({
  label,
  barStyle,
  spine,
}: {
  label: string
  barStyle: object
  spine?: boolean
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

// A recess that's MORE aggressive at the top opening than down the left: a top
// rim-light lip + a top inner shadow (alpha `a`) + a subtler LEFT inner shadow
// (alpha `la`). `o/b/sp` = offset / blur / spread → the crispness knob (small blur
// + tight spread = crisp edge; large blur = soft/wide). None on the screen-edge sides.
export function recessShadow(
  o: number,
  b: number,
  sp: number,
  a: number,
  la: number,
  rim: number
): string {
  return [
    `inset 0 1px 0 rgba(255,255,255,${rim})`, // top bezel highlight (the lit lip of the opening)
    `inset 0 ${o}px ${b}px ${sp}px rgba(0,0,0,${a})`, // top inner shadow (stronger)
    `inset ${o}px 0 ${b}px ${sp}px rgba(0,0,0,${la})`, // left inner shadow (quieter)
  ].join(', ')
}

export function FrameDemo({
  label,
  bezel,
  contentStyle,
  grain,
  hairlines = 'none',
}: {
  label: string
  bezel: string
  contentStyle: object
  grain?: boolean
  /** 'topbar' = line under the top bar; 'all' = that + nav→content line; 'nav-top' = ONLY a line at the top of the nav column. */
  hairlines?: 'none' | 'topbar' | 'all' | 'nav-top'
}) {
  const c = getSemanticColors('dark')
  const HAIRC = 'rgba(255,255,255,0.09)'
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
        {/* top bar — bezel; bottom hairline separates it from the nav below-left */}
        <View
          style={{
            height: 46,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            gap: 10,
            borderBottomWidth: hairlines === 'topbar' || hairlines === 'all' ? 1 : 0,
            borderColor: HAIRC,
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
        {/* row: nav (bezel) + recessed content well */}
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View
            style={{
              width: 56,
              alignItems: 'center',
              paddingTop: 14,
              gap: 16,
              borderRightWidth: hairlines === 'all' ? 1 : 0,
              borderTopWidth: hairlines === 'nav-top' ? 1 : 0,
              borderColor: HAIRC,
            }}
          >
            <Text style={{ color: '#FF7900', fontSize: 10, fontWeight: '700' }}>LIVE</Text>
            <Text style={{ color: TEXT.tertiary, fontSize: 10 }}>HIST</Text>
            <Text style={{ color: TEXT.tertiary, fontSize: 10 }}>PLAN</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: c['surface-base'], ...contentStyle }}>
            <View style={{ padding: 18 }}>
              <Text style={{ color: '#F3F4F6', fontSize: 22, fontWeight: '700' }}>
                Cable Chest Press
              </Text>
              <Text style={{ color: TEXT.secondary, fontSize: 13, marginTop: 4 }}>
                content well · surface-base
              </Text>
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
