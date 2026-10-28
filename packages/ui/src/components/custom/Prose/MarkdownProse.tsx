// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, type ReactNode } from 'react'
import { Text, View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Alert, AlertTitle, type AlertStatus } from '../../ui/alert'
import { Typography } from '../../ui/typography'
import { parseProseBlocks } from './parseProseBlocks'
import { CodeBlock, ProseTable } from './ProseBlocks'
import {
  ProseAnchor,
  inlineContext,
  renderInline,
  type ProseLink,
  type ProseLinker,
} from './proseInline'
import type { ProseBlock, ProseCalloutKind } from './proseTypes'

export type { ProseBlock, ProseBlockType, ProseCalloutKind } from './proseTypes'
export { parseProseBlocks } from './parseProseBlocks'
export { ProseAnchor } from './proseInline'
export type { ProseAnchorProps, ProseLink, ProseLinker, ProseLinkTone } from './proseInline'
export { safeHref } from './proseUrl'
export { slugify } from './proseSlug'
export { plainInline } from './proseInlineTokens'

export type ProseSize = 'sm' | 'md'

/** Returns spans for a fenced block's code, or `null` to show it plain. It runs during render. */
export type ProseHighlighter = (code: string, lang: string) => ReactNode

export interface MarkdownProseProps {
  /**
   * Markdown source. Headings (with anchor ids), bullet and ordered lists (nested), paragraphs,
   * bold, italic, code, `[text](url)` links, fenced code, pipe tables and `::: tip|info|warning|danger`
   * containers are understood. A leading YAML frontmatter block and HTML comments are dropped.
   */
  body: string
  /** Reference patterns to auto-link, tried in order. */
  linkers?: ProseLinker[]
  /** `md` is one step up from the dense default, in primary text colour. */
  size?: ProseSize
  /**
   * Renders the spans of `body` with no block wrapper and no type style of its own, for a line
   * inside the caller's own `Text`. Block markup reads as text.
   */
  inline?: boolean
  /**
   * Renders a `[text](url)` link whose target passed the URL policy (http(s), mailto, relative);
   * any other target shows its text and links nowhere. Defaults to {@link ProseAnchor}; pass one
   * wrapping it with an `onPress` for client routing.
   */
  renderLink?: (link: ProseLink) => ReactNode
  /** Highlights fenced code. No highlighter is bundled. */
  highlight?: ProseHighlighter
  className?: string
  testID?: string
}

// One step denser than body2, with a 20px line so long logs stay readable at that size.
const BODY_TEXT: Record<ProseSize, string> = {
  sm: 'text-xs leading-5 text-text-secondary',
  md: 'text-sm leading-5 text-text-primary',
}
const CALLOUT_STATUS: Record<ProseCalloutKind, AlertStatus> = {
  tip: 'success',
  info: 'info',
  warning: 'warning',
  danger: 'error',
}

interface RenderContext {
  inline: (text: string) => ReactNode[]
  size: ProseSize
  highlight?: ProseHighlighter
}

interface BlockProps {
  block: ProseBlock
  ctx: RenderContext
}

function Heading({ block, ctx }: BlockProps) {
  const isTitle = block.type === 'h1' || block.type === 'h2'
  return (
    <Typography
      variant={isTitle ? (block.type === 'h1' ? 'h5' : 'h6') : 'subtitle2'}
      className={isTitle ? 'mt-1.5 text-text-primary' : 'mt-1 font-bold text-text-primary'}
      accessibilityRole="header"
      aria-level={block.level}
      nativeID={block.id}
    >
      {ctx.inline(block.text)}
    </Typography>
  )
}

function ListItem({ block, ctx }: BlockProps) {
  const body = BODY_TEXT[ctx.size]
  return (
    <View role="listitem" className="flex-row gap-2 pl-1">
      <Text className={cn(body, 'text-text-brand')} aria-hidden={!block.ordered}>
        {block.ordered ? `${block.n}.` : '•'}
      </Text>
      <View className="flex-1 gap-1">
        {block.text ? (
          <Typography variant="body2" className={body}>
            {ctx.inline(block.text)}
          </Typography>
        ) : null}
        {block.children ? <BlockList blocks={block.children} ctx={ctx} /> : null}
      </View>
    </View>
  )
}

