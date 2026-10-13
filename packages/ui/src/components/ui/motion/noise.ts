// 2D simplex noise, ported from simplex-noise 4.0.1 by Jonas Wagner (MIT, see LICENSE-simplex-noise beside this
// file), itself based on Stefan Gustavson's example code with Peter Eastman's optimisations. The permutation table
// is shuffled by the stateless `random(seed, i)`, so a seed always yields the same field.
import { random } from './random'

const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6
const SCALE_TO_UNIT = 70
const MAX_CACHED_SEEDS = 16
// prettier-ignore
const GRADIENTS = [1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 1, 0, -1, 0, 0, 1, 0, -1, 0, 1, 0, -1] as const

interface Field {
  perm: Uint8Array
  gradX: Float64Array
  gradY: Float64Array
}

const fields = new Map<number | string, Field>()

function permutation(seed: number | string): Uint8Array {
  const p = new Uint8Array(512)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 0; i < 255; i++) {
    const r = i + Math.floor(random(seed, i) * (256 - i))
    const swap = p[i] as number
    p[i] = p[r] as number
    p[r] = swap
  }
  p.copyWithin(256, 0, 256)
  return p
}

function field(seed: number | string): Field {
  const cached = fields.get(seed)
  if (cached) return cached
  if (fields.size >= MAX_CACHED_SEEDS) fields.delete(fields.keys().next().value as number | string)
  const perm = permutation(seed)
  const gradX = Float64Array.from(perm, (v) => GRADIENTS[(v % 12) * 2] as number)
  const gradY = Float64Array.from(perm, (v) => GRADIENTS[(v % 12) * 2 + 1] as number)
  const created = { perm, gradX, gradY }
  fields.set(seed, created)
  return created
}

function corner({ gradX, gradY }: Field, gradient: number, x: number, y: number): number {
  const falloff = 0.5 - x * x - y * y
  if (falloff < 0) return 0
  const squared = falloff * falloff
  return squared * squared * ((gradX[gradient] as number) * x + (gradY[gradient] as number) * y)
}

/**
 * Smooth, repeatable noise in [-1, 1] at `(x, y)` for `seed`. Nearby points give nearby values, so `noise2D(seed,
 * t * speed, lane)` drifts a value over time without any state.
 */
export function noise2D(seed: number | string, x: number, y: number): number {
  const f = field(seed)
  const skew = (x + y) * F2
  const i = Math.floor(x + skew)
  const j = Math.floor(y + skew)
  const unskew = (i + j) * G2
  const x0 = x - (i - unskew)
  const y0 = y - (j - unskew)
  const [i1, j1] = x0 > y0 ? [1, 0] : [0, 1]
  const ii = i & 255
  const jj = j & 255
  const perm = (index: number) => f.perm[index] as number
  const n0 = corner(f, ii + perm(jj), x0, y0)
  const n1 = corner(f, ii + i1 + perm(jj + j1), x0 - i1 + G2, y0 - j1 + G2)
  const n2 = corner(f, ii + 1 + perm(jj + 1), x0 - 1 + 2 * G2, y0 - 1 + 2 * G2)
  return SCALE_TO_UNIT * (n0 + n1 + n2)
}
