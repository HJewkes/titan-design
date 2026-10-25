import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CiPacketSchema, writePacketDir, type CiPacket } from '../src/packet.ts'
import { collected, layer, png, tempDir } from './packet-fake.ts'
import { editPacket, lint, packetDir, readPacket } from './packet-lint-fake.ts'

const PATH = 'packages/ui/specimen/baseline/x.test.ts-snapshots/a-chromium-linux.png'

const sharePath = (p: CiPacket) => (p.images[1].path = p.images[0].path)
const shareKey = (p: CiPacket) => (p.images[1].key = p.images[0].key)

const SHARED: [string, (p: CiPacket) => void, string][] = [
  ['path', sharePath, 'images.1.path'],
  ['key', shareKey, 'images.1.key'],
]

describe('packet images are unique', () => {
  it.each(SHARED)('the schema refuses two images with one %s', async (field, share, at) => {
    const packet = await readPacket(await packetDir())
    share(packet)

    const parsed = CiPacketSchema.safeParse(packet)

    expect(parsed.error?.issues.map((i) => [i.path.join('.'), i.message])).toEqual([
      [at, `another image has this ${field}`],
    ])
  })

  it.each(SHARED)('the packet lint refuses two images with one %s', async (_, share, at) => {
    const dir = await packetDir()
    await editPacket(dir, share)

    const problems = await lint(dir)

    expect(problems.map((p) => p.rule)).toEqual(['packet-schema'])
    expect(problems[0].message).toContain(at)
  })

  it('from-ci refuses to write a packet that shows one baseline twice', async () => {
    const out = join(await tempDir(), 'packet')
    const shown = { layer: 'component' as const, source: 'artifact' as const, path: PATH }
    const added = { ...shown, change: 'new' as const, after: png(4, 4) }
    const c = collected([layer({ layer: 'component', shown: [added, added] })])

    await expect(writePacketDir(c, out)).rejects.toThrow(`${PATH} is shown twice`)
  })
})
