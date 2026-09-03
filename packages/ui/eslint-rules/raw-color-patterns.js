/**
 * Raw-colour detection, shared by the `no-raw-color` ESLint rule and the script
 * that regenerates its baseline.
 *
 * Deliberately one module: if the rule and the generator drifted apart, the
 * baseline would stop describing what the rule actually counts, and the ratchet
 * would quietly stop ratcheting.
 *
 * Hex is only one way a colour reaches the screen, so this covers the notations
 * that actually appear in a React Native + nativewind codebase: functional CSS
 * colours, Tailwind palette utilities, and the handful of bare CSS keywords that
 * get typed out of habit. `oklch`/`lab`/`lch` have no occurrences today and are
 * included so the first one is caught rather than grandfathered.
 */

/** `#abc`, `#abcd`, `#aabbcc`, `#aabbccdd`. */
const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/

/** `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`, `oklch(...)`, `lab(...)`, `lch(...)`. */
const FUNCTIONAL = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\s*\(/

/** Tailwind palette utility: `bg-red-500`, `text-slate-200`, `ring-cyan-400`. */
const TW_PALETTE =
  /\b(?:bg|text|border|from|via|to|fill|stroke|ring|shadow|decoration|outline|caret|accent|divide)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|[1-9]00|950)\b/

/** Tailwind achromatic utility: `bg-white`, `text-black`. */
const TW_ACHROMATIC = /\b(?:bg|text|border|fill|stroke|divide|ring)-(?:white|black)\b/

/** Tailwind arbitrary colour value: `bg-[#1C1C1C]`, `text-[rgb(0,0,0)]`. */
const TW_ARBITRARY = /\[(?:#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?)\([^\]]*\))\]/

/**
 * A bare CSS colour keyword used as a whole value.
 *
 * Anchored to the entire string so prose ("white text on black") and identifiers
 * ("whiteboard") never match — only `color: 'white'` style values do.
 * `transparent` is excluded on purpose: it encodes absence, not a colour, and
 * has no token equivalent.
 */
const NAMED_KEYWORD =
  /^(?:white|black|red|green|blue|gray|grey|silver|orange|purple|yellow|cyan|magenta|pink|brown|navy|teal|olive|maroon|lime|aqua|fuchsia)$/i

/**
 * Most specific first. `bg-[#1C1C1C]` is matched by TW_ARBITRARY *and* HEX, and
 * `[rgba(0,0,0,.5)]` by TW_ARBITRARY *and* FUNCTIONAL — whichever runs first
 * claims the span, and later patterns skip anything overlapping it. Without
 * that ordering those literals count twice, which both double-reports and
 * over-funds the baseline.
 */
const PATTERNS = [
  { re: TW_ARBITRARY, id: 'twArbitrary' },
  { re: FUNCTIONAL, id: 'functional' },
  { re: TW_PALETTE, id: 'twPalette' },
  { re: TW_ACHROMATIC, id: 'twAchromatic' },
  { re: HEX, id: 'hex' },
]

/**
 * Every raw colour in `text`, as `{ value, id }` pairs.
 *
 * Extracts the colour substrings rather than keying on the whole literal, so the
 * baseline stays stable when unrelated text moves — editing one class in
 * `"flex bg-red-500 p-2"` shouldn't re-flag the colour that was already there.
 * Values are lowercased so `#FFF` and `#fff` are the same debt.
 */
function extractRawColors(text) {
  if (typeof text !== 'string') return []
  const found = []
  /** Spans already claimed by a more specific pattern. */
  const claimed = []
  const overlaps = (start, end) => claimed.some(([s, e]) => start < e && end > s)

  for (const { re, id } of PATTERNS) {
    const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)
    for (const match of text.matchAll(global)) {
      const start = match.index
      const end = start + match[0].length
      if (overlaps(start, end)) continue
      claimed.push([start, end])
      found.push({ value: match[0].toLowerCase(), id, index: start })
    }
  }
  if (NAMED_KEYWORD.test(text.trim())) {
    found.push({ value: text.trim().toLowerCase(), id: 'named', index: 0 })
  }
  // Source order keeps the reported colour predictable and the baseline stable.
  return found.sort((a, b) => a.index - b.index)
}

module.exports = { PATTERNS, NAMED_KEYWORD, extractRawColors }
