import { FeedbackSchema, type Feedback } from '@titan-design/review-schema'
import { ReviewError, readJsonFile } from './review.ts'

interface Tally {
  agreed: number
  total: number
}

const CONFIDENCE_BANDS = [
  { label: '<0.5', holds: (c: number) => c < 0.5 },
  { label: '0.5-0.75', holds: (c: number) => c >= 0.5 && c < 0.75 },
  { label: '>=0.75', holds: (c: number) => c >= 0.75 },
] as const

interface Scored {
  agreed: boolean
  confidence: number
  /** Answered with the recommendation visible; feedback from before the tag counts as blind. */
  seen: boolean
}

/** The answers a recommendation can be scored on: it was given, and the owner answered. */
function scored(feedback: Feedback): Scored[] {
  return feedback.answers.flatMap((a) =>
    a.recommendation && a.agreed !== undefined
      ? [
          {
            agreed: a.agreed,
            confidence: a.recommendation.confidence,
            seen: a.recommendationSeen === true,
          },
        ]
      : []
  )
}

const blind = (items: Scored[]) => items.filter((i) => !i.seen)

/** A round's blind rate, saying how many answers were left out as seen. */
function roundRow(f: Feedback): string {
  const items = scored(f)
  const seen = items.length - blind(items).length
  const label = `${f.unit} round ${f.round}${seen ? ` (${seen} seen)` : ''}`
  return row(label, tally(blind(items)))
}

function tally(items: { agreed: boolean }[]): Tally {
  return { agreed: items.filter((i) => i.agreed).length, total: items.length }
}

function row(label: string, { agreed, total }: Tally): string {
  const share = total ? `${Math.round((agreed / total) * 100)}%` : '-'
  return `  ${label.padEnd(32)} ${`${agreed}/${total}`.padStart(7)}  ${share.padStart(4)}`
}

/**
 * Agreement per round, overall, and by confidence band, as plain text. Every rate but `seen` counts
 * blind answers only: an answer given with the recommendation in view says nothing about it.
 */
export function calibrationReport(rounds: Feedback[]): string {
  const all = rounds.flatMap(scored)
  const blindAll = blind(all)
  return [
    'By round (blind)',
    ...rounds.map(roundRow),
    'Overall',
    row('all rounds, blind', tally(blindAll)),
    row('all rounds, seen', tally(all.filter((i) => i.seen))),
    'By confidence (blind)',
    ...CONFIDENCE_BANDS.map((b) =>
      row(b.label, tally(blindAll.filter((i) => b.holds(i.confidence))))
    ),
  ].join('\n')
}

export async function readFeedbackFiles(paths: string[]): Promise<Feedback[]> {
  if (paths.length === 0) throw new ReviewError('calibration needs at least one feedback.json')
  return Promise.all(
    paths.map(async (path) => {
      const { json } = await readJsonFile(path)
      const result = FeedbackSchema.safeParse(json)
      if (!result.success) throw new ReviewError(`${path} is not feedback: ${result.error.message}`)
      return result.data
    })
  )
}
