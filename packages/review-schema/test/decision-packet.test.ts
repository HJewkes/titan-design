import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ManifestSchema, RoundSchema, lintRound } from '../src/index.ts'

const A = 'A · 44 px'
const A_PRIME = 'A′ · 44 px, measured advance'
const B = 'B · 40 px nominal'
const C = 'C · 40 px, wide mono face'

interface FixtureQuestion {
  frames: string[]
  optionDetails?: Record<string, { detail: string }>
  evidence?: { columns: { label: string; option?: string }[]; rows: { cells: unknown[] }[] }[]
  compare?: { cells: Record<string, Partial<Record<string, string>>>; shown?: string[] }
  recommendation: { fallback?: string; weakPoint?: string }
}

interface Fixture {
  variants: { key: string; label: string; image?: string; storyId?: string }[]
  questions: FixtureQuestion[]
}

const packetRound = (): Fixture =>
  JSON.parse(
    readFileSync(new URL('./fixtures/round-decision-packet.json', import.meta.url), 'utf8')
  )

/** The fixture with its one question edited, so each case states only what it breaks. */
function withQuestion(edit: (q: FixtureQuestion) => void): Fixture {
  const round = packetRound()
  edit(round.questions[0]!)
  return round
}

const problems = (input: unknown) => {
  const parsed = RoundSchema.safeParse(input)
  return parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
}

describe('a decision packet on a pick-one', () => {
  it('parses a four-option, four-view packet with no problems', () => {
    const round = RoundSchema.parse(packetRound())

    const q = round.questions[0]!
    expect(q.kind === 'pick-one' && q.compare?.cells[A_PRIME]?.mid).toBe('q1-ap-mid')
    expect(lintRound(round)).toEqual([])
  })

  it('reports optionDetails keyed by a text that is not an option, with the question id', () => {
    const round = withQuestion((q) => {
      q.optionDetails!['D · 48 px'] = { detail: 'Not offered.' }
    })

    expect(problems(round)).toEqual([
      'questions: question label-floor: optionDetails "D · 48 px" is not one of its options',
    ])
  })

  it('reports a row with too few cells and accepts a span that makes up the count', () => {
    const short = withQuestion((q) => {
      q.evidence![0]!.rows[0]!.cells = ['fits', 'fits']
    })
    const spanned = withQuestion((q) => {
      q.evidence![0]!.rows[0]!.cells = [{ text: 'fits', tone: 'pass', span: 2 }, 'fits']
    })

    expect(problems(short)).toEqual([
      'questions: question label-floor: evidence "Measured cost (dark, 1080)" row "Wide layout" has 2 cells for 3 columns',
    ])
    expect(problems(spanned)).toEqual([])
  })

  it('reports a compare cell naming a variant that is not one of the question frames', () => {
    const round = withQuestion((q) => {
      q.frames = q.frames.filter((k) => k !== 'q1-b-dense')
    })
    round.variants.push({ key: 'q1-spare', label: 'Spare', image: 'frames/spare.png' })

    expect(problems(round)).toContain(
      'questions: question label-floor: compare cell q1-b-dense is not one of its frames'
    )
  })

  it('reports an option whose compare row misses a view', () => {
    const round = withQuestion((q) => {
      delete q.compare!.cells[C]!.target
    })

    expect(problems(round)).toEqual([
      `questions: question label-floor: compare row "${C}" has no frame for view target`,
    ])
  })

  it('reports a fallback that is the recommended answer', () => {
    const round = withQuestion((q) => {
      q.recommendation.fallback = A_PRIME
    })

    expect(problems(round)).toEqual([
      `questions: question label-floor: recommendation fallback "${A_PRIME}" is the recommended answer`,
    ])
  })

  it('reports table columns, compare rows and shown entries that are not options', () => {
    const round = withQuestion((q) => {
      q.evidence![0]!.columns[1]!.option = 'B'
      q.compare!.shown = [B, 'E']
      q.compare!.cells.E = q.compare!.cells[A]
      delete q.compare!.cells[A]
    })

    expect(problems(round)).toEqual(
      expect.arrayContaining([
        'questions: question label-floor: evidence "Measured cost (dark, 1080)" column "B" is not one of its options',
        'questions: question label-floor: compare row "E" is not one of its options',
      ])
    )
  })

  it('reports compare frames that mix image and story sources', () => {
    const round = packetRound()
    const variant = round.variants.find((v) => v.key === 'q1-a-wide')!
    delete variant.image
    variant.storyId = 'maps-labels--wide'

    expect(problems(round)).toEqual(
      expect.arrayContaining([
        'questions: question label-floor: compare frames mix sources (live story, image); compared frames share one',
      ])
    )
  })

  it('accepts a round with no packet fields, as every older round is written', () => {
    const round = withQuestion((q) => {
      delete q.optionDetails
      delete q.evidence
      delete q.compare
      delete q.recommendation.weakPoint
      delete q.recommendation.fallback
    })

    expect(ManifestSchema.safeParse(round).success).toBe(true)
    expect(problems(round)).toEqual([])
  })
})
