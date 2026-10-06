// Text repairs for seat-written Morning items, ported from the operator's generator. A seat
// writes "Recommended default" and "Recommend yes"; the owner reads every such line as
// "Proposed", with its reasoning, so the seat's lean never reads as a verdict. Code spans and
// fenced blocks are quoted verbatim: a `default:` in a config sample is not a seat's lean.

/** A label opens a line, a bold run, a list item or a sentence; elsewhere the word is a verb. */
const LABEL_AT = String.raw`(^|\*\*|[-*] |[.;:] )`

type Replacement = string | ((match: string) => string)

const initial = (word: string) => (word[0] === 'R' ? 'P' : 'p')
/** recommend, recommends, recommended: the same form of propose, case kept. */
const verb = (word: string) =>
  `${initial(word)}ropose${word.endsWith('ed') ? 'd' : word.endsWith('s') ? 's' : ''}`
/** recommendation(s): proposal(s), case kept. */
const noun = (word: string) => `${initial(word)}roposal${word.endsWith('s') ? 's' : ''}`

const RELABELS: [RegExp, Replacement][] = [
  [/\*\*Recommend(?:ed)? (yes|no)\*\*/g, '**Proposed: $1**'],
  [/\bRecommended default:\*\*\s*/g, 'Proposed:** '],
  [/\bRecommended default:\s*/g, 'Proposed: '],
  [/\bthe seat recommends\b/gi, 'the plan proposes'],
  [/\brecommended defaults?\b/g, 'proposals'],
  [/\(recommended default in each\)/g, ''],
  [/\bRecommended default\b/g, 'Proposal'],
  [/Plan's default/g, "Plan's proposal"],
  [/Plan default/g, 'Plan proposal'],
  [/\bDefault:\s*/g, 'Proposed: '],
  [/\bdefault: /g, 'proposal: '],
  [/\(recommended default in bold\)/g, ''],
  [/Silence goes to the decider\.\s*/g, ''],
  [/\bRecommendation:/g, 'Proposal:'],
  // A bold label keeps its colon inside the bold: "**Recommend** teal" is "**Proposed:** teal".
  [/\*\*Recommend(?:ed)?\b:?\*\*\s*/g, '**Proposed:** '],
  [new RegExp(`${LABEL_AT}Recommend(?:ed)?\\b:?\\s*`, 'g'), '$1Proposed: '],
  // Elsewhere the word is a verb, a participle or a noun, and stays one.
  [/\b[Rr]ecommend(s|ed)?\b(?!:)/g, (m) => verb(m)],
  [/\b[Rr]ecommendations?\b(?!:)/g, (m) => noun(m)],
  [/\b(?:Proposed: )+(Proposed:)/g, '$1'],
]

function relabelProse(text: string): string {
  return RELABELS.reduce(
    (t, [pattern, replacement]) =>
      typeof replacement === 'string'
        ? t.replace(pattern, replacement)
        : t.replace(pattern, replacement),
    text
  )
}

const FENCE = /^\s*(```|~~~)/
const CODE_SPAN = /(`+)[^`][\s\S]*?\1/g

/** `fn` over the prose of one line: every part outside a code span, in place. */
function mapProseOfLine(line: string, fn: (prose: string) => string): string {
  let out = ''
  let at = 0
  for (const span of line.matchAll(CODE_SPAN)) {
    out += fn(line.slice(at, span.index)) + span[0]
    at = span.index + span[0].length
  }
  return out + fn(line.slice(at))
}

type LineFn = (line: string, index: number, lines: string[]) => string

/** `fn` over every prose line, skipping fenced code; a fence line itself is kept as it is. */
function mapLines(text: string, fn: LineFn, onFence: () => void = () => {}) {
  let fenced = false
  const lines = text.split('\n')
  return lines
    .map((line, i) => {
      if (FENCE.test(line)) {
        fenced = !fenced
        onFence()
        return line
      }
      return fenced ? line : fn(line, i, lines)
    })
    .join('\n')
}

/** Every "Recommended default" and "Recommend" in seat prose, relabelled as a proposal. */
export function relabelAsProposed(text: string): string {
  return mapLines(text, (line) => mapProseOfLine(line, relabelProse))
}

const QUOTE_PREFIX = /^((?:>\s?)+)/
const SEPARATOR_ROW = /^\|(\s*:?-+:?\s*\|)+$/

const bolds = (prose: string) => prose.split('**').length - 1

/** Drops the last `**` of a line whose prose holds an odd number; code spans do not count. */
function dropOrphanBold(line: string): string {
  let count = 0
  mapProseOfLine(line, (prose) => {
    count += bolds(prose)
    return prose
  })
  if (count % 2 === 0) return line
  let seen = 0
  return mapProseOfLine(line, (prose) => {
    const own = bolds(prose)
    seen += own
    if (own === 0 || seen < count) return prose
    const last = prose.lastIndexOf('**')
    return prose.slice(0, last) + prose.slice(last + 2)
  })
}

function unquote(line: string): { prefix: string; body: string } {
  const prefix = QUOTE_PREFIX.exec(line)?.[1] ?? ''
  return { prefix, body: line.slice(prefix.length) }
}

function isTableRow(line: string): boolean {
  return unquote(line).body.startsWith('|')
}

function cellCount(row: string): number {
  return row.trim().split(/(?<!\\)\|/).length - 2
}

/** The blank header (and separator) GFM needs before a table that starts without one. */
function missingHeader(line: string, next: string | undefined): string[] {
  const { prefix, body } = unquote(line)
  const cols = cellCount(body)
  const header = `${prefix}|${' |'.repeat(cols)}`
  if (SEPARATOR_ROW.test(body.trim())) return [header]
  if (next !== undefined && SEPARATOR_ROW.test(unquote(next).body.trim())) return []
  return [header, `${prefix}|${'---|'.repeat(cols)}`]
}

/** Markdown the page can render: no orphan `**`, and every table opens with a header row. */
export function repairMarkdown(text: string): string {
  let inTable = false
  const repairLine: LineFn = (raw, i, lines) => {
    const line = dropOrphanBold(raw)
    const isTable = isTableRow(line)
    const header = isTable && !inTable ? missingHeader(line, lines[i + 1]) : []
    inTable = isTable
    return [...header, line].join('\n')
  }
  return mapLines(text, repairLine, () => (inTable = false))
}

/** Seat text as the owner reads it: relabelled, then repaired. */
export function proposalText(text: string): string {
  return repairMarkdown(relabelAsProposed(text))
}
