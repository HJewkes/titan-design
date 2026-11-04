import { isFenceOpen, readFence, readTable } from './proseFenceTable'
import {
  readCallout,
  readComment,
  readListItem,
  skipFrontmatter,
  type ListItemRead,
} from './proseNest'
import { plainInline } from './proseInlineTokens'
import { createSlugger, readCustomId, slugify } from './proseSlug'
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
  const lines = body.split('\n')
  const blocks = parseLines(lines.slice(skipFrontmatter(lines)), 0)
  assignHeadingIds(blocks, createSlugger())
  return blocks
}

function parseLines(lines: string[], depth: number): ProseBlock[] {
  const blocks: ProseBlock[] = []
  let paragraph: string[] = []
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') })
    paragraph = []
  }
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!
    if (!raw.trim()) {
      flush()
      continue
    }
    const read = readBlock(lines, i, depth, paragraph.length > 0, blocks)
    if (read) {
      flush()
      if (read.block) blocks.push(read.block)
      i = read.next - 1
      continue
    }
    paragraph.push(raw.trim())
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
  lines: string[],
  i: number,
  depth: number,
  inParagraph: boolean,
  blocks: ProseBlock[]
): BlockRead | null {
  const comment = readComment(lines, i)
  if (comment !== null) return { block: null, next: comment }
  if (isFenceOpen(lines[i]!)) {
    const fence = readFence(lines, i)
    return { block: { type: 'code', text: fence.code, lang: fence.lang }, next: fence.next }
  }
  const nested = depth < MAX_DEPTH
  const callout = nested ? readCallout(lines, i) : null
  if (callout) {
    const { kind, title, inner, next } = callout
    return {
      block: { type: 'callout', kind, title, text: title, children: parseLines(inner, depth + 1) },
      next,
    }
  }
  const table = readTable(lines, i)
  if (table) return { block: tableBlock(table), next: table.next }
  const heading = headingBlock(lines[i]!.trim())
  if (heading) return { block: heading, next: i + 1 }
  const item = nested ? readListItem(lines, i, inParagraph) : null
  return item ? { block: listItemBlock(item, blocks, depth), next: item.next } : null
}

function tableBlock({
  header,
  align,
  rows,
}: NonNullable<ReturnType<typeof readTable>>): ProseBlock {
  return { type: 'table', text: [...header, ...rows.flat()].join(' '), header, align, rows }
}

function headingBlock(line: string): ProseBlock | null {
  const match = line.match(/^(#{1,6})\s+(.*)/)
  if (!match) return null
  const level = match[1]!.length
  const { text, id } = readCustomId(match[2]!)
  return { type: `h${Math.min(3, level)}` as ProseBlockType, text, level, ...(id ? { id } : {}) }
}

/** An item's first paragraph is its text; anything after it nests under the item. */
function listItemBlock(item: ListItemRead, blocks: ProseBlock[], depth: number): ProseBlock {
  const children = parseLines(item.content, depth + 1)
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
