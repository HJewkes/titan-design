/**
 * Measures the vendored label faces from their WOFF2 files and writes `src/theme/font-metrics.json` beside the fonts:
 * the average advance of a label vocabulary and the x-height, per face and weight. Reads a WOFF2 (Brotli tables), maps
 * characters through cmap format 4, takes hmtx advances and applies the HVAR deltas for the weight (fvar + avar
 * normalisation). Kerning (GPOS) is not applied; it moves the average by well under 1 %.
 * Usage: node scripts/font-metrics.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliDecompressSync } from 'node:zlib'

const KNOWN_TAGS = ('cmap head hhea hmtx maxp name OS/2 post cvt  fpgm glyf loca prep CFF  VORG EBDT EBLC gasp hdmx kern LTSH PCLT VDMX ' +
  'vhea vmtx BASE GDEF GPOS GSUB EBSC JSTF MATH CBDT CBLC COLR CPAL SVG  sbix acnt avar bdat bloc bsln cvar fdsc feat fmtx fvar gvar hsty ' +
  'just lcar mort morx opbd prop trak Zapf Silf Glat Gloc Feat Sill').match(/.{4}\s?/g)!.map((t) => t.slice(0, 4))

type Tables = Map<string, Buffer>

/** The decompressed sfnt tables of a WOFF2 file. Only `glyf`/`loca` stay transformed, and neither is read here. */
export function woff2Tables(file: Buffer): Tables {
  if (file.toString('ascii', 0, 4) !== 'wOF2') throw new Error('not a WOFF2 file')
  let o = 48
  const base128 = () => {
    let v = 0
    for (let i = 0; i < 5; i++) {
      const byte = file[o++] as number
      v = v * 128 + (byte & 127)
      if (!(byte & 128)) return v
    }
    throw new Error('bad UIntBase128')
  }
  const dir: { tag: string; length: number }[] = []
  for (let i = 0; i < file.readUInt16BE(12); i++) {
    const flags = file[o++] as number
    const tag = (flags & 63) === 63 ? file.toString('ascii', o, (o += 4)) : (KNOWN_TAGS[flags & 63] as string)
    const version = flags >> 6
    const origLength = base128()
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0
    dir.push({ tag, length: transformed ? base128() : origLength })
  }
  const data = brotliDecompressSync(file.subarray(o, o + file.readUInt32BE(20)))
  let at = 0
  return new Map(dir.map(({ tag, length }) => [tag, data.subarray(at, (at += length))]))
}

const f2dot14 = (b: Buffer, o: number) => b.readInt16BE(o) / 16384

function cmap4(cmap: Buffer): (code: number) => number {
  for (let i = 0; i < cmap.readUInt16BE(2); i++) {
    const sub = cmap.readUInt32BE(8 + i * 8)
    if (cmap.readUInt16BE(4 + i * 8) === 3 && cmap.readUInt16BE(6 + i * 8) === 1 && cmap.readUInt16BE(sub) === 4) {
      const segs = cmap.readUInt16BE(sub + 6) / 2
      const ends = sub + 14
      const starts = ends + segs * 2 + 2
      const deltas = starts + segs * 2
      const ranges = deltas + segs * 2
      return (code) => {
        for (let s = 0; s < segs; s++) {
          if (code > cmap.readUInt16BE(ends + s * 2)) continue
          const start = cmap.readUInt16BE(starts + s * 2)
          if (code < start) return 0
          const range = cmap.readUInt16BE(ranges + s * 2)
          const delta = cmap.readInt16BE(deltas + s * 2)
          if (range === 0) return (code + delta) & 0xffff
          const g = cmap.readUInt16BE(ranges + s * 2 + range + (code - start) * 2)
          return g === 0 ? 0 : (g + delta) & 0xffff
        }
        return 0
      }
    }
  }
  throw new Error('no Windows Unicode BMP cmap (format 4)')
}

/** The weight axis value in normalised coordinates, through avar's segment map when there is one. */
function normalisedWeight(tables: Tables, weight: number): number {
  const fvar = tables.get('fvar') as Buffer
  const axes = fvar.readUInt16BE(4)
  for (let i = 0; i < fvar.readUInt16BE(8); i++) {
    const a = axes + i * fvar.readUInt16BE(10)
    if (fvar.toString('ascii', a, a + 4) !== 'wght') continue
    const [min, def, max] = [4, 8, 12].map((d) => fvar.readInt32BE(a + d) / 65536) as [number, number, number]
    const v = Math.min(max, Math.max(min, weight))
    const n = v < def ? (v - def) / (def - min) : v > def ? (v - def) / (max - def) : 0
    return avarMap(tables.get('avar'), i, n)
  }
  throw new Error('font has no wght axis')
}

