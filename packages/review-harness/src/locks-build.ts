import {
  LOCK_CONFLICT_KINDS,
  lockConflicts,
  lockSurface,
  lockedTokens,
  tokenKey,
  type Lock,
  type Locks,
  type ManifestInput,
  type ModeToken,
  type PlannedItem,
  type PlannedQuestion,
  type RecordedShip,
} from '@titan-design/review-schema'
import type { TreeGit } from './build.ts'
import { MAIN_REF } from './harness-freshness.ts'
import {
  lockFootprint,
  locksIo,
  readRegistry,
  type FootprintOptions,
  type LockFootprint,
} from './locks.ts'
import { normalizeAnswer } from './round.ts'
import { explicitPrs, sectionPr } from './sections.ts'
import type { PriorRound } from './ship-gate.ts'

// What `build --locks` adds to the builder: the draft read as a lock plan (TD-810). The pure
// checks are `lockConflicts` in review-schema; this module derives the plan from the draft and
// each PR head's footprint, adds the one check that needs the Storybook tree (`lock-head-missing`),
// orders lock-holder groups first and labels the frames that render under a decided lock.

type Draft = ManifestInput
type DraftQuestion = Draft['questions'][number]
type DraftSection = NonNullable<Draft['sections']>[number]

export const LOCK_BUILD_RULES = [...LOCK_CONFLICT_KINDS, 'lock-head-missing'] as const
export type LockBuildRule = (typeof LOCK_BUILD_RULES)[number]

export interface LockProblem {
  rule: LockBuildRule
  message: string
}

/** A PR the draft presents: its group key, head, and the commit its frames render on. */
export interface DraftItem {
  key: string
  pr: number
  head: string
  base: string
  /** The holder head the group is stacked on, when it is. */
  stackedOn?: string
}

/** What an item's head changes, as far as the lock checks read it. */
export type ItemFootprint = Pick<LockFootprint, 'tokens' | 'files'>

/** Reads a head's footprint; the real one runs git in the tree, tests supply a table. */
export type FootprintReader = (opts: FootprintOptions) => Promise<LockFootprint>

/** An item's overlap with an open lock it does not hold: locked tokens it edits, readers it edits. */
export interface LockOverlap {
  item: DraftItem
  lock: Lock
  tokens: ModeToken[]
  files: string[]
}

export interface LockBuild {
  /** The draft with holder groups first and render overlaps labelled; applying it twice changes nothing. */
  rule: (draft: Draft) => Draft
  /** Every lock problem of the ruled draft against the tree at `mergeSha`; empty when clear. */
  problems: (mergeSha: string | undefined) => Promise<LockProblem[]>
  /** Questions the checks could not read, one line each. */
  warnings: string[]
}

const prNumber = (key: string) => Number(key.slice(key.lastIndexOf('#') + 1))
const short = (sha: string) => sha.slice(0, 7)
const isShip = (q: DraftQuestion) => q.kind === 'pick-one' && q.merge !== undefined

/** Each PR the draft holds once: its PR groups, then any Ship-bound PR without a group. */
export function draftItems(draft: Draft): DraftItem[] {
  const items = new Map<string, DraftItem>()
  for (const g of draft.prGroups ?? [])
    items.set(g.pr, {
      key: g.pr,
      pr: prNumber(g.pr),
      head: g.headSha,
      base: g.stackedOn?.headSha ?? g.headSha,
      ...(g.stackedOn && { stackedOn: g.stackedOn.headSha }),
    })
  for (const q of draft.questions) {
    if (q.kind !== 'pick-one' || !q.merge) continue
    const key = `${q.merge.repo}#${q.merge.pr}`
    if (!items.has(key))
      items.set(key, { key, pr: q.merge.pr, head: q.merge.headSha, base: q.merge.headSha })
  }
  return [...items.values()]
}

