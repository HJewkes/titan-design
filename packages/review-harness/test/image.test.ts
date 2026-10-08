import http from 'node:http'
import { mkdir, mkdtemp, readFile, realpath, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../page/App.tsx'
import { captureRound } from '../src/capture.ts'
import { exampleManifest } from '../src/example.ts'
import { buildFeedback, emptyDraft } from '../src/feedback.ts'
import { ReviewError, assertStoriesExist, loadRound } from '../src/review.ts'
import { FeedbackSchema, ManifestSchema, type ManifestInput } from '@titan-design/review-schema'
import { startReviewServer, type ReviewServer } from '../src/server.ts'
import { SHA, underContract } from './fixtures.ts'

// A 1x1 PNG, so the files are real PNGs without shipping a binary fixture.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

/** The example round with C swapped for a screenshot; `imageOnly` drops the stories. */
function imageRound(image = 'shots/wall.png', imageOnly = false): ManifestInput {
  const m = exampleManifest('http://127.0.0.1:6100')
  const c = { key: 'C', image, label: 'Wall screenshot' }
  const variants = imageOnly ? [c] : [m.variants[0], m.variants[1], c]
  const q1 = { id: 'q1', kind: 'pick-one' as const, prompt: 'Keep it?', options: ['C', 'none'] }
  return imageOnly ? { ...m, variants, questions: [q1] } : { ...m, variants }
}

/** Writes the round under the review contract, which loading it requires. */
async function roundDir(manifest: ManifestInput): Promise<{ dir: string; path: string }> {
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-image-'))
  await mkdir(join(dir, 'shots'))
  await writeFile(join(dir, 'shots', 'wall.png'), PNG)
  const path = join(dir, 'round.json')
  await writeFile(path, JSON.stringify(underContract(manifest)))
  return { dir, path }
}

const loadError = (path: string) =>
  loadRound(path).then(
    () => '',
    (err: Error) => (err instanceof ReviewError ? err.message : `unexpected: ${err}`)
  )

describe('loading a round with an image variant', () => {
  it('resolves the image against the round file, by variant key', async () => {
    const { dir, path } = await roundDir(imageRound())
    const round = await loadRound(path)
    expect(Object.keys(round.images)).toEqual(['C'])
    expect(round.images.C).toBe(join(await realpath(dir), 'shots', 'wall.png'))
  })

  it('refuses a missing image at load time, naming the variant', async () => {
    const { path } = await roundDir(imageRound('shots/gone.png'))
    expect(await loadError(path)).toMatch(/variant C: image shots\/gone.png does not exist/)
  })

  it('refuses an image that a symlink takes outside the round directory', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'titan-review-outside-'))
    await writeFile(join(outside, 'secret.png'), PNG)
    const { dir, path } = await roundDir(imageRound('shots/link.png'))
    await symlink(join(outside, 'secret.png'), join(dir, 'shots', 'link.png'))
    expect(await loadError(path)).toMatch(/resolves outside the round directory/)
  })

  it('refuses a file that only has a .png name', async () => {
    const { dir, path } = await roundDir(imageRound('shots/fake.png'))
    await writeFile(join(dir, 'shots', 'fake.png'), 'not a png')
    expect(await loadError(path)).toMatch(/variant C: image shots\/fake.png is not a PNG file/)
  })

  it('needs no Storybook when every variant is an image', async () => {
    const { path } = await roundDir(imageRound('shots/wall.png', true))
    await expect(assertStoriesExist(await loadRound(path))).resolves.toBeUndefined()
  })
})

