import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, stat, writeFile } from 'node:fs/promises'
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
import type { FrameShooter, Viewport } from '../src/shooter.ts'
import { ManifestSchema, type Manifest, type ThemeMode } from '@titan-design/review-schema'
import { exampleManifest } from '../src/example.ts'

const STORYBOOK = 'http://127.0.0.1:6100'
const SHA = 'c'.repeat(64)

interface Shot {
  url: string
  viewport: Viewport
  file: string
}

/** A shooter that writes the url it was given as the frame's bytes and reports `applied` as the theme. */
function stubShooter(applied: (url: string) => ThemeMode = () => 'dark') {
  const shots: Shot[] = []
  let closed = false
  const open = async (): Promise<FrameShooter> => ({
    shoot: async (url, viewport, file) => {
      shots.push({ url, viewport, file })
      await writeFile(file, `png:${url}`)
      return applied(url)
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
    })
    expect(index.frames[1].viewport).toEqual({ width: 360, height: 900 })
    for (const frame of index.frames)
      expect(sha256(await readFile(join(dir, '..', frame.file)))).toBe(frame.sha256)
    expect((await readdir(dir)).sort()).toEqual(
      [...keys.map((k) => `${k}.png`), 'frames.json'].sort()
    )
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
    expect(await readdir(dir)).not.toContain('frames.json')
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
