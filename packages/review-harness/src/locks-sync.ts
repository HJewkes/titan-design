import {
  lockSurface,
  tokenKey,
  tokensMatch,
  type Lock,
  type LockDependent,
  type Locks,
  type LockSurface,
} from '@titan-design/review-schema'
import type { FootprintBody } from './locks-footprint.ts'
import type { LockFootprint } from './locks.ts'

/** The fields of `gh pr view --json` that sync reads. */
export interface PrState {
  state: 'OPEN' | 'CLOSED' | 'MERGED'
  headRefOid: string
  headRefName: string
  baseRefName: string
  mergeCommit: { oid: string } | null
  mergedAt: string | null
}

export const PR_STATE_FIELDS = 'state,headRefOid,headRefName,baseRefName,mergeCommit,mergedAt'

export type HolderEvent = 'merged' | 'closed' | 'new-head' | 'unchanged'

/** A dependent's own diff against a holder's surface. */
export interface DependentOverlap {
  pr: number
  mode: LockDependent['mode']
  files: string[]
  tokens: string[]
  /** Components the dependent edits that read a token the holder moves. */
  readers: string[]
  /** Whether the overlap differs from the one the registry's footprint gives. */
  changed: boolean
}

export interface HolderSync {
  pr: number
  event: HolderEvent
  headSha: string
  /** The head gh reports, when it differs from `headSha`. */
  newHeadSha?: string
  mergeSha?: string
  footprint?: LockFootprint
  dependents?: DependentOverlap[]
}

export interface LockSync {
  lock: string
  status: Lock['status']
  /** The status the holders now give, when it differs. */
  newStatus?: Lock['status']
  mergeSha?: string
  closedAt?: string
  holders: HolderSync[]
  /** Registry edits for a coordinator to make, in words. */
  edits: string[]
  /** Commands for a coordinator to run; sync runs none of them. */
  commands: string[]
  notes: string[]
}

export interface SyncReport {
  repo: string
  locks: LockSync[]
}

/** The derived footprints sync needs: each moved holder head and each of its dependents. */
export interface SyncFootprints {
  holders: Map<number, LockFootprint>
  dependents: Map<number, FootprintBody>
}

export function holderEvent(headSha: string, pr: PrState): HolderEvent {
  if (pr.state === 'MERGED') return 'merged'
  if (pr.state === 'CLOSED') return 'closed'
  return pr.headRefOid === headSha ? 'unchanged' : 'new-head'
}

/** The open locks and the PRs sync reads for them: holders, and dependents of a moved holder. */
export function syncTargets(registry: Locks): { holders: number[]; dependents: number[] } {
  const open = registry.locks.filter((l) => l.status === 'open' && l.holders.length > 0)
  const ids = new Set(open.map((l) => l.id))
  return {
    holders: [...new Set(open.flatMap((l) => l.holders.map((h) => h.pr)))],
    dependents: [...new Set(registry.dependents.filter((d) => ids.has(d.lock)).map((d) => d.pr))],
  }
}

/** Overlap of a dependent's diff with a lock surface: shared files, tokens, edited readers. */
function overlapWith(dep: FootprintBody, surface: LockSurface) {
  const edited = new Set([...dep.files, ...dep.components.direct])
  return {
    files: dep.files.filter((f) => surface.files.includes(f)),
    tokens: dep.tokens.filter((t) => surface.tokens.some((s) => tokensMatch(s, t))).map(tokenKey),
    readers: surface.readers.filter((r) => edited.has(r)),
  }
}

const sameOverlap = (a: ReturnType<typeof overlapWith>, b: ReturnType<typeof overlapWith>) =>
  JSON.stringify(a) === JSON.stringify(b)

function dependentOverlaps(lock: Lock, registry: Locks, fps: SyncFootprints, fp: LockFootprint) {
  const fresh = lockSurface({ footprint: fp })
  const recorded = lockSurface(lock)
  return registry.dependents
    .filter((d) => d.lock === lock.id && fps.dependents.has(d.pr))
    .map((d): DependentOverlap => {
      const dep = fps.dependents.get(d.pr)!
      const now = overlapWith(dep, fresh)
      return {
        pr: d.pr,
        mode: d.mode,
        ...now,
        changed: !sameOverlap(now, overlapWith(dep, recorded)),
      }
    })
}