describe('serving an image variant', () => {
  let server: ReviewServer
  beforeEach(async () => {
    const { path } = await roundDir(imageRound())
    const round = await loadRound(path)
    server = await startReviewServer({
      ...round,
      page: (_req: http.IncomingMessage, res: http.ServerResponse) => res.end('page'),
    })
  })
  afterEach(() => server.close())

  it('serves the PNG under api/image/<key>', async () => {
    const res = await fetch(`${server.url}api/image/C`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(Buffer.from(await res.arrayBuffer()).equals(PNG)).toBe(true)
  })

  it.each(['A', 'nope', '..%2Fround.json', 'toString'])('answers 404 for %s', async (key) => {
    expect((await fetch(`${server.url}api/image/${key}`)).status).toBe(404)
  })

  it('answers 404 for a malformed escape and stays up', async () => {
    expect((await fetch(`${server.url}api/image/%E0%A4%A`)).status).toBe(404)
    expect((await fetch(`${server.url}api/image/C`)).status).toBe(200)
  })
})

describe('the page and the record for an image variant', () => {
  const manifest = ManifestSchema.parse(imageRound())

  it('renders a static image at each width, in the same card with the same controls', () => {
    const markup = renderToStaticMarkup(createElement(App, { manifest, manifestSha256: SHA }))
    const card = markup.slice(markup.indexOf('data-testid="variant-C"'))
    expect(card).toContain('<code>shots/wall.png</code>')
    expect(card).toContain('src="api/image/C"')
    expect(card).toContain('alt="C · Wall screenshot at 1920px"')
    expect(card).toContain('alt="C · Wall screenshot at 360px"')
    expect(card).toContain('data-testid="overlay-C-1920"')
    expect(card).toContain('aria-label="Verdict for C"')
    expect(card).toContain('aria-label="Comment on C"')
    expect(card.slice(0, card.indexOf('aria-label="Comment on C"'))).not.toContain('<iframe')
  })

  it('records the image in place of a storyId in feedback', () => {
    const draft = emptyDraft(manifest)
    draft.variants.C = { verdict: 'chosen', comment: 'Reads at distance', annotations: [] }
    const feedback = buildFeedback(manifest, SHA, draft, new Date('2026-10-01T00:00:00Z'))
    expect(FeedbackSchema.parse(feedback).variants[2]).toEqual({
      key: 'C',
      image: 'shots/wall.png',
      verdict: 'chosen',
      comment: 'Reads at distance',
      annotations: [],
    })
    expect(feedback.variants[0]).toMatchObject({ key: 'A', storyId: manifest.variants[0].storyId })
  })

  it('caps an auto image frame at the round cap and fixes a numbered one, scrolling past either', () => {
    const capped = ManifestSchema.parse({ ...imageRound(), height: 'auto', maxHeight: 600 })
    capped.variants[0] = { ...capped.variants[2], key: 'D', height: 300 }
    const markup = renderToStaticMarkup(
      createElement(App, { manifest: capped, manifestSha256: SHA })
    )
    const frames = (key: string) =>
      markup
        .slice(markup.indexOf(`data-testid="variant-${key}"`))
        .match(/class="frame-box image-box" style="[^"]*"/)?.[0]
    expect(frames('C')).toContain('max-height:600px')
    expect(frames('D')).toContain('height:300px')
    expect(frames('D')).not.toContain('max-height')
  })
})

describe('capturing an image variant', () => {
  const capture = async (manifest: ManifestInput, setup?: (dir: string) => Promise<void>) => {
    const { dir, path } = await roundDir(manifest)
    await setup?.(dir)
    const round = await loadRound(path)
    const out = await realpath(dir)
    return { out, run: () => captureRound(round.manifest, round.storybookUrl, out, round.images) }
  }

  it('copies the PNG into the capture directory without starting a browser', async () => {
    const { run, out } = await capture(imageRound('shots/wall.png', true))
    const files = await run()
    expect(files).toEqual([join(out, 'C-image.png')])
    expect((await readFile(files[0])).equals(PNG)).toBe(true)
  })

  it("renames a copy that would land on another variant's source PNG", async () => {
    const original = Buffer.concat([PNG, Buffer.from('B source')])
    const manifest = {
      ...imageRound('shots/wall.png', true),
      variants: [
        { key: 'A', image: 'shots/wall.png', label: 'A' },
        { key: 'B', image: 'A-image.png', label: 'B' },
      ],
      questions: [],
    }
    const { run, out } = await capture(manifest, (dir) =>
      writeFile(join(dir, 'A-image.png'), original)
    )
    expect(await run()).toEqual([join(out, 'A-image-2.png'), join(out, 'B-image.png')])
    expect((await readFile(join(out, 'A-image.png'))).equals(original)).toBe(true)
  })

  it("refuses a story shot that would land on an image variant's source, before any browser", async () => {
    const m = imageRound('1920-A-responsive.png')
    const { run } = await capture(m, (dir) => writeFile(join(dir, '1920-A-responsive.png'), PNG))
    await expect(run()).rejects.toThrow(/refusing to overwrite the round's source image/)
  })
})
