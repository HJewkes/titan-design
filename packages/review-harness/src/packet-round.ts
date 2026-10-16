// packet round: the round a CI packet's draft builds into, and the frames@1 index the console imports
// it with. No Storybook and no tree: round.json is the round rules over draft.json plus the packet's
// provenance, and frames/frames.json lists the packet's PNGs and binds packet.json and prose.json.
import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { mkdir, open, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ManifestInput } from '@titan-design/review-schema'
import { ROUND_FILE, roundBytes } from './build.ts'
import { FRAMES_DIR, FRAMES_FILE, FRAMES_SCHEMA_ID } from './frames.ts'
import { CiPacketSchema, DRAFT_FILE, PACKET_FILE, checkDraft, type CiPacket } from './packet.ts'
import { PROSE_FILE } from './packet-prose.ts'
import { ReviewError } from './review.ts'
import { applyRoundRules } from './round-rules.ts'

/** Where the index sits, relative to the packet directory. */
export const PACKET_FRAMES_PATH = `${FRAMES_DIR}/${FRAMES_FILE}`

interface Listed {
  file: string
  sha256: string
}

/** One record per packet image: the montage is the head view, as the round's variant `image` is. */
export interface PacketFrame extends Listed {
  key: string
  base?: Listed
  diff?: Listed
  after?: Listed
}

export interface PacketFramesIndex {
  schema: typeof FRAMES_SCHEMA_ID
  unit: string
  round: number
  manifestSha256: string
  packet: Listed
  prose: Listed
  frames: PacketFrame[]
}

/** The bytes of the three JSON files the index binds. */
export interface PacketRoundBytes {
  packet: Buffer
  round: Buffer
  prose: Buffer
}

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')
const listed = ({ file, sha256 }: Listed): Listed => ({ file, sha256 })

function frameOf(image: CiPacket['images'][number]): PacketFrame {
  return {
    ...listed(image),
    key: image.key,
    ...(image.before ? { base: listed(image.before) } : {}),
    ...(image.diff ? { diff: listed(image.diff) } : {}),
    ...(image.after ? { after: listed(image.after) } : {}),
  }
}

/** The frames.json bytes for a packet and its round; lint's `frames-index` rule compares against these. */
export function framesIndexBytes(packet: CiPacket, bytes: PacketRoundBytes): Buffer {
  const round = JSON.parse(bytes.round.toString('utf8')) as { unit: string; round: number }
  const index: PacketFramesIndex = {
    schema: FRAMES_SCHEMA_ID,
    unit: round.unit,
    round: round.round,
    manifestSha256: sha256(bytes.round),
    packet: { file: PACKET_FILE, sha256: sha256(bytes.packet) },
    prose: { file: PROSE_FILE, sha256: sha256(bytes.prose) },
    frames: packet.images.map(frameOf),
  }
  return Buffer.from(`${JSON.stringify(index, null, 2)}\n`)
}

/** round.json for the packet: the round rules over its draft, built at the packet's main and head. */
export function packetRoundBytes(packet: CiPacket, draft: ManifestInput): Buffer {
  checkDraft(draft)
  return roundBytes(applyRoundRules(draft), { mainSha: packet.mainSha, mergeSha: packet.headSha })
}

async function readFileIn(dir: string, file: string): Promise<Buffer> {
  const handle = await open(join(dir, file), constants.O_RDONLY | constants.O_NOFOLLOW).catch(
    () => {
      throw new ReviewError(`${file} is missing, a link, or unreadable`)
    }
  )
  try {
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

function parseJson(bytes: Buffer, file: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new ReviewError(`${file} is not JSON`)
  }
}

/** Every input read and checked before anything is written. */
async function readInputs(dir: string) {
  const packetBytes = await readFileIn(dir, PACKET_FILE)
  const parsed = CiPacketSchema.safeParse(parseJson(packetBytes, PACKET_FILE))
  if (!parsed.success) throw new ReviewError(`${PACKET_FILE} is not a ci-packet@1 packet`)
  const draftBytes = await readFileIn(dir, DRAFT_FILE)
  if (sha256(draftBytes) !== parsed.data.draft.sha256)
    throw new ReviewError(`${DRAFT_FILE} does not hash to the sha256 ${PACKET_FILE} gives it`)
  const prose = await readFileIn(dir, PROSE_FILE)
  const draft = parseJson(draftBytes, DRAFT_FILE) as ManifestInput
  return { packet: parsed.data, draft, bytes: { packet: packetBytes, prose } }
}

/** Writes each file beside its target first, then renames them in, so no file is ever half written. */
async function writeAll(dir: string, files: [string, Buffer][]): Promise<void> {
  const staged = files.map(
    ([file, bytes]) => [join(dir, file), `${join(dir, file)}.tmp`, bytes] as const
  )
  try {
    for (const [, tmp, bytes] of staged) await writeFile(tmp, bytes)
    for (const [path, tmp] of staged) await rename(tmp, path)
  } finally {
    await Promise.all(staged.map(([, tmp]) => rm(tmp, { force: true })))
  }
}

export interface PacketRoundResult {
  round: Buffer
  frames: PacketFramesIndex
}

/** `packet round <dir>`: writes round.json and frames/frames.json; a refusal writes neither. */
export async function packetRound(dir: string): Promise<PacketRoundResult> {
  const { packet, draft, bytes } = await readInputs(dir)
  const round = packetRoundBytes(packet, draft)
  const frames = framesIndexBytes(packet, { ...bytes, round })
  await mkdir(join(dir, FRAMES_DIR), { recursive: true })
  await writeAll(dir, [
    [PACKET_FRAMES_PATH, frames],
    [ROUND_FILE, round],
  ])
  return { round, frames: JSON.parse(frames.toString('utf8')) as PacketFramesIndex }
}
