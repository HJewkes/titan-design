import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CiPacketSchema, type CiPacket } from '../src/packet.ts'
import { runCli } from '../src/run.ts'
import {
  COMPONENT,
  HEAD,
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
const A = `${SPEC}a-chromium-linux.png`
const RED = [255, 0, 0, 255]

async function run(w: World) {
  const out = join(await tempDir(), 'packet')
  const stderr: string[] = []
  const fake = fakeCi(w)
  const code = await runCli(fromCiArgs(out), cliIo(fake.io, stderr))
  return { code, out, stderr: stderr.join('\n'), calls: fake.calls }
}

const exists = (path: string) =>
  access(path).then(
    () => true,
    () => false
  )

const readPacket = async (out: string): Promise<CiPacket> =>
  CiPacketSchema.parse(JSON.parse(await readFile(join(out, 'packet.json'), 'utf8')))

/** Main has baseline a; the run regenerated it with one pixel turned red. */
function changedWorld(diagnostics?: Record<string, Buffer>): World {
  const base = world({ main: { [`${COMPONENT.prefix}${A}`]: png(40, 20) } })
  const regenerated = withArtifact(base, COMPONENT.artifact, {
    [A]: png(40, 20, undefined, [[3, 4, RED]]),
  })
  return diagnostics ? withArtifact(regenerated, COMPONENT.diagnostics, diagnostics) : regenerated
}

describe('packet from-ci binding', () => {
  it('refuses a run of another head, naming both shas, and writes nothing', async () => {
    const other = 'e5'.repeat(20)
    const result = await run(world({ run: { ...world().run, headSha: other } }))

    expect(result.code).toBe(2)
    expect(result.stderr).toContain(other)
    expect(result.stderr).toContain(HEAD)
    expect(await exists(result.out)).toBe(false)
  })

  it('refuses when the PR head has moved past --head', async () => {
    const result = await run(world({ pr: { headRefOid: 'f6'.repeat(20), state: 'OPEN' } }))

    expect(result.code).toBe(2)
    expect(result.stderr).toContain('has moved')
    expect(await exists(result.out)).toBe(false)
  })

  it('refuses a run of another workflow', async () => {
    const result = await run(world({ run: { ...world().run, workflowName: 'Visual' } }))

    expect(result.code).toBe(2)
    expect(await exists(result.out)).toBe(false)
  })

  it('refuses an expired artifact by name rather than reading it as no changes', async () => {
    const w = world({ artifacts: [{ name: COMPONENT.artifact, expired: true }] })
    const result = await run(w)

    expect(result.code).toBe(2)
    expect(result.stderr).toContain(`${COMPONENT.artifact} has expired`)
    expect(await exists(result.out)).toBe(false)
  })
})

describe('packet from-ci sources', () => {
  it('maps an artifact file onto its layer prefix, so an unchanged baseline is not new plus removed', async () => {
    const w = withArtifact(
      world({ main: { [`${COMPONENT.prefix}${A}`]: png(40, 20) } }),
      COMPONENT.artifact,
      {
        [A]: png(40, 20),
      }
    )
    const { out } = await run(w)
    const packet = await readPacket(out)

    expect(packet.images).toEqual([])
    expect(packet.unchanged).toEqual({ component: 1, story: 0 })
  })

  it("uses CI's diff when its expected image is main's bytes", async () => {
    const ciDiff = png(40, 20, [1, 2, 3, 255])
    const { out } = await run(
      changedWorld({ [`run/a-diff.png`]: ciDiff, [`run/a-expected.png`]: png(40, 20) })
    )
    const [image] = (await readPacket(out)).images

    expect(image.diff?.source).toBe('ci')
    expect(await readFile(join(out, image.diff!.file))).toEqual(ciDiff)
  })

  it('computes its own diff when the CI diff was made against another main', async () => {
    const stale = png(40, 20, [9, 9, 9, 255])
    const { out } = await run(
      changedWorld({ [`run/a-diff.png`]: png(40, 20), [`run/a-expected.png`]: stale })
    )
    const [image] = (await readPacket(out)).images

    expect(image.diff?.source).toBe('computed')
    expect(image.diff?.diffPixels).toBe(1)
  })

  it('shows PNGs the PR commits on a green run, classified against main', async () => {
    const added = `${STORY.prefix}lab-still--default-chromium-linux.png`
    const edited = `${COMPONENT.prefix}${A}`
    const w = world({
      run: { ...world().run, conclusion: 'success' },
      main: { [edited]: png(40, 20) },
      prFiles: { [added]: png(30, 10), [edited]: png(40, 24) },
    })
    const { code, out } = await run(w)
    const images = (await readPacket(out)).images

    expect(code).toBe(0)
    expect(images.map((i) => [i.path, i.change, i.source])).toEqual([
      [edited, 'changed', 'git'],
      [added, 'new', 'git'],
    ])
    expect(images[0].diff).toBeNull()
    expect(images[0].size).toEqual({ before: { w: 40, h: 20 }, after: { w: 40, h: 24 } })
    expect(images[1].storyId).toBe('lab-still--default')
  })

  it('calls only read verbs of gh and git', async () => {
    const result = await run(changedWorld({ [`run/a-diff.png`]: png(40, 20) }))
    const verbs = new Set(result.calls.map(([tool, ...args]) => `${tool} ${args[0]} ${args[1]}`))
    const read =
      /^(gh (run (view|download)|pr view|api \S+)|git (fetch|rev-parse|merge-base|ls-tree|diff|show) \S+)$/

    expect(result.code).toBe(0)
    for (const verb of verbs) expect(verb).toMatch(read)
    expect(result.calls.flat()).not.toContain('--method')
  })
})
