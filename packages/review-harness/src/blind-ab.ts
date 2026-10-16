import {
  BLIND_CHOICES,
  blindAbKey,
  engineOf,
  type BlindAbQuestion,
  type BlindChoice,
  type Feedback,
  type Manifest,
  type Question,
} from '@titan-design/review-schema'

// A blind-ab question's key (which engine plays at A and at B) stays on the server: the page gets
// the round with each take's engine and path replaced by its position, fetches each take by that
// position, and learns the engines only from the reply to its submit.

export const isBlindAb = (q: Question): q is BlindAbQuestion => q.kind === 'blind-ab'

/** The route key a take is served under: its question, pair and position, never its engine. */
export function blindTakeKey(questionId: string, pairId: string, choice: BlindChoice): string {
  return `${questionId}/${pairId}/${choice}`
}

/** Every take's file, by route key, as the round plays it; `src` is relative to the round file. */
export function blindTakeSources(
  manifest: Manifest
): { key: string; where: string; src: string }[] {
  return manifest.questions.filter(isBlindAb).flatMap((q) =>
    blindAbKey(manifest, q).flatMap((played) =>
      BLIND_CHOICES.map((choice) => ({
        key: blindTakeKey(q.id, played.pair, choice),
        where: `question ${q.id}: pair ${played.pair} take ${played[choice].src}`,
        src: played[choice].src,
      }))
    )
  )
}

/** The question as the page sees it: each pair in played order, each take named by its position. */
function blindQuestionForPage(manifest: Manifest, q: BlindAbQuestion): BlindAbQuestion {
  const { seed: _seed, ...rest } = q
  const pairs = blindAbKey(manifest, q).map((played) => ({
    id: played.pair,
    transcript: played.transcript,
    takes: BLIND_CHOICES.map((choice) => ({
      engine: choice,
      src: '',
      ...(played[choice].durationMs !== undefined && { durationMs: played[choice].durationMs }),
    })) as BlindAbQuestion['pairs'][number]['takes'],
  }))
  return { ...rest, pairs }
}

/** The round the page is sent: every blind-ab question without its key, its paths or its seed. */
export function pageManifest(manifest: Manifest): Manifest {
  return {
    ...manifest,
    questions: manifest.questions.map((q) =>
      isBlindAb(q) ? blindQuestionForPage(manifest, q) : q
    ),
  }
}

/** Feedback as stored: each blind-ab choice gains the engine the key maps it to. */
export function withBlindEngines(feedback: Feedback, manifest: Manifest): Feedback {
  const keys = new Map(
    manifest.questions.filter(isBlindAb).map((q) => [q.id, blindAbKey(manifest, q)])
  )
  return {
    ...feedback,
    answers: feedback.answers.map((a) => {
      const key = keys.get(a.questionId)
      if (!key || !a.pairs) return a
      return {
        ...a,
        pairs: a.pairs.map((p) => ({ ...p, engine: engineOf(key, p.pair, p.choice) })),
      }
    }),
  }
}

/** One pair after the reveal: what played at A and B, and which the owner picked. */
export interface RevealedPair {
  pair: string
  A: string
  B: string
  choice?: BlindChoice
}

export interface BlindReveal {
  questionId: string
  pairs: RevealedPair[]
  /** How many pairs each engine won, every engine of the question listed. */
  tally: Record<string, number>
}

/** What the page shows once the round is sent; built only from stored, engine-mapped feedback. */
export function blindReveal(manifest: Manifest, feedback: Feedback): BlindReveal[] {
  const answers = new Map(feedback.answers.map((a) => [a.questionId, a]))
  return manifest.questions.filter(isBlindAb).map((q) => {
    const chosen = new Map(answers.get(q.id)?.pairs?.map((p) => [p.pair, p]))
    const pairs = blindAbKey(manifest, q).map((played) => ({
      pair: played.pair,
      A: played.A.engine,
      B: played.B.engine,
      choice: chosen.get(played.pair)?.choice,
    }))
    const tally: Record<string, number> = {}
    for (const p of pairs) {
      for (const engine of [p.A, p.B]) tally[engine] ??= 0
      if (p.choice) tally[p[p.choice]] += 1
    }
    return { questionId: q.id, pairs, tally }
  })
}
