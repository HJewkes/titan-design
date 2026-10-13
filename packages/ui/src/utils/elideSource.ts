/**
 * Middle elision for a source citation: refs joined by `"; "`, each
 * `[pin:] [dirs/] basename[:range][, range…] [tail] [ @pin]`.
 *
 * The pin and `basename:firstRange` are protected atoms: a viewer checks a
 * citation by those two, so they are never split. Everything else gives way in
 * a fixed order, and the first level that fits the budget wins.
 */
export type ElisionLevel = 0 | 1 | 2 | 3 | 4

export interface ElidedSource {
  text: string
  /** 0 unchanged, 1 dirs, 2 prose refs, 3 lead ref + count, 4 lead ref trimmed. */
  level: ElisionLevel
  /** Refs no longer shown, collapsed into `…` (level 2) or counted by ` +k`. */
  droppedRefs: number
  /** False when even the protected atoms exceed the budget; `text` is then the shortest form. */
  fits: boolean
}

interface SourceRef {
  pin: string
  body: string
  suffix: string
}

const REF_SEPARATOR = '; '
const ELLIPSIS = '…'
const PIN_PREFIX = /^([A-Za-z][\w-]*@[0-9a-f]{7,40}:)(.*)$/
const PIN_SUFFIX = /^(.*?)( @[0-9a-f]{7,40})$/
const FILE_TOKEN = /[\w-]+\.[A-Za-z]{1,5}\b/
const EXTRA_RANGES = /^(\S*?:L?\d+(?:-L?\d+)?)(?:,\s*L?\d+(?:-L?\d+)?)+/
const DOC_TAIL = /^(.*?§[\d.]+)(.+)$/

function parseRef(raw: string): SourceRef {
  const prefixed = PIN_PREFIX.exec(raw)
  const pin = prefixed ? prefixed[1] : ''
  const rest = prefixed ? prefixed[2] : raw
  const suffixed = PIN_SUFFIX.exec(rest)
  return suffixed ? { pin, body: suffixed[1], suffix: suffixed[2] } : { pin, body: rest, suffix: '' }
}

const refText = (ref: SourceRef) => ref.pin + ref.body + ref.suffix
const isPinned = (ref: SourceRef) => Boolean(ref.pin || ref.suffix)
const isProse = (ref: SourceRef) => !isPinned(ref) && !FILE_TOKEN.test(ref.body)

function collapseDirs(body: string): string {
  const [head, ...rest] = body.split(' ')
  const slash = head.lastIndexOf('/')
  if (slash < 0 || slash === head.length - 1) return body
  return [`${ELLIPSIS}/${head.slice(slash + 1)}`, ...rest].join(' ')
}

// The pinned ref is the one a viewer can check, so it leads even when a plain ref precedes it.
function leadIndex(refs: SourceRef[]): number {
  return Math.max(0, refs.findIndex(isPinned))
}

function collapseProse(refs: SourceRef[], lead: number): { text: string; dropped: number } {
  const out: string[] = []
  let dropped = 0
  refs.forEach((ref, i) => {
    if (i === lead || !isProse(ref)) {
      out.push(refText(ref))
      return
    }
    dropped += 1
    if (out[out.length - 1] !== ELLIPSIS) out.push(ELLIPSIS)
  })
  return { text: out.join(REF_SEPARATOR), dropped }
}

function trimExtraRanges(body: string): string {
  return body.replace(EXTRA_RANGES, `$1${ELLIPSIS}`)
}

function trimDocTail(body: string): string {
  const match = DOC_TAIL.exec(body)
  return match && match[2] !== ELLIPSIS ? match[1] + ELLIPSIS : body
}

function joinAround(words: string[], head: number, tail: number): string {
  return [...words.slice(0, head), ELLIPSIS, ...words.slice(words.length - tail)].join(' ')
}

// Keeps the first and last word, then grows the tail and head in turn while the result fits.
function trimMiddleWords(body: string, room: number): string {
  const words = body.split(' ')
  if (body.length <= room || words.length < 3) return body
  let head = 1
  let tail = 1
  for (let grew = true; grew; ) {
    grew = false
    if (head + tail + 1 < words.length && joinAround(words, head, tail + 1).length <= room) {
      tail += 1
      grew = true
    }
    if (head + tail + 1 < words.length && joinAround(words, head + 1, tail).length <= room) {
      head += 1
      grew = true
    }
  }
  return joinAround(words, head, tail)
}

function trimLead(ref: SourceRef, budget: number): string {
  let body = ref.body
  for (const trim of [trimExtraRanges, trimDocTail]) {
    if (refText({ ...ref, body }).length <= budget) break
    body = trim(body)
  }
  const room = budget - ref.pin.length - ref.suffix.length
  return refText({ ...ref, body: trimMiddleWords(body, room) })
}

/**
 * Shortens `text` to at most `maxChars` characters without splitting a pin or
 * a `basename:firstRange`.
 *
 * @example
 * elideSource('ab@1a2b3c4:src/core/loop.ts:12-30', 30).text // 'ab@1a2b3c4:…/loop.ts:12-30'
 */
export function elideSource(text: string, maxChars: number): ElidedSource {
  if (text.length <= maxChars) return { text, level: 0, droppedRefs: 0, fits: true }
  const refs = text
    .split(REF_SEPARATOR)
    .map(parseRef)
    .map((ref) => ({ ...ref, body: collapseDirs(ref.body) }))
  const dirsOnly = refs.map(refText).join(REF_SEPARATOR)
  if (dirsOnly.length <= maxChars) return { text: dirsOnly, level: 1, droppedRefs: 0, fits: true }
  const lead = leadIndex(refs)
  const prose = collapseProse(refs, lead)
  if (prose.dropped > 0 && prose.text.length <= maxChars) {
    return { text: prose.text, level: 2, droppedRefs: prose.dropped, fits: true }
  }
  const droppedRefs = refs.length - 1
  const counter = droppedRefs > 0 ? ` +${droppedRefs}` : ''
  const leadOnly = refText(refs[lead]) + counter
  if (counter && leadOnly.length <= maxChars) {
    return { text: leadOnly, level: 3, droppedRefs, fits: true }
  }
  const trimmed = trimLead(refs[lead], maxChars - counter.length) + counter
  return { text: trimmed, level: 4, droppedRefs, fits: trimmed.length <= maxChars }
}
