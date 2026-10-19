// Colour maths for the audit probes, over the computed strings collectLayout reports. The OKLab and
// composite maths copy src/theme/color-checks.ts, which plain node cannot import; colour.test.mjs
// pins the two together.

const HEX = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i
const RGB = /^rgba?\(([^)]+)\)$/i

const channel = (raw) => (raw.endsWith('%') ? (parseFloat(raw) / 100) * 255 : parseFloat(raw))
const alphaOf = (raw) => (raw === undefined ? 1 : raw.endsWith('%') ? parseFloat(raw) / 100 : +raw)

function parseHex(digits) {
  const full = digits.length <= 4 ? [...digits].map((d) => d + d).join('') : digits
  const [r, g, b, a = 255] = full.match(/../g).map((p) => parseInt(p, 16))
  return { r, g, b, a: a / 255 }
}

/** `{ r, g, b, a }` (channels 0-255, alpha 0-1) of a hex or `rgb[a]()` string, else null. */
export function parseColour(value) {
  if (typeof value !== 'string') return null
  const s = value.trim()
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  const hex = HEX.exec(s)
  if (hex) return parseHex(hex[1])
  const rgb = RGB.exec(s)
  if (!rgb) return null
  const parts = rgb[1].split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3 || parts.length > 4) return null
  const [r, g, b] = parts.slice(0, 3).map(channel)
  const colour = { r, g, b, a: alphaOf(parts[3]) }
  return Object.values(colour).every(Number.isFinite) ? colour : null
}

const asColour = (value) => (typeof value === 'string' ? parseColour(value) : value)
const byte = (v) =>
  Math.round(Math.min(255, Math.max(0, v)))
    .toString(16)
    .padStart(2, '0')

/** Lowercase `#rrggbb` of a colour string or object; alpha is dropped. */
export function toHex(value) {
  const c = asColour(value)
  return c ? `#${byte(c.r)}${byte(c.g)}${byte(c.b)}` : null
}

/** The opaque `#rrggbb` that `top` shows over `base`, blended in sRGB as a browser paints it. */
export function compositeOver(top, base) {
  const [t, b] = [asColour(top), asColour(base)]
  if (!t || !b) return null
  const mix = (k) => ((t[k] / 255) * t.a + (b[k] / 255) * (1 - t.a)) * 255
  return toHex({ r: mix('r'), g: mix('g'), b: mix('b') })
}

const toLinear = (c) => (c >= 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92)

/** OKLab `[L, a, b]` of a colour, ignoring alpha. */
export function toOklab(value) {
  const c = asColour(value)
  if (!c) return null
  const [r, g, b] = [c.r, c.g, c.b].map((v) => toLinear(v / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** OKLCh `{ L, C, h }` of a colour, with `h` in degrees from 0 to 360. */
export function toOklch(value) {
  const lab = toOklab(value)
  if (!lab) return null
  const [L, a, b] = lab
  const h = (Math.atan2(b, a) * 180) / Math.PI
  return { L, C: Math.hypot(a, b), h: h < 0 ? h + 360 : h }
}

/** Perceived difference as OKLab Euclidean distance times 100. */
export function deltaE(x, y) {
  const [a, b] = [toOklab(x), toOklab(y)]
  if (!a || !b) return null
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100
}

// Commas inside rgba() do not separate shadow layers.
function splitTopLevel(value) {
  const out = []
  let depth = 0
  let start = 0
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++
    else if (value[i] === ')') depth--
    else if (value[i] === ',' && depth === 0) {
      out.push(value.slice(start, i))
      start = i + 1
    }
  }
  return [...out, value.slice(start)].map((s) => s.trim()).filter(Boolean)
}

function parseLayer(layer) {
  const colourMatch = layer.match(/rgba?\([^)]*\)|#[\da-f]+\b/i)
  const rest = colourMatch ? layer.replace(colourMatch[0], ' ') : layer
  const words = rest.split(/\s+/).filter(Boolean)
  const [x = 0, y = 0, blur = 0, spread = 0] = words
    .filter((w) => w !== 'inset')
    .map((w) => parseFloat(w))
  return {
    inset: words.includes('inset'),
    x,
    y,
    blur,
    spread,
    colour: colourMatch ? parseColour(colourMatch[0]) : null,
  }
}

/** Layers `{ inset, x, y, blur, spread, colour }` of a computed `box-shadow`; `none` gives []. */
export function parseShadow(value) {
  if (!value || value.trim() === 'none') return []
  return splitTopLevel(value).map(parseLayer)
}