function avarMap(avar: Buffer | undefined, axis: number, n: number): number {
  if (!avar) return n
  let o = 8
  for (let i = 0; i < axis; i++) o += 2 + avar.readUInt16BE(o) * 4
  const pairs = Array.from({ length: avar.readUInt16BE(o) }, (_, k) => [f2dot14(avar, o + 2 + k * 4), f2dot14(avar, o + 4 + k * 4)] as const)
  const hi = pairs.findIndex(([from]) => from >= n)
  if (hi <= 0) return hi === 0 ? (pairs[0] as readonly [number, number])[1] : n
  const [[f0, t0], [f1, t1]] = [pairs[hi - 1], pairs[hi]] as [readonly [number, number], readonly [number, number]]
  return t0 + ((n - f0) / (f1 - f0)) * (t1 - t0)
}

function regionScalars(store: Buffer, coord: number): number[] {
  const list = store.readUInt32BE(2)
  const axisCount = store.readUInt16BE(list)
  return Array.from({ length: store.readUInt16BE(list + 2) }, (_, r) => {
    const at = list + 4 + r * axisCount * 6
    const [start, peak, end] = [0, 2, 4].map((d) => f2dot14(store, at + d)) as [number, number, number]
    if (peak === 0 || coord === peak) return 1
    if (coord <= start || coord >= end) return 0
    return coord < peak ? (coord - start) / (peak - start) : (end - coord) / (end - peak)
  })
}

/** The delta of item (`outer`, `inner`) in an ItemVariationStore at normalised weight scalars. */
function storeDelta(store: Buffer, scalars: number[], outer: number, inner: number): number {
  const data = store.readUInt32BE(8 + outer * 4)
  const words = store.readUInt16BE(data + 2)
  const longWords = (words & 0x8000) !== 0
  const wordCount = words & 0x7fff
  const regions = Array.from({ length: store.readUInt16BE(data + 4) }, (_, k) => store.readUInt16BE(data + 6 + k * 2))
  const big = longWords ? 4 : 2
  const small = longWords ? 2 : 1
  const rowSize = wordCount * big + (regions.length - wordCount) * small
  let at = data + 6 + regions.length * 2 + inner * rowSize
  return regions.reduce((sum, region, k) => {
    const size = k < wordCount ? big : small
    const delta = store.readIntBE(at, size)
    at += size
    return sum + delta * (scalars[region] as number)
  }, 0)
}

/** HVAR's advance delta for a glyph at normalised weight `coord` (the weight is the font's only axis). */
function hvarDelta(hvar: Buffer, coord: number): (glyph: number) => number {
  const store = hvar.subarray(hvar.readUInt32BE(4))
  const scalars = regionScalars(store, coord)
  const map = hvar.readUInt32BE(8)
  return (glyph) => {
    let [outer, inner] = [0, glyph]
    if (map) {
      const format = hvar[map] as number
      const entry = hvar[map + 1] as number
      const count = format === 0 ? hvar.readUInt16BE(map + 2) : hvar.readUInt32BE(map + 2)
      const size = ((entry & 0x30) >> 4) + 1
      const innerBits = (entry & 0x0f) + 1
      const at = map + (format === 0 ? 4 : 6) + Math.min(glyph, count - 1) * size
      const value = hvar.readUIntBE(at, size)
      ;[outer, inner] = [value >> innerBits, value & ((1 << innerBits) - 1)]
    }
    return storeDelta(store, scalars, outer, inner)
  }
}

/** MVAR's delta for a metric tag (such as `xhgt`) at normalised weight `coord`; 0 when the font does not vary it. */
function mvarDelta(mvar: Buffer | undefined, tag: string, coord: number): number {
  if (!mvar) return 0
  const store = mvar.subarray(mvar.readUInt16BE(10))
  const size = mvar.readUInt16BE(6)
  for (let i = 0; i < mvar.readUInt16BE(8); i++) {
    const at = 12 + i * size
    if (mvar.toString('ascii', at, at + 4) === tag) {
      const outer = mvar.readUInt16BE(at + 4)
      if (outer === 0xffff) return 0
      return storeDelta(store, regionScalars(store, coord), outer, mvar.readUInt16BE(at + 6))
    }
  }
  return 0
}

