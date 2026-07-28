/**
 * Surface MATERIALS — the treatments layered on top of the flat grey ramp.
 *
 * The ramp says how deep a plane sits. This says what it is made of. Two
 * materials, deliberately: a matte PAPER sheet for hero surfaces, and a recessed
 * INSET WELL for grouped or awaiting-data regions.
 *
 * SCOPE, and it is a hard rule rather than a preference: paper goes on hero
 * surfaces only — the live card, the LOAD/verdict chip, the rest hero. The
 * "everything is a paper card" look is explicitly NOT the model; it was an
 * over-application built to find the ceiling. There are no LEVELS of paper. One
 * treatment, used sparingly, or the texture stops meaning anything.
 *
 * Second hard rule: paper fills take DEEP/MUTED tones only (a ramp step, or a
 * categorical `dark` variant). Vivid and neon colours are ink ON paper — never
 * the paper itself.
 *
 * PLATFORM: `backgroundImage` and multi-layer `boxShadow` are web/RNW only. On
 * native these are ignored and the surface falls back to its flat fill, which is
 * why every material here keeps `backgroundColor` load-bearing on its own. A
 * material must never be the only thing carrying meaning.
 *
 * See coordination/design-explorations/surface-system-north-star.md §4.
 */
import type { ViewStyle } from 'react-native'
import { getSemanticColors } from './tokens/semantic'

const c = getSemanticColors('dark')

// ── colour math ─────────────────────────────────────────────────────────────

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h
  const rgb: [number, number, number] = [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
  return rgb.some(Number.isNaN) ? null : rgb
}

/** sRGB perceived luminance (0 dark … 1 bright), Rec.601 weights. */
function perceivedLuminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0.5
  const [r, g, b] = rgb
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

const srgb2lin = (c8: number) => {
  const s = c8 / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const lin2srgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const fLab = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
const fInv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787)

