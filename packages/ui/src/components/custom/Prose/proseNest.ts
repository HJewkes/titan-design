import type { ProseCalloutKind } from './proseTypes'

const LIST_ITEM = /^(\s*)([-*+]|(\d{1,9})[.)])(\s+)(.*)$/
const CALLOUT_OPEN = /^\s*:::\s*([A-Za-z]+)\s*(.*?)\s*$/
const CALLOUT_CLOSE = /^\s*:::\s*$/
const FENCE_TOGGLE = /^\s*```/
const CALLOUT_KINDS = new Set<string>(['tip', 'info', 'warning', 'danger'])

const indentOf = (line: string) => /^\s*/.exec(line)![0].length

/** The line a body's content starts on: past a leading `---` YAML block, else 0. */
export function skipFrontmatter(lines: string[]): number {
  if (lines[0]?.trim() !== '---' || !/^[\w-]+:/.test(lines[1] ?? '')) return 0
  const close = lines.findIndex((line, i) => i > 0 && line.trim() === '---')
  return close === -1 ? 0 : close + 1
}

/**
 * An HTML comment that owns its lines is dropped: returns the line after it, or `null`
 * when the line is not one (a comment with text after it stays in the paragraph).
 */
export function readComment(lines: string[], start: number): number | null {
  const first = lines[start]!.trim()
  if (!first.startsWith('<!--')) return null
  for (let i = start; i < lines.length; i++) {
    const at = lines[i]!.indexOf('-->', i === start ? 4 : 0)
    // A new opener first means this one never closes; stopping there keeps the scan linear.
    if (at === -1 && i > start && lines[i]!.includes('<!--')) return null
    if (at === -1) continue
    return lines[i]!.slice(at + 3).trim() ? null : i + 1
  }
  return null
}

export interface CalloutRead {
  kind: ProseCalloutKind
  title: string
  inner: string[]
  next: number
}

/** A `::: kind [title]` container up to its matching `:::`, skipping fences; unclosed, it takes the rest. */
export function readCallout(lines: string[], start: number): CalloutRead | null {
  const open = CALLOUT_OPEN.exec(lines[start]!)
  if (!open) return null
  let depth = 1
  let inFence = false
  let i = start + 1
  for (; i < lines.length; i++) {
    const line = lines[i]!
    if (FENCE_TOGGLE.test(line)) inFence = !inFence
    if (inFence) continue
    if (CALLOUT_OPEN.test(line)) depth++
    if (CALLOUT_CLOSE.test(line) && --depth === 0) break
  }
  const word = open[1]!.toLowerCase()
  const kind = (CALLOUT_KINDS.has(word) ? word : 'info') as ProseCalloutKind
  return {
    kind,
    title: open[2]!,
    inner: lines.slice(start + 1, i),
    next: Math.min(i + 1, lines.length),
  }
}

export interface ListItemRead {
  /** The item's lines with its content indent removed, ready to parse as blocks. */
  content: string[]
  ordered: boolean
  start: number
  next: number
}

/**
 * A list item and every line indented past its marker, blank lines between them included.
 * An ordered item numbered other than 1 cannot interrupt a paragraph, as in CommonMark.
 */
export function readListItem(
  lines: string[],
  start: number,
  inParagraph: boolean
): ListItemRead | null {
  const match = LIST_ITEM.exec(lines[start]!)
  if (!match || !match[5]!.trim()) return null
  const ordered = match[3] !== undefined
  const number = ordered ? Number(match[3]) : 1
  if (ordered && inParagraph && number !== 1) return null
  const indent = match[1]!.length
  const offset = indent + match[2]!.length + match[4]!.length
  const content = [match[5]!]
  let end = start + 1
  for (let i = end; i < lines.length; i++) {
    const line = lines[i]!
    if (!line.trim()) continue
    if (indentOf(line) <= indent) break
    // Every line skipped since `end` was blank; they stay, so paragraphs inside the item still split.
    for (; end < i; end++) content.push('')
    content.push(line.slice(Math.min(indentOf(line), offset)))
    end = i + 1
  }
  return { content, ordered, start: number, next: end }
}
