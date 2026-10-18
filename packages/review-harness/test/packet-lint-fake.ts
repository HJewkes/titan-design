// A packet directory for the lint tests: written by from-ci's writer, then tampered per case.
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { expect } from 'vitest'
import { writePacketDir, type CiPacket } from '../src/packet.ts'
import { lintPacket, type PacketLintOptions } from '../src/packet-lint.ts'
import { PROSE_SCHEMA_ID, type Prose } from '../src/packet-prose.ts'
import type { Gathered } from '../src/packet-types.ts'
import { HEAD, collected, layer, png, tempDir } from './packet-fake.ts'

export const RED = [255, 0, 0, 255]
export const OTHER_HEAD = 'e5'.repeat(20)
export const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

const shown = (over: Partial<Gathered> & Pick<Gathered, 'path' | 'change'>): Gathered => ({
  layer: 'component',
  source: 'artifact',
  ...over,
})

/** A 4x4 packet: one changed baseline (before, after, diff, montage) and one new one. */
export async function packetDir() {
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

export const readJsonFile = async <T = unknown>(dir: string, file: string): Promise<T> =>
  JSON.parse(await readFile(join(dir, file), 'utf8'))
export const writeJsonFile = (dir: string, file: string, value: unknown) =>
  writeFile(join(dir, file), `${JSON.stringify(value, null, 2)}\n`)

export const readPacket = (dir: string) => readJsonFile<CiPacket>(dir, 'packet.json')

export async function editPacket(dir: string, edit: (p: CiPacket) => void) {
  const packet = await readPacket(dir)
  edit(packet)
  await writeJsonFile(dir, 'packet.json', packet)
}

/** Rewrites draft.json and the sha packet.json gives it, so only the draft's content differs. */
export async function editDraft(dir: string, edit: (draft: string) => string) {
  const draft = Buffer.from(edit(await readFile(join(dir, 'draft.json'), 'utf8')))
  await writeFile(join(dir, 'draft.json'), draft)
  await editPacket(dir, (p) => (p.draft.sha256 = sha256(draft)))
}

/** A prose.json that passes, for the packet in `dir`. */
export async function validProse(dir: string): Promise<Prose> {
  const packet = await readPacket(dir)
  return {
    schema: PROSE_SCHEMA_ID,
    packetId: packet.packetId,
    headSha: packet.headSha,
    intent: { text: 'Widgets gain a red corner pixel.', approvedBy: 'XX-1', pointer: 'task XX-1' },
    delta: ['The corner pixel was grey; it is red.'],
    cause: Object.fromEntries(packet.images.map((i) => [i.key, 'src/widget.tsx sets the fill'])),
    recommend: { answer: 'Ship', confidence: 0.8, flip: 'A grey corner in the after image' },
    followUps: [1, 2, 3].map((n) => ({
      question: `Question ${n}?`,
      answer: `Answer ${n}.`,
      pointer: `img-00${n}`,
    })),
  }
}

export async function lint(dir: string, opts: Partial<PacketLintOptions> = {}) {
  const problems = await lintPacket(dir, { gateHead: HEAD, ...opts })
  for (const p of problems) expect(p.message).not.toContain(dirname(dir))
  return problems
}

export const rules = async (dir: string, opts: Partial<PacketLintOptions> = {}) =>
  (await lint(dir, opts)).map((p) => p.rule)
