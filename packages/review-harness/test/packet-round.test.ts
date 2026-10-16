import { readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ManifestInput } from '@titan-design/review-schema'
import { describe, expect, it } from 'vitest'
import { writePacketDir } from '../src/packet.ts'
import { packetRound, type PacketFramesIndex } from '../src/packet-round.ts'
import type { Gathered } from '../src/packet-types.ts'
import { ReviewError } from '../src/review.ts'
import { applyRoundRules } from '../src/round-rules.ts'
import { runCli } from '../src/run.ts'
import {
  CONSOLE_IMAGE_PATH,
  CONSOLE_PACKET_FILE,
  CONSOLE_PROSE_FILE,
  ConsoleFramesIndexSchema,
} from './console-frames-schema.ts'
import { HEAD, MAIN, cliIo, collected, fakeCi, layer, png, tempDir, world } from './packet-fake.ts'
import { RED, readJsonFile, readPacket, rules, sha256, validProse } from './packet-lint-fake.ts'

const FRAMES = 'frames/frames.json'

/** A 4x4 packet with one changed, one new and one removed baseline, and its prose. */
async function packetWithProse() {
  const dir = join(await tempDir(), 'packet')
  const at = (name: string) => `snapshots/${name}-chromium-linux.png`
  const base = { layer: 'component', source: 'artifact' } as const
  const shown: Gathered[] = [
    { ...base, path: at('a'), change: 'changed', before: png(4, 4), after: png(4, 4, RED) },
    { ...base, path: at('b'), change: 'new', after: png(4, 4, RED) },
    { ...base, path: at('c'), change: 'removed', before: png(4, 4, RED) },
  ]
  await writePacketDir(collected([layer({ layer: 'component', shown })]), dir)
  await writeFile(join(dir, 'prose.json'), JSON.stringify(await validProse(dir)))
  return dir
}

const readBytes = (dir: string, file: string) => readFile(join(dir, file))
const readIndex = (dir: string) => readJsonFile<PacketFramesIndex>(dir, FRAMES)
const frame = (index: PacketFramesIndex, key: string) => index.frames.find((f) => f.key === key)!

describe('packet round', () => {
  it('writes the round build writes for the draft, which lints clean with its index', async () => {
    const dir = await packetWithProse()

    await packetRound(dir)

    const { build, ...round } = await readJsonFile<Record<string, unknown>>(dir, 'round.json')
    const draft = await readJsonFile<ManifestInput>(dir, 'draft.json')
    expect(round).toEqual(JSON.parse(JSON.stringify(applyRoundRules(draft))))
    expect(build).toEqual({ mainSha: MAIN, mergeSha: HEAD })
    expect(await rules(dir, { require: ['prose', 'round'] })).toEqual([])
  })

  it('binds the index to the round.json bytes, its unit and its round', async () => {
    const dir = await packetWithProse()

    await packetRound(dir)

    const index = await readIndex(dir)
    const round = await readJsonFile<ManifestInput>(dir, 'round.json')
    expect(index.manifestSha256).toBe(sha256(await readBytes(dir, 'round.json')))
    expect({ unit: index.unit, round: index.round }).toEqual({ unit: round.unit, round: 1 })
  })

  it('maps a changed image to its montage, before, diff and after', async () => {
    const dir = await packetWithProse()

    await packetRound(dir)

    const [changed] = (await readPacket(dir)).images
    expect(frame(await readIndex(dir), changed.key)).toEqual({
      key: changed.key,
      file: 'montage/img-001.png',
      sha256: changed.sha256,
      base: { file: 'before/img-001.png', sha256: changed.before!.sha256 },
      diff: { file: 'diff/img-001.png', sha256: changed.diff!.sha256 },
      after: { file: 'after/img-001.png', sha256: changed.after!.sha256 },
    })
  })

  it('gives a new image no base and a removed image no after', async () => {
    const dir = await packetWithProse()

    await packetRound(dir)

    const index = await readIndex(dir)
    const [, added, removed] = (await readPacket(dir)).images
    expect(Object.keys(frame(index, added.key)).sort()).toEqual(['after', 'file', 'key', 'sha256'])
    expect(Object.keys(frame(index, removed.key)).sort()).toEqual(['base', 'file', 'key', 'sha256'])
    expect(frame(index, removed.key).base?.file).toBe(removed.before!.file)
  })

  it('hashes packet.json and prose.json as their bytes, not as re-serialised JSON', async () => {
    const dir = await packetWithProse()
    await writeFile(join(dir, 'packet.json'), JSON.stringify(await readPacket(dir)))

    await packetRound(dir)

    const index = await readIndex(dir)
    expect(index.packet).toEqual({
      file: 'packet.json',
      sha256: sha256(await readBytes(dir, 'packet.json')),
    })
    expect(index.prose).toEqual({
      file: 'prose.json',
      sha256: sha256(await readBytes(dir, 'prose.json')),
    })
  })

  it('writes the same bytes when run again', async () => {
    const dir = await packetWithProse()
    await packetRound(dir)
    const first = [await readBytes(dir, 'round.json'), await readBytes(dir, FRAMES)]

    await packetRound(dir)

    expect([await readBytes(dir, 'round.json'), await readBytes(dir, FRAMES)]).toEqual(first)
  })

  it('refuses a packet without prose.json and writes nothing', async () => {
    const dir = await packetWithProse()
    await rm(join(dir, 'prose.json'))

    await expect(packetRound(dir)).rejects.toThrow(ReviewError)

    expect((await readdir(dir)).sort()).toEqual([
      'after',
      'before',
      'diff',
      'draft.json',
      'montage',
      'packet.json',
    ])
  })

  it('refuses a draft.json that is not the one packet.json names', async () => {
    const dir = await packetWithProse()
    await writeFile(join(dir, 'draft.json'), `${(await readBytes(dir, 'draft.json')).toString()} `)

    await expect(packetRound(dir)).rejects.toThrow(/draft\.json does not hash/)
  })
})

