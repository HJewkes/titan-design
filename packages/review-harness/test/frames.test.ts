import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  FRAMES_SCHEMA_ID,
  FrameRenderError,
  declaredTheme,
  frameKey,
  framesDir,
  readFramesIndex,
  renderFrames,
  type RenderFramesOptions,
} from '@titan-design/review-harness/frames'
import type { FrameShooter, TargetBox, Viewport } from '../src/shooter.ts'
import { ManifestSchema, type Manifest, type ThemeMode } from '@titan-design/review-schema'
import { exampleManifest } from '../src/example.ts'
import { ConsoleFrameTargetsSchema, ConsoleFramesIndexSchema } from './console-frames-schema.ts'

const STORYBOOK = 'http://127.0.0.1:6100'
const SHA = 'c'.repeat(64)

interface Shot {
  url: string
  viewport: Viewport
  file: string
}

const BOXES: TargetBox[] = [
  { x: 0, y: 0, width: 320, height: 48, target: { testId: 'card', text: 'Weekly volume' } },
  { x: 16.5, y: -2, width: 0, height: 20, target: { role: 'button' } },
]

/**
 * A shooter that writes the url it was given as the frame's bytes, reports `applied` as the theme
 * and `boxes` as the story's elements.
 */
function stubShooter(
  applied: (url: string) => ThemeMode = () => 'dark',
  boxes: (viewport: Viewport) => TargetBox[] = () => BOXES
) {
  const shots: Shot[] = []
  let closed = false
  const open = async (): Promise<FrameShooter> => ({
    shoot: async (url, viewport, file) => {
      shots.push({ url, viewport, file })
      await writeFile(file, `png:${url}`)
      return { theme: applied(url), boxes: boxes(viewport) }
    },
    close: async () => void (closed = true),
  })
  return { open, shots, isClosed: () => closed }
}

/** The theme the real Storybook would apply: light only when the URL asks for it. */
const themeFromUrl = (url: string): ThemeMode => (url.includes('theme%3Alight') ? 'light' : 'dark')

/** The example round, three story variants at two widths; `light` makes B a light frame. */
function round(light = false): Manifest {
  const example = exampleManifest(STORYBOOK)
  const variants = example.variants.map((v) =>
    light && v.key === 'B' ? { ...v, globals: { theme: 'light' } } : v
  )
  return ManifestSchema.parse({ ...example, widths: [1280, 360], variants })
}

const storyIds = (manifest: Manifest) => async () =>
  new Set(manifest.variants.flatMap((v) => (v.storyId ? [v.storyId] : [])))

async function setup(manifest: Manifest, extra: Partial<RenderFramesOptions> = {}) {
  const roundsDir = await mkdtemp(join(tmpdir(), 'titan-frames-'))
  const shooter = stubShooter(themeFromUrl)
  const options: RenderFramesOptions = {
    roundsDir,
    roundId: 'r1',
    open: shooter.open,
    storyIds: storyIds(manifest),
    ...extra,
  }
  return { roundsDir, shooter, options, dir: framesDir(roundsDir, 'r1') }
}

const sha256 = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex')

/** What a frames dir holds after a render: a PNG and an element map per key, and the index. */
const frameFiles = (keys: string[]) =>
  [...keys.flatMap((k) => [`${k}.png`, `${k}.targets.json`]), 'frames.json'].sort()

