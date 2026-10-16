import { createHash } from 'node:crypto'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sha256Of } from '../src/frames.ts'
import { CiPacketSchema } from '../src/packet.ts'
import { runCli } from '../src/run.ts'
import {
  COMPONENT,
  STORY,
  cliIo,
  fakeCi,
  fromCiArgs,
  png,
  tempDir,
  withArtifact,
  world,
  type World,
} from './packet-fake.ts'

const SPEC = 'x.test.ts-snapshots/'
const path = (name: string) => `${SPEC}${name}-chromium-linux.png`
const RED = [255, 0, 0, 255]

/** A failed run: one baseline changed, one new, one removed, one unchanged, and one story changed. */
function failedRun(): World {
  const c = (name: string) => `${COMPONENT.prefix}${path(name)}`
  const story = 'shell-rail--default-chromium-linux.png'
  const base = world({
    main: {
      [c('same')]: png(40, 20),
      [c('changed')]: png(40, 20),
      [c('removed')]: png(40, 20),
      [`${STORY.prefix}${story}`]: png(64, 32),
    },
  })
  const component = withArtifact(base, COMPONENT.artifact, {
    [path('same')]: png(40, 20),
    [path('changed')]: png(40, 20, undefined, [[1, 1, RED]]),
    [path('new')]: png(40, 20, RED),
  })
  return withArtifact(component, STORY.artifact, { [story]: png(64, 40) })
}

async function build(w: World, out: string) {
  const stderr: string[] = []
  const code = await runCli(fromCiArgs(out), cliIo(fakeCi(w).io, stderr))
  return { code, stderr: stderr.join('\n') }
}

const readJson = async (file: string) => JSON.parse(await readFile(file, 'utf8'))
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

describe('titan-review packet from-ci', () => {
  it('writes a packet whose every sha256 is the sha256 of the file it names', async () => {
    const out = join(await tempDir(), 'packet')
    expect((await build(failedRun(), out)).code).toBe(0)
    const packet = CiPacketSchema.parse(await readJson(join(out, 'packet.json')))

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
    const out = join(await tempDir(), 'packet')
    await build(failedRun(), out)
    const story = CiPacketSchema.parse(await readJson(join(out, 'packet.json'))).images[3]

    expect(story.diff).toBeNull()
    expect(story.size).toEqual({ before: { w: 64, h: 32 }, after: { w: 64, h: 40 } })
  })

  it('gives the same packetId to two runs over the same inputs', async () => {
    const [a, b] = [join(await tempDir(), 'a'), join(await tempDir(), 'b')]
    await build(failedRun(), a)
    await build(failedRun(), b)

    const id = async (out: string) => (await readJson(join(out, 'packet.json'))).packetId
    expect(await id(a)).toBe(await id(b))
  })

  it('leaves an earlier packet untouched when a downloaded PNG is corrupt', async () => {
    const out = join(await tempDir(), 'packet')
    await mkdir(out)
    await writeFile(join(out, 'packet.json'), 'earlier')
    const corrupt = withArtifact(world(), COMPONENT.artifact, {
      [path('broken')]: Buffer.from('not a png'),
    })

    const result = await build(corrupt, out)

    expect(result.code).toBe(2)
    expect(result.stderr).toContain('not a PNG')
    expect(await readFile(join(out, 'packet.json'), 'utf8')).toBe('earlier')
  })

  it('builds a Ship-only packet from a green run with nothing regenerated', async () => {
    const out = join(await tempDir(), 'packet')
    const green = world({ run: { ...world().run, conclusion: 'success' } })
    expect((await build(green, out)).code).toBe(0)
    const packet = CiPacketSchema.parse(await readJson(join(out, 'packet.json')))
    const draft = await readJson(join(out, 'draft.json'))

    expect(packet.images).toEqual([])
    expect(packet.ci.regenerated).toEqual({ component: false, story: false })
    expect(draft.sections.map((s: { id: string }) => s.id)).toEqual(['ship'])
  })

  it('warns when main changed a baseline after the merge-base', async () => {
    const out = join(await tempDir(), 'packet')
    const moved = `${COMPONENT.prefix}${path('elsewhere')}`
    const result = await build(world({ moved: [moved] }), out)

    expect(result.stderr).toContain(moved)
    expect((await readJson(join(out, 'packet.json'))).warnings).toHaveLength(1)
  })

  it('refuses a missing --run before calling gh', async () => {
    const out = join(await tempDir(), 'packet')
    const args = fromCiArgs(out).filter((a, i, all) => a !== '--run' && all[i - 1] !== '--run')
    const fake = fakeCi(world())

    expect(await runCli(args, cliIo(fake.io))).toBe(2)
    expect(fake.calls).toEqual([])
    await expect(access(out)).rejects.toThrow()
  })
})
