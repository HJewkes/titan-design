// Text repairs for seat-written Morning items, ported from the operator's generator. A seat
// writes "Recommended default" and "Recommend yes"; the owner reads every such line as
// "Proposed", with its reasoning, so the seat's lean never reads as a verdict.

const RELABELS: [RegExp, string][] = [
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
  [/\bRecommend\b/g, 'Proposed:'],
]

/** Every "Recommended default" and "Recommend" in seat text, relabelled as a proposal. */
export function relabelAsProposed(text: string): string {
  return RELABELS.reduce((t, [pattern, replacement]) => t.replace(pattern, replacement), text)
}

const QUOTE = '> '
const SEPARATOR_ROW = /^\|(\s*:?-+:?\s*\|)+$/

function dropOrphanBold(line: string): string {
  const count = line.split('**').length - 1
  if (count % 2 === 0) return line
  const last = line.lastIndexOf('**')
  return line.slice(0, last) + line.slice(last + 2)
}

function cellCount(row: string): number {
  return row.trim().split(/(?<!\\)\|/).length - 2
}

/** The blank header (and separator) GFM needs before a table that starts without one. */
function tableHeader(line: string): string[] {
  const quoted = line.startsWith(QUOTE)
  const body = quoted ? line.slice(QUOTE.length) : line
  const prefix = quoted ? QUOTE : ''
  const cols = cellCount(body)
  const header = `${prefix}|${' |'.repeat(cols)}`
  if (SEPARATOR_ROW.test(body.trim())) return [header]
  return [header, `${prefix}|${'---|'.repeat(cols)}`]
}

/** Markdown the page can render: no orphan `**`, and every table opens with a header row. */
export function repairMarkdown(text: string): string {
  const out: string[] = []
  let inTable = false
  for (const raw of text.split('\n')) {
    const line = dropOrphanBold(raw)
    const body = line.startsWith(QUOTE) ? line.slice(QUOTE.length) : line
    const isTable = body.startsWith('|')
    if (isTable && !inTable) out.push(...tableHeader(line))
    out.push(line)
    inTable = isTable
  }
  return out.join('\n')
}

/** Seat text as the owner reads it: relabelled, then repaired. */
export function proposalText(text: string): string {
  return repairMarkdown(relabelAsProposed(text))
}
