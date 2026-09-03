import type { ProseLinker } from '../Prose'

/** A per-initiative task id such as `AW-22` or `TD-07.14`. */
export const TASK_REF_PATTERN = /\b[A-Z]{2,}-\d+(?:\.\d+)?\b/
/** An Obsidian-style `[[name]]` link into notes or memory. */
export const WIKI_LINK_PATTERN = /\[\[[^\]]+\]\]/
/** A bare `#123` pull-request or issue number. */
export const PR_REF_PATTERN = /#\d+\b/

/** Every distinct task id in a body, in first-seen order. */
export function extractTaskRefs(body: string): string[] {
  const all = body.match(new RegExp(TASK_REF_PATTERN.source, 'g')) ?? []
  return Array.from(new Set(all))
}

/** Task ids read in the brand colour and, when a handler is given, open the task. */
export function taskRefLinker(onPress?: (id: string) => void): ProseLinker {
  return { id: 'task', pattern: TASK_REF_PATTERN, tone: 'brand', onPress }
}

/** `[[name]]` links drop their brackets and read as links; the handler receives the bare name. */
export function wikiLinkLinker(onPress?: (name: string) => void): ProseLinker {
  const strip = (ref: string) => ref.slice(2, -2)
  return {
    id: 'wiki',
    pattern: WIKI_LINK_PATTERN,
    tone: 'link',
    label: strip,
    onPress: onPress ? (ref) => onPress(strip(ref)) : undefined,
  }
}

/** PR numbers recede rather than compete with task ids; the handler receives the number. */
export function prRefLinker(onPress?: (number: number) => void): ProseLinker {
  return {
    id: 'pr',
    pattern: PR_REF_PATTERN,
    tone: 'muted',
    onPress: onPress ? (ref) => onPress(Number(ref.slice(1))) : undefined,
  }
}

export interface SessionLinkHandlers {
  onPressTask?: (id: string) => void
  onPressLink?: (name: string) => void
  onPressPr?: (number: number) => void
}

/** The three linkers a session log needs, in the order they should win a match. */
export function sessionLinkers(handlers: SessionLinkHandlers = {}): ProseLinker[] {
  return [
    taskRefLinker(handlers.onPressTask),
    wikiLinkLinker(handlers.onPressLink),
    prRefLinker(handlers.onPressPr),
  ]
}
