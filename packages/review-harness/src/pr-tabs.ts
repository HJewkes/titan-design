import type {
  Manifest,
  PrGroup,
  PrGroupShipStatus,
  Question,
  Variant,
} from '@titan-design/review-schema'

// A PR group's page splits into tabs (owner item 167): Review asks every question, Diff sets base
// beside head read-only, Context shows the PR. The Ship bar sits under all three (item 166).

export const PR_TABS = ['review', 'diff', 'context'] as const
export type PrTab = (typeof PR_TABS)[number]

export const PR_TAB_LABEL: Record<PrTab, string> = {
  review: 'Review',
  diff: 'Diff',
  context: 'Context',
}

/** The explicit PR group a page shows, or undefined for a page that is not one. */
export function prGroupOfPage(manifest: Manifest, sectionIds: string[]): PrGroup | undefined {
  return manifest.prGroups?.find((g) => sectionIds.some((id) => g.sectionIds.includes(id)))
}

/** The PR's merge-bound question: the one the Ship bar answers. */
export function shipQuestionOf(
  manifest: Manifest,
  group: PrGroup
): Extract<Question, { kind: 'pick-one' }> | undefined {
  return manifest.questions.find(
    (q): q is Extract<Question, { kind: 'pick-one' }> =>
      q.kind === 'pick-one' && q.merge !== undefined && `${q.merge.repo}#${q.merge.pr}` === group.pr
  )
}

/** The frames of the group's sections that carry a base render or a change class, in page order. */
export function diffFrames(manifest: Manifest, group: PrGroup): Variant[] {
  const keys = (manifest.sections ?? [])
    .filter((s) => group.sectionIds.includes(s.id))
    .flatMap((s) => s.variantKeys)
  return keys
    .map((key) => manifest.variants.find((v) => v.key === key))
    .filter((v): v is Variant => v !== undefined && (v.baseImage !== undefined || !!v.change))
}

/** Whether the group carries anything for its Context tab. */
export function hasContext(group: PrGroup): boolean {
  const { description, task, codewatch, files } = group
  return !!(description || task || codewatch || files?.length)
}

export interface TabBadges {
  /** Questions with no answer yet; they never block Ship. */
  open: number
  /** Answers that request a change; any one withholds Ship. */
  changes: number
  /** Frames in the Diff tab. */
  frames: number
}

export function tabBadges(
  manifest: Manifest,
  group: PrGroup,
  status: PrGroupShipStatus | undefined
): TabBadges {
  return {
    open: status?.unansweredQuestionIds.length ?? 0,
    changes: new Set(status?.blockers.map((b) => b.questionId)).size,
    frames: diffFrames(manifest, group).length,
  }
}

/** The image route the server gives a frame's base render; `.` never occurs in a variant key. */
export const baseImageKey = (variantKey: string) => `${variantKey}.base`