describe('renderFrames', () => {
  it('writes one PNG per story variant per width under <roundsDir>/<roundId>/frames and indexes them', async () => {
    const manifest = round()
    const { shooter, options, dir } = await setup(manifest, { manifestSha256: SHA })
    const index = await renderFrames(manifest, STORYBOOK, options)
    const [a, b, c] = manifest.variants
    const keys = [a, b, c].flatMap((v) => [1280, 360].map((w) => frameKey(v as never, w)))
    expect(index.frames.map((f) => f.key)).toEqual(keys)
    expect(index).toMatchObject({
      schema: FRAMES_SCHEMA_ID,
      unit: manifest.unit,
      round: manifest.round,
      storybookUrl: STORYBOOK,
      manifestSha256: SHA,
    })
    expect(index.frames[0]).toEqual({
      key: `1280-A-${a.storyId!.split('--').pop()}`,
      variant: 'A',
      storyId: a.storyId,
      theme: 'dark',
      viewport: { width: 1280, height: 900 },
      file: `frames/1280-A-${a.storyId!.split('--').pop()}.png`,
      sha256: sha256(`png:${shooter.shots[0].url}`),
      targets: {
        file: `frames/1280-A-${a.storyId!.split('--').pop()}.targets.json`,
        sha256: expect.any(String),
      },
    })
    expect(index.frames[1].viewport).toEqual({ width: 360, height: 900 })
    for (const frame of index.frames)
      expect(sha256(await readFile(join(dir, '..', frame.file)))).toBe(frame.sha256)
    expect((await readdir(dir)).sort()).toEqual(frameFiles(keys))
    expect(await readFramesIndex(dir)).toEqual(index)
    expect(shooter.isClosed()).toBe(true)
  })

  it('shoots the story URL with the variant args and globals, on the frame viewport', async () => {
    const manifest = round(true)
    const { shooter, options } = await setup(manifest)
    await renderFrames(manifest, `${STORYBOOK}/`, options)
    const b = shooter.shots.find((s) => s.url.includes('id=' + manifest.variants[1].storyId))
    expect(b?.url).toContain(`${STORYBOOK}/iframe.html?id=`)
    expect(b?.url).toContain('globals=theme%3Alight')
    expect(b?.viewport).toEqual({ width: 1280, height: 900 })
  })

  it('refuses a story the Storybook does not serve, naming it, before any browser opens', async () => {
    const manifest = round()
    const { shooter, options, dir } = await setup(manifest, {
      storyIds: async () => new Set([manifest.variants[0].storyId!]),
    })
    const missing = manifest.variants.slice(1).map((v) => v.storyId)
    await expect(renderFrames(manifest, STORYBOOK, options)).rejects.toThrow(FrameRenderError)
    await expect(renderFrames(manifest, STORYBOOK, options)).rejects.toThrow(
      `unknown story ids on ${STORYBOOK} (wrong worktree's port?): ${missing.join(', ')}`
    )
    expect(shooter.shots).toEqual([])
    await expect(stat(dir)).rejects.toThrow()
  })

  it('refuses a Storybook off loopback without reading its index', async () => {
    const manifest = round()
    const { options } = await setup(manifest, {
      storyIds: async () => {
        throw new Error('must not be read')
      },
    })
    await expect(renderFrames(manifest, 'http://10.0.0.5:6100', options)).rejects.toThrow(
      /only loopback Storybook hosts/
    )
  })

  it('records the theme each frame got: declared light, or the default the Storybook applied', async () => {
    const manifest = round(true)
    const { options } = await setup(manifest)
    const { frames } = await renderFrames(manifest, STORYBOOK, options)
    const themes = Object.fromEntries(frames.map((f) => [f.key, f.theme]))
    expect(themes[frameKey(manifest.variants[1] as never, 1280)]).toBe('light')
    expect(themes[frameKey(manifest.variants[0] as never, 1280)]).toBe('dark')
    expect(declaredTheme(manifest.variants[1])).toBe('light')
    expect(declaredTheme(manifest.variants[0])).toBeUndefined()
  })

  it('rejects a frame whose declared theme did not apply, and writes no index', async () => {
    const manifest = round(true)
    const { options, dir } = await setup(manifest, { open: stubShooter(() => 'dark').open })
    const key = frameKey(manifest.variants[1] as never, 1280)
    await expect(renderFrames(manifest, STORYBOOK, options)).rejects.toThrow(
      `${key}: the light theme did not apply (got dark)`
    )
    await expect(stat(dir)).rejects.toThrow()
    expect(await readdir(join(dir, '..'))).toEqual([])
  })

  it('leaves the previous frames and index intact when a rerender fails its theme check', async () => {
    const { options, dir } = await setup(round())
    const before = await renderFrames(round(), STORYBOOK, options)
    const failing = { ...options, open: stubShooter(() => 'dark').open }
    await expect(renderFrames(round(true), STORYBOOK, failing)).rejects.toThrow(FrameRenderError)
    expect(await readFramesIndex(dir)).toEqual(before)
    for (const frame of before.frames)
      expect(sha256(await readFile(join(dir, '..', frame.file)))).toBe(frame.sha256)
    expect((await readdir(dir)).sort()).toEqual(frameFiles(before.frames.map((f) => f.key)))
    expect(await readdir(join(dir, '..'))).toEqual(['frames'])
  })

  it('drops a PNG left in the frames dir by a render that never wrote an index', async () => {
    const manifest = round()
    const { options, dir } = await setup(manifest)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'orphan.png'), 'stale')
    await renderFrames(manifest, STORYBOOK, options)
    expect(await readdir(dir)).not.toContain('orphan.png')
  })

  it('removes a frame an earlier render wrote for a variant the round no longer names', async () => {
    const manifest = round()
    const { options, dir } = await setup(manifest)
    await renderFrames(manifest, STORYBOOK, options)
    const dropped = frameKey(manifest.variants[2] as never, 360)
    const smaller = { ...manifest, variants: manifest.variants.slice(0, 2) }
    await renderFrames(smaller, STORYBOOK, options)
    expect(await readdir(dir)).not.toContain(`${dropped}.png`)
    expect((await readFramesIndex(dir)).frames).toHaveLength(4)
  })

  it('writes an empty index, opening no browser, for a round with no story variants', async () => {
    const manifest = { ...round(), variants: [] }
    const { shooter, options, dir } = await setup(manifest, {
      storyIds: async () => {
        throw new Error('must not be read')
      },
    })
    const index = await renderFrames(manifest, STORYBOOK, options)
    expect(index.frames).toEqual([])
    expect(shooter.shots).toEqual([])
    expect(await readdir(dir)).toEqual(['frames.json'])
  })
})

