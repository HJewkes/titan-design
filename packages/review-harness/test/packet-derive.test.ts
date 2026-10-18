import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { writePacketDir } from '../src/packet.ts'
import type { CiIo } from '../src/packet-ci.ts'
import { lintPacket, type PacketLintOptions } from '../src/packet-lint.ts'
import type { Gathered } from '../src/packet-types.ts'
import { HEAD, MAIN, collected, layer, png, tempDir } from './packet-fake.ts'
import { RED, editPacket, readPacket, sha256 } from './packet-lint-fake.ts'

const BLUE = [0, 0, 255, 255]
const BLACK = [0, 0, 0, 255]
const path = (name: string) => `snapshots/${name}-chromium-linux.png`

/** The repo the fake clone holds: main's baselines and the ones the PR head commits. */
const GIT = {
  main: {
    [path('a')]: png(4, 4),
    [path('c')]: png(4, 4),
    [path('d')]: png(2, 2),
    [path('e')]: png(4, 4),
  },
  head: {
    [path('a')]: png(4, 4, undefined, [[1, 1, RED]]),
    [path('b')]: png(4, 4, RED),
    [path('e')]: png(4, 5, RED),
  },
}

/**
 * Five images, keyed by path order: img-001 a git change with a computed diff, img-002 a git add,
 * img-003 an artifact change with a CI diff no recompute gives, img-004 an artifact removal and
 * img-005 a git change of size (no diff).
 */
function shown(forge: Record<string, Partial<Gathered>> = {}): Gathered[] {
  const g = (name: string, over: Omit<Gathered, 'layer' | 'path'>): Gathered => ({
    ...{ layer: 'component', path: path(name), ...over },
    ...forge[name],
  })
  const afterC = png(4, 4, undefined, [[2, 2, RED]])
  return [
    g('a', { change: 'changed', source: 'git', before: GIT.main[path('a')] }),
    g('b', { change: 'new', source: 'git' }),
    g('c', {
      ...{ change: 'changed', source: 'artifact', before: GIT.main[path('c')], after: afterC },
      ciDiff: { expected: GIT.main[path('c')], diff: png(4, 4, BLUE) },
    }),
    g('d', { change: 'removed', source: 'artifact', before: GIT.main[path('d')] }),
    g('e', { change: 'changed', source: 'git', before: GIT.main[path('e')] }),
  ].map((item) => ({ after: GIT.head[item.path], ...item }))
}

/** A packet written by from-ci's writer; `forge` swaps an input's bytes, so it is self-consistent. */
async function packetDir(forge: Record<string, Partial<Gathered>> = {}) {
  const dir = join(await tempDir(), 'packet')
  await writePacketDir(collected([layer({ layer: 'component', shown: shown(forge) })]), dir)
  return dir
}

/** The fake clone: `git show` answers main's and the head's blobs and refuses anything else. */
function fakeGit() {
  const calls: string[] = []
  const blobs: Record<string, Buffer> = {}
  for (const [p, bytes] of Object.entries(GIT.main)) blobs[`${MAIN}:${p}`] = bytes
  for (const [p, bytes] of Object.entries(GIT.head)) blobs[`${HEAD}:${p}`] = bytes
  const io: Pick<CiIo, 'gitBlob'> = {
    gitBlob: async (_clone, spec) => {
      calls.push(spec)
      if (!blobs[spec]) throw new Error(`fatal: path not in ${spec}`)
      return blobs[spec]
    },
  }
  return { io, calls, blobs }
}

const CLONE = '/synthetic-clone'

async function lint(dir: string, opts: Partial<PacketLintOptions> = {}, git = fakeGit()) {
  const problems = await lintPacket(dir, { gateHead: HEAD, clone: CLONE, ...opts }, git.io)
  for (const p of problems) {
    expect(p.message).not.toContain(dirname(dir))
    expect(p.message).not.toContain(CLONE)
  }
  return problems
}

