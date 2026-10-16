// prose.json: the parts of a visual gate's DP-1 packet only an agent can write. Code owns the rest
// (packet.json and the Ship question), so the packager writes this file and nothing else.
import { z } from 'zod'
import { SHIP_OPTIONS } from '@titan-design/review-schema'

// The first code form of DP-1's visual subset; TD-925 moves it into review-schema.
export const PROSE_SCHEMA_ID = 'titan-review/packet-prose@1'
export const PROSE_FILE = 'prose.json'

/** Character caps and list bounds. Guesses, to tune after the first packets are rated. */
export const PROSE_LIMITS = {
  intent: 600,
  pointer: 300,
  delta: 200,
  cause: 300,
  flip: 300,
  question: 200,
  answer: 300,
  deltaItems: { min: 1, max: 3 },
  followUps: { min: 3, max: 5 },
} as const

/** A decision number or a task id; also a guess, as above. */
export const APPROVED_BY = /^(decision \d+|[A-Z]+-\d+)$/

const line = (max: number) => z.string().trim().min(1).max(max)
const imageKey = z.string().regex(/^[A-Za-z0-9_-]{1,32}$/)
const L = PROSE_LIMITS

export const ProseSchema = z.strictObject({
  schema: z.literal(PROSE_SCHEMA_ID),
  packetId: z.string().regex(/^[0-9a-f]{64}$/),
  headSha: z.string().regex(/^[0-9a-f]{40}$/),
  /** `approvedBy: null` renders as DP-1's "Not approved at plan time". */
  intent: z.strictObject({
    text: line(L.intent),
    approvedBy: z.string().regex(APPROVED_BY).nullable(),
    pointer: line(L.pointer),
  }),
  /** Behaviour before -> after, in the owner's words. */
  delta: z.array(line(L.delta)).min(L.deltaItems.min).max(L.deltaItems.max),
  /** One per image key: the file change that made the pixels change. */
  cause: z.record(imageKey, line(L.cause)),
  /** Its own object, so the console can hide it until the owner answers. */
  recommend: z.strictObject({
    answer: z.enum(SHIP_OPTIONS),
    confidence: z.number().min(0).max(1),
    flip: line(L.flip),
  }),
  followUps: z
    .array(
      z.strictObject({
        question: line(L.question),
        answer: line(L.answer),
        pointer: line(L.pointer),
      })
    )
    .min(L.followUps.min)
    .max(L.followUps.max),
})

export type Prose = z.infer<typeof ProseSchema>
