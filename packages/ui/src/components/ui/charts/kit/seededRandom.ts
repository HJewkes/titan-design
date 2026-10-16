/** A deterministic generator in [0, 1) from an integer seed (LCG), for fixtures and seeded layouts. */
export function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}
