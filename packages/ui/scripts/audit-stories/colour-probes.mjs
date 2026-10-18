// Colour probes (TD-935a): pure judges over one frame's collectLayout output and the page's token
// map (`ctx.tokens`, lowercase `#rrggbb` → `--color-*` names). Thresholds are the DOM checks of
// rows DR-CO-08, DR-CO-09 and DR-CO-11 in docs/design-rules.md.
import { deltaE, parseColour, toHex, toOklch } from './colour.mjs'

export const FULL_CHROMA = 'full-chroma'
export const GREY_ON_COLOUR = 'grey-on-colour'
export const CONCEPT_TOKEN_DRIFT = 'concept-token-drift'

/** The warning kinds this module emits. */
export const KINDS = Object.freeze([FULL_CHROMA, GREY_ON_COLOUR, CONCEPT_TOKEN_DRIFT])
/** Each kind's design rule id in docs/design-rules.md. */
export const RULES = Object.freeze({
  [FULL_CHROMA]: 'DR-CO-08',
  [GREY_ON_COLOUR]: 'DR-CO-09',
  [CONCEPT_TOKEN_DRIFT]: 'DR-CO-11',
})

/** DR-CO-08: a status, result or data colour renders at this strength or more. */
export const MIN_STRENGTH = 0.95
/** DR-CO-08: a background counts as a mark (a dot, a swatch) up to this size on both sides. */
export const MAX_MARK = 24
/** DR-CO-09: a backdrop is chromatic above this OKLCh chroma, inside the lightness band. */
export const CHROMATIC_C = 0.06
export const CHROMATIC_L = Object.freeze([0.35, 0.85])
/** Below this chroma a text colour is reported as neutral grey. */
export const NEUTRAL_C = 0.02
/** DR-CO-11: the most two instances of one concept may differ, as OKLab ΔE × 100. */
export const CONCEPT_DELTA_E = 2

// `-subtle` is the published wash. A `-rgb` token holds a bare channel triple that the page's
// canvas cannot parse, so tokenColours records it as #000000.
const STRONG_TOKEN = /^--color-(status|result|data)-(?!.*-(subtle|rgb)$)/
const ON_TOKEN = /^--color-on-/

const namesOf = (tokens, hex) => tokens?.[hex] ?? []
const named = (tokens, hex) => `${hex} (${namesOf(tokens, hex).join(', ') || 'raw'})`
const round = (v, places = 2) => Math.round(v * 10 ** places) / 10 ** places
const isMark = (n) => (n.box?.[2] ?? Infinity) <= MAX_MARK && (n.box?.[3] ?? Infinity) <= MAX_MARK

// Every colour a node paints: its own text, an svg mark, a small background mark.
function paintsOf(n) {
  const out = []
  if (n.text?.color) out.push(['text', n.text.color])
  if (n.paint) out.push(['svg', n.paint])
  if (isMark(n) && (parseColour(n.style?.backgroundColor)?.a ?? 0) > 0)
    out.push(['background', n.style.backgroundColor])
  return out
}

function fadedPaint(n, tokens) {
  const opacity = n.style?.effectiveOpacity ?? 1
  for (const [where, value] of paintsOf(n)) {
    const colour = parseColour(value)
    const hex = toHex(colour)
    if (!colour || !namesOf(tokens, hex).some((t) => STRONG_TOKEN.test(t))) continue
    const strength = Math.min(opacity, colour.a)
    if (strength >= MIN_STRENGTH) continue
    const how = colour.a < MIN_STRENGTH ? `alpha ${round(colour.a)}` : `opacity ${round(opacity)}`
    return `${where} ${named(tokens, hex)} at ${how} (floor ${MIN_STRENGTH})`
  }
  return null
}

/** DR-CO-08: a status, result or data colour washed out by opacity or alpha. Disabled is exempt. */
export function judgeFullChroma(layout, ctx = {}) {
  const out = []
  for (const n of layout?.nodes ?? []) {
    if (n.state?.disabled) continue
    const detail = fadedPaint(n, ctx.tokens)
    if (detail) out.push({ kind: FULL_CHROMA, selector: n.selector, detail })
  }
  return out
}

const isChromatic = ({ L, C }) => C > CHROMATIC_C && L >= CHROMATIC_L[0] && L <= CHROMATIC_L[1]