/** The PR each section is about, by section id, as the builder rules read it. */
function sectionPrs(draft: Draft): Map<string, string | undefined> {
  const byId = new Map(draft.questions.map((q) => [q.id, q]))
  const known = draft.questions.flatMap((q) => q.page ?? [])
  const explicit = explicitPrs(draft.prGroups)
  return new Map(
    (draft.sections ?? []).map((s) => [s.id, sectionPr(s, byId, known, explicit)] as const)
  )
}

/** Items in the order the draft presents them: by first section; an item with none last. */
export function presentedItems(draft: Draft, items: DraftItem[]): DraftItem[] {
  const prs = sectionPrs(draft)
  const order = (draft.sections ?? []).map((s) => prs.get(s.id))
  const at = (item: DraftItem) => {
    const i = order.findIndex((pr) => pr === item.key || pr === `#${item.pr}`)
    return i < 0 ? order.length : i
  }
  return [...items].sort((a, b) => at(a) - at(b))
}

/** One footprint per item, read from the tree against `origin/main` (or the holder head it stacks on). */
export async function itemFootprints(
  items: DraftItem[],
  tree: string,
  read: FootprintReader
): Promise<Map<string, ItemFootprint>> {
  const out = new Map<string, ItemFootprint>()
  for (const item of items) {
    const stackedOn = item.stackedOn ? [item.stackedOn] : []
    const fp = await read({ base: MAIN_REF, head: item.head, repo: tree, stackedOn })
    out.set(item.key, { tokens: fp.tokens, files: fp.files })
  }
  return out
}

/** The tokens a question's answer decides, when it says. */
const touchedTokens = (q: DraftQuestion): ModeToken[] => q.touches?.tokens ?? []

/** An item's tokens: those its head changes, plus those the questions on its page declare. */
function itemTokens(item: DraftItem, footprints: Map<string, ItemFootprint>, draft: Draft) {
  const own = footprints.get(item.key)?.tokens ?? []
  const declared = draft.questions.filter((q) => q.page === item.key).flatMap(touchedTokens)
  return [...own, ...declared]
}

/** Questions on no PR page that declare what they decide; a Ship question is its PR's. */
function plannedQuestions(draft: Draft): PlannedQuestion[] {
  return draft.questions
    .filter((q) => !q.page && !isShip(q) && q.touches)
    .map((q) => ({ id: q.id, touches: { tokens: touchedTokens(q) } }))
}

/** A non-PR question that decides something and declares no touches is unchecked, not refused. */
export function touchWarnings(draft: Draft): string[] {
  return draft.questions
    .filter((q) => !q.page && !isShip(q) && q.kind !== 'text' && !q.touches)
    .map(
      (q) =>
        `question ${q.id} is on no PR page and declares no touches, so it is not checked against the locks`
    )
}

/**
 * The Ships the plan records for the PRs the draft holds: each prior round's Ship answers in
 * round order, then the draft's own Ship asks, so a re-ask at the planned head is current.
 */
export function recordedShips(
  draft: Draft,
  priors: PriorRound[],
  items: DraftItem[]
): RecordedShip[] {
  const held = new Set(items.map((i) => i.key))
  const prior = [...priors]
    .sort((a, b) => a.manifest.round - b.manifest.round)
    .flatMap((p) => {
      const answers = new Map(p.feedback.answers.map((a) => [a.questionId, a]))
      return p.manifest.questions.flatMap((q) => {
        const given = answers.get(q.id)
        if (q.kind !== 'pick-one' || !q.merge || !given) return []
        const pick = normalizeAnswer(q, given).pick
        const shipped = pick !== undefined && q.merge.ship.includes(pick)
        return shipped && held.has(`${q.merge.repo}#${q.merge.pr}`)
          ? [{ pr: q.merge.pr, head: q.merge.headSha }]
          : []
      })
    })
  const asked = draft.questions.flatMap((q) =>
    q.kind === 'pick-one' && q.merge ? [{ pr: q.merge.pr, head: q.merge.headSha }] : []
  )
  return [...prior, ...asked]
}

