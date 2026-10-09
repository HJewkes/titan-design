import type { ColorToken } from '../../../theme/resolve-color'
import type { PillTone } from '../../ui/pill'

/** The entities a typed cross-entity ref can point at. */
export type RefKind = 'task' | 'pr' | 'session' | 'agent' | 'note' | 'file' | 'initiative'

export interface RefKindMeta {
  /** Singular noun, spoken before the ref's own label. */
  label: string
  /** Group heading in a `RelatedList`. */
  plural: string
  /** One text character, drawn before the label and hidden from assistive tech. */
  glyph: string
  /**
   * An existing data token for consumers that colour by kind (NetworkGraph node kinds).
   * `RefChip` itself stays neutral: a chip is not coloured per kind.
   */
  color: ColorToken
}

/** The order `RelatedList` groups render in. */
export const REF_KIND_ORDER = [
  'task',
  'pr',
  'session',
  'agent',
  'note',
  'file',
  'initiative',
] as const satisfies readonly RefKind[]

export const REF_KIND_META = {
  task: { label: 'Task', plural: 'Tasks', glyph: '#', color: 'data-1' },
  pr: { label: 'Pull request', plural: 'Pull requests', glyph: '⇄', color: 'data-2' },
  session: { label: 'Session', plural: 'Sessions', glyph: '▸', color: 'data-5' },
  agent: { label: 'Agent', plural: 'Agents', glyph: '@', color: 'data-6' },
  note: { label: 'Note', plural: 'Notes', glyph: '¶', color: 'data-3' },
  file: { label: 'File', plural: 'Files', glyph: '/', color: 'data-7' },
  initiative: { label: 'Initiative', plural: 'Initiatives', glyph: '◆', color: 'data-9' },
} as const satisfies Record<RefKind, RefKindMeta>

/** An optional status on a ref, e.g. a pull request's open or merged state. */
export interface RefStatus {
  label: string
  tone: PillTone
}

/** A typed pointer at another entity. */
export interface EntityRef {
  kind: RefKind
  /** The ref's stable identity, unique within a list (e.g. `task:TD-1`). */
  id: string
  /** What the chip shows. */
  label: string
  status?: RefStatus
  /** Where the ref navigates. */
  href?: string
}

/** One kind as a graph node kind; structurally NetworkGraph's `GraphKind`. */
export interface RefGraphKind {
  id: RefKind
  label: string
  color: ColorToken
}

/** The kind vocabulary as NetworkGraph node kinds, so a node and a chip of one kind agree. */
export function refGraphKinds(): RefGraphKind[] {
  return REF_KIND_ORDER.map((id) => ({
    id,
    label: REF_KIND_META[id].label,
    color: REF_KIND_META[id].color,
  }))
}

/** The accessible name of a ref: kind, label, then status. */
export function describeRef({ kind, label, status }: EntityRef): string {
  const name = `${REF_KIND_META[kind].label} ${label}`
  return status ? `${name}, ${status.label}` : name
}
