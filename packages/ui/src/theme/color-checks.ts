/**
 * Colour maths shared by the theme tests and the colour stories: WCAG contrast,
 * OKLab distance and Machado-2009 dichromacy simulation. Pure, no JSX.
 *
 * Every function takes `#RRGGBB` strings. Simulation and OKLab run in linear
 * light, so the gamma threshold below is load-bearing for all of them.
 */

export type CvdKind = 'deutan' | 'protan' | 'tritan'
type Vec3 = [number, number, number]

/** Machado-2009 dichromacy simulation matrices, severity 1.0, applied to linear RGB. */
export const CVD_MATRICES: Record<CvdKind, readonly number[]> = {
  deutan: [
    0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881,
  ],
  protan: [
    0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998,
  ],
  tritan: [
    1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039,
  ],
}

const hexToRgb = (hex: string): Vec3 => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as Vec3
}
const toLinear = (c: number) => (c >= 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92)
const toGamma = (c: number) =>
  c >= 0.0031308 ? 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055 : 12.92 * c
const toHex = (v: number) =>
  Math.round(Math.min(1, Math.max(0, v)) * 255)
    .toString(16)
    .padStart(2, '0')

const linearRgb = (hex: string): Vec3 => hexToRgb(hex).map(toLinear) as Vec3

const mulMatrix = (m: readonly number[], [r, g, b]: Vec3): Vec3 => [
  m[0] * r + m[1] * g + m[2] * b,
  m[3] * r + m[4] * g + m[5] * b,
  m[6] * r + m[7] * g + m[8] * b,
]

const oklabFromLinear = ([r, g, b]: Vec3): Vec3 => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

const oklabDistance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = linearRgb(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two solid colours, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const RGBA = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/

/**
 * The opaque `#RRGGBB` a colour shows over `baseHex`. A hex colour is already
 * opaque and comes back as it is; an `rgba(…)` one is blended in sRGB, the way
 * a browser paints it. Contrast needs two opaque colours, so measure this.
 */
export function compositeOver(color: string, baseHex: string): string {
  if (color.startsWith('#')) return color
  const match = RGBA.exec(color)
  if (!match) throw new Error(`expected #RRGGBB or rgba(…), got "${color}"`)
  const alpha = parseFloat(match[4] ?? '1')
  const base = hexToRgb(baseHex)
  const mixed = [1, 2, 3].map(
    (i, c) => (parseFloat(match[i]) / 255) * alpha + base[c] * (1 - alpha)
  )
  return '#' + mixed.map(toHex).join('').toUpperCase()
}

/** OKLab `[L, a, b]` of a colour. */
export function toOklab(hex: string): Vec3 {
  return oklabFromLinear(linearRgb(hex))
}

/** Perceived difference as OKLab Euclidean distance times 100. */
export function deltaE(a: string, b: string): number {
  return oklabDistance(toOklab(a), toOklab(b))
}

/** How `hex` appears to a viewer with the given dichromacy. */
export function simulateCvd(hex: string, kind: CvdKind): string {
  const out = mulMatrix(CVD_MATRICES[kind], linearRgb(hex)).map(toGamma)
  return '#' + out.map(toHex).join('')
}

/**
 * Worst-case perceived difference across deutan and protan. Red-green is the
 * binding case the palette solver optimises; tritan is deliberately excluded.
 * The simulated colour is not clamped to gamut, to match the solver. Pass
 * `['tritan']` to measure the tritan case that is printed but not gated.
 * `clampNegative` zeroes negative simulated channels first, the convention of
 * the TD-756 plan's measurement script.
 */
export function cvdDelta(
  a: string,
  b: string,
  kinds: readonly CvdKind[] = ['deutan', 'protan'],
  { clampNegative = false }: { clampNegative?: boolean } = {}
): number {
  const simulate = (hex: string, kind: CvdKind) => {
    const linear = mulMatrix(CVD_MATRICES[kind], linearRgb(hex))
    return oklabFromLinear(clampNegative ? (linear.map((c) => Math.max(0, c)) as Vec3) : linear)
  }
  return Math.min(...kinds.map((kind) => oklabDistance(simulate(a, kind), simulate(b, kind))))
}

/** The grey of equal WCAG luminance, for reading a palette's value structure. */
export function grayOfValue(hex: string): string {
  const channel = toHex(toGamma(relativeLuminance(hex)))
  return `#${channel}${channel}${channel}`.toUpperCase()
}

type Metric = (a: string, b: string) => number

/** Smallest `metric` over every pair of `colors`. */
export function minPairwise(colors: readonly string[], metric: Metric = cvdDelta): number {
  let worst = Infinity
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++)
      worst = Math.min(worst, metric(colors[i], colors[j]))
  }
  return worst
}

/** Smallest `metric` between neighbouring `colors`. */
export function minAdjacent(colors: readonly string[], metric: Metric = cvdDelta): number {
  let worst = Infinity
  for (let i = 1; i < colors.length; i++) worst = Math.min(worst, metric(colors[i - 1], colors[i]))
  return worst
}
