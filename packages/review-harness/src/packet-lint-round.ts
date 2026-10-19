// The draft and the round in a packet directory: both bound to the gate's head, and round.json the
// build of the packet's own draft. Pure: packet-lint reads the files and passes their JSON in.
import { isDeepStrictEqual } from 'node:util'
import type { ManifestInput } from '@titan-design/review-schema'
import { ROUND_FILE } from './build.ts'
import type { CiPacket } from './packet.ts'
import { packetUnit } from './packet-draft.ts'
import { applyRoundRules } from './round-rules.ts'

type Problem<R extends string> = { rule: R; message: string }
type JsonObject = Record<string, unknown>

const isObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const objects = (value: unknown): JsonObject[] =>
  Array.isArray(value) ? value.filter(isObject) : []

/** Each merge-bound question's `merge`, as written. */
const merges = (manifest: unknown): JsonObject[] =>
  objects(isObject(manifest) ? manifest.questions : undefined).flatMap((q) =>
    isObject(q.merge) ? [q.merge] : []
  )

/** draft.json must bind its Ship question to this packet's PR at the gate's head. */
export function draftHeadProblems(
  draft: unknown,
  packet: CiPacket,
  gateHead: string
): Problem<'draft-head'>[] {
  const bound = merges(draft)
  if (!bound.length)
    return [{ rule: 'draft-head', message: 'draft.json has no merge-bound Ship question' }]
  return bound
    .filter((m) => m.repo !== packet.repo || m.pr !== packet.pr || m.headSha !== gateHead)
    .map((m) => ({
      rule: 'draft-head',
      message: `draft.json binds Ship to ${String(m.repo)}#${String(m.pr)} at ${String(m.headSha)}; the gate is on ${packet.repo}#${packet.pr} at ${gateHead}`,
    }))
}

/** What `build` would write for the draft, minus its provenance; undefined when it cannot. */
function built(draft: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(applyRoundRules(draft as ManifestInput)))
  } catch {
    return undefined
  }
}

function headProblems(round: JsonObject, gateHead: string): Problem<'round-head'>[] {
  const heads = [
    ...objects(round.prGroups).map((g) => ['a PR group', g.headSha] as const),
    ...merges(round).map((m) => ['a Ship question', m.headSha] as const),
  ]
  return heads
    .filter(([, head]) => head !== gateHead)
    .map(([what, head]) => ({
      rule: 'round-head',
      message: `${ROUND_FILE} has ${what} at ${String(head)}; the gate is on ${gateHead}`,
    }))
}

type RoundRule = 'round-unit' | 'round-draft' | 'round-head'

/** Every way round.json is not the build of `draft` for the packet at the gate's head. */
export function roundProblems(
  round: unknown,
  draft: unknown,
  packet: CiPacket,
  gateHead: string
): Problem<RoundRule>[] {
  if (!isObject(round))
    return [{ rule: 'round-draft', message: `${ROUND_FILE} is not a JSON object` }]
  const problems: Problem<RoundRule>[] = []
  const unit = packetUnit(packet.repo, packet.pr, packet.headSha)
  if (round.unit !== unit)
    problems.push({ rule: 'round-unit', message: `${ROUND_FILE} unit is not ${unit}` })
  const unbuilt = { ...round }
  delete unbuilt.build
  if (!isDeepStrictEqual(unbuilt, built(draft)))
    problems.push({
      rule: 'round-draft',
      message: `${ROUND_FILE} without its build is not the round rules applied to draft.json`,
    })
  return [...problems, ...headProblems(round, gateHead)]
}