function greyOnColour(text, tokens) {
  if (text.backdropImage || !text.backdrop || !text.color) return null
  const fill = toOklch(text.backdrop)
  const ink = toHex(text.color)
  if (!fill || !ink || !isChromatic(fill)) return null
  if (namesOf(tokens, ink).some((t) => ON_TOKEN.test(t))) return null
  const neutral = toOklch(ink).C < NEUTRAL_C ? 'neutral ' : ''
  return (
    `${neutral}text ${named(tokens, ink)} on ${text.backdrop} (L ${round(fill.L)}, C ${round(fill.C)}) ` +
    `is not an on-* token value (chromatic: C > ${CHROMATIC_C}, L ${CHROMATIC_L.join('–')})`
  )
}

/** DR-CO-09: text on a chromatic fill whose colour is not one of the on-* token values. */
export function judgeGreyOnColour(layout, ctx = {}) {
  const out = []
  for (const n of layout?.nodes ?? []) {
    const detail = n.text ? greyOnColour(n.text, ctx.tokens) : null
    if (detail) out.push({ kind: GREY_ON_COLOUR, selector: n.selector, detail })
  }
  return out
}

// A concept's colour: own text, else a painted background, else an svg mark.
function conceptPaint(n) {
  if (n.text?.color) return n.text.color
  if ((parseColour(n.style?.backgroundColor)?.a ?? 0) > 0) return n.style.backgroundColor
  return n.paint ?? null
}

// concept → member nodes, from data-concept and the story's declared map.
function conceptMembers(layout) {
  const byId = new Map((layout?.nodes ?? []).map((n) => [n.id, n]))
  const members = new Map()
  const add = (name, n) => {
    if (!n) return
    if (!members.has(name)) members.set(name, new Set())
    members.get(name).add(n)
  }
  for (const n of byId.values()) if (n.concept) add(n.concept, n)
  for (const [name, ids] of Object.entries(layout?.audit?.concepts ?? {}))
    for (const id of ids) add(name, byId.get(id))
  return { byId, members }
}

// A member that paints nothing itself takes the first painted node inside it, in document order.
function memberPaint(member, nodes, byId) {
  const own = conceptPaint(member)
  if (own) return own
  const inside = (n) => {
    for (let p = byId.get(n.parent); p; p = byId.get(p.parent)) if (p === member) return true
    return false
  }
  for (const n of nodes) {
    const paint = conceptPaint(n)
    if (paint && inside(n)) return paint
  }
  return null
}

function maxDelta(hexes) {
  let max = 0
  for (let i = 0; i < hexes.length; i++)
    for (let j = i + 1; j < hexes.length; j++) max = Math.max(max, deltaE(hexes[i], hexes[j]))
  return max
}

/** DR-CO-11: two instances of one concept painted more than ΔE 2 apart. One finding per concept. */
export function judgeConceptTokenDrift(layout, ctx = {}) {
  const { byId, members } = conceptMembers(layout)
  const nodes = layout?.nodes ?? []
  const out = []
  for (const [name, set] of members) {
    const painted = [...set]
      .map((m) => [m, toHex(memberPaint(m, nodes, byId))])
      .filter(([, hex]) => hex)
    const hexes = painted.map(([, hex]) => hex)
    const max = maxDelta(hexes)
    if (max <= CONCEPT_DELTA_E) continue
    const counts = new Map()
    for (const hex of hexes) counts.set(hex, (counts.get(hex) ?? 0) + 1)
    const listed = [...counts].map(([hex, count]) => `${named(ctx.tokens, hex)} ×${count}`)
    const detail = `concept "${name}": ${listed.join(', ')}; max ΔE ${round(max, 1)} (limit ${CONCEPT_DELTA_E})`
    out.push({ kind: CONCEPT_TOKEN_DRIFT, selector: painted[0][0].selector, detail })
  }
  return out
}

/** judge(layout, ctx): findings `{ kind, selector, detail }`. */
export function judge(layout, ctx = {}) {
  return [
    ...judgeFullChroma(layout, ctx),
    ...judgeGreyOnColour(layout, ctx),
    ...judgeConceptTokenDrift(layout, ctx),
  ]
}
