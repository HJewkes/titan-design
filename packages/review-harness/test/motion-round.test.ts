import http from 'node:http'
import { mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  FeedbackSchema,
  ManifestSchema,
  RoundSchema,
  lintRound,
  type ManifestInput,
} from '@titan-design/review-schema'
import { App } from '../page/App.tsx'
import { captureRound, scaleCaptureFileName } from '../src/capture.ts'
import { contrastReport } from '../src/contrast-gate.ts'
import { buildFeedback, emptyDraft } from '../src/feedback.ts'
import { ReviewError, isVideoHead, loadRound } from '../src/review.ts'
import { urlParamProblems } from '../src/round.ts'
import { byteRange, startReviewServer, type ReviewServer } from '../src/server.ts'
import { SHA, underContract } from './fixtures.ts'

// The first bytes of each container, enough for the sniff; no binary fixture is shipped.
const WEBM = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.from('webm body')])
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom mp4 body')])

const STORY = 'components-molecules-progress--default'

function motionRound(clip = 'clips/reel.webm'): ManifestInput {
  return {
    schema: 'titan-review/round@2',
    unit: 'motion-round',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6200',
    widths: [1920],
    variants: [
      {
        key: 'fill',
        storyId: STORY,
        label: 'Fill',
        motion: { mechanism: 'arg', arg: 'value', from: 0, to: 100, durationMs: 3000 },
      },
      {
        key: 'size',
        storyId: 'foundations-typography--default',
        label: 'Sizes',
        scale: { arg: 'variant', candidates: ['h3', 'h1'] },
      },
      { key: 'reel', clip, label: 'Reel', motion: { mechanism: 'clip', loop: false } },
    ],
    questions: [],
  }
}

async function roundDir(manifest: ManifestInput, bytes: Buffer = WEBM) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-motion-'))
  await mkdir(join(dir, 'clips'))
  await writeFile(join(dir, 'clips', 'reel.webm'), bytes)
  const path = join(dir, 'round.json')
  await writeFile(path, JSON.stringify(underContract(manifest)))
  return { dir, path }
}

const clipOnly = (): ManifestInput => ({ ...motionRound(), variants: [motionRound().variants[2]] })

describe('loading a clip variant', () => {
  it('resolves the clip against the round file, by variant key', async () => {
    const { dir, path } = await roundDir(motionRound())
    const round = await loadRound(path)
    expect(round.clips).toEqual({ reel: join(await realpath(dir), 'clips', 'reel.webm') })
  })

  it('refuses a file that only has a video name', async () => {
    const { path } = await roundDir(motionRound(), Buffer.from('not a video'))
    await expect(loadRound(path)).rejects.toThrow(
      new ReviewError(`variant reel: clip clips/reel.webm is not an mp4 or webm file`)
    )
  })

  it('knows an mp4 and a webm by their first bytes', () => {
    expect([isVideoHead(WEBM), isVideoHead(MP4), isVideoHead(Buffer.from('GIF89a..'))]).toEqual([
      true,
      true,
      false,
    ])
  })
})

describe('serving a clip variant', () => {
  let server: ReviewServer
  beforeEach(async () => {
    const round = await loadRound((await roundDir(clipOnly())).path)
    server = await startReviewServer({
      ...round,
      page: (_req: http.IncomingMessage, res: http.ServerResponse) => res.end('page'),
    })
  })
  afterEach(() => server.close())

  it('serves the whole clip with its type, and says it takes ranges', async () => {
    const res = await fetch(`${server.url}api/clip/reel`)
    expect([res.status, res.headers.get('content-type'), res.headers.get('accept-ranges')]).toEqual(
      [200, 'video/webm', 'bytes']
    )
    expect(Buffer.from(await res.arrayBuffer()).equals(WEBM)).toBe(true)
  })

  it('answers a byte range with 206 and that slice, as a video element seeks', async () => {
    const res = await fetch(`${server.url}api/clip/reel`, { headers: { range: 'bytes=4-7' } })
    expect([res.status, res.headers.get('content-range')]).toEqual([206, 'bytes 4-7/13'])
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe('webm')
  })

  it.each(['fill', 'nope', 'toString'])('answers 404 for %s', async (key) => {
    expect((await fetch(`${server.url}api/clip/${key}`)).status).toBe(404)
  })
})

