// The round@2 draft for a CI packet: one image frame per shown baseline, grouped by change class,
// any side questions, then the one merge-bound Ship question for the PR at its head.
import {
  MANIFEST_SCHEMA_ID,
  SHIP_OPTIONS,
  THEME_MODES,
  type ManifestInput,
} from '@titan-design/review-schema'
import type { ShownChange } from './packet-classify.ts'

type DraftQuestion = ManifestInput['questions'][number]
type DraftSection = NonNullable<ManifestInput['sections']>[number]
type DraftVariant = ManifestInput['variants'][number]

const DEFAULT_STORYBOOK = 'http://127.0.0.1:6006'
const WIDTHS = [1280]
const UNMEASURED = 'a CI baseline montage; no DOM to measure'
export const SHIP_ID = 'ship'
export const SIDE_ID = 'side'

/** What the draft reads from packet.json. */
export interface DraftPacket {
  repo: string
  pr: number
  headSha: string
  mainSha: string
  ci: { runId: string }
  unchanged: Record<string, number>
  images: {
    key: string
    label: string
    change: ShownChange
    file: string
    source: 'artifact' | 'git'
    before?: { file: string }
  }[]
}

const short = (sha: string) => sha.slice(0, 12)

/** `<repo name>-pr<n>-<head12>`: the unit, and the packet directory's default name. */
export function packetUnit(repo: string, pr: number, headSha: string): string {
  return `${repo.split('/')[1]}-pr${pr}-${short(headSha)}`
}

function variant(image: DraftPacket['images'][number]): DraftVariant {
  return {
    key: image.key,
    image: image.file,
    label: image.label,
    change: image.change,
    ...(image.change === 'changed' && image.before ? { baseImage: image.before.file } : {}),
  }
}

const PROSE: Record<ShownChange, { title: string; shows: string }> = {
  changed: { title: 'Changed baselines', shows: 'BEFORE | AFTER | DIFF, or an aligned pair' },
  new: { title: 'New baselines', shows: 'the new image under a NEW bar' },
  removed: { title: 'Removed baselines', shows: "main's image under a REMOVED bar" },
}

function changeSection(change: ShownChange, keys: string[], p: DraftPacket): DraftSection {
  const unmeasured = keys.flatMap((v) =>
    THEME_MODES.map((mode) => ({ variant: v, mode, reason: UNMEASURED }))
  )
  return {
    id: change,
    title: `${PROSE[change].title} (${keys.length})`,
    deciding: 'Nothing on its own: these frames are the evidence for the Ship question.',
    changed: `${keys.length} ${change} against main ${short(p.mainSha)}, from CI run ${p.ci.runId}.`,
    context: `Each frame shows ${PROSE[change].shows}.`,
    kind: 'STATES',
    variantKeys: keys,
    contrast: { unmeasured },
  }
}

function sideSection(side: DraftQuestion[]): DraftSection[] {
  if (side.length === 0) return []
  return [
    {
      id: SIDE_ID,
      title: 'Side questions',
      deciding: 'The side questions supplied with this packet.',
      changed: 'Supplied with --side; from-ci adds only their page.',
      context: 'They are about the same PR head as the Ship question below.',
      questionIds: side.map((q) => q.id),
    },
  ]
}

function shipSection(p: DraftPacket, shown: number): DraftSection {
  const unchanged = Object.values(p.unchanged).reduce((a, b) => a + b, 0)
  return {
    id: SHIP_ID,
    title: `Ship ${p.repo}#${p.pr}`,
    deciding: 'Whether this PR merges at this head with these baselines.',
    changed: `${shown} baselines differ from main ${short(p.mainSha)}; ${unchanged} are unchanged.`,
    context: `Built by titan-review packet from-ci from CI run ${p.ci.runId}.`,
    questionIds: [SHIP_ID],
  }
}

/** A regenerated set came from a red CI run's artifact, so the head must commit those very images. */
const isRegenerated = (p: DraftPacket) => p.images.some((i) => i.source === 'artifact')

function shipPrompt(p: DraftPacket): string {
  const ask = `Ship ${p.repo}#${p.pr} at ${short(p.headSha)}?`
  if (!isRegenerated(p)) return ask
  return `${ask} These images are regenerated from CI run ${p.ci.runId}; Ship means the head must have them committed exactly.`
}

function shipQuestion(p: DraftPacket): DraftQuestion {
  const page = `${p.repo}#${p.pr}`
  return {
    id: SHIP_ID,
    kind: 'pick-one',
    prompt: shipPrompt(p),
    options: [...SHIP_OPTIONS],
    required: true,
    page,
    decision: 'ship',
    signsOff: `the ${p.images.length} baseline changes of run ${p.ci.runId} at ${short(p.headSha)}`,
    merge: { repo: p.repo, pr: p.pr, headSha: p.headSha, ship: ['Ship'] },
  }
}

/** The draft for `build`: frames by change class, side questions on the PR page, Ship last. */
export function packetDraft(p: DraftPacket, side: DraftQuestion[]): ManifestInput {
  const page = `${p.repo}#${p.pr}`
  const byChange = (['changed', 'new', 'removed'] as const)
    .map((change) => ({
      change,
      keys: p.images.filter((i) => i.change === change).map((i) => i.key),
    }))
    .filter((group) => group.keys.length > 0)
  const sideQuestions = side.map((q) => ({ ...q, page }))
  const sections = [
    ...byChange.map(({ change, keys }) => changeSection(change, keys, p)),
    ...sideSection(sideQuestions),
    shipSection(p, p.images.length),
  ]
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: packetUnit(p.repo, p.pr, p.headSha),
    round: 1,
    storybookUrl: DEFAULT_STORYBOOK,
    widths: WIDTHS,
    variants: p.images.map(variant),
    questions: [...sideQuestions, shipQuestion(p)],
    sections,
    prGroups: [{ pr: page, headSha: p.headSha, sectionIds: sections.map((s) => s.id) }],
    recommendations: 'after-answer',
  }
}
