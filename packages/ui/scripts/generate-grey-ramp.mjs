/**
 * Regenerate the unified warm-neutral grey ramp (TD-07.14).
 *
 *   node scripts/generate-grey-ramp.mjs          # print the ramp + the token block
 *   node scripts/generate-grey-ramp.mjs --check  # verify primitives.ts still matches
 *
 * This ramp was re-derived from scratch four separate times before it was ever
 * committed, because only the hexes were ever passed along and the REASONING for
 * the odd step numbers (975, 850, 875) lived in a chat log. So the derivation
 * lives here, next to the values, and `--check` runs in CI.
 *
 * Derived from the v3 generator in
 * coordination/design-explorations/foundations/warm-grey-ramp/grey-ramp-v3.mjs
 * (the exploration HTML report is dropped; the math is verbatim). The rejected
 * v1 and v2 cuts are preserved there too — check before "improving" this.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

// ── sRGB(hex) <-> CIELAB (D65) ──────────────────────────────────────────────
const srgb2lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const lin2srgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const hex2rgb = (h) => {
  const s = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255)
}
function hex2lab(hex) {
  const [r, g, b] = hex2rgb(hex).map(srgb2lin)
  let X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
  const Y = r * 0.2126729 + g * 0.7151522 + b * 0.072175
  let Z = r * 0.0193339 + g * 0.119192 + b * 0.9503041
  X /= 0.95047
  Z /= 1.08883
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const [fx, fy, fz] = [f(X), f(Y), f(Z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
function lab2hex(L, a, b) {
  const fy = (L + 16) / 116
  const [fx, fz] = [fy + a / 500, fy - b / 200]
  const fi = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787)
  const [X, Y, Z] = [0.95047 * fi(fx), fi(fy), 1.08883 * fi(fz)]
  const rgb = [
    X * 3.2404542 - Y * 1.5371385 - Z * 0.4985314,
    -X * 0.969266 + Y * 1.8760108 + Z * 0.041556,
    X * 0.0556434 - Y * 0.2040259 + Z * 1.0572252,
  ]
  return (
    '#' +
    rgb
      .map((c) => Math.round(clamp(lin2srgb(clamp(c))) * 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}
const warmth = (hex) => {
  const [r, , b] = hex2rgb(hex).map((c) => c * 255)
  return Math.round(r - b)
}
const Lof = (hex) => +hex2lab(hex)[0].toFixed(1)

// ── the canonical L* grid: median of the 7 chromatic ramps, per step ────────
// Read from primitives.ts rather than duplicated, so re-tuning a chromatic ramp
// re-tunes the greys with it instead of silently desyncing them.
const PRIMITIVES = join(HERE, '../src/theme/tokens/primitives.ts')
const src = readFileSync(PRIMITIVES, 'utf8')

function parseRamps(text) {
  const block = text.slice(text.indexOf('export const primitiveRamps'))
  const ramps = {}
  for (const hue of ['red', 'orange', 'amber', 'green', 'cyan', 'blue', 'magenta']) {
    const m = block.match(new RegExp(`\\b${hue}:\\s*\\{([^}]*)\\}`))
    if (!m) throw new Error(`could not parse primitiveRamps.${hue}`)
    ramps[hue] = Object.fromEntries(
      [...m[1].matchAll(/(\d+):\s*'(#[0-9A-Fa-f]{6})'/g)].map(([, k, v]) => [k, v]),
    )
  }
  return ramps
}
const primitiveRamps = parseRamps(src)

const CH_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const median = (arr) => {
  const s = [...arr].sort((x, y) => x - y)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const canonL = Object.fromEntries(
  CH_STEPS.map((st) => [
    st,
    +median(Object.values(primitiveRamps).map((r) => hex2lab(r[st])[0])).toFixed(1),
  ]),
)
const CH_FLOOR = canonL[950]

// ── the fixed anchors: shipped surface hexes, promoted to ramp steps ────────
// NO `inset`. It was ΔE 1.10 from the frame — an imperceptible duplicate, which
// is why `<Surface pressed>` (surface − 1) kept collapsing into it. Retired, not
// renamed; `975` is the floor.
const PLANES = {
  'warm-silver': '#D4D1CE',
  'surface-overlay': '#373635',
  'surface-raised': '#31302F',
  'surface-elevated': '#2C2A28',
  'surface-base': '#252321',
  'background-base': '#1C1916',
  'background-frame': '#100D0A',
}

/** Warm chroma (a*, b*) for a generated step, interpolated between the anchors. */
const anchors = Object.values(PLANES)
  .map((h) => hex2lab(h))
  .sort((p, q) => p[0] - q[0])