describe('byte ranges', () => {
  it.each([
    ['bytes=0-99', 1000, [0, 99]],
    ['bytes=900-', 1000, [900, 999]],
    ['bytes=-100', 1000, [900, 999]],
    ['bytes=990-2000', 1000, [990, 999]],
  ] as const)('reads %s of %i bytes', (header, size, range) => {
    expect(byteRange(header, size)).toEqual(range)
  })

  it.each([undefined, 'bytes=-', 'bytes=1000-', 'bytes=5-2', 'items=0-1'])(
    'serves the whole file for %s',
    (header) => expect(byteRange(header, 1000)).toBeNull()
  )
})

describe('capturing motion and scale', () => {
  it('copies a clip into the capture directory without starting a browser', async () => {
    const { dir, path } = await roundDir(clipOnly())
    const round = await loadRound(path)
    const out = await realpath(dir)
    const files = await captureRound(round.manifest, round.storybookUrl, out, {}, round.clips)
    expect(files).toEqual([join(out, 'reel-clip.webm')])
    expect((await readFile(files[0])).equals(WEBM)).toBe(true)
  })

  it('names one shot per scale candidate, at the frame width', () => {
    const size = ManifestSchema.parse(motionRound()).variants[1]
    expect(scaleCaptureFileName({ ...size, storyId: size.storyId! }, 'h1')).toBe(
      '1920-size-default-variant-h1.png'
    )
  })

  it('refuses a scale candidate Storybook would drop from the URL', () => {
    const input = motionRound()
    input.variants[1] = {
      ...input.variants[1],
      scale: { arg: 'variant', candidates: ['h1', 'a:b'] },
    }
    expect(urlParamProblems(ManifestSchema.parse(input))).toEqual([
      'variant size scale.variant = "a:b"',
    ])
  })
})

describe('the record and the contrast gate for a clip', () => {
  const manifest = ManifestSchema.parse(motionRound())

  it('echoes the clip in place of a storyId in feedback', () => {
    const feedback = buildFeedback(manifest, SHA, emptyDraft(manifest), new Date())
    expect(FeedbackSchema.parse(feedback).variants[2]).toMatchObject({
      key: 'reel',
      clip: 'clips/reel.webm',
    })
  })

  it('asks a clip for a measured or unmeasured ratio in each mode, as an image', () => {
    const report = contrastReport({ manifest, manifestSha256: SHA, frames: [] })
    expect(report.passed).toBe(false)
    expect(JSON.stringify(report)).toContain('clip variant reel has no light contrast measurement')
  })
})

describe('the page for motion and scale', () => {
  const manifest = ManifestSchema.parse(motionRound())
  const markup = renderToStaticMarkup(createElement(App, { manifest, manifestSha256: SHA }))
  const card = (key: string) => {
    const from = markup.indexOf(`data-testid="variant-${key}"`)
    return markup.slice(from, markup.indexOf(`aria-label="Comment on ${key}"`, from))
  }

  it('gives an arg motion a pause button (it autoplays), a scrubber and a readout', () => {
    expect(card('fill')).toContain('aria-label="Pause fill"')
    expect(card('fill')).toContain('aria-label="Scrub fill through value"')
    expect(card('fill')).toContain('0.0s / 3.0s · value 0.00')
    expect(card('fill')).toContain('loops')
  })

  it('plays a clip muted with native controls, once when it does not loop', () => {
    expect(card('reel')).toMatch(
      /<video[^>]*src="api\/clip\/reel"[^>]*autoplay=""[^>]*muted=""[^>]*controls=""/
    )
    expect(card('reel')).not.toMatch(/<video[^>]*loop=""/)
    expect(card('reel')).toContain('clip, plays once')
  })

  it('shows a scale reference as one 1920x1080 frame with a ladder, fitted or 1:1', () => {
    const size = card('size')
    expect(size).toContain('1920×1080 frame')
    expect(size).toContain('>Fit</button>')
    expect(size).toContain('>1:1</button>')
    expect(size).toContain('variant = h3')
    expect(size).toContain('variant = h1')
    expect(size).toContain('title 64px · 5.9% of 1080')
    expect(size.match(/data-testid="scale-ladder"/g)).toHaveLength(1)
    expect(card('fill')).not.toContain('scale-ladder')
  })
})

describe('the motion and scale example round', () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const example = join(here, '..', 'examples', 'motion-scale', 'draft.json')

  it('meets the review contract and passes round lint', async () => {
    const round = RoundSchema.parse(JSON.parse(await readFile(example, 'utf8')))
    expect(lintRound(round)).toEqual([])
    expect(round.variants.map((v) => [v.key, v.motion?.mechanism, v.scale?.arg])).toEqual([
      ['fill', 'arg', undefined],
      ['headline', undefined, 'variant'],
    ])
    expect(urlParamProblems(round)).toEqual([])
  })
})