function holderSync(lock: Lock, registry: Locks, prs: Map<number, PrState>, fps: SyncFootprints) {
  return lock.holders.map((h): HolderSync => {
    const pr = prs.get(h.pr)!
    const event = holderEvent(h.headSha, pr)
    const base: HolderSync = { pr: h.pr, event, headSha: h.headSha }
    if (event === 'merged') return { ...base, mergeSha: pr.mergeCommit?.oid }
    if (event !== 'new-head') return base
    const footprint = fps.holders.get(h.pr)
    return {
      ...base,
      newHeadSha: pr.headRefOid,
      ...(footprint && {
        footprint,
        dependents: dependentOverlaps(lock, registry, fps, footprint),
      }),
    }
  })
}

/** Every holder merged or closed ends the lock: merged if any merged, released if none did. */
function settledStatus(holders: HolderSync[]): Lock['status'] | undefined {
  if (!holders.every((h) => h.event === 'merged' || h.event === 'closed')) return undefined
  return holders.some((h) => h.event === 'merged') ? 'merged' : 'released'
}

function lastMerge(lock: Lock, prs: Map<number, PrState>) {
  const merged = lock.holders
    .map((h) => prs.get(h.pr)!)
    .filter((p) => p.state === 'MERGED' && p.mergedAt)
    .sort((a, b) => a.mergedAt!.localeCompare(b.mergedAt!))
  return merged.at(-1)
}

export interface SyncInput {
  registry: Locks
  repo: string
  prs: Map<number, PrState>
  footprints: SyncFootprints
}

/** What gh says changed for every open, held lock, and what a coordinator would do about it. */
export function planSync({ registry, repo, prs, footprints }: SyncInput): SyncReport {
  const open = registry.locks.filter((l) => l.status === 'open' && l.holders.length > 0)
  return { repo, locks: open.map((lock) => lockSync(lock, { registry, repo, prs, footprints })) }
}

function lockSync(lock: Lock, input: SyncInput): LockSync {
  const holders = holderSync(lock, input.registry, input.prs, input.footprints)
  const newStatus = settledStatus(holders)
  const last = newStatus === 'merged' ? lastMerge(lock, input.prs) : undefined
  const sync: LockSync = {
    lock: lock.id,
    status: lock.status,
    ...(newStatus && { newStatus }),
    ...(last?.mergeCommit && { mergeSha: last.mergeCommit.oid }),
    ...(last?.mergedAt && { closedAt: last.mergedAt }),
    holders,
    edits: [],
    commands: [],
    notes: [],
  }
  holderEdits(sync)
  if (newStatus) settleDependents(sync, lock, input)
  return sync
}

const short = (sha: string) => sha.slice(0, 7)

function holderEdits(sync: LockSync): void {
  for (const h of sync.holders) {
    if (h.event === 'new-head')
      sync.edits.push(
        `${sync.lock} holder #${h.pr}: headSha ${short(h.headSha)} -> ${short(h.newHeadSha!)}` +
          (h.footprint ? ', footprint as re-derived below' : '')
      )
    if (h.event === 'closed') sync.notes.push(`holder #${h.pr} was closed without merging`)
  }
  if (sync.newStatus === 'merged')
    sync.edits.push(
      `${sync.lock}: status open -> merged, mergeSha ${sync.mergeSha}, closedAt ${sync.closedAt}`
    )
  if (sync.newStatus === 'released')
    sync.edits.push(`${sync.lock}: status open -> released (every holder closed unmerged)`)
}

