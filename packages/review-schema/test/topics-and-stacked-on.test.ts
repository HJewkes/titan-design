import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ManifestSchema, RoundSchema, manifestJsonSchema } from '../src/index.ts'

// A real round@2 manifest written before 0.2, trimmed to three sections.
const realRound = (): Record<string, unknown> & { questions: Record<string, unknown>[] } =>
  JSON.parse(readFileSync(new URL('./fixtures/round-gate2-batch-9.json', import.meta.url), 'utf8'))

const HEAD = '1a9b9a1886a1d8428aea1ac06af47a63bdbaa2f6'

function withTopics(topics: unknown) {
  const round = realRound()
  round.questions[0] = { ...round.questions[0], topics }
  return round
}

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((i) => i.message) ?? []

describe('a round@2 manifest written before 0.2', () => {
  it('still validates under the contract and the reader', () => {
    expect(messages(RoundSchema.safeParse(realRound()))).toEqual([])
    expect(ManifestSchema.safeParse(realRound()).success).toBe(true)
  })
})

describe('question topics', () => {
  it('accepts ask, component, token and topic keys', () => {
    const topics = [
      'ask:gate2-batch-9/td54-pick',
      'component:CardStat',
      'token:text-secondary',
      'topic:stat-anatomy',
    ]
    const result = RoundSchema.safeParse(withTopics(topics))
    expect(messages(result)).toEqual([])
    expect(result.data?.questions[0]?.topics).toEqual(topics)
  })

  it.each(['CardStat', 'task:TD-1', 'component:', 'topic:two words', ' ask:x'])(
    'refuses the topic %j',
    (topic) => {
      expect(messages(RoundSchema.safeParse(withTopics([topic])))).toEqual([
        'a topic is ask:, component:, token: or topic: then a name without spaces',
      ])
    }
  )
})

describe('manifest stackedOn', () => {
  it('accepts the base PR a round is stacked on', () => {
    const stackedOn = { repo: 'HJewkes/titan-design', pr: 762, headSha: HEAD }
    const result = RoundSchema.safeParse({ ...realRound(), stackedOn })
    expect(messages(result)).toEqual([])
    expect(result.data?.stackedOn).toEqual(stackedOn)
  })

  it.each([
    ['a short head', { repo: 'HJewkes/titan-design', pr: 762, headSha: 'decc7b7b' }],
    ['a bare repo name', { repo: 'titan-design', pr: 762, headSha: HEAD }],
    ['a zero PR number', { repo: 'HJewkes/titan-design', pr: 0, headSha: HEAD }],
    ['an unknown field', { repo: 'HJewkes/titan-design', pr: 762, headSha: HEAD, branch: 'x' }],
  ])('refuses %s', (_, stackedOn) => {
    expect(RoundSchema.safeParse({ ...realRound(), stackedOn }).success).toBe(false)
  })

  it('appears in the JSON Schema as an optional field', () => {
    const schema = manifestJsonSchema() as {
      required: string[]
      properties: { stackedOn: { required: string[] } }
    }
    expect(schema.properties.stackedOn.required).toEqual(['repo', 'pr', 'headSha'])
    expect(schema.required).not.toContain('stackedOn')
  })
})
