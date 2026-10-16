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
import { CONTRAST_FILE, ROUND_FILE } from './build.ts'
import { draftHeadProblems, roundProblems } from './packet-lint-round.ts'
import { PROSE_FILE, PROSE_SCHEMA_ID, ProseSchema, type Prose } from './packet-prose.ts'
import { ReviewError } from './review.ts'
import type { z } from 'zod'

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
  'prose-missing',
  'prose-schema',
  'prose-binding',
  'cause-unknown',
  'cause-missing',
  'draft-head',
  'round-missing',
  'round-unit',
  'round-draft',
  'round-head',
] as const

export type PacketLintRule = (typeof PACKET_LINT_RULES)[number]

export interface PacketLintProblem {
  rule: PacketLintRule
  message: string
}

/** The optional files a lint can require; each is linted whenever it is present. */
export const PACKET_REQUIREMENTS = ['prose', 'round'] as const
export type PacketRequirement = (typeof PACKET_REQUIREMENTS)[number]

export interface PacketLintOptions {
  /** The head the gate is open on; the packet must be for it. */
  gateHead: string
  /** Files that must be present: prose.json, round.json. */
  require?: readonly PacketRequirement[]
}

/** The files a packet directory may hold beside the images packet.json names. */
export const PACKET_ROOT_FILES = [PACKET_FILE, DRAFT_FILE, PROSE_FILE, ROUND_FILE, CONTRAST_FILE]

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

/** A root file's bytes and its JSON (`isJson` false when it does not parse). */
interface JsonFile {
  bytes: Buffer
  json: unknown
  isJson: boolean
}

async function readJson(dir: string, walked: Walked, file: string): Promise<JsonFile | null> {
  if (!walked.files.has(file)) return null
  const bytes = await readNoFollow(dir, file)
  try {
    return { bytes, json: JSON.parse(bytes.toString('utf8')), isJson: true }
  } catch {
    return { bytes, json: undefined, isJson: false }
  }
}

const issueText = (error: z.ZodError) =>
  error.issues.map((i) => `${i.path.map(String).join('.')}: ${i.message}`).join('; ')

async function readPacket(dir: string, walked: Walked): Promise<CiPacket | PacketLintProblem> {
  const refuse = (message: string) => ({ rule: 'packet-schema' as const, message })
  const read = await readJson(dir, walked, PACKET_FILE)
  if (!read) return refuse(`${PACKET_FILE} is missing`)
  if (!read.isJson) return refuse(`${PACKET_FILE} is not JSON`)
  const parsed = CiPacketSchema.safeParse(read.json)
  if (parsed.success) return parsed.data
  return refuse(`${PACKET_FILE} fails ${CI_PACKET_SCHEMA_ID}: ${issueText(parsed.error)}`)
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

function draftProblems(draft: JsonFile | null, packet: CiPacket, opts: PacketLintOptions) {
  if (!draft)
    return [{ rule: 'file-missing' as const, message: `${DRAFT_FILE} is named but not present` }]
  const problems: PacketLintProblem[] = draftHeadProblems(draft.json, packet, opts.gateHead)
  if (sha256(draft.bytes) !== packet.draft.sha256)
    problems.unshift({ rule: 'draft-sha', message: `${DRAFT_FILE} does not hash to draft.sha256` })
  return problems
}

const required = (opts: PacketLintOptions, what: PacketRequirement, file: string) =>
  opts.require?.includes(what)
    ? [{ rule: `${what}-missing` as const, message: `${file} is required but not present` }]
    : []

function causeProblems(prose: Prose, packet: CiPacket): PacketLintProblem[] {
  const keys = packet.images.map((i) => i.key)
  const unknown = Object.keys(prose.cause).filter((key) => !keys.includes(key))
  const missing = keys.filter((key) => !Object.hasOwn(prose.cause, key))
  return [
    ...unknown.map((key) => ({
      rule: 'cause-unknown' as const,
      message: `${PROSE_FILE} gives a cause for ${key}, which is not an image of the packet`,
    })),
    ...missing.map((key) => ({
      rule: 'cause-missing' as const,
      message: `${PROSE_FILE} gives no cause for image ${key}`,
    })),
  ]
}

function proseBinding(prose: Prose, packet: CiPacket, opts: PacketLintOptions) {
  const problems: PacketLintProblem[] = []
  if (prose.packetId !== packet.packetId)
    problems.push({ rule: 'prose-binding', message: `${PROSE_FILE} is for another packetId` })
  if (prose.headSha !== opts.gateHead)
    problems.push({
      rule: 'prose-binding',
      message: `${PROSE_FILE} is for head ${prose.headSha}, the gate is on ${opts.gateHead}`,
    })
  return problems
}

async function proseProblems(
  dir: string,
  walked: Walked,
  packet: CiPacket,
  opts: PacketLintOptions
) {
  const read = await readJson(dir, walked, PROSE_FILE)
  if (!read) return required(opts, 'prose', PROSE_FILE)
  const refuse = (message: string) => [{ rule: 'prose-schema' as const, message }]
  if (!read.isJson) return refuse(`${PROSE_FILE} is not JSON`)
  const parsed = ProseSchema.safeParse(read.json)
  if (!parsed.success)
    return refuse(`${PROSE_FILE} fails ${PROSE_SCHEMA_ID}: ${issueText(parsed.error)}`)
  return [...proseBinding(parsed.data, packet, opts), ...causeProblems(parsed.data, packet)]
}

async function roundFileProblems(
  dir: string,
  walked: Walked,
  packet: CiPacket,
  opts: PacketLintOptions,
  draft: JsonFile | null
): Promise<PacketLintProblem[]> {
  const read = await readJson(dir, walked, ROUND_FILE)
  if (!read) return required(opts, 'round', ROUND_FILE)
  if (!read.isJson) return [{ rule: 'round-draft', message: `${ROUND_FILE} is not JSON` }]
  return roundProblems(read.json, draft?.json, packet, opts.gateHead)
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

export interface PacketLintResult {
  /** packet.json's packetId when it passes the schema, else null. */
  packetId: string | null
  problems: PacketLintProblem[]
}

/** Every way `dir` differs from the packet from-ci writes for `opts.gateHead`, with its id. */
export async function lintPacketResult(
  dir: string,
  opts: PacketLintOptions
): Promise<PacketLintResult> {
  const walked = await walkPacketDir(dir)
  const links = walked.links.map((file) => ({
    rule: 'file-link' as const,
    message: `${file} is a link or not a regular file`,
  }))
  const packet = await readPacket(dir, walked)
  if ('rule' in packet) return { packetId: null, problems: [...links, packet] }
  const draft = await readJson(dir, walked, DRAFT_FILE)
  const problems = [
    ...links,
    ...bindingProblems(packet, opts),
    ...draftProblems(draft, packet, opts),
    ...(await fileProblems(dir, walked, packet)),
    ...(await proseProblems(dir, walked, packet, opts)),
    ...(await roundFileProblems(dir, walked, packet, opts, draft)),
  ]
  return { packetId: packet.packetId, problems }
}

/** Every way `dir` differs from the packet from-ci writes for `opts.gateHead`. */
export async function lintPacket(
  dir: string,
  opts: PacketLintOptions
): Promise<PacketLintProblem[]> {
  return (await lintPacketResult(dir, opts)).problems
}
