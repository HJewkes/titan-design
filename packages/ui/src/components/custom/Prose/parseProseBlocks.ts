import { readFence, readTable } from './proseFenceTable'
import {
  readCallout,
  readComment,
  readListItem,
  skipFrontmatter,
  type ListItemRead,
} from './proseNest'
import { plainInline } from './proseInlineTokens'
import { headingLine } from './proseLines'
import { createSlugger, readCustomId, slugify } from './proseSlug'
import { isBlank, sliceTrimmed, splitLines, type LineRange, type ProseSource } from './proseSource'
import type { ProseBlock, ProseBlockType } from './proseTypes'

/** Deeper nesting than this reads as text; it bounds recursion on hostile input. */
const MAX_DEPTH = 8

/**
 * Splits markdown into the block kinds this renderer understands. Consecutive
 * text lines join into one paragraph; a blank line ends it. An indented line
 * straight after a list item continues that item. Deeper headings flatten to
 * h3 in `type`, keeping their source `level`; every heading gets an anchor id.
 */
export function parseProseBlocks(body: string): ProseBlock[] {
  return parseProseSource(body)
}

/** {@link parseProseBlocks} over any source; tests pass one that counts its reads. */
export function parseProseSource(src: ProseSource): ProseBlock[] {
  const lines = splitLines(src)
  const blocks = parseLines({ src, lines: lines.slice(skipFrontmatter(src, lines)), depth: 0 })
  assignHeadingIds(blocks, createSlugger())
  return blocks
}

/** A body as one line for `inline` mode: each line trimmed, blank ones dropped, joined by a space. */
export function joinProseLines(body: string): string {
  return splitLines(body)
    .filter((line) => !isBlank(body, line))
    .map((line) => sliceTrimmed(body, line))
    .join(' ')
}

/** The lines one nesting level reads, as ranges of the whole source. */
interface Scan {
  src: ProseSource
  lines: LineRange[]
  depth: number
}

const nestedScan = (scan: Scan, lines: LineRange[]): Scan => ({
  src: scan.src,
  lines,
  depth: scan.depth + 1,
})

function parseLines(scan: Scan): ProseBlock[] {
  const { src, lines } = scan
  const blocks: ProseBlock[] = []
  let paragraph: string[] = []
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') })
    paragraph = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (isBlank(src, line)) {
      flush()
      continue
    }
    const read = readBlock(scan, i, paragraph.length > 0, blocks)
    if (read) {
      flush()
      if (read.block) blocks.push(read.block)
      i = read.next - 1
      continue
    }
    paragraph.push(sliceTrimmed(src, line))
  }
  flush()
  return blocks
}

interface BlockRead {
  block: ProseBlock | null
  next: number
}

/** The block that starts at line `i`, or `null` when the line is paragraph text. */
function readBlock(
  scan: Scan,
  i: number,
  inParagraph: boolean,
  blocks: ProseBlock[]
): BlockRead | null {
  const { src, lines } = scan
  const comment = readComment(src, lines, i)
  if (comment !== null) return { block: null, next: comment }
  const fence = readFence(src, lines, i)
  if (fence) {
    return { block: { type: 'code', text: fence.code, lang: fence.lang }, next: fence.next }
  }
  const nested = scan.depth < MAX_DEPTH
  const callout = nested ? readCallout(src, lines, i) : null
  if (callout) {
    const { kind, title, inner, next } = callout
    const children = parseLines(nestedScan(scan, inner))
    return { block: { type: 'callout', kind, title, text: title, children }, next }
  }
  const table = readTable(src, lines, i)
  if (table) return { block: tableBlock(table), next: table.next }
  const heading = headingBlock(src, lines[i]!)
  if (heading) return { block: heading, next: i + 1 }
  const item = nested ? readListItem(src, lines, i, inParagraph) : null
  return item ? { block: listItemBlock(item, blocks, scan), next: item.next } : null
}

function tableBlock({
  header,
  align,
  rows,
}: NonNullable<ReturnType<typeof readTable>>): ProseBlock {
  return { type: 'table', text: [...header, ...rows.flat()].join(' '), header, align, rows }
}

function headingBlock(src: ProseSource, line: LineRange): ProseBlock | null {
  const heading = headingLine(src, line)
  if (!heading) return null
  const { level } = heading
  const { text, id } = readCustomId(heading.text)
  return { type: `h${Math.min(3, level)}` as ProseBlockType, text, level, ...(id ? { id } : {}) }
}

/** An item's first paragraph is its text; anything after it nests under the item. */
function listItemBlock(item: ListItemRead, blocks: ProseBlock[], scan: Scan): ProseBlock {
  const children = parseLines(nestedScan(scan, item.content))
  const text = children[0]?.type === 'p' ? children.shift()!.text : ''
  const block: ProseBlock = { type: 'li', text }
  if (children.length) block.children = children
  if (item.ordered) {
    const previous = blocks[blocks.length - 1]
    block.ordered = true
    block.n = previous?.ordered && previous.n !== undefined ? previous.n + 1 : item.start
  }
  return block
}

function assignHeadingIds(blocks: ProseBlock[], slug: (base: string) => string) {
  for (const block of blocks) {
    if (block.level !== undefined) block.id = slug(block.id ?? slugify(plainInline(block.text)))
    if (block.children) assignHeadingIds(block.children, slug)
  }
}
