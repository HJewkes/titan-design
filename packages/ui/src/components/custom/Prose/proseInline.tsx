import { Fragment, type ReactNode } from 'react'
import { Linking, Platform, Text, type TextProps } from 'react-native'
import { anchorProps } from '../../ui/link/anchorProps'
import {
  MAX_INLINE_DEPTH,
  inlineScanner,
  type InlineScanner,
  type InlineToken,
} from './proseInlineScan'
import { linkParts, plainInline } from './proseInlineTokens'
import { isExternalHref, safeHref } from './proseUrl'

/** How a linked reference reads: brand for the domain's own ids, link for cross-references, muted for asides. */
export type ProseLinkTone = 'brand' | 'link' | 'muted'

/**
 * A pattern the prose auto-links. Patterns must not carry flags (`g`, `i`, `u`,
 * …) or capture groups: the renderer combines every pattern's source into one
 * tokenizer, so flags cannot be kept per linker. A flagged pattern is matched
 * as if it had none, and warns once in development. Spell case-insensitivity
 * out in the pattern, e.g. `/[Tt][Dd]-\d+/`. Linkers run on the plain text
 * between markdown spans, which is untrusted: a pattern must run in linear time.
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

/** A safe link plus the press handler that routes it. */
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
  const anchor = anchorProps({
    href,
    isExternal,
    onPress: openNative ? () => void Linking.openURL(href) : onPress,
  })
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
  /** Every linker in one pattern, or `null` when there are none. */
  tokenizer: RegExp | null
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

/** One tokenizer for every linker, so a piece of text is classified exactly once. */
export function inlineContext(linkers: ProseLinker[]): Omit<InlineContext, 'renderLink'> {
  linkers.filter((l) => l.pattern.flags).forEach(warnDroppedFlags)
  const sources = linkers.map((l) => l.pattern.source)
  return {
    tokenizer: sources.length ? new RegExp(`(${sources.join('|')})`, 'g') : null,
    linkers: linkers.map((linker) => ({
      linker,
      whole: new RegExp(`^(?:${linker.pattern.source})$`),
    })),
  }
}

/** Plain text, each linker match in it rendered as a reference. */
function renderText(text: string, ctx: InlineContext): ReactNode[] {
  const pieces = ctx.tokenizer ? text.split(ctx.tokenizer) : [text]
  return pieces
    .filter((piece) => piece !== '' && piece !== undefined)
    .map((piece, i) => {
      const hit = ctx.linkers.find(({ whole }) => whole.test(piece))
      return hit ? <LinkedRef key={i} linker={hit.linker} value={piece} /> : piece
    })
}

/** A text being rendered and the scanner over it. */
interface Rendering {
  text: string
  scan: InlineScanner
  ctx: InlineContext
}

interface Scanned {
  token: InlineToken
  depth: number
}

function renderLinkToken(r: Rendering, { token, depth }: Scanned, key: number) {
  const { label, target } = linkParts(r.text, token)
  const children = renderRange(r, token.innerStart, token.innerEnd, depth + 1)
  const href = safeHref(target)
  if (href === null) {
    return (
      <Text key={key} className="text-text-secondary" testID="prose-link-refused">
        {children}
      </Text>
    )
  }
  const link = { href, label: plainInline(label), children, isExternal: isExternalHref(href) }
  return <Fragment key={key}>{r.ctx.renderLink(link)}</Fragment>
}

function renderToken(r: Rendering, scanned: Scanned, key: number): ReactNode {
  const { token, depth } = scanned
  const { text } = r
  if (token.kind === 'comment') return null
  if (token.kind === 'link') return renderLinkToken(r, scanned, key)
  if (token.kind === 'text') {
    return <Fragment key={key}>{renderText(text.slice(token.start, token.end), r.ctx)}</Fragment>
  }
  if (token.kind === 'code') {
    return (
      <Text key={key} className="font-mono text-text-primary">
        {text.slice(token.innerStart, token.innerEnd)}
      </Text>
    )
  }
  const isBold = token.kind === 'bold'
  return (
    <Text
      key={key}
      className={isBold ? 'font-semibold text-text-primary' : 'italic'}
      testID={isBold ? undefined : 'prose-em'}
    >
      {renderRange(r, token.innerStart, token.innerEnd, depth + 1)}
    </Text>
  )
}

function renderRange(r: Rendering, from: number, to: number, depth: number): ReactNode[] {
  if (depth >= MAX_INLINE_DEPTH) return renderText(r.text.slice(from, to), r.ctx)
  return r.scan(from, to).map((token, i) => renderToken(r, { token, depth }, i))
}

/** Inline spans of one block: links, bold, italic, code, comments dropped; linkers on the text between. */
export function renderInline(text: string, ctx: InlineContext): ReactNode[] {
  return renderRange({ text, scan: inlineScanner(text), ctx }, 0, text.length, 0)
}
