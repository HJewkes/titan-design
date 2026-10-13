import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement, type SyntheticEvent } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ManifestSchema, type ManifestInput } from '@titan-design/review-schema'
import { App } from '../page/App.tsx'
import { LadderOverlay, clipSizeCheck, trueSizeCaption } from '../page/TrueSize.tsx'
import { ReviewError, loadRound } from '../src/review.ts'
import { SHA, underContract } from './fixtures.ts'

const FRAME_1080 = { frame: { width: 1920, height: 1080 } }
const WEBM = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.from('webm body')])

/** The PNG signature and an IHDR chunk: all the bytes load reads to size an image. */
function pngHead(width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(25)
  ihdr.writeUInt32BE(13, 0)
  ihdr.write('IHDR', 4, 'latin1')
  ihdr.writeUInt32BE(width, 8)
  ihdr.writeUInt32BE(height, 12)
  ihdr.writeUInt8(8, 16)
  ihdr.writeUInt8(6, 17)
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ihdr])
}

function trueSizeRound(): ManifestInput {
  return {
    schema: 'titan-review/round@2',
    unit: 'true-size',
    round: 1,
    storybookUrl: 'http://127.0.0.1:6200',
    widths: [1280],
    variants: [
      { key: 'shot', image: 'shot.png', label: 'Shot', frameReference: FRAME_1080 },
      {
        key: 'reel',
        clip: 'reel.webm',
        label: 'Reel',
        motion: { mechanism: 'clip' },
        frameReference: FRAME_1080,
      },
      { key: 'plain', image: 'plain.png', label: 'Plain' },
    ],
    questions: [],
  }
}

async function loadWith(shot: Buffer): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-true-size-'))
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'shot.png'), shot)
  await writeFile(join(dir, 'plain.png'), pngHead(640, 480))
  await writeFile(join(dir, 'reel.webm'), WEBM)
  const path = join(dir, 'round.json')
  await writeFile(path, JSON.stringify(underContract(trueSizeRound())))
  return loadRound(path).then(
    () => '',
    (err: Error) => (err instanceof ReviewError ? err.message : `unexpected: ${err}`)
  )
}

describe('loading a true-size image', () => {
  it('accepts a PNG the size its frame reference declares', async () => {
    expect(await loadWith(pngHead(1920, 1080))).toBe('')
  })

  it('refuses a PNG of the right width and the wrong height', async () => {
    expect(await loadWith(pngHead(1920, 1000))).toMatch(
      'variant shot: image shot.png is 1920×1000; its frame reference declares 1920×1080'
    )
  })
})

describe('the ladder overlay', () => {
  it('draws each bar its rung px times the scale shown', () => {
    const markup = renderToStaticMarkup(
      createElement(LadderOverlay, { rungs: [{ label: 'A′', px: 44 }], k: 0.5 })
    )
    expect(markup).toContain('data-px="44" style="height:22px"')
    expect(markup).toContain('A′<br/>44px')
  })

  it('captions the true size and how it is drawn', () => {
    const reference = { ...FRAME_1080, ladder: [] }
    expect(trueSizeCaption(reference, 0.47)).toBe('1920×1080 · shown at 47%')
    expect(trueSizeCaption(reference, 1)).toBe('1920×1080 · 1:1')
  })
})

describe('checking a true-size clip as it loads', () => {
  const loaded = (videoWidth: number, videoHeight: number) =>
    ({ currentTarget: { videoWidth, videoHeight } }) as SyntheticEvent<HTMLVideoElement>
  const reference = { ...FRAME_1080, ladder: [] }

  it('reports a clip whose height differs from its frame', () => {
    const reports: (string | null)[] = []
    clipSizeCheck(reference, (m) => reports.push(m))(loaded(1920, 1000))
    clipSizeCheck(reference, (m) => reports.push(m))(loaded(1920, 1080))
    expect(reports).toEqual(['is 1920×1000; its frame reference declares 1920×1080', null])
  })

  it('checks nothing on a clip without a frame reference', () => {
    const reports: (string | null)[] = []
    clipSizeCheck(undefined, (m) => reports.push(m))(loaded(10, 10))
    expect(reports).toEqual([])
  })
})

describe('the page for true-size frames', () => {
  const manifest = ManifestSchema.parse(trueSizeRound())
  const markup = renderToStaticMarkup(createElement(App, { manifest, manifestSha256: SHA }))
  const card = (key: string) => {
    const from = markup.indexOf(`data-testid="variant-${key}"`)
    return markup.slice(from, markup.indexOf(`aria-label="Comment on ${key}"`, from))
  }

  it('draws an image and a clip once at their frame width, outlined, with Fit, 1:1 and a ladder', () => {
    for (const key of ['shot', 'reel']) {
      expect(card(key).match(/data-width="1920"/g)).toHaveLength(1)
      expect(card(key)).not.toContain('data-width="1280"')
      expect(card(key)).toContain('1920×1080 · 1:1')
      expect(card(key)).toContain('>Fit</button>')
      expect(card(key)).toContain('>1:1</button>')
      expect(card(key)).toMatch(/class="frame-box (image|clip)-box true-size"/)
      expect(card(key).match(/data-testid="frame-ladder"/g)).toHaveLength(1)
    }
  })

  it('leaves a frame without a reference at the round widths, with no ladder or toggle', () => {
    expect(card('plain')).toContain('data-width="1280"')
    expect(card('plain')).toContain('class="frame-box image-box"')
    expect(card('plain')).not.toContain('frame-ladder')
    expect(card('plain')).not.toContain('>1:1</button>')
  })
})