describe('renderFrames element maps', () => {
  it('names each frame element map with the sha256 of the bytes it wrote', async () => {
    const manifest = round()
    const { options, dir } = await setup(manifest)
    const { frames } = await renderFrames(manifest, STORYBOOK, options)
    expect(frames).toHaveLength(6)
    for (const frame of frames) {
      expect(frame.targets?.file).toBe(`frames/${frame.key}.targets.json`)
      expect(sha256(await readFile(join(dir, '..', frame.targets!.file)))).toBe(
        frame.targets!.sha256
      )
    }
  })

  it('writes the element map as frame-targets@1 holding the boxes the shooter found', async () => {
    const manifest = round()
    const { options, dir } = await setup(manifest)
    const { frames } = await renderFrames(manifest, STORYBOOK, options)
    const bytes = await readFile(join(dir, '..', frames[0].targets!.file), 'utf8')
    expect(ConsoleFrameTargetsSchema.parse(JSON.parse(bytes))).toEqual({
      schema: 'titan-review/frame-targets@1',
      boxes: BOXES,
    })
  })

  it('writes no element map, and names none, for a box list over 256 KiB', async () => {
    const manifest = round()
    const oversized = [{ ...BOXES[0], target: { text: 'x'.repeat(256 * 1024) } }]
    const shooter = stubShooter(themeFromUrl, ({ width }) => (width === 360 ? oversized : BOXES))
    const { options, dir } = await setup(manifest, { open: shooter.open })
    const { frames } = await renderFrames(manifest, STORYBOOK, options)
    const narrow = frames.filter((f) => f.viewport.width === 360)
    expect(narrow).toHaveLength(3)
    for (const frame of narrow) {
      expect(frame).not.toHaveProperty('targets')
      expect(await readdir(dir)).not.toContain(`${frame.key}.targets.json`)
    }
    expect(frames.filter((f) => f.targets).map((f) => f.viewport.width)).toEqual([1280, 1280, 1280])
  })

  it('leaves no element map from the staged render when a theme check fails', async () => {
    const manifest = round(true)
    const { roundsDir, options } = await setup(manifest, {
      open: stubShooter(() => 'dark').open,
    })
    await expect(renderFrames(manifest, STORYBOOK, options)).rejects.toThrow(FrameRenderError)
    const left = await readdir(roundsDir, { recursive: true })
    expect(left.filter((name) => name.endsWith('.targets.json'))).toEqual([])
  })

  it('writes an index the console reads, element maps included', async () => {
    const manifest = round()
    const { options, dir } = await setup(manifest)
    const { frames } = await renderFrames(manifest, STORYBOOK, options)
    const read = ConsoleFramesIndexSchema.parse(await readFramesIndex(dir))
    expect(read.frames.map((f) => f.targets)).toEqual(frames.map((f) => f.targets))
    expect(read.frames.every((f) => f.targets)).toBe(true)
  })
})