/** The ids of every lock `lock` comes after, transitively: the decisions it is downstream of. */
function upstreamIds(lock: Lock, locks: Lock[]): Set<string> {
  const seen = new Set<string>()
  const queue = [...lock.after]
  while (queue.length) {
    const id = queue.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    queue.push(...(locks.find((l) => l.id === id)?.after ?? []))
  }
  return seen
}

/**
 * Whether `lock` binds the item: not one it holds, and not one downstream (by `after`) of a lock
 * it holds, since a holder is rendered before the decisions that come after its own.
 */
function binds(lock: Lock, item: DraftItem, locks: Lock[]): boolean {
  const held = locks.filter((l) => l.holders.some((h) => h.pr === item.pr))
  if (held.includes(lock)) return false
  const upstream = upstreamIds(lock, locks)
  return !held.some((h) => upstream.has(h.id))
}

/** Each item's overlap with every open lock that binds it, where there is one. */
export function lockOverlaps(
  items: DraftItem[],
  footprints: Map<string, ItemFootprint>,
  draft: Draft,
  registry: Locks
): LockOverlap[] {
  const open = registry.locks.filter((l) => l.status === 'open')
  return items.flatMap((item) =>
    open
      .filter((lock) => binds(lock, item, registry.locks))
      .flatMap((lock) => {
        const surface = lockSurface(lock)
        const edited = new Set([...surface.files, ...surface.readers])
        const tokens = lockedTokens(itemTokens(item, footprints, draft), lock)
        const files = (footprints.get(item.key)?.files ?? []).filter((f) => edited.has(f))
        return tokens.length + files.length ? [{ item, lock, tokens, files }] : []
      })
  )
}

/** Open locks in `after` order (a lock after its predecessors), then each one's holder PRs once. */
export function holderPrs(registry: Locks): number[] {
  const open = registry.locks.filter((l) => l.status === 'open')
  const placed: Lock[] = []
  const visit = (lock: Lock) => {
    if (placed.includes(lock)) return
    for (const id of lock.after) {
      const earlier = open.find((l) => l.id === id)
      if (earlier) visit(earlier)
    }
    placed.push(lock)
  }
  open.forEach(visit)
  return [...new Set(placed.flatMap((l) => l.holders.map((h) => h.pr)))]
}

/** Whether a section's PR key names a holder of the registry's repo (or any repo when it has none). */
function holderIndex(key: string | undefined, holders: number[], repo: string | undefined) {
  if (!key) return -1
  const hash = key.lastIndexOf('#')
  const named = key.slice(0, hash)
  if (repo !== undefined && named !== '' && named !== repo) return -1
  return holders.indexOf(Number(key.slice(hash + 1)))
}

/** Sections about a lock holder first, in lock order, each group whole; the rest keep their order. */
export function orderHolderGroups(draft: Draft, registry: Locks): Draft {
  if (!draft.sections) return draft
  const holders = holderPrs(registry)
  const prs = sectionPrs(draft)
  const rank = (s: DraftSection) => holderIndex(prs.get(s.id), holders, registry.repo)
  const held = draft.sections.filter((s) => rank(s) >= 0).sort((a, b) => rank(a) - rank(b))
  const rest = draft.sections.filter((s) => rank(s) < 0)
  return { ...draft, sections: [...held, ...rest] }
}

/** `rendered with decided #n: ` on every frame of an overlapping item's sections. */
export function labelRenderFrames(draft: Draft, overlaps: LockOverlap[]): Draft {
  const prs = sectionPrs(draft)
  const prefixes = new Map<string, string>()
  for (const item of new Set(overlaps.map((o) => o.item))) {
    const holders = overlaps
      .filter((o) => o.item === item)
      .flatMap((o) => o.lock.holders.map((h) => h.pr))
    const decided = [...new Set(holders)].sort((a, b) => a - b)
    if (!decided.length) continue
    const prefix = `rendered with decided ${decided.map((n) => `#${n}`).join(', ')}: `
    for (const s of draft.sections ?? [])
      if (prs.get(s.id) === item.key)
        for (const key of s.variantKeys ?? []) prefixes.set(key, prefix)
  }
  const variants = draft.variants.map((v) => {
    const prefix = prefixes.get(v.key)
    return prefix && !v.label.startsWith(prefix) ? { ...v, label: prefix + v.label } : v
  })
  return { ...draft, variants }
}

