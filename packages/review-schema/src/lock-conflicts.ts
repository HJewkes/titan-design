import { lockedTokens, tokenKey, type ModeToken } from './lock-surface.ts'
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
  /** Whether `commit` has `ancestor` in its history; the caller answers it, e.g. with git. */
  contains: (commit: string, ancestor: string) => boolean
}

export interface LockConflict {
  kind: LockConflictKind
  /**
   * The lock the conflict is with. A stale Ship names the first lock its PR holds, or null when
   * it holds none.
   */
  lock: string | null
  /**
   * The offending PRs (`#n`), question ids, lock ids and heads, in message order; a stale Ship
   * then lists every lock its PR holds.
   */
  ids: string[]
  tokens: ModeToken[]
  message: string
}

const short = (sha: string) => sha.slice(0, 7)

function supersededState(item: PlannedItem, lock: Lock, plan: LockPlan): LockConflict[] {
  if (lock.holders.some((h) => h.pr === item.pr)) return []
  const tokens = lockedTokens(item.touches.tokens, lock)
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

/** What the plan and registry say about one PR: every lock it holds and its Ships in order. */
interface PrView {
  locks: Lock[]
  shipHeads: string[]
  plannedHead: string | undefined
}

function prViews(registry: Locks, plan: LockPlan): Map<number, PrView> {
  const prs = new Set([...plan.items, ...plan.ships].map((x) => x.pr))
  const live = registry.locks.filter((l) => l.status !== 'released')
  return new Map(
    [...prs].map((pr) => [
      pr,
      {
        locks: live.filter((l) => l.holders.some((h) => h.pr === pr)),
        shipHeads: plan.ships.filter((s) => s.pr === pr).map((s) => s.head),
        plannedHead: plan.items.find((i) => i.pr === pr)?.head,
      },
    ])
  )
}

/** The open locks `lock` comes after that no item up to and including this one holds. */
function unmetAfter(lock: Lock, placedPrs: Set<number>, locks: Lock[]): Lock[] {
  return lock.after
    .map((id) => locks.find((l) => l.id === id))
    .filter((l): l is Lock => l?.status === 'open')
    .filter((l) => !l.holders.some((h) => placedPrs.has(h.pr)))
}

function lockOrder(
  items: PlannedItem[],
  locks: Lock[],
  views: Map<number, PrView>
): LockConflict[] {
  return items.flatMap((item, i) => {
    const placed = new Set(items.slice(0, i + 1).map((x) => x.pr))
    const held = views.get(item.pr)!.locks.filter((l) => l.status === 'open')
    return held.flatMap((lock) =>
      unmetAfter(lock, placed, locks).map((first) => ({
        kind: 'lock-order' as const,
        lock: lock.id,
        ids: [`#${item.pr}`, lock.id, first.id],
        tokens: [],
        message:
          `#${item.pr} holds ${lock.id}, which comes after ${first.id}, but ${first.id} is open ` +
          `and no earlier item holds it; place its holder first or wait for it to merge`,
      }))
    )
  })
}

function reAsk(question: PlannedQuestion, lock: Lock): LockConflict[] {
  const tokens = lockedTokens(question.touches.tokens, lock)
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

function staleShip(pr: number, view: PrView, before: string, after: string, how: string) {
  const lockIds = view.locks.map((l) => l.id)
  return {
    kind: 'stale-ship' as const,
    lock: lockIds[0] ?? null,
    ids: [`#${pr}`, before, after, ...lockIds],
    tokens: [],
    message:
      `#${pr} was shipped at ${short(before)} ${how} ${short(after)}; ` +
      `a Ship holds for one head, so ask it again at that head`,
  }
}

/**
 * At most one per PR, judged on its last Ship: against its planned item's head when the round
 * holds the PR, else against the PR's prior Ship.
 */
function staleShips(views: Map<number, PrView>): LockConflict[] {
  return [...views].flatMap(([pr, view]) => {
    const last = view.shipHeads.at(-1)
    const prior = view.shipHeads.at(-2)
    if (last === undefined) return []
    if (view.plannedHead !== undefined)
      return view.plannedHead === last
        ? []
        : [staleShip(pr, view, last, view.plannedHead, 'but the round plans')]
    return prior === undefined || prior === last
      ? []
      : [staleShip(pr, view, prior, last, 'and again at')]
  })
}

/**
 * The conflicts between a planned round (or dispatch) and the lock registry: an item rendered on
 * a state a lock supersedes, a holder ordered ahead of a lock it comes after, a question asking a
 * decided row again, and a PR's last Ship at a head other than the planned one. Empty when the
 * plan is clear.
 */
export function lockConflicts(registry: Locks, plan: LockPlan): LockConflict[] {
  const open = registry.locks.filter((l) => l.status === 'open')
  const views = prViews(registry, plan)
  return [
    ...plan.items.flatMap((item) => open.flatMap((lock) => supersededState(item, lock, plan))),
    ...lockOrder(plan.items, registry.locks, views),
    ...plan.questions.flatMap((q) => registry.locks.flatMap((lock) => reAsk(q, lock))),
    ...staleShips(views),
  ]
}
