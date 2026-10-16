// packet lint: proves a packet directory is the one from-ci wrote for the gate's head. Offline:
// it reads only files inside the directory, walked with lstat, and never follows a link. Every
// message names paths relative to the directory, so no host path reaches a report.
import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, open, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  CI_PACKET_SCHEMA_ID,
  CiPacketSchema,
  DRAFT_FILE,
  PACKET_FILE,
  packetIdOf,
  type CiPacket,
} from './packet.ts'
import { ReviewError } from './review.ts'

export const PACKET_LINT_RULES = [
  'packet-schema',
  'packet-id',
  'gate-head',
  'draft-sha',
  'file-missing',
  'file-sha',
  'file-path',
  'file-extra',
  'file-link',
] as const

export type PacketLintRule = (typeof PACKET_LINT_RULES)[number]

export interface PacketLintProblem {
  rule: PacketLintRule
  message: string
}

export interface PacketLintOptions {
  /** The head the gate is open on; the packet must be for it. */
  gateHead: string
}

/** The files a packet directory may hold beside the images packet.json names. */
export const PACKET_ROOT_FILES = [
  PACKET_FILE,
  DRAFT_FILE,
  'prose.json',
  'round.json',
  'contrast.json',
]

const NAMED_PATH = /^(before|after|diff|montage)\/[A-Za-z0-9_.-]+\.png$/

interface Walked {
  files: Set<string>
  links: string[]
}

async function walk(dir: string, rel = '', out: Walked = { files: new Set(), links: [] }) {
  const names = (await readdir(join(dir, rel))).sort()
  for (const name of names) {
    const path = rel ? `${rel}/${name}` : name
    const stat = await lstat(join(dir, path))
    if (stat.isDirectory()) await walk(dir, path, out)
    else if (stat.isFile()) out.files.add(path)
    else out.links.push(path)
  }
  return out
}

async function readNoFollow(dir: string, rel: string): Promise<Buffer> {
  const handle = await open(join(dir, rel), constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

async function readPacket(dir: string, walked: Walked): Promise<CiPacket | PacketLintProblem> {
  const refuse = (message: string) => ({ rule: 'packet-schema' as const, message })
  if (!walked.files.has(PACKET_FILE)) return refuse(`${PACKET_FILE} is missing`)
  let json: unknown
  try {
    json = JSON.parse((await readNoFollow(dir, PACKET_FILE)).toString('utf8'))
  } catch {
    return refuse(`${PACKET_FILE} is not JSON`)
  }
  const parsed = CiPacketSchema.safeParse(json)
  if (parsed.success) return parsed.data
  const issues = parsed.error.issues.map((i) => `${i.path.map(String).join('.')}: ${i.message}`)
  return refuse(`${PACKET_FILE} fails ${CI_PACKET_SCHEMA_ID}: ${issues.join('; ')}`)
}

function bindingProblems(packet: CiPacket, opts: PacketLintOptions): PacketLintProblem[] {
  const problems: PacketLintProblem[] = []
  if (packetIdOf(packet) !== packet.packetId)
    problems.push({
      rule: 'packet-id',
      message: 'packetId is not the hash of what the packet names',
    })
  if (packet.headSha !== opts.gateHead)
    problems.push({
      rule: 'gate-head',
      message: `the packet is for head ${packet.headSha}, the gate is on ${opts.gateHead}`,
    })
  return problems
}

/** Every file packet.json names, with the sha256 it claims for it. */
function namedFiles(packet: CiPacket): [string, string][] {
  return packet.images.flatMap((i) =>
    [i, i.before, i.after, i.diff].flatMap((f) =>
      f ? [[f.file, f.sha256] as [string, string]] : []
    )
  )
}

async function fileProblem(dir: string, walked: Walked, [file, want]: [string, string]) {
  const at = (rule: PacketLintRule, message: string): PacketLintProblem => ({ rule, message })
  if (!NAMED_PATH.test(file))
    return at(
      'file-path',
      `${JSON.stringify(file)} is not a .png under before/ after/ diff/ montage/`
    )
  if (walked.links.includes(file)) return null
  if (!walked.files.has(file)) return at('file-missing', `${file} is named but not present`)
  if (sha256(await readNoFollow(dir, file)) !== want)
    return at('file-sha', `${file} does not hash to the sha256 packet.json gives it`)
  return null
}

async function draftProblems(dir: string, walked: Walked, packet: CiPacket) {
  if (!walked.files.has(DRAFT_FILE))
    return [{ rule: 'file-missing' as const, message: `${DRAFT_FILE} is named but not present` }]
  if (sha256(await readNoFollow(dir, DRAFT_FILE)) === packet.draft.sha256) return []
  return [{ rule: 'draft-sha' as const, message: `${DRAFT_FILE} does not hash to draft.sha256` }]
}

async function fileProblems(dir: string, walked: Walked, packet: CiPacket) {
  const named = namedFiles(packet)
  const problems: PacketLintProblem[] = []
  for (const entry of named) {
    const problem = await fileProblem(dir, walked, entry)
    if (problem) problems.push(problem)
  }
  const allowed = new Set([...PACKET_ROOT_FILES, ...named.map(([file]) => file)])
  for (const file of walked.files)
    if (!allowed.has(file))
      problems.push({ rule: 'file-extra', message: `${file} is not part of the packet` })
  return problems
}

async function walkPacketDir(dir: string): Promise<Walked> {
  const root = await lstat(dir).catch(() => null)
  if (!root?.isDirectory())
    throw new ReviewError('the packet directory is not a readable directory')
  return walk(dir)
}

/** Every way `dir` differs from the packet from-ci writes for `opts.gateHead`. */
export async function lintPacket(
  dir: string,
  opts: PacketLintOptions
): Promise<PacketLintProblem[]> {
  const walked = await walkPacketDir(dir)
  const links = walked.links.map((file) => ({
    rule: 'file-link' as const,
    message: `${file} is a link or not a regular file`,
  }))
  const packet = await readPacket(dir, walked)
  if ('rule' in packet) return [...links, packet]
  return [
    ...links,
    ...bindingProblems(packet, opts),
    ...(await draftProblems(dir, walked, packet)),
    ...(await fileProblems(dir, walked, packet)),
  ]
}
