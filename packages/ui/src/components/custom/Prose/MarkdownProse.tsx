// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, type ReactNode } from 'react'
import { Text, View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../Typography'

/** How a linked reference reads: brand for the domain's own ids, link for cross-references, muted for asides. */
export type ProseLinkTone = 'brand' | 'link' | 'muted'

/**
 * A pattern the prose auto-links. Patterns must not carry the `g` flag or
 * capture groups: the renderer combines them into one tokenizer.
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

export type ProseBlockType = 'h1' | 'h2' | 'h3' | 'li' | 'p'

export interface ProseBlock {
  type: ProseBlockType
  text: string
}

export interface MarkdownProseProps {
  /** Markdown source. Headings, bullet lists, paragraphs, bold and code are understood. */
  body: string
  /** Reference patterns to auto-link, tried in order. */
  linkers?: ProseLinker[]
  className?: string
  testID?: string
}

const BOLD = /\*\*[^*]+\*\*/
const CODE = /`[^`]+`/

/**
 * Splits markdown into the block kinds this renderer understands. Consecutive
 * text lines join into one paragraph; a blank line ends it. Deeper headings
 * flatten to h3, since session prose never needs more than three levels.
 */
export function parseProseBlocks(body: string): ProseBlock[] {
  const blocks: ProseBlock[] = []
  let paragraph: string[] = []
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') })
    paragraph = []
  }
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line) {
      flush()
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
    paragraph.push(line)
  }
  flush()
  return blocks
}

const TONE_CLASS: Record<ProseLinkTone, string> = {
  brand: 'font-semibold text-brand-primary',
  link: 'font-medium text-text-link',
  muted: 'text-text-tertiary',
}

function anchored(pattern: RegExp): RegExp {
  return new RegExp(`^(?:${pattern.source})$`)
}

/** One tokenizer for bold, code and every linker, so a span is classified exactly once. */
function buildTokenizer(linkers: ProseLinker[]): RegExp {
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

function Block({ block, inline }: { block: ProseBlock; inline: (text: string) => ReactNode[] }) {
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
        <Text className="text-brand-primary">•</Text>
        <Typography variant="body2" className="flex-1 text-text-secondary">
          {inline(block.text)}
        </Typography>
      </View>
    )
  }
  return (
    <Typography variant="body2" className="text-text-secondary">
      {inline(block.text)}
    </Typography>
  )
}

/**
 * MarkdownProse — renders a small, predictable markdown subset as themed prose
 * and auto-links references the caller describes.
 *
 * It is deliberately not a full markdown engine: headings, bullet lists,
 * paragraphs, bold and code cover the notes, briefs and session logs this
 * system reads, and anything richer would need a design pass of its own.
 * Composes {@link Typography}. Used by `SessionDetail` (session logs) and the
 * initiative reader (brief and handoff prose).
 */
export function MarkdownProse({ body, linkers = [], className, testID }: MarkdownProseProps) {
  const blocks = useMemo(() => parseProseBlocks(body), [body])
  const tokenizer = useMemo(() => buildTokenizer(linkers), [linkers])
  const inline = (text: string) => renderInline(text, linkers, tokenizer)
  return (
    <View className={cn('gap-2', className)} testID={testID}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} inline={inline} />
      ))}
    </View>
  )
}