const rules = async (dir: string, opts: Partial<PacketLintOptions> = {}) =>
  (await lint(dir, opts)).map((p) => p.rule)

describe('packet lint --clone: sources', () => {
  it('passes a clean packet whose befores and git afters are the clone blobs', async () => {
    const dir = await packetDir()
    const git = fakeGit()

    expect(await lint(dir, {}, git)).toEqual([])
    expect(git.calls).toContain(`${MAIN}:${path('a')}`)
    expect(git.calls).toContain(`${HEAD}:${path('b')}`)
  })

  it('refuses a before image that is not main blob, though the packet is self-consistent', async () => {
    const dir = await packetDir({ a: { before: png(4, 4, BLACK) } })

    expect(await rules(dir, { clone: undefined })).toEqual([])
    expect(await lint(dir)).toEqual([
      { rule: 'before-source', message: `before/img-001.png is not git's ${MAIN}:${path('a')}` },
    ])
  })

  it('refuses a git-sourced after that is not the head blob', async () => {
    const dir = await packetDir({ b: { after: png(4, 4, BLUE) } })

    expect(await rules(dir, { clone: undefined })).toEqual([])
    expect(await rules(dir)).toEqual(['after-source'])
  })

  it('refuses a before image git does not have at main', async () => {
    const dir = await packetDir()
    const git = fakeGit()
    delete git.blobs[`${MAIN}:${path('d')}`]

    expect(await lint(dir, {}, git)).toEqual([
      { rule: 'before-source', message: `before/img-004.png: git has no ${MAIN}:${path('d')}` },
    ])
  })
})

describe('packet lint --clone: derived files', () => {
  it('refuses a montage that is not the montage of its sides', async () => {
    const dir = await packetDir()
    const forged = png(8, 8, BLUE)
    await writeFile(join(dir, 'montage/img-001.png'), forged)
    await editPacket(dir, (p) => (p.images[0].sha256 = sha256(forged)))

    expect(await rules(dir, { clone: undefined })).toEqual([])
    expect(await rules(dir)).toEqual(['derived'])
  })

  it('refuses a computed diff that is not the recomputed diff', async () => {
    const dir = await packetDir()
    const forged = png(4, 4, BLUE)
    await writeFile(join(dir, 'diff/img-001.png'), forged)
    await editPacket(dir, (p) => (p.images[0].diff!.sha256 = sha256(forged)))

    expect(await rules(dir)).toEqual(['derived'])
  })

  it('refuses recorded pixel counts that are not the recomputed ones', async () => {
    const dir = await packetDir()
    await editPacket(dir, (p) => (p.images[0].diff!.diffPixels += 1))

    expect(await rules(dir)).toEqual(['derived'])
  })

  it('trusts a CI diff on its sha though a recompute gives other bytes', async () => {
    const dir = await packetDir()
    const ci = (await readPacket(dir)).images[2]

    expect(ci.diff?.source).toBe('ci')
    expect(await rules(dir)).toEqual([])
  })

  it('refuses a CI diff that is not a PNG', async () => {
    const dir = await packetDir()
    const forged = Buffer.from('not a png')
    await writeFile(join(dir, 'diff/img-003.png'), forged)
    await editPacket(dir, (p) => (p.images[2].diff!.sha256 = sha256(forged)))

    expect(await lint(dir)).toEqual([
      { rule: 'derived', message: 'diff/img-003.png is not a readable PNG' },
    ])
  })

  it('refuses a diff recorded for a pair whose sizes differ', async () => {
    const dir = await packetDir()
    await editPacket(dir, (p) => (p.images[4].diff = p.images[0].diff))

    expect(await rules(dir)).toEqual(['derived'])
  })
})

describe('packet lint without --clone', () => {
  it('reads no git and judges a forged before by its sha alone', async () => {
    const dir = await packetDir({ a: { before: png(4, 4, BLACK) } })
    const git = fakeGit()

    expect(await lint(dir, { clone: undefined }, git)).toEqual([])
    expect(git.calls).toEqual([])
  })
})