describe('packet round: the console import contract', () => {
  it('parses as the console reads frames@1, and names the sidecars where it copies them', async () => {
    const dir = await packetWithProse()

    await packetRound(dir)

    const index = ConsoleFramesIndexSchema.parse(await readIndex(dir))
    expect(index.packet?.file).toBe(CONSOLE_PACKET_FILE)
    expect(index.prose?.file).toBe(CONSOLE_PROSE_FILE)
    const files = index.frames.flatMap((f) =>
      [f, f.base, f.diff, f.after].filter((x) => x !== undefined)
    )
    expect(files.every((f) => CONSOLE_IMAGE_PATH.test(f.file))).toBe(true)
    expect(new Set(index.frames.map((f) => f.key)).size).toBe(index.frames.length)
  })

  it('lists every head view the round names, so the importer copies it', async () => {
    const dir = await packetWithProse()

    await packetRound(dir)

    const index = await readIndex(dir)
    const { variants } = await readJsonFile<ManifestInput>(dir, 'round.json')
    for (const variant of variants)
      if ('image' in variant) expect(frame(index, variant.key).file).toBe(variant.image)
  })
})

describe('packet lint: frames-index', () => {
  it('refuses a frames.json whose sha was edited', async () => {
    const dir = await packetWithProse()
    await packetRound(dir)
    const index = await readIndex(dir)
    index.frames[0].sha256 = 'f'.repeat(64)
    await writeFile(join(dir, FRAMES), `${JSON.stringify(index, null, 2)}\n`)

    expect(await rules(dir)).toEqual(['frames-index'])
  })

  it('refuses a frames.json for other round.json bytes', async () => {
    const dir = await packetWithProse()
    await packetRound(dir)
    await writeFile(join(dir, 'round.json'), JSON.stringify(await readJsonFile(dir, 'round.json')))

    expect(await rules(dir)).toEqual(['frames-index'])
  })

  it('refuses a frames.json beside no round.json', async () => {
    const dir = await packetWithProse()
    await packetRound(dir)
    await rm(join(dir, 'round.json'))

    expect(await rules(dir)).toEqual(['frames-index'])
  })
})

describe('packet round command', () => {
  async function run(args: string[]) {
    const stdout: string[] = []
    const io = { ...cliIo(fakeCi(world()).io, []), stdout: (t: string) => stdout.push(t) }
    return { code: await runCli(args, io), stdout: stdout.join('') }
  }

  it('prints round.json path and exits 0', async () => {
    const dir = await packetWithProse()

    const { code, stdout } = await run(['packet', 'round', dir])

    expect({ code, stdout }).toEqual({ code: 0, stdout: `${join(dir, 'round.json')}\n` })
  })

  it('exits 2 without prose.json', async () => {
    const dir = await packetWithProse()
    await rm(join(dir, 'prose.json'))

    expect((await run(['packet', 'round', dir])).code).toBe(2)
  })
})