/** CIELAB (D65) for a hex. Used so the tonal fill can be specified in ΔL*. */
function hexToLab(hex: string): [number, number, number] {
  const rgb = parseHex(hex)
  if (!rgb) return [50, 0, 0]
  const [r, g, b] = rgb.map(srgb2lin)
  const X = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047
  const Y = r * 0.2126729 + g * 0.7151522 + b * 0.072175
  const Z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883
  const [fx, fy, fz] = [fLab(X), fLab(Y), fLab(Z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

function labToHex(L: number, a: number, b: number): string {
  const fy = (L + 16) / 116
  const [fx, fz] = [fy + a / 500, fy - b / 200]
  const [X, Y, Z] = [0.95047 * fInv(fx), fInv(fy), 1.08883 * fInv(fz)]
  const rgb = [
    X * 3.2404542 - Y * 1.5371385 - Z * 0.4985314,
    -X * 0.969266 + Y * 1.8760108 + Z * 0.041556,
    X * 0.0556434 - Y * 0.2040259 + Z * 1.0572252,
  ]
  return (
    '#' +
    rgb
      .map((v) => Math.round(clamp01(lin2srgb(clamp01(v))) * 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

/** Shift a colour by ΔL* in CIELAB, holding its hue and chroma. */
function shiftL(hex: string, dL: number): string {
  const [L, a, b] = hexToLab(hex)
  return labToHex(Math.max(0, Math.min(100, L + dL)), a, b)
}

// ── grain ───────────────────────────────────────────────────────────────────

/**
 * Grain opacity for a tone, scaled by perceived brightness.
 *
 * A fixed opacity reads hot on a dark plane and vanishes on a bright one, so
 * darker tones get a whisper and brighter tones keep full texture. Anchored so a
 * dark chip (lum ≈ 0.13) lands ≈ 0.06 and a bright bar (lum ≈ 0.58) lands ≈ 0.20.
 * Above roughly 0.05α on a mid tone it starts reading as "dirty" rather than
 * matte, which is what the clamp is protecting.
 *
 * This is the ONE curve all grain goes through — a card and a bar carry
 * proportional, not identical, texture. That is what makes them read as the same
 * material.
 */
export function grainOpacityForTone(baseColor: string): number {
  return Math.min(0.24, Math.max(0.04, 0.02 + 0.31 * perceivedLuminance(baseColor)))
}

/**
 * The matte grain tile as a `backgroundImage` url — one shared `feTurbulence`
 * fractal-noise tile, painted once, NEVER animated. Pair with
 * `backgroundColor: baseColor`.
 */
export function grainForTone(baseColor: string): string {
  const op = grainOpacityForTone(baseColor).toFixed(3)
  return (
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E` +
    `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E` +
    `%3Crect width='120' height='120' filter='url(%23n)' opacity='${op}'/%3E%3C/svg%3E")`
  )
}

/**
 * A ~0.02α noise tile used purely as ANTI-BANDING dither.
 *
 * Distinct from {@link grainForTone} in intent and strength: grain is a visible
 * matte texture, this is below the threshold of being seen at all. It exists
 * because a low-contrast vertical gradient across a wide plane bands into visible
 * steps on an 8-bit panel, and a whisper of noise breaks the step edges up.
 *
 * Only worth applying where a gradient actually spans real width — {@link
 * paperSheet} already includes it via {@link tonalFill}. On a surface with no
 * gradient there is nothing to band, and this is dead weight.
 */
export function ditherTile(): string {
  return (
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E` +
    `%3Cfilter id='d'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E` +
    `%3Crect width='140' height='140' filter='url(%23d)' opacity='0.02'/%3E%3C/svg%3E")`
  )
}

// ── tonal fill ──────────────────────────────────────────────────────────────

/**
 * The tonal half of the paper recipe: a vertical top-lighter → bottom-darker
 * gradient across the fill, total span ΔL* ≤ 3.
 *
 * Three is deliberate and is close to a just-noticeable difference. The point is
 * not to be seen as a gradient — it is to stop a large plane reading as a flat
 * digital rectangle, by giving it the faint sense of light falling from above
 * that every physical sheet has. Push it past ~4 and it stops being material and
 * starts being a decorative gradient, which is the thing the exploration rejected.
 */
export function tonalFill(tone: string): string {
  const top = shiftL(tone, +1.5)
  const bottom = shiftL(tone, -1.5)
  return `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`
}

// ── the materials ───────────────────────────────────────────────────────────

/**
 * A matte PAPER hero sheet: tonal fill + brightness-scaled grain + anti-banding
 * dither + a crisp top rim-light + one soft contact shadow.
 *
 * The contact shadow is the ONE place a drop-shadow is still correct on a dark
 * surface: it is large, soft, and describes a sheet lying on a plane rather than
 * trying to encode hierarchy. Inline depth is the hairline's job.
 *
 * Defaults to `surface-raised` so a same-toned card laid inside reads as one
 * continuous sheet rather than a seam.
 *
 * HERO SURFACES ONLY, MUTED TONES ONLY — see the module header.
 */
export function paperSheet(tone: string = c['surface-raised']): ViewStyle {
  return {
    backgroundColor: tone,
    // Layered front-to-back: dither over grain over the tonal fill.
    backgroundImage: `${ditherTile()}, ${grainForTone(tone)}, ${tonalFill(tone)}`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 22px rgba(0,0,0,0.50)',
  } as unknown as ViewStyle
}

/**
 * A recessed INSET WELL: a tone pressed BELOW the surrounding plane, cut in by an
 * inner top shadow with a faint light line on the floor.
 *
 * The bottom rim is the load-bearing half. A dark inset alone just reads as a
 * darker rectangle; it is the light catching the floor that says "this is below
 * the surface" — which is why the treatment survives at 16px where a full paper
 * treatment does not.
 *
 * Note this is a MATERIAL, and independent of the surface LEVEL named `inset`
 * that was retired in TD-07.14. A well is something you apply; a level is
 * somewhere you sit.
 */
export function insetWell(tone: string = c['surface-input']): ViewStyle {
  return {
    backgroundColor: tone,
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.04)',
  } as unknown as ViewStyle
}

/**
 * Paper for a COLORED BAR — the same material as {@link paperSheet}, tuned for a
 * small saturated element: grain + top rim-light + a contact shadow cast past the
 * bar's leading edge, so a filled bar reads as a physical block that has travelled.
 *
 * No tonal fill or dither here: a bar is too narrow for a ΔL* 3 gradient to read,
 * and too narrow to band.
 *
 * `flip` = a vertically mirrored (`scaleY(-1)`) plot, i.e. the `down` wing of a
 * diverging chart. The contact shadow's y-offset is pre-inverted so the mirror
 * lands it pointing AWAY from the shared axis rather than up across it, and the
 * top rim-light is DROPPED — mirrored it would sit on the axis edge and read
 * wrong, so grain and shadow carry the material alone.
 */
export function barPaper(color: string, flip = false): ViewStyle {
  return {
    backgroundImage: grainForTone(color),
    boxShadow: flip
      ? '0 -6px 16px rgba(0,0,0,0.45)'
      : 'inset 0 1.5px 0 rgba(255,255,255,0.22), 0 6px 16px rgba(0,0,0,0.45)',
  } as unknown as ViewStyle
}
