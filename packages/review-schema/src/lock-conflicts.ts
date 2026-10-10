import type { Lock, Locks } from './locks.ts'

// What a round or dispatch plans to do, checked against the lock registry. `locksProblems` checks
// the registry itself; `lockConflicts` checks a plan against it. Pure: the caller runs git.

export const LOCK_CONFLICT_KINDS = [
  'superseded-state',
  'lock-order',
  're-ask',
  'stale-ship',
] as const

export type LockConflictKind = (typeof LOCK_CONFLICT_KINDS)[number]

/** A colour property in one theme mode. */
export interface ModeToken {
  name: string
  mode: 'light' | 'dark'
}

/** A PR in the round, in the order the round presents and ships it. */
export interface PlannedItem {
  pr: number
  head: string
  /** The commit the item is rendered and measured on: its head, or the head it is stacked on. */
  base: string
  touches: { tokens: ModeToken[] }
}

/** A question that asks for a decision, with the tokens its answer would decide. */
export interface PlannedQuestion {
  id: string
  touches: { tokens: ModeToken[] }
}

/** A Ship answer for a PR at a head, in the order they were recorded. */
export interface RecordedShip {
  pr: number
  head: string
}

export interface LockPlan {
  items: PlannedItem[]
  questions: PlannedQuestion[]
  ships: RecordedShip[]
  /** Whether `commit` has `ancestor` in its history; the caller answers it, for example with git. */
  contains: (commit: string, ancestor: string) => boolean
}

export interface LockConflict {
  kind: LockConflictKind
  /** The lock the conflict is with; null for a stale Ship on a PR that holds no lock. */
  lock: string | null
  /** The offending PRs (`#n`), question ids, lock ids and heads, in the order the message names them. */
  ids: string[]
  tokens: ModeToken[]
  message: string
}

const tokenKey = (t: ModeToken) => `${t.name}/${t.mode}`
const short = (sha: string) => sha.slice(0, 7)

/** The tokens a lock decides: its derived footprint and its declared touches. */
function lockTokens(lock: Lock): Set<string> {
  return new Set([...(lock.footprint?.tokens ?? []), ...(lock.touches?.tokens ?? [])].map(tokenKey))
}

function overlap(tokens: ModeToken[], lock: Lock): ModeToken[] {
  const decided = lockTokens(lock)
  const seen = new Set<string>()
  return tokens.filter((t) => {
    const key = tokenKey(t)
    const hit = decided.has(key) && !seen.has(key)
    seen.add(key)
    return hit
  })
}

function supersededState(item: PlannedItem, lock: Lock, plan: LockPlan): LockConflict[] {
  if (lock.holders.some((h) => h.pr === item.pr)) return []
  const tokens = overlap(item.touches.tokens, lock)
  const missing = lock.holders.filter((h) => !plan.contains(item.base, h.headSha))
  if (tokens.length === 0 || missing.length === 0) return []
  const holders = missing.map((h) => `#${h.pr} at ${short(h.headSha)}`).join(', ')
  return [
    {
      kind: 'superseded-state',
      lock: lock.id,
      ids: [`#${item.pr}`, ...missing.map((h) => `#${h.pr}`)],
      tokens,
      message:
        `#${item.pr} overlaps ${lock.id} (${holders}) on ${tokens.map(tokenKey).join(', ')} ` +
        `but is rendered on a base without it; stack it on the holder or defer it`,
    },
  ]
}

function heldLock(pr: number, locks: Lock[]): Lock | undefined {
  return locks.find((l) => l.status !== 'released' && l.holders.some((h) => h.pr === pr))
}

/** The open locks `lock` comes after that no earlier item in the round holds. */
function unmetAfter(lock: Lock, earlierPrs: Set<number>, locks: Lock[]): Lock[] {
  return lock.after
    .map((id) => locks.find((l) => l.id === id))
    .filter((l): l is Lock => l?.status === 'open')
    .filter((l) => !l.holders.some((h) => earlierPrs.has(h.pr)))
}

function lockOrder(items: PlannedItem[], locks: Lock[]): LockConflict[] {
  return items.flatMap((item, i) => {
    const lock = heldLock(item.pr, locks)
    if (!lock) return []
    const earlier = new Set(items.slice(0, i).map((x) => x.pr))
    return unmetAfter(lock, earlier, locks).map((first) => ({
      kind: 'lock-order' as const,
      lock: lock.id,
      ids: [`#${item.pr}`, lock.id, first.id],
      tokens: [],
      message:
        `#${item.pr} holds ${lock.id}, which comes after ${first.id}, but ${first.id} is open ` +
        `and no earlier item holds it; place its holder first or wait for it to merge`,
    }))
  })
}

function reAsk(question: PlannedQuestion, lock: Lock): LockConflict[] {
  const tokens = overlap(question.touches.tokens, lock)
  if (lock.status === 'released' || tokens.length === 0) return []
  return [
    {
      kind: 're-ask',
      lock: lock.id,
      ids: [question.id],
      tokens,
      message:
        `question ${question.id} asks again what ${lock.id} decided ` +
        `(${tokens.map(tokenKey).join(', ')}); cite the lock instead of asking`,
    },
  ]
}

function staleShip(pr: number, shipped: string, now: string, locks: Lock[], at: string) {
  return {
    kind: 'stale-ship' as const,
    lock: heldLock(pr, locks)?.id ?? null,
    ids: [`#${pr}`, shipped, now],
    tokens: [],
    message:
      `#${pr} was shipped at ${short(shipped)} but ${at} ${short(now)}; ` +
      `a Ship holds for one head, so ask it again at the new head`,
  }
}

/** A Ship at a head other than the PR's prior Ship, and a PR's last Ship off its planned head. */
function staleShips(ships: RecordedShip[], items: PlannedItem[], locks: Lock[]): LockConflict[] {
  const last = new Map<number, string>()
  const moved = ships.flatMap((ship) => {
    const prior = last.get(ship.pr)
    last.set(ship.pr, ship.head)
    if (prior === undefined || prior === ship.head) return []
    return [staleShip(ship.pr, prior, ship.head, locks, 'shipped again at')]
  })
  const behind = items.flatMap((item) => {
    const shipped = last.get(item.pr)
    if (shipped === undefined || shipped === item.head) return []
    return [staleShip(item.pr, shipped, item.head, locks, 'the round plans it at')]
  })
  return [...moved, ...behind]
}

/**
 * The conflicts between a planned round (or dispatch) and the lock registry: an item rendered on
 * a state a lock supersedes, a holder ordered ahead of a lock it comes after, a question asking a
 * decided row again, and a Ship whose head moved or differs from the planned head. Empty when the plan is clear.
 */
export function lockConflicts(registry: Locks, plan: LockPlan): LockConflict[] {
  const open = registry.locks.filter((l) => l.status === 'open')
  return [
    ...plan.items.flatMap((item) => open.flatMap((lock) => supersededState(item, lock, plan))),
    ...lockOrder(plan.items, registry.locks),
    ...plan.questions.flatMap((q) => registry.locks.flatMap((lock) => reAsk(q, lock))),
    ...staleShips(plan.ships, plan.items, registry.locks),
  ]
}
