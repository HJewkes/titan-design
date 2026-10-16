import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ManifestInput } from '@titan-design/review-schema'
import { describe, expect, it } from 'vitest'
import type { Prose } from '../src/packet-prose.ts'
import {
  OTHER_HEAD,
  editDraft,
  lint,
  packetDir,
  rules,
  validProse,
  writeJsonFile,
} from './packet-lint-fake.ts'

/** A packet dir with a prose.json: the valid one, edited. */
async function withProse(edit: (prose: Prose) => void = () => {}) {
  const dir = await packetDir()
  const prose = await validProse(dir)
  edit(prose)
  await writeJsonFile(dir, 'prose.json', prose)
  return dir
}

describe('packet lint: prose.json', () => {
  it('passes a valid prose.json, required or not', async () => {
    const dir = await withProse()

    expect(await lint(dir)).toEqual([])
    expect(await lint(dir, { require: ['prose'] })).toEqual([])
  })

  it('refuses an empty delta, naming the field', async () => {
    const problems = await lint(await withProse((p) => (p.delta = [])))

    expect(problems.map((p) => p.rule)).toEqual(['prose-schema'])
    expect(problems[0].message).toContain('delta')
  })

  it('refuses an intent that is only whitespace', async () => {
    expect(await rules(await withProse((p) => (p.intent.text = '  ')))).toEqual(['prose-schema'])
  })

  it('refuses two follow-ups, since DP-1 asks for three to five', async () => {
    const dir = await withProse((p) => (p.followUps = p.followUps.slice(0, 2)))

    expect(await rules(dir)).toEqual(['prose-schema'])
  })

  it('refuses a recommendation that is not a Ship option', async () => {
    const dir = await withProse((p) => Object.assign(p.recommend, { answer: 'Merge' }))

    expect(await rules(dir)).toEqual(['prose-schema'])
  })

  it('refuses an approver that is neither a decision nor a task id', async () => {
    const dir = await withProse((p) => (p.intent.approvedBy = 'someone'))

    expect(await rules(dir)).toEqual(['prose-schema'])
  })

  it('refuses a prose.json that is not JSON', async () => {
    const dir = await packetDir()
    await writeFile(join(dir, 'prose.json'), '{')

    expect(await rules(dir)).toEqual(['prose-schema'])
  })

  it('refuses prose written for another packet at the same head', async () => {
    const dir = await withProse((p) => (p.packetId = 'f'.repeat(64)))

    expect(await rules(dir)).toEqual(['prose-binding'])
  })

  it('refuses prose written for another head', async () => {
    expect(await rules(await withProse((p) => (p.headSha = OTHER_HEAD)))).toEqual(['prose-binding'])
  })

  it('refuses a cause for an image the packet does not have', async () => {
    const dir = await withProse((p) => (p.cause['img-009'] = 'src/other.tsx'))

    expect(await rules(dir)).toEqual(['cause-unknown'])
  })

  it('refuses prose that leaves an image without a cause', async () => {
    const dir = await withProse((p) => delete p.cause['img-002'])

    const problems = await lint(dir)
    expect(problems.map((p) => p.rule)).toEqual(['cause-missing'])
    expect(problems[0].message).toContain('img-002')
  })

  it('refuses a missing prose.json only when it is required', async () => {
    const dir = await packetDir()

    expect(await rules(dir, { require: ['prose'] })).toEqual(['prose-missing'])
    expect(await rules(dir)).toEqual([])
  })
})

describe('packet lint: the draft head', () => {
  it("refuses a draft whose Ship question binds another head, even with the draft's sha updated", async () => {
    const dir = await packetDir()
    await editDraft(dir, (text) => {
      const draft = JSON.parse(text) as ManifestInput
      const ship = draft.questions.find((q) => q.kind === 'pick-one' && q.merge)!
      if (ship.kind === 'pick-one') ship.merge!.headSha = OTHER_HEAD
      return `${JSON.stringify(draft, null, 2)}\n`
    })

    expect(await rules(dir)).toEqual(['draft-head'])
  })
})
