import {
  globRegExp,
  lockSurface,
  tokenKey,
  tokensMatch,
  type Lock,
  type Locks,
  type ModeToken,
} from '@titan-design/review-schema'

/** What a task about to be dispatched plans to change: paths or globs, and tokens. */
export interface PlannedWork {
  files: string[]
  tokens: ModeToken[]
}

export interface LockHit {
  lock: string
  title?: string
  files: string[]
  tokens: string[]
}

export type CheckVerdict = 'clear' | 'stack-on' | 'defer'

export const CHECK_EXIT: Record<CheckVerdict, number> = { clear: 0, 'stack-on': 10, defer: 11 }

export interface CheckResult {
  verdict: CheckVerdict
  /** The holder to branch from, for `stack-on`. */
  holder?: { pr: number; headSha: string; branch?: string }
  conflicts: LockHit[]
  /** Open locks the plan only renders under: it edits a component that reads a locked token. */
  renders: LockHit[]
  advisory: string
}

function matchFiles(globs: string[], paths: string[]): string[] {
  const res = globs.map(globRegExp)
  return paths.filter((p) => res.some((re) => re.test(p)))
}

function lockHits(lock: Lock, plan: PlannedWork) {
  const surface = lockSurface(lock)
  const tokens = plan.tokens.filter((t) => surface.tokens.some((l) => tokensMatch(l, t)))
  const base = { lock: lock.id, ...(lock.title && { title: lock.title }) }
  return {
    conflict: {
      ...base,
      files: matchFiles(plan.files, surface.files),
      tokens: tokens.map(tokenKey),
    },
    render: { ...base, files: matchFiles(plan.files, surface.readers), tokens: [] },
  }
}

const hasOverlap = (hit: LockHit) => hit.files.length + hit.tokens.length > 0

/**
 * Checks a plan against every open lock. A plan that edits a locked file or token stacks on the
 * lock's holder (exit 10) when every lock it hits shares one holder PR, and defers (exit 11)
 * otherwise: a lock with no holder is a decision only, which must not be re-asked.
 */
export function checkPlan(registry: Locks, plan: PlannedWork): CheckResult {
  const open = registry.locks.filter((l) => l.status === 'open')
  const hits = open.map((lock) => ({ lock, ...lockHits(lock, plan) }))
  const conflicting = hits.filter((h) => hasOverlap(h.conflict))
  const conflicts = conflicting.map((h) => h.conflict)
  const renders = hits.filter((h) => !hasOverlap(h.conflict) && hasOverlap(h.render))
  const result = { conflicts, renders: renders.map((h) => h.render) }
  if (conflicting.length === 0)
    return { verdict: 'clear', ...result, advisory: clearAdvice(renders) }
  const holderPrs = new Set(conflicting.flatMap((h) => h.lock.holders.map((x) => x.pr)))
  const everyHeld = conflicting.every((h) => h.lock.holders.length > 0)
  if (everyHeld && holderPrs.size === 1) {
    const holder = conflicting[0]!.lock.holders[0]!
    return { verdict: 'stack-on', holder, ...result, advisory: stackAdvice(holder, conflicts) }
  }
  return {
    verdict: 'defer',
    ...result,
    advisory: deferAdvice(
      conflicting.map((h) => h.lock),
      conflicts
    ),
  }
}

const short = (sha: string) => sha.slice(0, 7)

function overlapText(hits: LockHit[]): string {
  return hits
    .map((h) => {
      const parts = [
        h.tokens.length ? `tokens ${h.tokens.join(', ')}` : '',
        h.files.length ? `files ${h.files.join(', ')}` : '',
      ].filter(Boolean)
      return `${h.lock} on ${parts.join('; ')}`
    })
    .join('. ')
}

function clearAdvice(renders: { lock: Lock; render: LockHit }[]): string {
  const lines = ['Clear: no open lock covers these files or tokens.']
  for (const { lock, render } of renders) {
    const heads = lock.holders.map((h) => `#${h.pr} at ${short(h.headSha)}`).join(', ')
    lines.push(
      `Renders under ${lock.id}${heads ? ` (${heads})` : ''}: ${render.files.join(', ')} ` +
        `read a locked token; review frames on a tree that contains the holder head.`
    )
  }
  return lines.join('\n')
}

function stackAdvice(holder: CheckResult['holder'] & object, conflicts: LockHit[]): string {
  const locks = conflicts.map((c) => c.lock).join(', ')
  const ref = holder.branch ?? `refs/pull/${holder.pr}/head`
  return (
    `Stack on #${holder.pr} (branch ${ref}, lock ${locks}): branch from ${ref} at ` +
    `${short(holder.headSha)} and open the PR with --base ${holder.branch ?? '<holder branch>'}; ` +
    `it retargets to main when #${holder.pr} merges. Overlap: ${overlapText(conflicts)}.`
  )
}

function deferAdvice(locks: Lock[], conflicts: LockHit[]): string {
  const ids = locks.map((l) => l.id).join(', ')
  const decisionOnly = locks.filter((l) => l.holders.length === 0).map((l) => l.id)
  const held = locks.filter((l) => l.holders.length > 0)
  const lines = [`Defer (lock ${ids}): park this task with blocked-by: ${ids}.`]
  if (decisionOnly.length)
    lines.push(
      `${decisionOnly.join(', ')} ${decisionOnly.length > 1 ? 'are' : 'is'} decided with no ` +
        `holder PR: do not re-ask the decision. ` +
        `If this task implements it, file it as the holder of ${decisionOnly.join(', ')} instead.`
    )
  const holders = held.flatMap((l) => l.holders.map((h) => `#${h.pr} (${l.id})`))
  if (new Set(held.flatMap((l) => l.holders.map((h) => h.pr))).size > 1)
    lines.push(`Held by ${holders.join(', ')}; one task cannot stack on more than one holder.`)
  else if (held.length)
    lines.push(`Also held by ${holders.join(', ')}; stack on it when this task is picked up.`)
  lines.push(`Overlap: ${overlapText(conflicts)}.`)
  return lines.join('\n')
}