function warmAB(L) {
  if (L <= anchors[0][0]) return [anchors[0][1], anchors[0][2]]
  const top = anchors[anchors.length - 1]
  if (L >= top[0]) return [top[1], top[2]]
  for (let i = 0; i < anchors.length - 1; i++) {
    const [a, b] = [anchors[i], anchors[i + 1]]
    if (L >= a[0] && L <= b[0]) {
      const f = (L - a[0]) / (b[0] - a[0])
      return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
    }
  }
  return [1, 3]
}

// [step, canonical step to take L* from | null, exact plane | null]
const DEF = [
  ['50', 50, null],
  ['100', 100, null],
  ['200', null, 'warm-silver'],
  ['300', 300, null],
  ['400', 400, null],
  ['500', 500, null],
  ['600', 600, null],
  ['700', 700, null],
  ['800', 800, null],
  ['850', null, 'surface-overlay'],
  ['875', null, 'surface-raised'],
  ['900', null, 'surface-elevated'],
  ['925', null, 'surface-base'],
  ['950', null, 'background-base'],
  ['975', null, 'background-frame'],
]

const ramp = DEF.map(([name, cstep, plane]) => {
  if (plane) {
    const hex = PLANES[plane]
    return { name, hex, L: Lof(hex), plane, exact: true }
  }
  const L = canonL[cstep]
  const [a, b] = warmAB(L)
  let hex = lab2hex(L, a, b)
  // Guard: every step must read warm. Nudge a*/b* until R−B clears +2.
  let guard = 0
  while (warmth(hex) < 2 && guard < 14) {
    hex = lab2hex(L, a + 0.3, b + 0.6)
    guard++
  }
  return { name, hex, L: Lof(hex), plane: null, exact: false }
})

// ── output ──────────────────────────────────────────────────────────────────
const tokenBlock = ramp
  .map((s) => {
    const w = warmth(s.hex)
    const note = s.exact ? `  — ${s.plane}` : s.name === '800' ? '  — generated bridge' : ''
    return `  ${s.name}: '${s.hex}', // L*${String(s.L).padEnd(5)} W${w}${note}`
  })
  .join('\n')

if (process.argv.includes('--check')) {
  const failures = []
  for (const s of ramp) {
    const re = new RegExp(`^\\s*${s.name}: '(#[0-9A-F]{6})',`, 'm')
    const m = src.slice(src.indexOf('export const greyRamp')).match(re)
    if (!m) failures.push(`greyRamp.${s.name} missing from primitives.ts`)
    else if (m[1] !== s.hex) failures.push(`greyRamp.${s.name} is ${m[1]}, generator says ${s.hex}`)
  }
  if (failures.length) {
    console.error('grey ramp DRIFTED from its generator:')
    for (const f of failures) console.error('  ✗ ' + f)
    console.error('\nRe-run without --check and paste the block, or fix the generator.')
    process.exit(1)
  }
  console.log(`✓ greyRamp matches the generator (${ramp.length} steps)`)
} else {
  console.log(`\nchromatic floor (canonical 950 median L*): ${CH_FLOOR}`)
  console.log(`${ramp.filter((s) => s.L < CH_FLOOR).length} steps sit BELOW it — why 975 exists.\n`)
  console.log('export const greyRamp = {')
  console.log(tokenBlock)
  console.log('} as const\n')
}
