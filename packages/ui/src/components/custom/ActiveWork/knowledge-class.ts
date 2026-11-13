import type { ColorToken } from '../../../theme/resolve-color'

/** The record classes active-work keeps, in the singular. The one owner of this vocabulary. */
export type KnowledgeClass =
  | 'initiative'
  | 'note'
  | 'source'
  | 'nested_source'
  | 'task'
  | 'session'
  | 'transcript'

/** Classes in the order legends and pickers list them. */
export const KNOWLEDGE_CLASS_ORDER: KnowledgeClass[] = [
  'initiative',
  'task',
  'session',
  'note',
  'source',
  'nested_source',
  'transcript',
]

/** How a record class reads and which colour it takes. */
export interface KnowledgeClassMeta {
  /** Singular name, for one item. */
  label: string
  /** Plural name, for a legend or a count. */
  plural: string
  /** A categorical token, fixed per class so a class keeps its colour in every view. */
  colorToken: ColorToken
}

/**
 * Seven classes against six CVD-safe categorical slots: `nested_source` and
 * `transcript` share the sixth, because no view shows both (inventory has no
 * transcripts, search indexes no nested sources) and the label always names the class.
 */
export const KNOWLEDGE_CLASS_META: Record<KnowledgeClass, KnowledgeClassMeta> = {
  initiative: { label: 'Initiative', plural: 'Initiatives', colorToken: 'dataviz-categorical-0' },
  task: { label: 'Task', plural: 'Tasks', colorToken: 'dataviz-categorical-1' },
  session: { label: 'Session', plural: 'Sessions', colorToken: 'dataviz-categorical-2' },
  note: { label: 'Note', plural: 'Notes', colorToken: 'dataviz-categorical-3' },
  source: { label: 'Source', plural: 'Sources', colorToken: 'dataviz-categorical-4' },
  nested_source: {
    label: 'Nested source',
    plural: 'Nested sources',
    colorToken: 'dataviz-categorical-5',
  },
  transcript: { label: 'Transcript', plural: 'Transcripts', colorToken: 'dataviz-categorical-5' },
}

const PLURAL_WIRE_NAMES: Record<string, KnowledgeClass> = {
  initiatives: 'initiative',
  notes: 'note',
  sources: 'source',
  nested_sources: 'nested_source',
  tasks: 'task',
  sessions: 'session',
  transcripts: 'transcript',
}

// Own keys only: `in` would also accept `toString` and `__proto__`.
const hasOwn = (record: object, key: string) => Object.prototype.hasOwnProperty.call(record, key)

const isKnowledgeClass = (raw: string): raw is KnowledgeClass => hasOwn(KNOWLEDGE_CLASS_META, raw)

/**
 * The class for a wire name. The wire pins classes in the plural (`notes`, the
 * search `hit.class` form); the singular is accepted too. Undefined for an unknown
 * class, so a caller shows the raw name instead of guessing.
 */
export function toKnowledgeClass(raw: string): KnowledgeClass | undefined {
  if (hasOwn(PLURAL_WIRE_NAMES, raw)) return PLURAL_WIRE_NAMES[raw]
  return isKnowledgeClass(raw) ? raw : undefined
}

/** What a note records. */
export type NoteKind = 'process' | 'gotcha' | 'fyi' | 'decision' | 'plan'

/** What a source document is. */
export type SourceType = 'pr' | 'deepdive' | 'session' | 'pointer'

/** Display name per note kind. */
export const NOTE_KIND_LABEL: Record<NoteKind, string> = {
  process: 'Process',
  gotcha: 'Gotcha',
  fyi: 'FYI',
  decision: 'Decision',
  plan: 'Plan',
}

/** Display name per source type. */
export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  pr: 'PR',
  deepdive: 'Deep dive',
  session: 'Session',
  pointer: 'Pointer',
}

/** Every note kind, in display order. */
export const NOTE_KINDS = Object.keys(NOTE_KIND_LABEL) as NoteKind[]
/** Every source type, in display order. */
export const SOURCE_TYPES = Object.keys(SOURCE_TYPE_LABEL) as SourceType[]