function settleDependents(sync: LockSync, lock: Lock, { registry, repo, prs }: SyncInput): void {
  const holderBranches = new Map(
    lock.holders.map((h) => [prs.get(h.pr)!.headRefName, prs.get(h.pr)!])
  )
  for (const dep of registry.dependents.filter((d) => d.lock === lock.id)) {
    const state = prs.get(dep.pr)
    if (!state || state.state !== 'OPEN') {
      sync.notes.push(`dependent #${dep.pr} is no longer open`)
      continue
    }
    sync.edits.push(`${sync.lock}: drop dependent #${dep.pr} (${dep.mode}) once it is settled`)
    if (dep.mode === 'defer') {
      sync.notes.push(`#${dep.pr} was deferred on ${sync.lock} and re-enters`)
      continue
    }
    stackedDependent(sync, dep.pr, holderBranches.get(state.baseRefName), repo)
  }
}

/**
 * A dependent still based on a merged holder's branch is retargeted to the branch the holder
 * merged into, and its Shepherd hold released. One stacked on a closed holder needs a rebase
 * first, which only its seat can do, so both commands become a note.
 */
function stackedDependent(sync: LockSync, pr: number, holder: PrState | undefined, repo: string) {
  const retarget = holder ? [`gh pr edit ${pr} --base ${holder.baseRefName}`] : []
  const release = `titan-factory shepherd release ${repo}#${pr}`
  if (sync.newStatus === 'merged') {
    sync.commands.push(...retarget, release)
    return
  }
  const rebase = holder ? `rebase it onto ${holder.baseRefName}, then run ` : 'then run '
  sync.notes.push(
    `#${pr} is stacked on a closed holder: ${rebase}${[...retarget, release].join(' and ')}`
  )
}

function holderLines(h: HolderSync): string[] {
  if (h.event === 'unchanged') return [`  #${h.pr}: unchanged at ${short(h.headSha)}`]
  if (h.event === 'merged') return [`  #${h.pr}: merged as ${h.mergeSha ?? '(no merge commit)'}`]
  if (h.event === 'closed') return [`  #${h.pr}: closed without merging`]
  const lines = [`  #${h.pr}: new head ${short(h.headSha)} -> ${short(h.newHeadSha!)}`]
  if (h.footprint) lines.push(...footprintLines(h.footprint), ...overlapLines(h.dependents ?? []))
  return lines
}

function footprintLines(fp: LockFootprint): string[] {
  const tokens = fp.tokens.map(tokenKey).join(', ') || 'none'
  return [
    `    footprint at ${short(fp.derivedFrom.headSha)} (merge-base ${short(fp.derivedFrom.mainSha)}):`,
    `      tokens: ${tokens}`,
    `      files: ${fp.files.length}, direct: ${fp.components.direct.length}, ` +
      `readers: ${fp.components.readers.length}, renders: ${fp.components.rendersCount}`,
  ]
}

function overlapLines(deps: DependentOverlap[]): string[] {
  return deps.map((d) => {
    const parts = [
      d.tokens.length ? `tokens ${d.tokens.join(', ')}` : '',
      d.files.length ? `files ${d.files.join(', ')}` : '',
      d.readers.length ? `readers ${d.readers.join(', ')}` : '',
    ].filter(Boolean)
    const what = parts.length ? `overlaps on ${parts.join('; ')}` : 'no longer overlaps'
    return `    dependent #${d.pr} (${d.mode}) ${what}${d.changed ? ' [changed]' : ''}`
  })
}

/** The human report: per lock, what changed, the registry edits and the commands, unrun. */
export function formatSync(report: SyncReport): string {
  if (report.locks.length === 0) return 'No open lock has a holder; nothing to sync.\n'
  const blocks = report.locks.map((l) => {
    const status = l.newStatus ? `${l.status} -> ${l.newStatus}` : l.status
    const lines = [`${l.lock} (${status})`, ...l.holders.flatMap(holderLines)]
    lines.push(...l.notes.map((n) => `  note: ${n}`))
    lines.push(...l.edits.map((e) => `  edit: ${e}`))
    lines.push(...l.commands.map((c) => `  run: ${c}`))
    return lines.join('\n')
  })
  const commands = report.locks.flatMap((l) => l.commands)
  const tail = commands.length
    ? `\nCommands (not run):\n${commands.join('\n')}\n`
    : '\nNo commands to run.\n'
  return `${blocks.join('\n\n')}\n${tail}`
}
