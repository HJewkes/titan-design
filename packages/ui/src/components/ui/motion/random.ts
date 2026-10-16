// Stateless seeded randomness for render code: a pure hash of (seed, ...keys), so the value never depends on
// call order. The stateful LCG in `ui/charts/kit/seededRandom.ts` stays the fixture generator.

// 2^32 / phi, the splitmix increment, and the two lowbias32 multipliers, written in decimal.
const GOLDEN_GAMMA = 2654435769
const LOWBIAS_MUL_1 = 569420461
const LOWBIAS_MUL_2 = 1935289751
const TWO_POW_32 = 2 ** 32
const floatBits = new DataView(new ArrayBuffer(8))

/** lowbias32 finaliser: an avalanche mix of one 32-bit word. */
function mix32(word: number): number {
  let h = word >>> 0
  h ^= h >>> 16
  h = Math.imul(h, LOWBIAS_MUL_1)
  h ^= h >>> 15
  h = Math.imul(h, LOWBIAS_MUL_2)
  h ^= h >>> 15
  return h >>> 0
}

function absorb(state: number, word: number): number {
  return mix32(state + GOLDEN_GAMMA + mix32(word))
}

function absorbNumber(state: number, value: number): number {
  floatBits.setFloat64(0, value === 0 ? 0 : value)
  return absorb(absorb(state, floatBits.getUint32(0)), floatBits.getUint32(4))
}

function absorbString(state: number, value: string): number {
  let h = absorb(state, value.length)
  for (let i = 0; i < value.length; i++) h = absorb(h, value.charCodeAt(i))
  return h
}

/**
 * A repeatable value in [0, 1) for `seed` and `keys`. Equal arguments always give the same value, whatever else
 * was called before, so it is safe inside render and `f(t)` code.
 */
export function random(seed: number | string, ...keys: number[]): number {
  let h = typeof seed === 'string' ? absorbString(1, seed) : absorbNumber(2, seed)
  for (const key of keys) h = absorbNumber(h, key)
  return h / TWO_POW_32
}

/** `random(seed, ...keys)` mapped linearly onto `[lo, hi)`. */
export function randomRange(
  seed: number | string,
  keys: readonly number[],
  [lo, hi]: readonly [number, number]
): number {
  return lo + random(seed, ...keys) * (hi - lo)
}
