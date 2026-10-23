import { Fragment, type ReactNode } from 'react'
import { Linking, Platform, Text, type TextProps } from 'react-native'
import { anchorProps } from '../../ui/link/anchorProps'
import { INLINE_SOURCES, inlineKindOf, innerText, linkParts } from './proseInlineTokens'
import { isExternalHref, safeHref } from './proseUrl'

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

/** A `[text](url)` link whose target passed the URL policy, as handed to `renderLink`. */
export interface ProseLink {
  /** The target as written: http(s), mailto or relative. */
  href: string
  /** The link text with its markup dropped. */
  label: string
  /** The link text, rendered: bold, italic and code spans kept. */
  children: ReactNode
  /** An absolute http(s) or mailto target. */
  isExternal: boolean
}

export interface ProseAnchorProps extends ProseLink {
  /** Owns navigation on a plain click (client routing); a modified click still opens a tab. */
  onPress?: () => void
}

/**
 * The inline anchor the prose renders by default: a `<Text>` that is an `<a href>` on web,
 * so it stays in the line. `Link` is a pressable view, which would break the paragraph.
 * External targets open in a new tab on web and through `Linking` on native.
 */
export function ProseAnchor({ href, isExternal, onPress, children }: ProseAnchorProps) {
  const openNative = !onPress && Platform.OS !== 'web' && isExternal
  const anchor = anchorProps({ href, isExternal, onPress: openNative ? () => void Linking.openURL(href) : onPress })
  const web = { href: anchor.href, hrefAttrs: anchor.hrefAttrs } as TextProps
  return (
    <Text
      {...web}
      onPress={anchor.onPress}
      accessibilityRole="link"
      className="font-medium text-text-link underline web:cursor-pointer"
      testID="prose-link"
    >
      {children}
    </Text>
  )
}

const TONE_CLASS: Record<ProseLinkTone, string> = {
  brand: 'font-semibold text-text-brand',
  link: 'font-medium text-text-link',
  muted: 'text-text-secondary',
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

export interface InlineContext {
  /** Each linker with its pattern anchored to a whole piece, in order. */
  linkers: { linker: ProseLinker; whole: RegExp }[]
  tokenizer: RegExp
  renderLink: (link: ProseLink) => ReactNode
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

/** One tokenizer for the markdown spans and every linker, so a span is classified exactly once. */
export function inlineContext(linkers: ProseLinker[]): Omit<InlineContext, 'renderLink'> {
  linkers.filter((l) => l.pattern.flags).forEach(warnDroppedFlags)
  const parts = [...INLINE_SOURCES, ...linkers.map((l) => l.pattern.source)]
  return {
    tokenizer: new RegExp(`(${parts.join('|')})`, 'g'),
    linkers: linkers.map((linker) => ({ linker, whole: new RegExp(`^(?:${linker.pattern.source})$`) })),
  }
}

function renderLinkPiece(piece: string, key: number, ctx: InlineContext): ReactNode {
  const { label, target } = linkParts(piece)
  const children = renderInline(label, ctx)
  const href = safeHref(target)
  if (href === null) {
    return (
      <Text key={key} className="text-text-secondary" testID="prose-link-refused">
        {children}
      </Text>
    )
  }
  const link = { href, label: innerText(piece, 'link'), children, isExternal: isExternalHref(href) }
  return <Fragment key={key}>{ctx.renderLink(link)}</Fragment>
}

function renderPiece(piece: string, key: number, ctx: InlineContext): ReactNode {
  const kind = inlineKindOf(piece)
  if (kind === 'comment') return null
  if (kind === 'link') return renderLinkPiece(piece, key, ctx)
  if (kind === 'code') {
    return (
      <Text key={key} className="font-mono text-text-primary">
        {innerText(piece, kind)}
      </Text>
    )
  }
  if (kind) {
    const className = kind === 'bold' ? 'font-semibold text-text-primary' : 'italic'
    return (
      <Text key={key} className={className}>
        {renderInline(innerText(piece, kind), ctx)}
      </Text>
    )
  }
  const hit = ctx.linkers.find(({ whole }) => whole.test(piece))
  if (hit) return <LinkedRef key={key} linker={hit.linker} value={piece} />
  return piece
}

/** Inline spans of one block: links, bold, italic, code, comments dropped, then each linker. */
export function renderInline(text: string, ctx: InlineContext): ReactNode[] {
  return text
    .split(ctx.tokenizer)
    .filter((piece) => piece !== '' && piece !== undefined)
    .map((piece, i) => renderPiece(piece, i, ctx))
}
