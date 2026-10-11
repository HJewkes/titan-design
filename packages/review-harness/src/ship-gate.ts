import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import {
  FeedbackSchema,
  ManifestSchema,
  type Feedback,
  type Manifest,
  type ManifestInput,
  shipBlocks,
} from '@titan-design/review-schema'
import { normalizeAnswer } from './round.ts'
import { ReviewError } from './review.ts'

/** An answered round: its feedback and the manifest (round.json) that feedback answers. */
export interface PriorRound {
  feedbackPath: string
  manifest: Manifest
  feedback: Feedback
}

async function readJson(path: string): Promise<{ json: unknown; raw: Buffer }> {
  const raw = await readFile(path).catch(() => {
    throw new ReviewError(`${path} cannot be read`)
  })
  try {
    return { json: JSON.parse(raw.toString('utf8')), raw }
  } catch {
    throw new ReviewError(`${path} is not JSON`)
  }
}

/** A feedback.json and the round.json beside it, which must be the bytes it answered. */
export async function loadPriorRound(feedbackPath: string): Promise<PriorRound> {
  const feedback = FeedbackSchema.safeParse((await readJson(feedbackPath)).json)
  if (!feedback.success) throw new ReviewError(`${feedbackPath} is not a feedback file`)
  const roundPath = join(dirname(feedbackPath), 'round.json')
  const round = await readJson(roundPath)
  const sha = createHash('sha256').update(round.raw).digest('hex')
  if (sha !== feedback.data.manifestSha256)
    throw new ReviewError(`${feedbackPath} did not answer the round.json beside it`)
  const manifest = ManifestSchema.safeParse(round.json)
  if (!manifest.success) throw new ReviewError(`${roundPath} is not a round`)
  return { feedbackPath, manifest: manifest.data, feedback: feedback.data }
}

/** Earlier rounds of this unit in sibling round directories; unreadable ones are skipped. */
export async function discoverPriorRounds(draftPath: string, draft: ManifestInput) {
  const dir = dirname(draftPath)
  const parent = dirname(dir)
  const siblings = await readdir(parent).catch(() => [])
  const loaded = await Promise.all(
    siblings
      .filter((name) => name !== basename(dir))
      .map((name) => loadPriorRound(join(parent, name, 'feedback.json')).catch(() => null))
  )
  return loaded.filter(
    (p): p is PriorRound =>
      p !== null && p.manifest.unit === draft.unit && p.manifest.round < draft.round
  )
}

/** The answers of one prior round that ask something about `pr`, whose Ship head was `headSha`. */
function openRequests(prior: PriorRound, pr: string): { questionId: string; headSha?: string }[] {
  const answers = new Map(prior.feedback.answers.map((a) => [a.questionId, a]))
  const bound = prior.manifest.questions.find(
    (q) => q.kind === 'pick-one' && q.merge && q.page === pr
  )
  const headSha = bound?.kind === 'pick-one' ? bound.merge?.headSha : undefined
  return prior.manifest.questions.flatMap((q) => {
    const given = answers.get(q.id)
    if (q.page !== pr || !given) return []
    const answer = normalizeAnswer(q, given)
    const declined =
      q.kind === 'pick-one' &&
      q.merge !== undefined &&
      answer.pick !== undefined &&
      !q.merge.ship.includes(answer.pick)
    // A question that declares `implemented` is judged by the owner's rule (ruleRefusal), where
    // disagreeing with the recommendation is no change request (item 166). Older rounds without
    // it keep `agreed: false` as theirs.
    const implemented = (q.kind === 'pick-one' || q.kind === 'pick-many') && q.implemented
    const disagreed = answer.agreed === false && !implemented
    const open = answer.revisionRequested === true || disagreed || declined
    return open ? [{ questionId: q.id, ...(headSha ? { headSha } : {}) }] : []
  })
}

/** The prior round's own verdict on `pr` under the owner's Ship rule, when it is at this head. */
function ruleRefusal(prior: PriorRound, pr: string, head: string): string | null {
  const group = shipBlocks(prior.manifest, prior.feedback).find((g) => g.pr === pr)
  const bound = prior.manifest.questions.find(
    (q) => q.kind === 'pick-one' && q.merge && q.page === pr
  )
  const boundHead = bound?.kind === 'pick-one' ? bound.merge?.headSha : undefined
  // A holder's answer orders the stack within one round; it never carries into the next.
  const own = group?.blockers.filter((b) => b.kind !== 'holder-not-shipped') ?? []
  if (!own.length || (boundHead !== undefined && boundHead !== head)) return null
  return own.map((b) => b.message).join('; ')
}

/**
 * Why each Ship question in `draft` may not be emitted: the PR's latest earlier round holds a
 * changes-requested, declined or non-agreed answer for it. A Ship at a different head than the
 * one that round bound is a fix round's, so the old request no longer blocks it.
 */
export function shipRefusals(draft: ManifestInput, priors: PriorRound[]): string[] {
  const latest = [...priors].sort((a, b) => b.manifest.round - a.manifest.round)
  return draft.questions.flatMap((q) => {
    if (q.kind !== 'pick-one' || !q.merge) return []
    const pr = `${q.merge.repo}#${q.merge.pr}`
    const prior = latest.find((p) => p.manifest.questions.some((x) => x.page === pr))
    const open = prior ? openRequests(prior, pr) : []
    const blocking = open.filter((o) => o.headSha === undefined || o.headSha === q.merge!.headSha)
    const rule = prior ? ruleRefusal(prior, pr, q.merge.headSha) : null
    if (rule && prior && !blocking.length)
      return [
        `${q.id} offers Ship for ${pr}, but round ${prior.manifest.round} of ${prior.manifest.unit} ` +
          `(${prior.feedbackPath}) answered it with free text or a non-implemented pick: ${rule}. ` +
          'Fix it and bind the new head, or drop the Ship question.',
      ]
    return blocking.length && prior
      ? [
          `${q.id} offers Ship for ${pr}, but round ${prior.manifest.round} of ${prior.manifest.unit} ` +
            `(${prior.feedbackPath}) left it open: ${blocking.map((b) => b.questionId).join(', ')} ` +
            'is changes-requested or not agreed. Fix it and bind the new head, or drop the Ship question.',
        ]
      : []
  })
}
