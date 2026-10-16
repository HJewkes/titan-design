// `titan-review packet <verb>`: from-ci builds a packet, round builds its round, lint judges one,
// prompt prints the packager's instructions. Each verb is one function; a new verb adds one row to VERBS.
import { readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { DRAFT_FILE, PACKET_FILE, packetFromCi } from './packet.ts'
import { ciIo, type CiIo } from './packet-ci.ts'
import { packetUnit } from './packet-draft.ts'
import {
  PACKET_REQUIREMENTS,
  lintPacketResult,
  type PacketLintProblem,
  type PacketRequirement,
} from './packet-lint.ts'
import { packetRound } from './packet-round.ts'
import { EXIT_REFUSED, ROUND_FILE } from './build.ts'
import { REPO_ROOT } from './locks.ts'
import { EXIT_OK, ReviewError } from './review.ts'

/** The `--json` result of `packet lint`; factory parses it before an import. */
export const PACKET_LINT_SCHEMA_ID = 'titan-review/packet-lint@1'

export const PACKET_USAGE = `titan-review packet from-ci --repo <owner/name> --pr <n> --head <sha> --run <id> [--out <dir>]
                  [--clone <path>] [--side <questions.json>]
titan-review packet lint <dir> --gate-head <sha> [--require prose,round] [--clone <path>] [--json]
titan-review packet round <dir>
titan-review packet prompt`

/** The packager's instructions, shipped beside the lint that judges what it writes. */
export const PACKAGER_PROMPT = new URL('../prompts/review-packager.md', import.meta.url)

export interface PacketParsed {
  positionals: string[]
  values: {
    repo?: string
    pr?: string
    head?: string
    run?: string
    out?: string
    clone?: string
    side?: string
    'gate-head'?: string
    require?: string
    json?: boolean
  }
}

export interface PacketIo {
  stdout: (text: string) => void
  stderr: (text: string) => void
  /** The gh and git reads of `packet from-ci`; the real ones when absent. */
  ci?: CiIo
}

const usage = (message: string) => new ReviewError(`${message}\n\n${PACKET_USAGE}`)

function required(parsed: PacketParsed, name: 'repo' | 'pr' | 'head' | 'run'): string {
  const value = parsed.values[name]
  if (value === undefined) throw usage(`packet from-ci needs --${name}`)
  return value
}

/** Builds the packet and prints packet.json's path; every refusal writes nothing. */
async function fromCi(parsed: PacketParsed, io: PacketIo): Promise<number> {
  if (parsed.positionals.length !== 2) throw usage('expected: packet from-ci')
  const repo = required(parsed, 'repo')
  const pr = Number(required(parsed, 'pr'))
  const head = required(parsed, 'head')
  const out = resolve(parsed.values.out ?? join('packets', packetUnit(repo, pr, head)))
  const { packet: built, warnings } = await packetFromCi(
    {
      ...{ repo, pr, head, run: required(parsed, 'run'), out },
      clone: resolve(parsed.values.clone ?? REPO_ROOT),
      ...(parsed.values.side ? { side: resolve(parsed.values.side) } : {}),
    },
    io.ci ?? ciIo
  )
  warnings.forEach((w) => io.stderr(`titan-review: warning: ${w}`))
  io.stderr(`${built.images.length} images; next: titan-review build ${join(out, DRAFT_FILE)}`)
  io.stdout(`${join(out, PACKET_FILE)}\n`)
  return EXIT_OK
}

function gateHead(parsed: PacketParsed): string {
  const head = parsed.values['gate-head']
  if (head === undefined) throw usage('packet lint needs --gate-head')
  if (!/^[0-9a-f]{40}$/.test(head)) throw usage('--gate-head must be a 40-hex commit sha')
  return head
}

function requirements(parsed: PacketParsed): PacketRequirement[] {
  const given = (parsed.values.require ?? '').split(',').filter(Boolean)
  const unknown = given.filter((r) => !(PACKET_REQUIREMENTS as readonly string[]).includes(r))
  if (unknown.length) throw usage(`--require takes ${PACKET_REQUIREMENTS.join(', ')}`)
  return given as PacketRequirement[]
}

/** `--clone`, when given and a directory; lint never defaults it, so no flag means no git read. */
async function lintClone(parsed: PacketParsed): Promise<{ clone?: string }> {
  if (parsed.values.clone === undefined) return {}
  const clone = resolve(parsed.values.clone)
  if (!(await stat(clone).catch(() => null))?.isDirectory())
    throw usage('--clone must be a directory')
  return { clone }
}

const lintText = (problems: PacketLintProblem[]) =>
  problems.map((p) => `${p.rule}: ${p.message}\n`).join('')

/** Exit 0 when the packet is clean, 3 when it has problems; a usage error or unreadable dir is 2. */
async function lint(parsed: PacketParsed, io: PacketIo): Promise<number> {
  const [, , dir] = parsed.positionals
  if (dir === undefined || parsed.positionals.length !== 3)
    throw usage('expected: packet lint <dir>')
  const opts = {
    gateHead: gateHead(parsed),
    require: requirements(parsed),
    ...(await lintClone(parsed)),
  }
  const { packetId, problems } = await lintPacketResult(resolve(dir), opts, io.ci ?? ciIo)
  const ok = problems.length === 0
  if (parsed.values.json)
    io.stdout(`${JSON.stringify({ schema: PACKET_LINT_SCHEMA_ID, ok, packetId, problems })}\n`)
  else io.stdout(ok ? 'packet lint: clean\n' : lintText(problems))
  return ok ? EXIT_OK : EXIT_REFUSED
}

/** Writes round.json and frames/frames.json into the packet and prints round.json's path. */
async function round(parsed: PacketParsed, io: PacketIo): Promise<number> {
  const [, , dir] = parsed.positionals
  if (dir === undefined || parsed.positionals.length !== 3)
    throw usage('expected: packet round <dir>')
  const { frames } = await packetRound(resolve(dir))
  io.stderr(
    `${frames.frames.length} frames; next: titan-review packet lint ${dir} --gate-head <sha>`
  )
  io.stdout(`${join(resolve(dir), ROUND_FILE)}\n`)
  return EXIT_OK
}

async function prompt(parsed: PacketParsed, io: PacketIo): Promise<number> {
  if (parsed.positionals.length !== 2) throw usage('expected: packet prompt')
  io.stdout(await readFile(PACKAGER_PROMPT, 'utf8'))
  return EXIT_OK
}

const VERBS: Record<string, (parsed: PacketParsed, io: PacketIo) => Promise<number>> = {
  'from-ci': fromCi,
  lint,
  round,
  prompt,
}

export async function packetCommand(parsed: PacketParsed, io: PacketIo): Promise<number> {
  const name = parsed.positionals[1] ?? ''
  if (!Object.hasOwn(VERBS, name)) throw usage(`expected: packet ${Object.keys(VERBS).join(' | ')}`)
  return VERBS[name](parsed, io)
}
