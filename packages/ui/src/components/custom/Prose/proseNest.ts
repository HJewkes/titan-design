import {
  calloutOpenLine,
  findText,
  isCalloutClose,
  isCommentOpener,
  isExactly,
  isFrontmatterKey,
  listItemLine,
  togglesFence,
} from './proseLines'
import { indentOf, isBlank, type LineRange, type ProseSource } from './proseSource'
import type { ProseCalloutKind } from './proseTypes'

const CALLOUT_KINDS = new Set<string>(['tip', 'info', 'warning', 'danger'])
const COMMENT_OPENER_LENGTH = 4

/** The line a body's content starts on: past a leading `---` YAML block, else 0. */
export function skipFrontmatter(src: ProseSource, lines: LineRange[]): number {
  if (lines.length < 2 || !isExactly(src, lines[0]!, '---')) return 0
  if (!isFrontmatterKey(src, lines[1]!)) return 0
  for (let i = 1; i < lines.length; i++) if (isExactly(src, lines[i]!, '---')) return i + 1
  return 0
}

/**
 * An HTML comment that owns its lines is dropped: returns the line after it, or `null`
 * when the line is not one (a comment with text after it stays in the paragraph).
 */
export function readComment(src: ProseSource, lines: LineRange[], start: number): number | null {
  const first = lines[start]!
  if (!isCommentOpener(src, first)) return null
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]!
    const from = i === start ? first.start + COMMENT_OPENER_LENGTH : line.start
    const at = findText(src, from, line.end, '-->')
    // A new opener first means this one never closes; stopping there keeps the scan linear.
    if (at === -1 && i > start && findText(src, line.start, line.end, '<!--') !== -1) return null
    if (at === -1) continue
    return isBlank(src, { start: at + 3, end: line.end }) ? i + 1 : null
  }
  return null
}

export interface CalloutRead {
  kind: ProseCalloutKind
  title: string
  inner: LineRange[]
  next: number
}

/** The index of the `:::` closing a container whose content starts at `from`; the end when unclosed. */
function calloutEnd(src: ProseSource, lines: LineRange[], from: number): number {
  let depth = 1
  let inFence = false
  let i = from
  for (; i < lines.length; i++) {
    const line = lines[i]!
    if (togglesFence(src, line)) inFence = !inFence
    if (inFence) continue
    if (calloutOpenLine(src, line)) depth++
    if (isCalloutClose(src, line) && --depth === 0) break
  }
  return i
}

/** A `::: kind [title]` container up to its matching `:::`, skipping fences; unclosed, it takes the rest. */
export function readCallout(
  src: ProseSource,
  lines: LineRange[],
  start: number
): CalloutRead | null {
  const open = calloutOpenLine(src, lines[start]!)
  if (!open) return null
  const close = calloutEnd(src, lines, start + 1)
  const word = open.word.toLowerCase()
  const kind = (CALLOUT_KINDS.has(word) ? word : 'info') as ProseCalloutKind
  return {
    kind,
    title: open.title,
    inner: lines.slice(start + 1, close),
    next: Math.min(close + 1, lines.length),
  }
}

export interface ListItemRead {
  /** The item's lines with its content indent removed, ready to parse as blocks. */
  content: LineRange[]
  ordered: boolean
  start: number
  next: number
}

/**
 * A list item and every line indented past its marker, blank lines between them included.
 * An ordered item numbered other than 1 cannot interrupt a paragraph, as in CommonMark.
 */
export function readListItem(
  src: ProseSource,
  lines: LineRange[],
  start: number,
  inParagraph: boolean
): ListItemRead | null {
  const first = lines[start]!
  const item = listItemLine(src, first)
  if (!item || (item.ordered && inParagraph && item.number !== 1)) return null
  const content = [{ start: first.start + item.offset, end: first.end }]
  let end = start + 1
  for (let i = end; i < lines.length; i++) {
    const line = lines[i]!
    const indent = indentOf(src, line)
    if (indent === line.end - line.start) continue
    if (indent <= item.indent) break
    // Every line skipped since `end` was blank; they stay, so paragraphs inside the item still split.
    for (; end < i; end++) content.push(lines[end]!)
    content.push({ start: line.start + Math.min(indent, item.offset), end: line.end })
    end = i + 1
  }
  return { content, ordered: item.ordered, start: item.number, next: end }
}
