import { createHash } from 'node:crypto'
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sha256Of } from '../src/frames.ts'
import { CiPacketSchema, readSide, writePacketDir } from '../src/packet.ts'
import type { Gathered } from '../src/packet-types.ts'
import { collected, layer, png, tempDir } from './packet-fake.ts'

const COMPONENT = 'packages/ui/specimen/baseline/x.test.ts-snapshots/'
const STORY = 'packages/ui/tests/visual/reference/stories.spec.ts-snapshots/'
const path = (name: string) => `${COMPONENT}${name}-chromium-linux.png`
const RED = [255, 0, 0, 255]

const shown = (over: Partial<Gathered> & Pick<Gathered, 'path' | 'change'>): Gathered => ({
  layer: 'component',
  source: 'artifact',
  ...over,
})

/** A failed run: one baseline changed, one new, one removed, one unchanged, and one story changed. */
function failedRun() {
  return collected([
    layer({
      layer: 'component',
      regenerated: true,
      unchanged: 1,
      shown: [
        shown({
          path: path('changed'),
          change: 'changed',
          before: png(40, 20),
          after: png(40, 20, undefined, [[1, 1, RED]]),
        }),
        shown({ path: path('new'), change: 'new', after: png(40, 20, RED) }),
        shown({ path: path('removed'), change: 'removed', before: png(40, 20) }),
      ],
    }),
    layer({
      layer: 'story',
      regenerated: true,
      shown: [
        shown({
          layer: 'story',
          path: `${STORY}shell-rail--default-chromium-linux.png`,
          change: 'changed',
          before: png(64, 32),
          after: png(64, 40),
        }),
      ],
    }),
  ])
}

/** Main's one baseline, changed by one red pixel, with this CI diff for it. */
function withCiDiff(diff: Buffer, expected: Buffer) {
  const changed = shown({
    path: path('a'),
    change: 'changed',
    before: png(40, 20),
    after: png(40, 20, undefined, [[3, 4, RED]]),
    ciDiff: { diff, expected },
  })
  return collected([layer({ layer: 'component', regenerated: true, shown: [changed] })])
}

const readJson = async (file: string) => JSON.parse(await readFile(file, 'utf8'))
const readPacket = async (out: string) =>
  CiPacketSchema.parse(await readJson(join(out, 'packet.json')))
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')
const outDir = async () => join(await tempDir(), 'packet')

describe('packet.json', () => {
  it('writes a packet whose every sha256 is the sha256 of the file it names', async () => {
    const out = await outDir()
    await writePacketDir(failedRun(), out)
    const packet = await readPacket(out)

    expect(packet.images.map((i) => [i.layer, i.change])).toEqual([
      ['component', 'changed'],
      ['component', 'new'],
      ['component', 'removed'],
      ['story', 'changed'],
    ])
    expect(packet.unchanged).toEqual({ component: 1, story: 0 })
    const named = packet.images.flatMap((i) => [i, i.before, i.after, i.diff ?? undefined])
    for (const ref of named.filter((r) => r !== undefined))
      expect(await sha256Of(join(out, ref.file)), ref.file).toBe(ref.sha256)
    expect(sha256(await readFile(join(out, 'draft.json')))).toBe(packet.draft.sha256)
  })

  it('records a size change with no pixel diff', async () => {
    const out = await outDir()
    await writePacketDir(failedRun(), out)
    const story = (await readPacket(out)).images[3]

    expect(story.diff).toBeNull()
    expect(story.size).toEqual({ before: { w: 64, h: 32 }, after: { w: 64, h: 40 } })
    expect(story.storyId).toBe('shell-rail--default')
  })

  it('gives the same packetId to two builds over the same inputs', async () => {
    const [a, b] = [await outDir(), await outDir()]
    await writePacketDir(failedRun(), a)
    await writePacketDir(failedRun(), b)

    expect((await readPacket(a)).packetId).toBe((await readPacket(b)).packetId)
  })

  it('gives another packetId when the head changes', async () => {
    const [a, b] = [await outDir(), await outDir()]
    const other = failedRun()
    other.target = { ...other.target, head: 'e5'.repeat(20) }
    await writePacketDir(failedRun(), a)
    await writePacketDir(other, b)

    expect((await readPacket(a)).packetId).not.toBe((await readPacket(b)).packetId)
  })

  it("uses CI's diff when its expected image is main's bytes", async () => {
    const out = await outDir()
    const ciDiff = png(40, 20, [1, 2, 3, 255])
    await writePacketDir(withCiDiff(ciDiff, png(40, 20)), out)
    const [image] = (await readPacket(out)).images

    expect(image.diff?.source).toBe('ci')
    expect(await readFile(join(out, image.diff!.file))).toEqual(ciDiff)
  })

  it('computes its own diff when the CI diff was made against another main', async () => {
    const out = await outDir()
    await writePacketDir(withCiDiff(png(40, 20), png(40, 20, [9, 9, 9, 255])), out)
    const [image] = (await readPacket(out)).images

    expect(image.diff?.source).toBe('computed')
    expect(image.diff?.diffPixels).toBe(1)
  })

  it('builds a Ship-only packet when nothing is shown', async () => {
    const out = await outDir()
    await writePacketDir(collected(), out)
    const packet = await readPacket(out)
    const draft = await readJson(join(out, 'draft.json'))

    expect(packet.images).toEqual([])
    expect(packet.ci.regenerated).toEqual({ component: false, story: false })
    expect(draft.sections.map((s: { id: string }) => s.id)).toEqual(['ship'])
  })

  it('records the warnings it is given', async () => {
    const out = await outDir()
    await writePacketDir(collected([], { warnings: ['main moved'] }), out)

    expect((await readPacket(out)).warnings).toEqual(['main moved'])
  })
})

describe('packet directory', () => {
  const corrupt = () =>
    collected([
      layer({
        layer: 'component',
        shown: [shown({ path: path('broken'), change: 'new', after: Buffer.from('not a png') })],
      }),
    ])

  it('leaves an earlier packet untouched when a PNG is corrupt', async () => {
    const out = await outDir()
    await mkdir(out)
    await writeFile(join(out, 'packet.json'), 'earlier')

    await expect(writePacketDir(corrupt(), out)).rejects.toThrow('not a PNG')
    expect(await readdir(out)).toEqual(['packet.json'])
    expect(await readFile(join(out, 'packet.json'), 'utf8')).toBe('earlier')
  })

  it('leaves no packet directory when the first build fails part way', async () => {
    const out = await outDir()

    await expect(writePacketDir(corrupt(), out)).rejects.toThrow()
    await expect(access(out)).rejects.toThrow()
    expect(await readdir(join(out, '..'))).toEqual([])
  })
})

describe('--side', () => {
  it('refuses a file that is not an array of questions', async () => {
    const file = join(await tempDir(), 'side.json')
    await writeFile(file, JSON.stringify([{ id: 'x' }]))

    await expect(readSide(file)).rejects.toThrow('is not an array of questions')
  })
})
