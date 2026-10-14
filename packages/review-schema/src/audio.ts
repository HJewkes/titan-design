import { z } from 'zod'

// Audio on a round (TD-916): a variant can be a sound to listen to, and a blind-ab question plays
// pairs of takes in a seeded order the page never learns, so the owner can compare engines blind.

/** An audio file relative to the round file, under the same path rules as an image or clip. */
export const audioPath = z
  .string()
  .regex(
    /^(?![/\\]|[A-Za-z]:)(?!(.*[/\\])?\.\.([/\\]|$)).+\.(?:[Ww][Aa][Vv]|[Mm][Pp]3|[Oo][Gg][Gg]|[Mm]4[Aa])$/,
    'a .wav, .mp3, .ogg or .m4a path relative to the round file, without .. segments'
  )

/** How long a recording runs, when the round wants it stated; the file is the authority. */
export const audioDuration = z.number().int().min(100).max(600_000)

const extension = (path: string) => path.slice(path.lastIndexOf('.')).toLowerCase()

const pairId = z.string().regex(/^[A-Za-z0-9_-]{1,32}$/, 'letters, digits, _ and - only')

/** One engine's take of a pair; `engine` is the hidden key, which the page never receives. */
export const BlindTakeSchema = z
  .object({ engine: z.string().min(1), src: audioPath, durationMs: audioDuration.optional() })
  .strict()

/** One line read by two engines; the page plays them as A and B in the round's seeded order. */
export const BlindPairSchema = z
  .object({
    id: pairId,
    transcript: z.string().min(1),
    takes: z.tuple([BlindTakeSchema, BlindTakeSchema]),
  })
  .strict()
  .refine((p) => p.takes[0].engine !== p.takes[1].engine, {
    message: 'a pair compares two engines: its takes name different engines',
  })
  .refine((p) => extension(p.takes[0].src) === extension(p.takes[1].src), {
    message: 'the takes of a pair share one format, so the file type does not tell them apart',
  })

/** The positions a blind pair is played in; an answer names one of them, never an engine. */
export const BLIND_CHOICES = ['A', 'B'] as const

export type BlindChoice = (typeof BLIND_CHOICES)[number]
export type BlindTake = z.output<typeof BlindTakeSchema>
export type BlindPair = z.output<typeof BlindPairSchema>

interface BlindQuestion {
  id: string
  pairs: BlindPair[]
  seed?: string
}

/** The seed a blind-ab question shuffles by: its own, else one per round so each round reshuffles. */
export function blindAbSeed(round: { unit: string; round: number }, question: BlindQuestion) {
  return question.seed ?? `${round.unit}#${round.round}/${question.id}`
}

// FNV-1a: a stable 32-bit hash of the seed text, so the order needs no crypto in the browser.
function hashSeed(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193)
  return hash >>> 0
}

// mulberry32: a small seeded generator; the same seed always gives the same sequence.
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Which take of each pair plays as A (0 or 1), for `count` pairs. Each take leads in half the pairs
 * (an odd pair out goes by the seed), shuffled by the seed, so the order is the same for a seed
 * and no engine always plays first.
 */
export function blindAbOrder(seed: string, count: number): (0 | 1)[] {
  const random = seededRandom(hashSeed(seed))
  const order = Array.from({ length: count }, (_, i): 0 | 1 => (i % 2 === 0 ? 0 : 1))
  if (count % 2 === 1) order[count - 1] = random() < 0.5 ? 0 : 1
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/** A pair as played: the take at A and the take at B. */
export interface PlayedPair {
  pair: string
  transcript: string
  A: BlindTake
  B: BlindTake
}

/** Every pair of a blind-ab question in the order the round plays it; this is the hidden key. */
export function blindAbKey(round: { unit: string; round: number }, question: BlindQuestion) {
  const order = blindAbOrder(blindAbSeed(round, question), question.pairs.length)
  return question.pairs.map(
    (p, i): PlayedPair => ({
      pair: p.id,
      transcript: p.transcript,
      A: p.takes[order[i]],
      B: p.takes[1 - order[i]],
    })
  )
}

/** The engine an answer's choice picked, by the key; undefined for a pair the key does not hold. */
export function engineOf(key: PlayedPair[], pair: string, choice: BlindChoice): string | undefined {
  return key.find((p) => p.pair === pair)?.[choice].engine
}
