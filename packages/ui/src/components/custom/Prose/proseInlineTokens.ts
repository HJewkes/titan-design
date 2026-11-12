import {
  MAX_INLINE_DEPTH,
  inlineScanner,
  type InlineScanner,
  type InlineToken,
} from './proseInlineScan'
import type { ProseSource } from './proseSource'

/** A link token's label and target, title dropped. */
export function linkParts(src: ProseSource, token: InlineToken): { label: string; target: string } {
  return {
    label: src.slice(token.innerStart, token.innerEnd),
    target: src.slice(token.targetStart!, token.targetEnd),
  }
}

interface PlainScan {
  src: ProseSource
  scan: InlineScanner
}

function plainRange(ctx: PlainScan, from: number, to: number, depth: number): string {
  if (depth >= MAX_INLINE_DEPTH) return ctx.src.slice(from, to)
  return ctx
    .scan(from, to)
    .map((token) => plainToken(ctx, token, depth))
    .join('')
}

function plainToken(ctx: PlainScan, token: InlineToken, depth: number): string {
  if (token.kind === 'text') return ctx.src.slice(token.start, token.end)
  if (token.kind === 'comment') return ''
  if (token.kind === 'code') return ctx.src.slice(token.innerStart, token.innerEnd)
  return plainRange(ctx, token.innerStart, token.innerEnd, depth + 1)
}

/** {@link plainInline} over any source; tests pass one that counts its reads. */
export function plainInlineSource(src: ProseSource): string {
  return plainRange({ src, scan: inlineScanner(src) }, 0, src.length, 0)
}

/** The words a reader sees, markup dropped: what a heading's slug and a screen reader's line are built from. */
export function plainInline(text: string): string {
  return plainInlineSource(text)
}
