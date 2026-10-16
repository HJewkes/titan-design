// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, type ReactNode } from 'react'
import { Text, View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../../ui/typography'
import { isFenceOpen, readFence, readTable } from './proseFenceTable'
import { CodeBlock, ProseTable } from './ProseBlocks'
import type { ProseBlock, ProseBlockType } from './proseTypes'

/** How a linked reference reads: brand for the domain's own ids, link for cross-references, muted for asides. */
export type ProseLinkTone = 'brand' | 'link' | 'muted'

/**
 * A pattern the prose auto-links. Patterns must not carry flags (`g`, `i`, `u`,
 * …) or capture groups: the renderer combines every pattern's source into one
 * tokenizer, so flags cannot be kept per linker. A flagged pattern is matched
 * as if it had none, and warns once in development. Spell case-insensitivity
 * out in the pattern, e.g. `/[Tt][Dd]-\d+/`.
 */
export interface ProseLinker {
  /** Stable id, used in keys and test ids. */
  id: string
  pattern: RegExp
  tone?: ProseLinkTone
  /** Text to show for a match. Defaults to the match itself. */
  label?: (ref: string) => string
  /** When set the reference is pressable and exposes a link role. */
  onPress?: (ref: string) => void
}

export type { ProseBlock, ProseBlockType } from './proseTypes'

export interface MarkdownProseProps {
  /** Markdown source. Headings, bullet lists, paragraphs, bold, code, fenced code blocks and pipe tables are understood. */
  body: string
  /** Reference patterns to auto-link, tried in order. */
  linkers?: ProseLinker[]
  /** `md` is one step up from the dense default, in primary text colour. */
  size?: ProseSize
  className?: string
  testID?: string
}

export type ProseSize = 'sm' | 'md'

const BOLD = /\*\*[^*]+\*\*/
const CODE = /`[^`]+`/

/**
 * Splits markdown into the block kinds this renderer understands. Consecutive
 * text lines join into one paragraph; a blank line ends it. An indented line
 * straight after a bullet continues that bullet. Deeper headings flatten to
 * h3, since session prose never needs more than three levels.
 */
export function parseProseBlocks(body: string): ProseBlock[] {
  const blocks: ProseBlock[] = []
  let paragraph: string[] = []
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') })
    paragraph = []
  }
  const lines = body.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    if (isFenceOpen(raw)) {
      flush()
      const fence = readFence(lines, i)
      blocks.push({ type: 'code', text: fence.code, lang: fence.lang })
      i = fence.next - 1
      continue
    }
    const table = readTable(lines, i)
    if (table) {
      flush()
      const { header, align, rows } = table
      blocks.push({
        type: 'table',
        text: [...header, ...rows.flat()].join(' '),
        header,
        align,
        rows,
      })
      i = table.next - 1
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.*)/)
    if (heading) {
      flush()
      const level = Math.min(3, heading[1]!.length)
      blocks.push({ type: `h${level}` as ProseBlockType, text: heading[2]! })
      continue
    }
    const item = line.match(/^[-*]\s+(.*)/)
    if (item) {
      flush()
      blocks.push({ type: 'li', text: item[1]! })
      continue
    }
    // Lazy continuation: an indented line straight after a bullet belongs to it.
    const last = blocks[blocks.length - 1]
    if (last?.type === 'li' && paragraph.length === 0 && /^\s/.test(raw)) {
      last.text = `${last.text} ${line}`
      continue
    }
    paragraph.push(line)
  }
  flush()
  return blocks
}

// One step denser than body2, with a 20px line so long logs stay readable at that size.
const BODY_TEXT: Record<ProseSize, string> = {
  sm: 'text-xs leading-5 text-text-secondary',
  md: 'text-sm leading-5 text-text-primary',
}
const TONE_CLASS: Record<ProseLinkTone, string> = {
  brand: 'font-semibold text-text-brand',
  link: 'font-medium text-text-link',
  muted: 'text-text-secondary',
}

function anchored(pattern: RegExp): RegExp {
  return new RegExp(`^(?:${pattern.source})$`)
}

// Bundlers replace `process.env.NODE_ENV` literally; the DTS build has no Node types.
declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()

/** Warn once per linker in development; the tokenizer is rebuilt on every render. */
function warnDroppedFlags(linker: ProseLinker) {
  if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') return
  const key = `${linker.id}/${linker.pattern.flags}`
  if (warned.has(key)) return
  warned.add(key)
  console.warn(
    `titan: MarkdownProse linker "${linker.id}" has flags "${linker.pattern.flags}", which the combined tokenizer drops. Write the pattern without flags.`
  )
}

/** One tokenizer for bold, code and every linker, so a span is classified exactly once. */
function buildTokenizer(linkers: ProseLinker[]): RegExp {
  linkers.filter((l) => l.pattern.flags).forEach(warnDroppedFlags)
  const parts = [BOLD.source, CODE.source, ...linkers.map((l) => l.pattern.source)]
  return new RegExp(`(${parts.join('|')})`, 'g')
}

function LinkedRef({ linker, value }: { linker: ProseLinker; value: string }) {
  const label = linker.label ? linker.label(value) : value
  const pressable = !!linker.onPress
  return (
    <Text
      className={TONE_CLASS[linker.tone ?? 'link']}
      onPress={pressable ? () => linker.onPress?.(value) : undefined}
      accessibilityRole={pressable ? 'link' : undefined}
      testID={`prose-ref-${linker.id}`}
    >
      {label}
    </Text>
  )
}

function renderInline(text: string, linkers: ProseLinker[], tokenizer: RegExp): ReactNode[] {
  const anchoredLinkers = linkers.map((l) => ({ linker: l, test: anchored(l.pattern) }))
  return text
    .split(tokenizer)
    .filter((piece) => piece !== '' && piece !== undefined)
    .map((piece, i) => {
      if (anchored(BOLD).test(piece)) {
        return (
          <Text key={i} className="font-semibold text-text-primary">
            {piece.slice(2, -2)}
          </Text>
        )
      }
      if (anchored(CODE).test(piece)) {
        return (
          <Text key={i} className="font-mono text-text-primary">
            {piece.slice(1, -1)}
          </Text>
        )
      }
      const hit = anchoredLinkers.find((l) => l.test.test(piece))
      if (hit) return <LinkedRef key={i} linker={hit.linker} value={piece} />
      return <Text key={i}>{piece}</Text>
    })
}

interface BlockProps {
  block: ProseBlock
  inline: (text: string) => ReactNode[]
  size: ProseSize
}

function Block({ block, inline, size }: BlockProps) {
  const body = BODY_TEXT[size]
  if (block.type === 'code') return <CodeBlock code={block.text} lang={block.lang ?? ''} />
  if (block.type === 'table') return <ProseTable block={block} inline={inline} />
  if (block.type === 'h1' || block.type === 'h2') {
    return (
      <Typography variant={block.type === 'h1' ? 'h5' : 'h6'} className="mt-1.5 text-text-primary">
        {block.text}
      </Typography>
    )
  }
  if (block.type === 'h3') {
    return (
      <Typography variant="subtitle2" className="mt-1 font-bold text-text-primary">
        {inline(block.text)}
      </Typography>
    )
  }
  if (block.type === 'li') {
    return (
      <View className="flex-row gap-2 pl-1">
        <Text className={cn(body, 'text-text-brand')}>•</Text>
        <Typography variant="body2" className={cn('flex-1', body)}>
          {inline(block.text)}
        </Typography>
      </View>
    )
  }
  return (
    <Typography variant="body2" className={body}>
      {inline(block.text)}
    </Typography>
  )
}

/**
 * MarkdownProse — renders a small, predictable markdown subset as themed prose
 * and auto-links references the caller describes.
 *
 * It is deliberately not a full markdown engine: headings, bullet lists,
 * paragraphs, bold, code, fenced code blocks and pipe tables cover the notes, briefs and session logs this
 * system reads, and anything richer would need a design pass of its own.
 * Composes {@link Typography} and, for tables, `Table`. Used by `SessionDetail` (session logs) and the
 * initiative reader (brief and handoff prose).
 */
export function MarkdownProse({
  body,
  linkers = [],
  size = 'sm',
  className,
  testID,
}: MarkdownProseProps) {
  const blocks = useMemo(() => parseProseBlocks(body), [body])
  const tokenizer = useMemo(() => buildTokenizer(linkers), [linkers])
  const inline = (text: string) => renderInline(text, linkers, tokenizer)
  return (
    <View className={cn('gap-2', className)} testID={testID}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} inline={inline} size={size} />
      ))}
    </View>
  )
}