export interface FaceAdvance {
  /** Mean advance per character over `labels`, in em. */
  avgAdvance: number
  /** The widest label's advance per character, in em. */
  worstAdvance: number
  worstLabel: string
}

export function measureAdvance(fontFile: string, weight: number, labels: readonly string[]): FaceAdvance {
  return advanceOf(woff2Tables(readFileSync(fontFile)), weight, labels)
}

function advanceOf(tables: Tables, weight: number, labels: readonly string[]): FaceAdvance {
  const head = tables.get('head') as Buffer
  const hhea = tables.get('hhea') as Buffer
  const hmtx = tables.get('hmtx') as Buffer
  const upem = head.readUInt16BE(18)
  const metrics = hhea.readUInt16BE(34)
  const glyphOf = cmap4(tables.get('cmap') as Buffer)
  const delta = tables.has('HVAR') ? hvarDelta(tables.get('HVAR') as Buffer, normalisedWeight(tables, weight)) : () => 0
  const advance = (ch: string) => {
    const g = glyphOf(ch.codePointAt(0) as number)
    return (hmtx.readUInt16BE(Math.min(g, metrics - 1) * 4) + delta(g)) / upem
  }
  const widths = labels.map((l) => [...l].reduce((s, ch) => s + advance(ch), 0))
  const chars = labels.reduce((n, l) => n + [...l].length, 0)
  const per = labels.map((l, i) => (widths[i] as number) / [...l].length)
  const worst = per.indexOf(Math.max(...per))
  return { avgAdvance: widths.reduce((a, b) => a + b, 0) / chars, worstAdvance: per[worst] as number, worstLabel: labels[worst] as string }
}

/** Space Grotesk's L1 box labels, the vocabulary the average advance is taken over. */
export const LABELS = ['session-miner', 'store-sqlite', 'session-read', 'session-analytics', 'code-graph', 'factory', 'console', '+8 more', 'imported by', 'imports']

export const WEIGHTS = [400, 500, 600, 700] as const

export const FACES = [
  { name: 'inter', file: 'inter/latin.woff2' },
  { name: 'jetbrains-mono', file: 'jetbrains-mono/latin.woff2' },
  { name: 'nunito-sans', file: 'nunito-sans/latin.woff2' },
  { name: 'space-grotesk', file: 'space-grotesk/latin.woff2' },
] as const

export interface WeightMetrics {
  /** Mean advance per character over `LABELS`, in em. */
  avgAdvance: number
  /** Height of lowercase letters, in em, at this weight. */
  xHeight: number
}

export interface FaceMetrics {
  unitsPerEm: number
  weights: Record<string, WeightMetrics>
}

const round = (n: number) => Math.round(n * 10000) / 10000

function xHeightOf(tables: Tables, weight: number): number {
  const os2 = tables.get('OS/2') as Buffer
  const upem = (tables.get('head') as Buffer).readUInt16BE(18)
  const base = os2.readUInt16BE(0) >= 2 ? os2.readInt16BE(86) : 0
  const delta = mvarDelta(tables.get('MVAR'), 'xhgt', normalisedWeight(tables, weight))
  return (base + delta) / upem
}

export function measureFace(fontFile: string): FaceMetrics {
  const tables = woff2Tables(readFileSync(fontFile))
  const entries = WEIGHTS.map((weight) => [
    String(weight),
    { avgAdvance: round(advanceOf(tables, weight, LABELS).avgAdvance), xHeight: round(xHeightOf(tables, weight)) },
  ])
  return { unitsPerEm: (tables.get('head') as Buffer).readUInt16BE(18), weights: Object.fromEntries(entries) }
}

const THEME_DIR = join(import.meta.dirname, '..', 'src', 'theme')
const FONTS_DIR = join(THEME_DIR, 'fonts')
export const METRICS_FILE = join(THEME_DIR, 'font-metrics.json')

export function measureAll(): Record<string, FaceMetrics> {
  return Object.fromEntries(FACES.map(({ name, file }) => [name, measureFace(join(FONTS_DIR, file))]))
}

if (process.argv[1] === import.meta.filename) {
  writeFileSync(METRICS_FILE, `${JSON.stringify({ faces: measureAll() }, null, 2)}\n`)
}
