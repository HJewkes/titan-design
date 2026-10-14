import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Form } from '../page/App.tsx'
import { initialState, pagesFor, stopsFor } from '../page/state.ts'
import { buildRound, type TreeGit } from '../src/build.ts'
import {
  RoundSchema,
  lintRound,
  type Manifest,
  type ManifestInput,
} from '@titan-design/review-schema'

const MERGE = 'f'.repeat(40)
const tree: TreeGit = {
  revParse: async (_t, ref) => (ref === 'HEAD' ? MERGE : '0'.repeat(40)),
  isAncestor: async () => true,
}

const readDraft = async (): Promise<ManifestInput> =>
  JSON.parse(
    await readFile(
      new URL('./fixtures/drafts/question-frames-two-prs.json', import.meta.url),
      'utf8'
    )
  )

const roots: string[] = []

async function build(draft: ManifestInput) {
  const root = await mkdtemp(join(tmpdir(), 'titan-question-frames-'))
  roots.push(root)
  const dir = join(root, 'round-1')
  await mkdir(dir)
  const path = join(dir, 'draft.json')
  await writeFile(path, JSON.stringify(draft))
  const lines: string[] = []
  const io = { stderr: (t: string) => lines.push(t), measure: async () => [], git: tree }
  const code = await buildRound(path, undefined, io, { tree: '/tree' })
  return { code, lines, round: join(dir, 'round.json') }
}

async function builtRound(): Promise<Manifest> {
  const { code, round } = await build(await readDraft())
  expect(code).toBe(0)
  return RoundSchema.parse(JSON.parse(await readFile(round, 'utf8')))
}

/** The page's stops, as `frame:<key>` and `question:<id>`, from the first stop of each page. */
function pageStops(m: Manifest): string[][] {
  const stops = stopsFor(m).map((s) =>
    s.kind === 'variant' ? `frame:${s.key}` : s.kind === 'question' ? `question:${s.id}` : s.kind
  )
  return pagesFor(m).map((p) => stops.slice(p.first, p.last + 1))
}

const formAt = (m: Manifest, active: number) =>
  renderToStaticMarkup(
    createElement(Form, {
      manifest: m,
      state: { ...initialState(m), active },
      dispatch: () => {},
      onHitTesting: () => {},
    })
  )

beforeEach(async () => {
  const stories = (await readDraft()).variants.flatMap((v) => (v.storyId ? [v.storyId] : []))
  const entries = Object.fromEntries(stories.map((id) => [id, {}]))
  vi.stubGlobal('fetch', async () => Response.json({ entries }))
})
afterAll(async () => {
  vi.unstubAllGlobals()
  await Promise.all(roots.map((r) => rm(r, { recursive: true, force: true })))
})

