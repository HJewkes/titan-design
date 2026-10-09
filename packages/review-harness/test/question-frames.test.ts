import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Form } from '../page/App.tsx'
import { initialState, pagesFor, stopsFor } from '../page/state.ts'
import { buildRound, type TreeGit } from '../src/build.ts'
import { RoundSchema, type Manifest, type ManifestInput } from '@titan-design/review-schema'

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
  const code = await buildRound(path, undefined, io, '/tree')
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
        'frame:pill-outline',
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
  })

  it('refuses a pick whose frames sit in another section, naming both', async () => {
    const draft = await readDraft()
    const pick = draft.questions.find((q) => q.id === 'button-weight')!
    draft.questions = draft.questions.map((q) =>
      q === pick ? { ...q, frames: ['button-primary', 'button-loading'] } : q
    )
    await expect(build(draft)).rejects.toThrow(
      'question button-weight: frame button-loading is in section pr-102-ship, not in its own section pr-102-picks, so it would not sit directly above the question'
    )
  })
})
