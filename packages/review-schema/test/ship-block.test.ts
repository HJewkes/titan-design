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
    expect(status(matching)).toEqual({ pr: PR, blocked: false, blockers: [] })
  })

  it('does not block on questions that are unanswered', () => {
    expect(status([])).toMatchObject({ blocked: false })
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

describe('shipBlocks on a stacked round', () => {
  const head = (n: number) => String(n % 10).repeat(40)
  const pr = (n: number) => `owner/name#${n}`
  const shipOf = (n: number) => ({
    id: `ship-${n}`,
    kind: 'pick-one',
    decision: 'ship',
    prompt: `Ship #${n}?`,
    options: ['Ship', "Don't ship"],
    required: true,
    page: pr(n),
    merge: { repo: 'owner/name', pr: n, headSha: head(n), ship: ['Ship'] },
  })
  const on = (n: number) => ({ stackedOn: { repo: 'owner/name', pr: n, headSha: head(n) } })
  const stacked = ManifestSchema.parse({
    ...round,
    questions: [800, 808, 823, 418].map(shipOf),
    sections: [800, 808, 823, 418].map((n) => ({
      id: `s${n}`,
      title: `#${n}`,
      questionIds: [`ship-${n}`],
      variantKeys: [],
    })),
    prGroups: [
      { pr: pr(800), headSha: head(800), sectionIds: ['s800'] },
      { pr: pr(808), headSha: head(808), sectionIds: ['s808'], ...on(800) },
      { pr: pr(823), headSha: head(823), sectionIds: ['s823'], ...on(800) },
      { pr: pr(418), headSha: head(418), sectionIds: ['s418'], ...on(823) },
    ],
  })
  const group = (n: number, answers: Answer[]) =>
    shipBlocks(stacked, { answers }).find((g) => g.pr === pr(n))!

  it("blocks a dependent whose holder is answered Don't ship, naming the holder", () => {
    expect(group(808, [{ questionId: 'ship-800', pick: "Don't ship" }])).toEqual({
      pr: pr(808),
      blocked: true,
      shipsAfter: pr(800),
      blockers: [
        {
          questionId: 'ship-800',
          kind: 'holder-not-shipped',
          message: `stacked on ${pr(800)}, which may not ship: it is answered "Don't ship"`,
        },
      ],
    })
  })

  it('blocks a dependent whose holder asks for a revision', () => {
    const answers: Answer[] = [{ questionId: 'ship-800', revisionRequested: true, comment: 'redo' }]
    expect(group(808, answers).blockers[0]?.message).toBe(
      `stacked on ${pr(800)}, which may not ship: a revision was requested`
    )
  })

  it('does not block a dependent whose holder is answered Ship', () => {
    const result = group(808, [{ questionId: 'ship-800', pick: 'Ship' }])
    expect(result).toEqual({ pr: pr(808), blocked: false, blockers: [], shipsAfter: pr(800) })
  })

  it('does not block a dependent whose holder is unanswered', () => {
    expect(group(808, [])).toMatchObject({ blocked: false, shipsAfter: pr(800) })
  })

  it('blocks on the nearest holder only, each stack on its own base', () => {
    const answers = [{ questionId: 'ship-823', pick: "Don't ship" }]
    expect(group(418, answers)).toMatchObject({ blocked: true, shipsAfter: pr(823) })
    expect(group(808, answers)).toMatchObject({ blocked: false, shipsAfter: pr(800) })
    expect(group(800, answers)).not.toHaveProperty('shipsAfter')
  })

  it('names no holder when the base is not a group of the round', () => {
    const alone = ManifestSchema.parse({
      ...stacked,
      prGroups: stacked.prGroups!.filter((g) => g.pr !== pr(823)),
      sections: stacked.sections!.filter((s) => s.id !== 's823'),
      questions: stacked.questions.filter((q) => q.id !== 'ship-823'),
    })
    const result = shipBlocks(alone, { answers: [] }).find((g) => g.pr === pr(418))
    expect(result).not.toHaveProperty('shipsAfter')
  })
})
