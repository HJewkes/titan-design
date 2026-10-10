import { describe, expect, it } from 'vitest'
import { MANIFEST_SCHEMA_ID, ManifestSchema, shipBlocks, type Answer } from '../src/index.ts'

const HEAD = '1'.repeat(40)
const PR = 'owner/name#101'

const round = ManifestSchema.parse({
  schema: MANIFEST_SCHEMA_ID,
  unit: 'ship-block',
  round: 1,
  storybookUrl: 'http://127.0.0.1:6100',
  widths: [1280],
  variants: [],
  questions: [
    {
      id: 'format',
      kind: 'pick-one',
      decision: 'iterate',
      prompt: 'Which format?',
      options: ['Subtle', 'Outline'],
      implemented: 'Subtle',
      page: PR,
    },
    {
      id: 'checks',
      kind: 'pick-many',
      prompt: 'Which states?',
      options: ['Hover', 'Focus', 'Disabled'],
      implemented: ['Hover', 'Focus'],
      page: PR,
    },
    { id: 'notes', kind: 'text', prompt: 'Anything else?', page: PR },
    {
      id: 'ship',
      kind: 'pick-one',
      decision: 'ship',
      prompt: 'Ship?',
      options: ['Ship', "Don't ship"],
      required: true,
      page: PR,
      merge: { repo: 'owner/name', pr: 101, headSha: HEAD, ship: ['Ship'] },
    },
    { id: 'other', kind: 'pick-one', prompt: 'Elsewhere?', options: ['x', 'y'], implemented: 'x' },
  ],
})

const status = (answers: Answer[]) => shipBlocks(round, { answers }).find((g) => g.pr === PR)!
const matching: Answer[] = [
  { questionId: 'format', pick: 'Subtle' },
  { questionId: 'checks', picks: ['Focus', 'Hover'] },
]

describe('shipBlocks', () => {
  it('allows Ship when every answer matches its implemented option and has no text', () => {
    expect(status(matching)).toEqual({
      pr: PR,
      blocked: false,
      blockers: [],
      unansweredQuestionIds: ['notes'],
    })
  })

  it('enables Ship with every question unanswered, and lists them apart from Ship (item 166)', () => {
    expect(status([])).toEqual({
      pr: PR,
      blocked: false,
      blockers: [],
      unansweredQuestionIds: ['format', 'checks', 'notes'],
    })
  })

  it('counts a comment-only answer as unanswered and as a change request', () => {
    const result = status([...matching, { questionId: 'notes', comment: 'see the margin' }])
    expect(result).toMatchObject({ blocked: true, unansweredQuestionIds: ['notes'] })
  })

  it('blocks on a pick-one that is not the implemented option', () => {
    const result = status([{ questionId: 'format', pick: 'Outline' }])
    expect(result.blocked).toBe(true)
    expect(result.blockers).toEqual([
      {
        questionId: 'format',
        kind: 'not-implemented',
        message: 'question format: picked "Outline", but the PR implements "Subtle"',
      },
    ])
  })

  it('blocks on a pick-many whose set differs from the implemented set', () => {
    expect(status([{ questionId: 'checks', picks: ['Hover'] }]).blockers[0]).toMatchObject({
      kind: 'not-implemented',
    })
  })

  it('blocks on a requested revision', () => {
    const result = status([{ questionId: 'format', revisionRequested: true, comment: 'redo it' }])
    expect(result.blockers.map((b) => b.kind)).toEqual(['not-implemented', 'free-text'])
  })

  it.each([
    ['a comment', { questionId: 'format', pick: 'Subtle', comment: 'looks tight' }],
    ['a text answer', { questionId: 'notes', text: 'one more thing' }],
    [
      'a frame comment',
      {
        questionId: 'format',
        pick: 'Subtle',
        variantComments: [{ key: 'A', comment: 'too wide' }],
      },
    ],
  ] as const)('blocks on free text: %s', (_, answer) => {
    const result = status([answer as Answer])
    expect(result.blocked).toBe(true)
    expect(result.blockers.map((b) => b.kind)).toContain('free-text')
  })

  it('ignores whitespace-only text and the Ship question own pick', () => {
    const answers: Answer[] = [
      ...matching,
      { questionId: 'format', pick: 'Subtle', comment: '   ' },
      { questionId: 'ship', pick: 'Ship' },
    ]
    expect(status(answers).blocked).toBe(false)
  })

  it('keeps a question on another page out of this PR group', () => {
    expect(status([{ questionId: 'other', pick: 'y' }]).blocked).toBe(false)
  })

  it('groups by prGroups sections as well as by page', () => {
    const grouped = ManifestSchema.parse({
      ...round,
      questions: round.questions.map((q) => (q.id === 'format' ? { ...q, page: undefined } : q)),
      sections: [{ id: 's', title: 's', questionIds: ['format', 'ship'], variantKeys: [] }],
      prGroups: [{ pr: PR, headSha: HEAD, sectionIds: ['s'] }],
    })
    const result = shipBlocks(grouped, { answers: [{ questionId: 'format', pick: 'Outline' }] })
    expect(result).toEqual([expect.objectContaining({ pr: PR, blocked: true })])
  })
})
