import { readFile } from 'node:fs/promises'
import { FeedbackSchema, type Feedback } from './schema.ts'
import { ReviewError } from './review.ts'

interface Tally {
  agreed: number
  total: number
}

export const CONFIDENCE_BANDS = [
  { label: '<0.5', holds: (c: number) => c < 0.5 },
  { label: '0.5-0.75', holds: (c: number) => c >= 0.5 && c < 0.75 },
  { label: '>=0.75', holds: (c: number) => c >= 0.75 },
] as const

/** The answers a recommendation can be scored on: it was given, and the owner answered. */
function scored(feedback: Feedback) {
  return feedback.answers.flatMap((a) =>
    a.recommendation && a.agreed !== undefined
      ? [{ agreed: a.agreed, confidence: a.recommendation.confidence }]
      : []
  )
}

function tally(items: { agreed: boolean }[]): Tally {
  return { agreed: items.filter((i) => i.agreed).length, total: items.length }
}

function row(label: string, { agreed, total }: Tally): string {
  const share = total ? `${Math.round((agreed / total) * 100)}%` : '-'
  return `  ${label.padEnd(32)} ${`${agreed}/${total}`.padStart(7)}  ${share.padStart(4)}`
}

/** Agreement per round, overall, and by confidence band, as plain text. */
export function calibrationReport(rounds: Feedback[]): string {
  const all = rounds.flatMap(scored)
  return [
    'By round',
    ...rounds.map((f) => row(`${f.unit} round ${f.round}`, tally(scored(f)))),
    'Overall',
    row('all rounds', tally(all)),
    'By confidence',
    ...CONFIDENCE_BANDS.map((b) => row(b.label, tally(all.filter((i) => b.holds(i.confidence))))),
  ].join('\n')
}

function parseJson(path: string, text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new ReviewError(`${path} is not JSON`)
  }
}

export async function readFeedbackFiles(paths: string[]): Promise<Feedback[]> {
  if (paths.length === 0) throw new ReviewError('calibration needs at least one feedback.json')
  return Promise.all(
    paths.map(async (path) => {
      const text = await readFile(path, 'utf8').catch(() => {
        throw new ReviewError(`cannot read ${path}`)
      })
      const result = FeedbackSchema.safeParse(parseJson(path, text))
      if (!result.success) throw new ReviewError(`${path} is not feedback: ${result.error.message}`)
      return result.data
    })
  )
}
