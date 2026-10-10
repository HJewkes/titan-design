import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ManifestSchema, RoundSchema, manifestJsonSchema } from '../src/index.ts'

// A real round@2 manifest written before 0.2, trimmed to three sections.
const realRound = () =>
  JSON.parse(
    readFileSync(new URL('./fixtures/round-gate2-batch-9.json', import.meta.url), 'utf8')
  ) as {
    questions: Record<string, unknown>[]
    variants: Record<string, unknown>[]
    sections: { id: string }[]
    prGroups?: unknown
  }

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((i) => i.message) ?? []

const pickOneIndex = (round: ReturnType<typeof realRound>) =>
  round.questions.findIndex((q) => q.kind === 'pick-one' && !q.merge)

const shipIndex = (round: ReturnType<typeof realRound>) =>
  round.questions.findIndex((q) => q.merge !== undefined)

describe('review kinds, outcomes, PR groups and frame units', () => {
  it('still validates a round written before any of them', () => {
    expect(messages(RoundSchema.safeParse(realRound()))).toEqual([])
  })

  it('accepts a decision, option outcomes and the frame fields', () => {
    const round = realRound()
    const i = pickOneIndex(round)
    const options = round.questions[i].options as string[]
    round.questions[i] = {
      ...round.questions[i],
      decision: 'iterate',
      outcomes: { [options[0]]: 'accept', [options[1]]: 'changes' },
    }
    round.variants[0] = { ...round.variants[0], variantUnit: 'u1', alternate: 'A', change: 'new' }
    const parsed = RoundSchema.safeParse(round)
    expect(messages(parsed)).toEqual([])
    expect(parsed.data?.questions[i]).toMatchObject({ decision: 'iterate' })
    expect(parsed.data?.variants[0]).toMatchObject({ variantUnit: 'u1', change: 'new' })
  })

  it('accepts a question that declares the tokens its answer decides (touches)', () => {
    const round = realRound()
    const i = pickOneIndex(round)
    round.questions[i] = {
      ...round.questions[i],
      touches: { tokens: [{ name: 'surface-base', mode: 'light' }, { name: 'divider' }] },
    }
    const parsed = RoundSchema.safeParse(round)
    expect(messages(parsed)).toEqual([])
    expect(parsed.data?.questions[i].touches).toEqual({
      tokens: [{ name: 'surface-base', mode: 'light' }, { name: 'divider' }],
      components: [],
    })
    round.questions[i] = {
      ...round.questions[i],
      touches: { tokens: [{ name: 'surface-base', mode: 'dim' }] },
    }
    expect(messages(RoundSchema.safeParse(round))).not.toEqual([])
  })

  it('refuses an outcome for an option the question does not offer', () => {
    const round = realRound()
    const i = pickOneIndex(round)
    round.questions[i] = { ...round.questions[i], outcomes: { Elsewhere: 'accept' } }
    expect(messages(ManifestSchema.safeParse(round))).toEqual([
      `question ${String(round.questions[i].id)}: outcome for "Elsewhere", which is not one of its options`,
    ])
  })

  it('refuses a merge-bound question whose decision is not ship', () => {
    const round = realRound()
    const i = shipIndex(round)
    round.questions[i] = { ...round.questions[i], decision: 'iterate' }
    expect(messages(ManifestSchema.safeParse(round))).toEqual([
      `question ${String(round.questions[i].id)}: a merge-bound question's decision is ship, not iterate`,
    ])
  })

  it('refuses an unknown change class', () => {
    const round = realRound()
    round.variants[0] = { ...round.variants[0], change: 'failed' }
    expect(ManifestSchema.safeParse(round).success).toBe(false)
  })

  it('accepts PR groups and refuses an unknown section, a shared one and a repeated PR', () => {
    const round = realRound()
    const [a, b] = round.sections.map((s) => s.id)
    const group = (pr: string, sectionIds: string[]) => ({
      pr,
      headSha: 'a'.repeat(40),
      sectionIds,
    })
    round.prGroups = [group('owner/name#1', [a]), group('owner/name#2', [b])]
    expect(messages(RoundSchema.safeParse(round))).toEqual([])
    round.prGroups = [group('owner/name#1', [a, 'nope']), group('owner/name#1', [a])]
    expect(messages(ManifestSchema.safeParse(round))).toEqual([
      'PR group owner/name#1: unknown section nope',
      `section ${a} is in two PR groups`,
      'PR owner/name#1 has two groups',
    ])
  })

  it('carries every new field in round.schema.json', () => {
    const schema = manifestJsonSchema() as {
      properties: {
        prGroups: unknown
        variants: { items: { properties: Record<string, unknown> } }
      }
    }
    expect(schema.properties.prGroups).toBeDefined()
    expect(Object.keys(schema.properties.variants.items.properties)).toEqual(
      expect.arrayContaining(['variantUnit', 'alternate', 'change'])
    )
    expect(JSON.stringify(schema)).toContain('"outcomes"')
    expect(JSON.stringify(schema)).toContain('"decision"')
  })
})
