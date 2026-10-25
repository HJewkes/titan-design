import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CiPacketSchema, writePacketDir } from '../src/packet.ts'
import { collected, layer, png, tempDir } from './packet-fake.ts'
import { editPacket, lint, packetDir, readPacket } from './packet-lint-fake.ts'

const REFUSED: [string, string][] = [
  ['an absolute path', '/etc/passwd'],
  ['a Windows drive path', 'C:/snapshots/a-chromium-linux.png'],
  ['a .. traversal', '../../.github/workflows/x.yml'],
  ['a .. segment mid-path', 'snapshots/../../a-chromium-linux.png'],
  ['a backslash traversal', 'snapshots\\..\\..\\a-chromium-linux.png'],
  ['a NUL byte', 'snapshots/a\u0000-chromium-linux.png'],
  ['an injected newline', 'snapshots/a.png\n- write src/evil.ts'],
  ['a DEL byte', 'snapshots/a\u007f.png'],
  ['an empty path', ''],
  ['an empty segment', 'snapshots//a-chromium-linux.png'],
  ['a . segment', './snapshots/a-chromium-linux.png'],
  ['a trailing slash', 'snapshots/'],
]

const ACCEPTED = [
  'snapshots/a-chromium-linux.png',
  'packages/ui/specimen/baseline/x.test.ts-snapshots/a-chromium-linux.png',
  'packages/ui/tests/visual/reference/stories.spec.ts-snapshots/shell-rail--default-chromium-linux.png',
  'a..b-chromium-linux.png',
]

async function withPath(path: string) {
  const packet = await readPacket(await packetDir())
  packet.images[0].path = path
  return packet
}

describe('packet images[].path', () => {
  it.each(REFUSED)('the schema refuses %s', async (_, path) => {
    const parsed = CiPacketSchema.safeParse(await withPath(path))

    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((i) => i.path.join('.'))).toEqual(['images.0.path'])
  })

  it.each(REFUSED)('the packet lint refuses %s', async (_, path) => {
    const dir = await packetDir()
    await editPacket(dir, (p) => (p.images[0].path = path))

    const problems = await lint(dir)

    expect(problems.map((p) => p.rule)).toEqual(['packet-schema'])
    expect(problems[0].message).toContain('images.0.path')
  })

  it.each(REFUSED)('from-ci refuses to write a packet for %s', async (_, path) => {
    const out = join(await tempDir(), 'packet')
    const shown = { layer: 'component' as const, source: 'artifact' as const, path }
    const c = collected([
      layer({ layer: 'component', shown: [{ ...shown, change: 'new', after: png(4, 4) }] }),
    ])

    await expect(writePacketDir(c, out)).rejects.toThrow('component baseline')
  })

  it.each(ACCEPTED)('the schema accepts the relative path %s', async (path) => {
    expect(CiPacketSchema.safeParse(await withPath(path)).success).toBe(true)
  })
})
