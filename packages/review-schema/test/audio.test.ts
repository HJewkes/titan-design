import { describe, expect, it } from 'vitest'
import {
  MANIFEST_SCHEMA_ID,
  QuestionSchema,
  RoundSchema,
  VariantSchema,
  blindAbKey,
  blindAbOrder,
  engineOf,
  type BlindAbQuestion,
} from '../src/index.ts'

const messages = (schema: typeof VariantSchema | typeof QuestionSchema, input: unknown) => {
  const parsed = schema.safeParse(input)
  return parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
}

const pair = (id: string) => ({
  id,
  transcript: `Line ${id}.`,
  takes: [
    { engine: 'engine-x', src: `audio/${id}-x.wav` },
    { engine: 'engine-y', src: `audio/${id}-y.wav` },
  ],
})

const blind = (count: number, extra: Record<string, unknown> = {}) =>
  QuestionSchema.parse({
    id: 'tts',
    kind: 'blind-ab',
    prompt: 'Which take sounds more natural?',
    pairs: Array.from({ length: count }, (_, i) => pair(`p${i + 1}`)),
    ...extra,
  }) as BlindAbQuestion

const ROUND = { unit: 'tts-ab', round: 1 }

describe('the seeded A/B order', () => {
  // Catches: an order drawn from Math.random, or from anything but the seed.
  it('is the same every time for one seed', () => {
    expect(blindAbOrder('tts-ab#1/tts', 20)).toEqual(blindAbOrder('tts-ab#1/tts', 20))
  })

  // Catches: an order that ignores its seed (a fixed alternation, or all zeros).
  it('differs between seeds', () => {
    expect(blindAbOrder('seed-one', 20)).not.toEqual(blindAbOrder('seed-two', 20))
  })

  // Catches: a coin flip per pair, which can let one engine lead most pairs.
  it('lets each engine lead half the pairs', () => {
    const order = blindAbOrder('tts-ab#1/tts', 20)
    expect(order.filter((i) => i === 0)).toHaveLength(10)
  })

  // Catches: a default seed without the round, so round 2 would replay round 1's order.
  it('reshuffles each round when the question names no seed', () => {
    const q = blind(20)
    const firstAt = (round: number) => blindAbKey({ ...ROUND, round }, q).map((p) => p.A.engine)
    expect(firstAt(1)).not.toEqual(firstAt(2))
  })

  // Catches: a question seed that is ignored in favour of the round default.
  it('takes the question seed over the round default', () => {
    const q = blind(20, { seed: 'fixed' })
    const firstAt = (round: number) => blindAbKey({ ...ROUND, round }, q).map((p) => p.A.engine)
    expect(firstAt(1)).toEqual(firstAt(2))
  })
})

describe('the key', () => {
  // Catches: a key that maps both positions to one take, or ignores the order.
  it('maps each position of each pair back to its engine', () => {
    const q = blind(4)
    const key = blindAbKey(ROUND, q)
    const order = blindAbOrder('tts-ab#1/tts', 4)
    key.forEach((played, i) => {
      expect(played.pair).toBe(`p${i + 1}`)
      expect(engineOf(key, played.pair, 'A')).toBe(q.pairs[i].takes[order[i]].engine)
      expect(engineOf(key, played.pair, 'B')).toBe(q.pairs[i].takes[1 - order[i]].engine)
    })
  })

  // Catches: engineOf guessing an engine for a pair the key does not hold.
  it('names no engine for an unknown pair', () => {
    expect(engineOf(blindAbKey(ROUND, blind(2)), 'p9', 'A')).toBeUndefined()
  })
})

describe('an audio variant', () => {
  const audio = { key: 'line', audio: 'audio/line.wav', label: 'A line', transcript: 'Hello.' }

  // Catches: audio left out of the variant sources.
  it('parses with its transcript and an optional duration', () => {
    expect(messages(VariantSchema, { ...audio, durationMs: 1800 })).toEqual([])
  })

  // Catches: a transcript made optional on audio.
  it('needs a transcript', () => {
    const { transcript: _t, ...bare } = audio
    expect(messages(VariantSchema, bare)).toEqual([
      'transcript: an audio variant shows what it says: give it a transcript',
    ])
  })

  // Catches: audio counted beside another source instead of instead of it.
  it('is one source only', () => {
    expect(messages(VariantSchema, { ...audio, image: 'a.png' })).toContain(
      ': a variant has exactly one of storyId, image, clip or audio'
    )
  })

  // Catches: transcript accepted on a frame that plays no sound.
  it('keeps its transcript and duration off other frames', () => {
    expect(
      messages(VariantSchema, { key: 'x', image: 'x.png', label: 'X', transcript: 'Hi.' })
    ).toEqual(['transcript: transcript belongs to an audio variant; give the variant audio'])
  })

  // Catches: a path rule that lets audio climb out of the round directory.
  it('refuses a path outside the round', () => {
    expect(messages(VariantSchema, { ...audio, audio: '../line.wav' })[0]).toMatch(/^audio: /)
  })
})

describe('a blind-ab question', () => {
  // Catches: a pair whose two takes are one engine, which compares nothing.
  it('refuses a pair that names one engine twice', () => {
    const same = pair('p1')
    same.takes[1].engine = 'engine-x'
    const q = { id: 'tts', kind: 'blind-ab', prompt: 'Which?', pairs: [same] }
    expect(messages(QuestionSchema, q)).toEqual([
      'pairs.0: a pair compares two engines: its takes name different engines',
    ])
  })

  // Catches: a pair whose takes differ in format, whose served type would name the engine.
  it('refuses a pair whose takes are different formats', () => {
    const mixed = pair('p1')
    mixed.takes[1].src = 'audio/p1-y.mp3'
    const q = { id: 'tts', kind: 'blind-ab', prompt: 'Which?', pairs: [mixed] }
    expect(messages(QuestionSchema, q)).toEqual([
      'pairs.0: the takes of a pair share one format, so the file type does not tell them apart',
    ])
  })

  // Catches: two pairs under one id, whose answers could not be told apart.
  it('refuses a repeated pair id', () => {
    const q = { id: 'tts', kind: 'blind-ab', prompt: 'Which?', pairs: [pair('p1'), pair('p1')] }
    expect(messages(QuestionSchema, q)).toEqual(['pairs: pair p1 repeats'])
  })

  // Catches: blind-ab left out of the contract's question union, so build would refuse it.
  it('is a question under the review contract', () => {
    const parsed = RoundSchema.safeParse({
      schema: MANIFEST_SCHEMA_ID,
      ...ROUND,
      storybookUrl: 'http://127.0.0.1:6006',
      widths: [1280],
      variants: [],
      questions: [{ id: 'tts', kind: 'blind-ab', prompt: 'Which?', pairs: [pair('p1')] }],
      sections: [
        {
          id: 'listen',
          title: 'Listen',
          deciding: 'Which engine reads better.',
          changed: 'Two engines read the same lines.',
          context: 'The lines are fixed.',
          questionIds: ['tts'],
        },
      ],
    })
    expect(parsed.error?.issues ?? []).toEqual([])
  })
})
