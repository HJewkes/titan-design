// Colour interpolation in Oklab on resolved colour values.
//
// The colour-space conversions are ported from Theatre.js (`packages/utils/src/color.ts`, the
// `srgbToLinearSrgb`, `linearSrgbToOklab`, `oklabToLinearSrgb` and `linearSrgbToSrgb` functions,
// and the lerp in `packages/core/src/propTypes/index.ts` `_interpolateRgba`, at commit 6ea82b93),
// Copyright Theatre.js contributors, licensed under the Apache License 2.0; see `LICENSE-theatre`
// beside this file. The Oklab matrices are Björn Ottosson's. Changes from the source: the hex
// parsing and formatting are titan's own, the lerp takes titan's `interpolate` options, and
// non-hex input throws instead of falling back to black.
import { interpolate, type InterpolateOptions } from './interpolate'
import { linear, type Easing } from './easing'

interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

function parseHex(color: string): Rgba {
  const match = HEX.exec(color.trim())
  if (!match) {
    throw new RangeError(
      `interpolateColor: '${color}' is not a hex colour; resolve tokens first, e.g. getSemanticColors(mode)[token]`
    )
  }
  const digits = match[1] as string
  const full = digits.length <= 4 ? [...digits].map((d) => d + d).join('') : digits
  const channel = (i: number) => (i < full.length ? parseInt(full.slice(i, i + 2), 16) / 255 : 1)
  return { r: channel(0), g: channel(2), b: channel(4), a: channel(6) }
}

function toHexString({ r, g, b, a }: Rgba): string {
  const byte = (x: number) =>
    Math.round(Math.min(1, Math.max(0, x)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${byte(r)}${byte(g)}${byte(b)}${a < 1 ? byte(a) : ''}`
}

const toLinear = (x: number) => (x >= 0.04045 ? ((x + 0.055) / 1.055) ** 2.4 : x / 12.92)
const toGamma = (x: number) => (x >= 0.0031308 ? 1.055 * x ** (1 / 2.4) - 0.055 : 12.92 * x)

function srgbToOklab({ r, g, b, a }: Rgba): Rgba {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return {
    r: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    g: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    a,
  }
}

function oklabToSrgb({ r: L, g: A, b: B, a }: Rgba): Rgba {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return {
    r: toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a,
  }
}

/**
 * Maps `t` from the input range to a colour between two hex colours (`#rgb`, `#rgba`, `#rrggbb` or
 * `#rrggbbaa`), mixed in Oklab so the midpoint looks halfway rather than muddy. Returns `#rrggbb`, or
 * `#rrggbbaa` when the result is translucent. `ease` and `clamp` work as in `interpolate`.
 *
 * Token bypass: this mixes resolved values, not tokens. On web a token colour is a `var(--color-…)`
 * string, which throws here; resolve it with `getSemanticColors(mode)[token]` first, and the result is
 * then frozen to that mode, so it will not follow a live theme switch. Prefer cross-fading two layers
 * painted with token classes, and use this only where a single mixed value is unavoidable.
 */
export function interpolateColor(
  t: number,
  input: readonly [number, number],
  [from, to]: readonly [string, string],
  options: InterpolateOptions = {}
): string {
  const p = interpolate(t, input, [0, 1], options)
  const a = srgbToOklab(parseHex(from))
  const b = srgbToOklab(parseHex(to))
  const lerp = (x: number, y: number) => x + (y - x) * p
  return toHexString(
    oklabToSrgb({ r: lerp(a.r, b.r), g: lerp(a.g, b.g), b: lerp(a.b, b.b), a: lerp(a.a, b.a) })
  )
}

const TAU = 2 * Math.PI
/** Below this chroma a colour's hue is noise. */
const ACHROMATIC = 1e-4

function toOklch({ r: l, g: a, b, a: alpha }: Rgba) {
  return { l, c: Math.hypot(a, b), h: Math.atan2(b, a), alpha }
}

/** Options for `interpolateColorOklch`. */
export interface OklchInterpolateOptions extends InterpolateOptions {
  /** Applied to the eased progress for lightness only, e.g. to hold lightness while hue turns. */
  lightnessEase?: Easing
}

/**
 * Like `interpolateColor`, but mixed in OKLCH: lightness and chroma move in a straight line and the
 * hue turns along the shorter arc, so two saturated colours stay saturated through the midpoint
 * (orange to green passes yellow, not olive). An achromatic end takes the other end's hue. The same
 * token bypass applies: pass resolved hex values.
 */
export function interpolateColorOklch(
  t: number,
  input: readonly [number, number],
  [from, to]: readonly [string, string],
  { lightnessEase = linear, ...options }: OklchInterpolateOptions = {}
): string {
  const p = interpolate(t, input, [0, 1], options)
  const a = toOklch(srgbToOklab(parseHex(from)))
  const b = toOklch(srgbToOklab(parseHex(to)))
  const lerp = (x: number, y: number, q = p) => x + (y - x) * q
  const hueA = a.c < ACHROMATIC ? b.h : a.h
  const hueB = b.c < ACHROMATIC ? hueA : b.h
  const turn = ((((hueB - hueA) % TAU) + 3 * Math.PI) % TAU) - Math.PI
  const h = hueA + turn * p
  const c = lerp(a.c, b.c)
  return toHexString(
    oklabToSrgb({
      r: lerp(a.l, b.l, lightnessEase(p)),
      g: c * Math.cos(h),
      b: c * Math.sin(h),
      a: lerp(a.alpha, b.alpha),
    })
  )
}