describe('a round of two PR groups with anchored picks', () => {
  it('pages each PR group whole: its frames, each pick under its frames, then its Ship', async () => {
    const round = await builtRound()
    expect(pageStops(round)).toEqual([
      [
        'frame:pill-built',
        'frame:pill-subtle',
        'frame:pill-subtle-light',
        'frame:pill-outline',
        'frame:pill-outline-light',
        'question:pill-format',
        'frame:pill-sm',
        'frame:pill-md',
        'question:pill-size',
        'question:ship-101',
      ],
      [
        'frame:button-primary',
        'frame:button-secondary',
        'question:button-weight',
        'frame:button-outline',
        'frame:button-ghost',
        'question:button-quiet',
        'frame:button-loading',
        'question:ship-102',
      ],
      ['general'],
    ])
  })

  it('renders both of a PR group sections on one page, the Ship after every frame', async () => {
    const round = await builtRound()
    const [, second] = pagesFor(round)
    const markup = formAt(round, second.first)
    const at = (needle: string) => markup.indexOf(needle)
    expect(markup).not.toContain('data-testid="section-pr-101"')
    expect(at('data-testid="variant-button-secondary"')).toBeLessThan(
      at('data-testid="question-button-weight"')
    )
    expect(at('data-testid="question-button-weight"')).toBeLessThan(
      at('data-testid="variant-button-outline"')
    )
    expect(at('data-testid="question-button-quiet"')).toBeLessThan(
      at('data-testid="variant-button-loading"')
    )
    expect(at('data-testid="variant-button-loading"')).toBeLessThan(
      at('data-testid="question-ship-102"')
    )
    expect(markup).toContain('Section 2 of 3: #102 Button weight and style')
    expect(markup).not.toContain('data-testid="strip-kind-pr-102-picks"')
    expect(markup).toContain('data-testid="strip-kind-pr-102-ship"')
  })

  it('builds a round that lints clean, carrying every review field', async () => {
    const round = await builtRound()
    expect(lintRound(round)).toEqual([])
    expect(round.prGroups?.map((g) => g.sectionIds)).toEqual([
      ['pr-101'],
      ['pr-102-ship', 'pr-102-picks'],
    ])
    expect(round.questions.find((q) => q.id === 'ship-101')).toMatchObject({
      decision: 'ship',
      outcomes: { Ship: 'accept', "Don't ship": 'changes' },
    })
    expect(round.variants.find((v) => v.key === 'pill-subtle-light')).toMatchObject({
      variantUnit: 'pill-subtle',
      alternate: 'subtle',
      change: 'new',
    })
  })

  it('refuses a pick whose frames sit in another section, naming both', async () => {
    const draft = await readDraft()
    const pick = draft.questions.find((q) => q.id === 'button-weight')!
    draft.questions = draft.questions.map((q) =>
      q === pick ? { ...q, frames: ['button-primary', 'button-secondary', 'button-loading'] } : q
    )
    await expect(build(draft)).rejects.toThrow(
      'frame-outside-section: question button-weight: frame button-loading is in section pr-102-ship, not in its own section pr-102-picks, so it would not sit directly above the question'
    )
  })

  it('refuses a deciding question with no frames', async () => {
    const draft = await readDraft()
    draft.questions = draft.questions.map((q) => {
      if (q.id !== 'pill-size' || q.kind !== 'pick-one') return q
      const { frames: _, ...rest } = q
      return { ...rest, options: ['Small', 'Medium'], implemented: 'Small' }
    })
    await expect(build(draft)).rejects.toThrow(
      'unanchored-question: question pill-size: it decides something its section shows; name its frames'
    )
  })

  it('refuses an iterate question that does not declare its implemented option', async () => {
    const draft = await readDraft()
    draft.questions = draft.questions.map((q) => {
      if (q.id !== 'pill-size' || q.kind !== 'pick-one') return q
      const { implemented: _, ...rest } = q
      return rest
    })
    await expect(build(draft)).rejects.toThrow(
      'missing-implemented-option: question pill-size: its iterate decision changes what ships; declare the option the PR implements (implemented)'
    )
  })

  it('refuses a variant unit split between a pick and the strip', async () => {
    const draft = await readDraft()
    draft.variants = draft.variants.map((v) =>
      v.key === 'pill-built' ? { ...v, variantUnit: 'pill-subtle', alternate: 'subtle' } : v
    )
    await expect(build(draft)).rejects.toThrow(
      "split-variant-unit: variant unit pill-subtle is split across section pr-101's strip and question pill-format"
    )
  })

  it('refuses alternates compared over different modes', async () => {
    const draft = await readDraft()
    draft.variants = draft.variants.map((v) =>
      v.key === 'pill-outline-light' ? { ...v, globals: { theme: 'dark' } } : v
    )
    await expect(build(draft)).rejects.toThrow(
      'unequal-alternates: question pill-format: alternate subtle shows theme=dark, theme=light but outline shows theme=dark, theme=dark; compare whole units over the same modes'
    )
  })

  it("refuses a Ship whose head is not its PR group's", async () => {
    const draft = await readDraft()
    draft.prGroups = draft.prGroups!.map((g) =>
      g.pr === 'owner/name#102' ? { ...g, headSha: '3'.repeat(40) } : g
    )
    await expect(build(draft)).rejects.toThrow(
      `ship-head-mismatch: question ship-102: it ships owner/name#102 at ${'2'.repeat(40)}, but its PR group is at ${'3'.repeat(40)}`
    )
  })

  it('keeps a PR group on one page even when a section names no PR of its own', async () => {
    const draft = await readDraft()
    draft.sections = [
      ...draft.sections!.map((s) =>
        s.id === 'pr-101'
          ? { ...s, variantKeys: s.variantKeys!.filter((k) => k !== 'pill-built') }
          : s
      ),
      {
        id: 'pill-context',
        title: 'Pill as built',
        deciding: 'Nothing; context for the Pill picks.',
        changed: 'Nothing.',
        context: 'The as-built Pill.',
        kind: 'STATES',
        questionIds: [],
        variantKeys: ['pill-built'],
      },
    ]
    draft.prGroups = draft.prGroups!.map((g) =>
      g.pr === 'owner/name#101' ? { ...g, sectionIds: ['pill-context', 'pr-101'] } : g
    )
    const { code, round } = await build(draft)
    expect(code).toBe(0)
    const built = RoundSchema.parse(JSON.parse(await readFile(round, 'utf8')))
    const pages = pagesFor(built)
    expect(pages.map((p) => p.sectionIds)).toEqual([
      ['pill-context', 'pr-101'],
      ['pr-102-picks', 'pr-102-ship'],
      [],
    ])
    expect(pageStops(built)[0].at(-1)).toBe('question:ship-101')
  })
})