/** `contains(commit, ancestor)` answered ahead of time, for each item base and each holder head. */
async function containsTable(
  items: DraftItem[],
  registry: Locks,
  tree: string | undefined,
  git: TreeGit
): Promise<(commit: string, ancestor: string) => boolean> {
  const heads = registry.locks
    .filter((l) => l.status === 'open')
    .flatMap((l) => l.holders.map((h) => h.headSha))
  const known = new Map<string, boolean>()
  for (const item of items)
    for (const head of new Set(heads))
      if (item.base !== head && tree !== undefined)
        known.set(`${item.base} ${head}`, await git.isAncestor(tree, head, item.base))
  return (commit, ancestor) => commit === ancestor || (known.get(`${commit} ${ancestor}`) ?? false)
}

function overlapText(o: LockOverlap): string {
  return [
    o.tokens.length ? `tokens ${o.tokens.map(tokenKey).join(', ')}` : '',
    o.files.length ? `files ${o.files.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('; ')
}

/** Each overlapping lock's holder head that the Storybook tree does not contain. */
async function headMissing(
  overlaps: LockOverlap[],
  tree: string | undefined,
  mergeSha: string | undefined,
  git: TreeGit
): Promise<LockProblem[]> {
  const out: LockProblem[] = []
  for (const o of overlaps)
    for (const h of o.lock.holders) {
      const inTree =
        tree !== undefined &&
        mergeSha !== undefined &&
        (await git.isAncestor(tree, h.headSha, mergeSha))
      if (inTree) continue
      out.push({
        rule: 'lock-head-missing',
        message:
          `#${o.item.pr} overlaps ${o.lock.id} on ${overlapText(o)}, but its holder #${h.pr} at ` +
          `${short(h.headSha)} is not in the tree${mergeSha ? ` at HEAD ${short(mergeSha)}` : ''}; ` +
          'build the Storybook from a tree that contains it, or defer the item',
      })
    }
  return out
}

interface LockBuildInput {
  draft: Draft
  registryPath: string
  tree: string | undefined
  priors: PriorRound[]
  git: TreeGit
  footprint?: FootprintReader
}

/**
 * Reads the registry and every item's footprint, then gives the builder its lock rule and its
 * checks. Refuses (as lines) a draft that holds a PR without `--tree`, since a footprint and the
 * ancestor test both read the tree.
 */
export async function prepareLockBuild(
  input: LockBuildInput
): Promise<LockBuild | { refusal: string[] }> {
  const { draft, tree, git } = input
  const registry = await readRegistry(input.registryPath)
  const items = draftItems(draft)
  if (items.length && tree === undefined)
    return { refusal: ['--locks reads each PR head in the tree; pass --tree <path>'] }
  const read = input.footprint ?? ((opts) => lockFootprint(opts, locksIo))
  const footprints = tree
    ? await itemFootprints(items, tree, read)
    : new Map<string, ItemFootprint>()
  const overlaps = lockOverlaps(items, footprints, draft, registry)
  const rule = (d: Draft) => labelRenderFrames(orderHolderGroups(d, registry), overlaps)
  const problems = async (mergeSha: string | undefined) => {
    const ordered = presentedItems(rule(draft), items)
    const plan = {
      items: ordered.map(
        (i): PlannedItem => ({ ...i, touches: { tokens: itemTokens(i, footprints, draft) } })
      ),
      questions: plannedQuestions(draft),
      ships: recordedShips(draft, input.priors, items),
      contains: await containsTable(items, registry, tree, git),
    }
    const conflicts = lockConflicts(registry, plan).map(
      (c): LockProblem => ({ rule: c.kind, message: c.message })
    )
    return [...conflicts, ...(await headMissing(overlaps, tree, mergeSha, git))]
  }
  return { rule, problems, warnings: touchWarnings(draft) }
}
