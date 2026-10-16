import type { ManifestInput } from '@titan-design/review-schema'
import { describe, expect, it } from 'vitest'
import { applyRoundRules } from '../src/round-rules.ts'
import { MAIN, TREE } from './packet-fake.ts'
import {
  OTHER_HEAD,
  lint,
  packetDir,
  readJsonFile,
  rules,
  writeJsonFile,
} from './packet-lint-fake.ts'

type Round = ManifestInput & { build?: { mainSha: string; mergeSha: string } }

/** A packet dir with the round.json `build` writes for its draft, edited. */
async function withRound(edit: (round: Round) => void = () => {}) {
  const dir = await packetDir()
  const draft = await readJsonFile<ManifestInput>(dir, 'draft.json')
  const round: Round = { ...applyRoundRules(draft), build: { mainSha: MAIN, mergeSha: TREE } }
  edit(round)
  await writeJsonFile(dir, 'round.json', round)
  return dir
}

describe('packet lint: round.json', () => {
  it('passes the round build writes for the draft, with its provenance', async () => {
    const dir = await withRound()

    expect(await lint(dir)).toEqual([])
    expect(await rules(dir, { require: ['prose', 'round'] })).toEqual([
      'prose-missing',
      'frames-missing',
    ])
  })

  it('refuses a round whose question prompt was edited', async () => {
    const dir = await withRound((r) => (r.questions[0].prompt = 'SHIP: Ship it anyway?'))

    expect(await rules(dir)).toEqual(['round-draft'])
  })

  it('refuses a round whose unit names another head', async () => {
    const dir = await withRound(
      (r) => (r.unit = r.unit.replace(/[0-9a-f]{12}$/, OTHER_HEAD.slice(0, 12)))
    )

    expect(await rules(dir)).toEqual(['round-unit', 'round-draft'])
  })

  it('refuses a round whose PR group is at another head', async () => {
    const dir = await withRound((r) => (r.prGroups![0].headSha = OTHER_HEAD))

    expect(await rules(dir)).toEqual(['round-draft', 'round-head'])
  })

  it('refuses a round whose Ship question binds another head', async () => {
    const dir = await withRound((r) => {
      const ship = r.questions.find((q) => q.kind === 'pick-one' && q.merge)!
      if (ship.kind === 'pick-one') ship.merge!.headSha = OTHER_HEAD
    })

    expect(await rules(dir)).toEqual(['round-draft', 'round-head'])
  })

  it('refuses a round.json that is not an object', async () => {
    const dir = await packetDir()
    await writeJsonFile(dir, 'round.json', [])

    expect(await rules(dir)).toEqual(['round-draft'])
  })

  it('refuses a missing round.json only when it is required', async () => {
    const dir = await packetDir()

    expect(await rules(dir, { require: ['round'] })).toEqual(['round-missing', 'frames-missing'])
    expect(await rules(dir)).toEqual([])
  })
})