function Callout({ block, ctx }: BlockProps) {
  const kind = block.kind ?? 'info'
  return (
    <Alert
      status={CALLOUT_STATUS[kind]}
      role="note"
      accessibilityRole={undefined}
      testID={`prose-callout-${kind}`}
    >
      <AlertTitle>{block.title ? ctx.inline(block.title) : kind.toUpperCase()}</AlertTitle>
      <BlockList blocks={block.children ?? []} ctx={ctx} />
    </Alert>
  )
}

function Block({ block, ctx }: BlockProps) {
  if (block.type === 'code') {
    const lang = block.lang ?? ''
    return (
      <CodeBlock code={block.text} lang={lang} highlighted={ctx.highlight?.(block.text, lang)} />
    )
  }
  if (block.type === 'table') return <ProseTable block={block} inline={ctx.inline} />
  if (block.type === 'callout') return <Callout block={block} ctx={ctx} />
  if (block.level !== undefined) return <Heading block={block} ctx={ctx} />
  return (
    <Typography variant="body2" className={BODY_TEXT[ctx.size]}>
      {ctx.inline(block.text)}
    </Typography>
  )
}

/** Consecutive list items of one kind form one list, so web gets a list with its items. */
function groupLists(blocks: ProseBlock[]): (ProseBlock | ProseBlock[])[] {
  const groups: (ProseBlock | ProseBlock[])[] = []
  for (const block of blocks) {
    const last = groups[groups.length - 1]
    if (block.type !== 'li') groups.push(block)
    else if (Array.isArray(last) && !!last[0]!.ordered === !!block.ordered) last.push(block)
    else groups.push([block])
  }
  return groups
}

function BlockList({
  blocks,
  ctx,
  className,
  testID,
}: {
  blocks: ProseBlock[]
  ctx: RenderContext
  className?: string
  testID?: string
}) {
  return (
    <View className={cn('gap-2', className)} testID={testID}>
      {groupLists(blocks).map((group, i) =>
        Array.isArray(group) ? (
          <View key={i} role="list" className="gap-1">
            {group.map((item, j) => (
              <ListItem key={j} block={item} ctx={ctx} />
            ))}
          </View>
        ) : (
          <Block key={i} block={group} ctx={ctx} />
        )
      )}
    </View>
  )
}

const defaultRenderLink = (link: ProseLink) => <ProseAnchor {...link} />

/**
 * MarkdownProse — renders a predictable markdown subset as themed prose and
 * auto-links references the caller describes.
 *
 * It is deliberately not a full markdown engine: it covers the notes, briefs and session logs this
 * system reads and the docs site's pages, and anything richer would need a design pass of its own.
 * It renders on a server: nothing reads `window` or `document` during render.
 * Composes {@link Typography}, `Alert` for containers and, for tables, `Table`. Used by `SessionDetail`
 * (session logs) and the initiative reader (brief and handoff prose).
 */
export function MarkdownProse({
  body,
  linkers = [],
  size = 'sm',
  inline: isInline = false,
  renderLink = defaultRenderLink,
  highlight,
  className,
  testID,
}: MarkdownProseProps) {
  const blocks = useMemo(() => (isInline ? [] : parseProseBlocks(body)), [body, isInline])
  const matchers = useMemo(() => inlineContext(linkers), [linkers])
  const inline = (text: string) => renderInline(text, { ...matchers, renderLink })
  if (isInline) {
    return (
      <Text className={className} testID={testID}>
        {inline(body.replace(/\s*\n\s*/g, ' '))}
      </Text>
    )
  }
  return (
    <BlockList
      blocks={blocks}
      ctx={{ inline, size, highlight }}
      className={className}
      testID={testID}
    />
  )
}
