import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadRound } from '../src/review.ts'
import { RoundSchema, isBlanketSignOff, type ManifestInput } from '@titan-design/review-schema'
import { SECTION_TEXTS } from './fixtures.ts'

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function png(bytes: number, width = 1280): Buffer {
  const header = Buffer.alloc(24)
  Buffer.from(PNG_SIGNATURE).copy(header)
  header.write('IHDR', 12, 'ascii')
  header.writeUInt32BE(width, 16)
  return header.subarray(0, bytes)
}

function pickOne(id: string, options: string[], revisionOption?: string) {
  return {
    id,
    kind: 'pick-one' as const,
    prompt: `Which ${id}?`,
    options,
    signsOff: `the ${id} under a pinned header`,
    required: true,
    ...(revisionOption === undefined ? {} : { revisionOption }),
  }
}

function round(questions: ManifestInput['questions']): ManifestInput {
  return {
    schema: 'titan-review/round@2',
    unit: 'td-694-followups',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6100',
    widths: [1280],
    variants: [
      { key: 'keep', image: 'keep.png', label: 'keep' },
      { key: 'tight', image: 'tight.png', label: 'tight' },
    ],
    questions,
    sections: [
      {
        id: 'spacing',
        title: 'Spacing',
        ...SECTION_TEXTS,
        kind: 'CHOICE',
        questionIds: questions.map((q) => q.id),
        variantKeys: ['keep', 'tight'],
      },
    ],
  }
}

async function refusal(input: unknown, tightBytes = 24) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-followups-'))
  await writeFile(join(dir, 'keep.png'), png(24))
  await writeFile(join(dir, 'tight.png'), png(tightBytes))
  const path = join(dir, 'draft.json')
  await writeFile(path, JSON.stringify(input))
  return loadRound(path).then(
    () => '',
    (err: Error) => err.message
  )
}

describe('round@2 follow-ups', () => {
  it('loads a round whose pick-ones share one revisionOption text', async () => {
    const both = round([
      pickOne('spacing', ['keep', 'Rework the gap'], 'Rework the gap'),
      pickOne('rule', ['Keep the rule', 'Rework the gap'], 'Rework the gap'),
    ])
    expect(await refusal(both)).toBe('')
  })

  it('still refuses a shared option that is not either question’s revisionOption', async () => {
    const shared = round([
      pickOne('spacing', ['keep', 'Rework it'], 'Rework the gap'),
      pickOne('rule', ['Keep the rule', 'Rework it'], 'Rework the gap'),
    ])
    expect(await refusal(shared)).toContain('option "Rework it" is also in spacing')
  })

  it('names the sections array when a round has none', () => {
    const { sections: _sections, ...bare } = round([pickOne('spacing', ['keep', 'tight'])])
    const result = RoundSchema.safeParse(bare)
    expect(JSON.stringify(result.error?.issues)).toContain('a round needs a sections array')
  })

  it('refuses a truncated PNG frame instead of reading it as 0px wide', async () => {
    const message = await refusal(round([pickOne('spacing', ['keep', 'tight'])]), 18)
    expect(message).toContain('cannot read PNG width')
    expect(message).toContain('tight.png')
  })

  it.each(['LGTM', 'Looks good', 'looks good to me!', 'Approve', 'Ship it.'])(
    'refuses the bare approval %s',
    (text) => expect(isBlanketSignOff(text)).toBe(true)
  )

  it.each(['looks good: the spacing under the pinned header', 'Ship it after the rule moves'])(
    'accepts an approval that names a changed part: %s',
    (text) => expect(isBlanketSignOff(text)).toBe(false)
  )
})
