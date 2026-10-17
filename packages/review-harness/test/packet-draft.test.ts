import { describe, expect, it } from 'vitest'
import {
  RoundSchema,
  SHIP_OPTIONS,
  lintRound,
  type ManifestInput,
} from '@titan-design/review-schema'
import { checkDraft } from '../src/packet.ts'
import { packetDraft, type DraftPacket } from '../src/packet-draft.ts'
import { applyRoundRules } from '../src/round-rules.ts'

// An invented repo and run; the shas only need the right shape.
const HEAD = 'a1'.repeat(20)

function packet(images: DraftPacket['images'] = defaultImages()): DraftPacket {
  return {
    repo: 'acme/widgets',
    pr: 42,
    headSha: HEAD,
    mainSha: 'b2'.repeat(20),
    ci: { runId: '1234' },
    unchanged: { component: 3, story: 5 },
    images,
  }
}

function defaultImages(): DraftPacket['images'] {
  const image = (key: string, change: 'changed' | 'new' | 'removed') => ({
    key,
    label: `component: ${key}`,
    change,
    file: `montage/${key}.png`,
    source: 'git' as const,
    ...(change === 'new' ? {} : { before: { file: `before/${key}.png` } }),
  })
  return [image('img-001', 'changed'), image('img-002', 'new'), image('img-003', 'removed')]
}

const SIDE = {
  id: 'bundle',
  kind: 'pick-one' as const,
  prompt: 'Accept the bundle growth?',
  options: ['Accept', 'Shrink first'],
  signsOff: 'the 2 kB growth of the ESM entry',
  decision: 'decide' as const,
  implemented: 'Accept',
}

function lint(draft: ManifestInput) {
  return lintRound(RoundSchema.parse(applyRoundRules(draft)))
}

const ships = (draft: ManifestInput) =>
  draft.questions.filter((q) => q.kind === 'pick-one' && q.merge !== undefined)

describe('packetDraft', () => {
  it('passes the builder rules, the round contract and lintRound', () => {
    expect(lint(packetDraft(packet(), []))).toEqual([])
  })

  it('binds exactly one Ship question, to --head on the PR page', () => {
    const [ship, ...more] = ships(packetDraft(packet(), [SIDE]))

    expect(more).toEqual([])
    expect(ship).toMatchObject({ page: 'acme/widgets#42', merge: { headSha: HEAD, pr: 42 } })
  })

  it('gives changed frames a base and new frames none', () => {
    const variants = packetDraft(packet(), []).variants

    expect(variants.find((v) => v.change === 'changed')?.baseImage).toBe('before/img-001.png')
    expect(variants.find((v) => v.change === 'new')?.baseImage).toBeUndefined()
  })

  it('asks side questions on the PR page ahead of Ship, which comes last', () => {
    const draft = packetDraft(packet(), [SIDE])
    const sections = draft.sections!

    expect(draft.questions.find((q) => q.id === 'bundle')?.page).toBe('acme/widgets#42')
    expect(sections.map((s) => s.id)).toEqual(['changed', 'new', 'removed', 'side', 'ship'])
    expect(sections.at(-1)?.questionIds?.at(-1)).toBe('ship')
    expect(lint(draft)).toEqual([])
  })

  it('reports the lint when a side decision does not declare what the PR implements', () => {
    const { implemented: _dropped, ...bare } = SIDE

    expect(lint(packetDraft(packet(), [bare])).map((p) => p.rule)).toContain(
      'missing-implemented-option'
    )
  })

  it('keeps variant keys short and the long story stem in the label', () => {
    const stem = `pages-workout-${'very-long-story-name-'.repeat(4)}--default`
    const images = [
      {
        key: 'img-001',
        label: `story: ${stem}`,
        change: 'new' as const,
        file: 'montage/img-001.png',
        source: 'git' as const,
      },
    ]
    const [variant] = packetDraft(packet(images), []).variants

    expect(stem.length).toBeGreaterThan(90)
    expect(variant.key.length).toBeLessThanOrEqual(32)
    expect(variant.label).toContain(stem)
  })

  it('omits empty change sections, leaving Ship alone for a run with no images', () => {
    const draft = packetDraft(packet([]), [])

    expect(draft.sections?.map((s) => s.id)).toEqual(['ship'])
    expect(lint(draft)).toEqual([])
  })

  it('words the Ship draft as today for images that all come from git', () => {
    expect(packetDraft(packet(), [])).toMatchSnapshot()
  })

  it('names the CI run and asks for exactly these images when one comes from the artifact', () => {
    const images = defaultImages().map((i, n) =>
      n === 0 ? { ...i, source: 'artifact' as const } : i
    )
    const draft = packetDraft(packet(images), [])
    const [ship] = ships(draft)
    if (ship.kind !== 'pick-one') throw new Error('Ship is a pick-one')

    expect(ship.prompt).toContain('CI run 1234')
    expect(ship.prompt).toContain('committed exactly')
    expect(ship.options).toEqual([...SHIP_OPTIONS])
    expect(ship.merge).toMatchObject({ headSha: HEAD, ship: ['Ship'] })
    expect(lint(draft)).toEqual([])
    expect(() => checkDraft(draft)).not.toThrow()
  })

  it('fails checkDraft when the regenerated Ship question gains a third option', () => {
    const images = defaultImages().map((i) => ({ ...i, source: 'artifact' as const }))
    const draft = packetDraft(packet(images), [])
    const ship = ships(draft)[0]
    if (ship.kind !== 'pick-one') throw new Error('Ship is a pick-one')
    ship.options = [...ship.options, 'Ship later']

    expect(() => checkDraft(draft)).toThrow()
  })
})
