import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { writePacketDir, type CiPacket } from '../src/packet.ts'
import { lintPacket } from '../src/packet-lint.ts'
import type { Gathered } from '../src/packet-types.ts'
import { HEAD, collected, layer, png, tempDir } from './packet-fake.ts'

const RED = [255, 0, 0, 255]
const OTHER_HEAD = 'e5'.repeat(20)
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

const shown = (over: Partial<Gathered> & Pick<Gathered, 'path' | 'change'>): Gathered => ({
  layer: 'component',
  source: 'artifact',
  ...over,
})

/** A 4x4 packet: one changed baseline (before, after, diff, montage) and one new one. */
async function packetDir() {
  const dir = join(await tempDir(), 'packet')
  const changed = shown({
    path: 'snapshots/a-chromium-linux.png',
    change: 'changed',
    before: png(4, 4),
    after: png(4, 4, undefined, [[1, 1, RED]]),
  })
  const added = shown({
    path: 'snapshots/b-chromium-linux.png',
    change: 'new',
    after: png(4, 4, RED),
  })
  const layers = [layer({ layer: 'component', regenerated: true, shown: [changed, added] })]
  await writePacketDir(collected(layers, { warnings: ['a synthetic warning'] }), dir)
  return dir
}

const readPacket = async (dir: string): Promise<CiPacket> =>
  JSON.parse(await readFile(join(dir, 'packet.json'), 'utf8'))
const writePacket = (dir: string, packet: unknown) =>
  writeFile(join(dir, 'packet.json'), `${JSON.stringify(packet, null, 2)}\n`)

async function editPacket(dir: string, edit: (p: CiPacket) => void) {
  const packet = await readPacket(dir)
  edit(packet)
  await writePacket(dir, packet)
}

async function lint(dir: string, gateHead = HEAD) {
  const problems = await lintPacket(dir, { gateHead })
  for (const p of problems) expect(p.message).not.toContain(dirname(dir))
  return problems
}

const rules = async (dir: string, gateHead = HEAD) => (await lint(dir, gateHead)).map((p) => p.rule)

describe('packet lint: the packet and its binding', () => {
  it('passes a clean from-ci packet whose head is the gate head', async () => {
    expect(await lint(await packetDir())).toEqual([])
  })

  it('refuses a packet for another head, even when its draft names the gate head', async () => {
    const dir = await packetDir()
    const draftFile = join(dir, 'draft.json')
    const draft = Buffer.from((await readFile(draftFile, 'utf8')).replaceAll(HEAD, OTHER_HEAD))
    await writeFile(draftFile, draft)
    await editPacket(dir, (p) => (p.draft.sha256 = sha256(draft)))

    expect(await rules(dir, OTHER_HEAD)).toEqual(['gate-head'])
  })

  it('refuses a packet.json that writes a cause, since the schema is strict', async () => {
    const dir = await packetDir()
    await editPacket(dir, (p) => Object.assign(p.images[0], { cause: 'x' }))

    expect(await rules(dir)).toEqual(['packet-schema'])
  })

  it('refuses a packet.json that is not JSON', async () => {
    const dir = await packetDir()
    await writeFile(join(dir, 'packet.json'), '{')

    expect(await rules(dir)).toEqual(['packet-schema'])
  })

  it('refuses a packetId edited by one hex digit', async () => {
    const dir = await packetDir()
    await editPacket(
      dir,
      (p) => (p.packetId = `${p.packetId[0] === '0' ? '1' : '0'}${p.packetId.slice(1)}`)
    )

    expect(await rules(dir)).toEqual(['packet-id'])
  })

  it('refuses a swapped after image whose sha was updated but whose packetId was not', async () => {
    const dir = await packetDir()
    const forged = png(4, 4, RED)
    await writeFile(join(dir, 'after/img-001.png'), forged)
    await editPacket(dir, (p) => (p.images[0].after!.sha256 = sha256(forged)))

    expect(await rules(dir)).toEqual(['packet-id'])
  })

  it('refuses a draft.json changed only in whitespace', async () => {
    const dir = await packetDir()
    const draftFile = join(dir, 'draft.json')
    await writeFile(draftFile, (await readFile(draftFile, 'utf8')).replace('\n  ', '\n   '))

    expect(await rules(dir)).toEqual(['draft-sha'])
  })
})

describe('packet lint: the files', () => {
  it('refuses a deleted montage', async () => {
    const dir = await packetDir()
    await rm(join(dir, 'montage/img-001.png'))

    expect(await rules(dir)).toEqual(['file-missing'])
  })

  it('refuses a montage or a before image whose bytes changed', async () => {
    const dir = await packetDir()
    await writeFile(join(dir, 'montage/img-001.png'), png(4, 4, RED))
    await writeFile(join(dir, 'before/img-001.png'), png(4, 4, RED))

    const problems = await lint(dir)
    expect(problems.map((p) => [p.rule, p.message.split(' ')[0]])).toEqual([
      ['file-sha', 'montage/img-001.png'],
      ['file-sha', 'before/img-001.png'],
    ])
  })

  it('refuses a file packet.json does not name, of any extension', async () => {
    const dir = await packetDir()
    await writeFile(join(dir, 'montage/img-999.png'), png(4, 4))
    await writeFile(join(dir, 'notes.txt'), 'hello')

    const problems = await lint(dir)
    expect(problems.map((p) => [p.rule, p.message.split(' ')[0]])).toEqual([
      ['file-extra', 'montage/img-999.png'],
      ['file-extra', 'notes.txt'],
    ])
  })

  it('accepts the root files a packager or a build may add', async () => {
    const dir = await packetDir()
    for (const file of ['prose.json', 'round.json', 'contrast.json'])
      await writeFile(join(dir, file), '{}')

    expect(await lint(dir)).toEqual([])
  })

  it('refuses a named image replaced by a link to the same bytes', async () => {
    const dir = await packetDir()
    const target = join(dirname(dir), 'same.png')
    await writeFile(target, await readFile(join(dir, 'after/img-001.png')))
    await rm(join(dir, 'after/img-001.png'))
    await symlink(target, join(dir, 'after/img-001.png'))

    expect(await rules(dir)).toEqual(['file-link'])
  })

  it('refuses a linked directory without walking into it', async () => {
    const dir = await packetDir()
    const outside = join(dirname(dir), 'outside')
    await mkdir(outside)
    await writeFile(join(outside, 'secret.txt'), 'x')
    await symlink(outside, join(dir, 'extra'))

    expect(await rules(dir)).toEqual(['file-link'])
  })

  it('refuses a named path outside the directory and reads nothing there', async () => {
    const dir = await packetDir()
    const before = join(dir, 'before/img-001.png')
    await writeFile(join(dirname(dir), 'x.png'), await readFile(before))
    await rm(before)
    await editPacket(dir, (p) => (p.images[0].before!.file = '../x.png'))

    expect(await rules(dir)).toEqual(['file-path'])
  })

  it('refuses a missing draft.json as a missing file', async () => {
    const dir = await packetDir()
    await rm(join(dir, 'draft.json'))

    expect(await rules(dir)).toEqual(['file-missing'])
  })

  it('throws for a directory that does not exist, naming no host path', async () => {
    const dir = join(await tempDir(), 'absent')

    await expect(lintPacket(dir, { gateHead: HEAD })).rejects.toThrow(
      /^the packet directory is not a readable directory$/
    )
  })
})
