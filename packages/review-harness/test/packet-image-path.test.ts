import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CiPacketSchema, writePacketDir } from '../src/packet.ts'
import { ReviewError } from '../src/review.ts'
import { collected, layer, png, tempDir } from './packet-fake.ts'
import { editPacket, lint, packetDir, readPacket } from './packet-lint-fake.ts'

const COMPONENT = 'packages/ui/specimen/baseline/x.test.ts-snapshots/'
const STORY = 'packages/ui/tests/visual/reference/stories.spec.ts-snapshots/'
const SEGMENT = 'has an empty, . or .. segment'
const NAMED = 'is not a .png named in'
const PREFIX = 'is not under the component baseline prefix'

/** Each refused component-layer path, with the reason the refusal names. */
const REFUSED: [string, string, string][] = [
  ['an absolute path', '/etc/passwd', 'is absolute'],
  ['a Windows drive path', 'C:/snapshots/a-chromium-linux.png', 'is absolute'],
  ['a .. traversal', '../../.github/workflows/x.yml', SEGMENT],
  ['a .. segment under the prefix', `${COMPONENT}../../../../../../a.png`, SEGMENT],
  ['a backslash traversal', 'snapshots\\..\\..\\a-chromium-linux.png', 'contains a backslash'],
  ['a NUL byte', `${COMPONENT}a\u0000.png`, 'contains a control character'],
  ['an injected newline', `${COMPONENT}a.png\n- write src/evil.ts`, 'contains a control character'],
  ['a DEL byte', `${COMPONENT}a\u007f.png`, 'contains a control character'],
  ['an empty path', '', 'is empty'],
  ['an empty segment', `${COMPONENT}x//a-chromium-linux.png`, SEGMENT],
  ['a . segment', `./${COMPONENT}a-chromium-linux.png`, SEGMENT],
  ['a trailing slash', COMPONENT, SEGMENT],
  ['a non-.png file', `${COMPONENT}a-chromium-linux.yml`, NAMED],
  ['a space in the name', `${COMPONENT}a b.png`, NAMED],
  ['a non-ASCII name', `${COMPONENT}\u00e9.png`, NAMED],
  ['a path outside every baseline prefix', 'snapshots/a-chromium-linux.png', PREFIX],
  ["the story layer's prefix", `${STORY}a-chromium-linux.png`, PREFIX],
]

const ACCEPTED = [
  `${COMPONENT}a-chromium-linux.png`,
  `${COMPONENT}a..b-chromium-linux.png`,
  'packages/ui/specimen/baseline/nested/x_y.test.ts-snapshots/a-chromium-linux.png',
]

async function withImage(path: string, layer: 'component' | 'story' = 'component') {
  const packet = await readPacket(await packetDir())
  Object.assign(packet.images[0], { path, layer })
  return packet
}

describe('packet images[].path', () => {
  it.each(REFUSED)('the schema refuses %s', async (_, path, reason) => {
    const parsed = CiPacketSchema.safeParse(await withImage(path))

    expect(parsed.error?.issues.map((i) => [i.path.join('.'), i.message])).toEqual([
      ['images.0.path', expect.stringContaining(reason)],
    ])
  })

  it.each(REFUSED)('the packet lint refuses %s', async (_, path, reason) => {
    const dir = await packetDir()
    await editPacket(dir, (p) => (p.images[0].path = path))

    const problems = await lint(dir)

    expect(problems.map((p) => p.rule)).toEqual(['packet-schema'])
    expect(problems[0].message).toContain('images.0.path')
    expect(problems[0].message).toContain(reason)
  })

  it.each(REFUSED)('from-ci refuses to write a packet for %s', async (_, path, reason) => {
    const out = join(await tempDir(), 'packet')
    const shown = { layer: 'component' as const, source: 'artifact' as const, path }
    const c = collected([
      layer({ layer: 'component', shown: [{ ...shown, change: 'new', after: png(4, 4) }] }),
    ])

    const refused = await writePacketDir(c, out).catch((err: unknown) => err)

    expect(refused).toBeInstanceOf(ReviewError)
    expect((refused as ReviewError).message).toContain(reason)
  })

  it.each(ACCEPTED)('the schema accepts the component path %s', async (path) => {
    expect(CiPacketSchema.safeParse(await withImage(path)).success).toBe(true)
  })

  it('the schema accepts a story image under the story prefix', async () => {
    const packet = await withImage(`${STORY}shell-rail--default-chromium-linux.png`, 'story')

    expect(CiPacketSchema.safeParse(packet).success).toBe(true)
  })
})
