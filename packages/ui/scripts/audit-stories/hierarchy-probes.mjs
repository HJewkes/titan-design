// Hierarchy and salience probes (TD-936): pure judges over one frame's collectLayout output, its
// story and the page's token map (`ctx.tokens`, lowercase `#rrggbb` → `--color-*` names). Thresholds
// are the DOM checks of rows DR-CO-03, DR-CO-04, DR-CO-06 and DR-CO-07 in docs/design-rules.md.
// CO-04, CO-06 and CO-07 are judgement (J) rows: their warnings are proxies a reviewer confirms, so
// RUBRIC lists them as critique rubric rows.
import { contrastRatio, parseColour, toHex, toOklch } from './colour.mjs'
import { inInstance, instanceRoots, isPageScope, isSpecimen } from './instances.mjs'
import { index } from './layout-probes.mjs'

export const ROLE_ORDER = 'role-order'
export const SALIENCE_TIE = 'salience-tie'
export const HUE_BUDGET = 'hue-budget'
export const STATE_CARRIERS = 'state-carriers'

/** The warning kinds this module emits. */
export const KINDS = Object.freeze([ROLE_ORDER, SALIENCE_TIE, HUE_BUDGET, STATE_CARRIERS])
/** Each kind's design rule id in docs/design-rules.md. */
export const RULES = Object.freeze({
  [ROLE_ORDER]: 'DR-CO-03',
  [SALIENCE_TIE]: 'DR-CO-04',
  [HUE_BUDGET]: 'DR-CO-06',
  [STATE_CARRIERS]: 'DR-CO-07',
})
/** The J rows: a warning here is a prompt for the critique rubric, not a verdict. */
export const RUBRIC = Object.freeze([
  Object.freeze({
    rule: 'DR-CO-04',
    kind: SALIENCE_TIE,
    question: 'Does the component have one most-salient text element?',
  }),
  Object.freeze({
    rule: 'DR-CO-06',
    kind: HUE_BUDGET,
    question: 'Does the component show at most 2 non-neutral hues outside data marks?',
  }),
  Object.freeze({
    rule: 'DR-CO-07',
    kind: STATE_CARRIERS,
    question: "Does one element carry the state's colour, with text or a glyph carrying the rest?",
  }),
])

/** DR-CO-03: text roles from most to least prominent, and the least step between adjacent ones. */
export const TEXT_ROLES = Object.freeze(['primary', 'secondary', 'tertiary'])
export const ROLE_STEP = 1.25
/** DR-CO-04: templates whose salience is within this share of the top one tie with it. */
export const SALIENCE_TOLERANCE = 0.05
/** DR-CO-06: a paint is a hue above this OKLCh chroma; hues within HUE_SPAN degrees cluster. */
export const HUE_C = 0.06
export const HUE_SPAN = 30
export const MAX_HUES = 2
/** DR-CO-06: an svg larger than this on both sides is a chart, whose marks are exempt. */
export const MAX_ICON = 48
/** DR-CO-07: elements per instance that may carry one state colour. */
export const MAX_CARRIERS = 2
/** A background mark (a dot, a swatch) is at most this size on both sides. */
export const MAX_MARK = 24

const round = (v, places = 2) => Math.round(v * 10 ** places) / 10 ** places
const words = (t) => (t.ownText ?? '').slice(0, 20)
const namesOf = (tokens, hex) => tokens?.[hex] ?? []
const visible = (value) => (parseColour(value)?.a ?? 0) > 0
const boxSide = (n, i) => n.box?.[i] ?? Infinity
const fitsIn = (n, size) => boxSide(n, 2) <= size && boxSide(n, 3) <= size
const isText = (n) => n.text?.fontSize && n.text.color
const enabled = (n) => !n.state?.disabled

// Component stories answer per instance. Page, shell and Foundations stories hold many components.
function instanceGroups(layout, story, members) {
  if (isSpecimen(story) || isPageScope(story)) return []
  const { byId } = index(layout?.nodes ?? [])
  return instanceRoots({ nodes: layout?.nodes ?? [] }, story)
    .map((rootId) => ({
      selector: rootId === null ? members[0]?.selector : byId.get(rootId)?.selector,
      members: members.filter((n) => inInstance(n.id, rootId)),
    }))
    .filter((g) => g.members.length)
    .map((g) => ({ ...g, selector: g.selector ?? g.members[0].selector }))
}

// --- DR-CO-03 role-order

const ROLE_TOKEN = /^--color-text-(primary|secondary|tertiary)$/

function roleOf(n, tokens) {
  for (const name of namesOf(tokens, toHex(n.text.color))) {
    const match = ROLE_TOKEN.exec(name)
    if (match) return match[1]
  }
  return null
}

// plane → role → the text nodes of that role on that plane, with their contrast against it.
function rolesByPlane(layout, tokens) {
  const planes = new Map()
  for (const n of (layout?.nodes ?? []).filter((x) => isText(x) && enabled(x))) {
    const role = roleOf(n, tokens)
    if (!role || n.text.backdropImage || !n.text.backdrop) continue
    if (!planes.has(n.text.backdrop)) planes.set(n.text.backdrop, new Map())
    const roles = planes.get(n.text.backdrop)
    if (!roles.has(role)) roles.set(role, [])
    roles.get(role).push({ n, ratio: contrastRatio(n.text.color, n.text.backdrop) })
  }
  return planes
}

function orderBreach(upper, lower) {
  const weakest = upper.reduce((a, b) => (b.ratio < a.ratio ? b : a))
  const strongest = lower.reduce((a, b) => (b.ratio > a.ratio ? b : a))
  const step = weakest.ratio / strongest.ratio
  if (step >= ROLE_STEP) return null
  return { weakest, strongest, step }
}

/** DR-CO-03: on one plane, a text role whose contrast is not ROLE_STEP× the next role down. */
export function judgeRoleOrder(layout, ctx = {}) {
  const out = []
  for (const [plane, roles] of rolesByPlane(layout, ctx.tokens)) {
    const present = TEXT_ROLES.filter((r) => roles.has(r))
    for (let i = 0; i + 1 < present.length; i++) {
      const [hi, lo] = [present[i], present[i + 1]]
      const breach = orderBreach(roles.get(hi), roles.get(lo))
      if (!breach) continue
      const detail =
        `on ${plane}: ${hi} ${round(breach.weakest.ratio)}:1 vs ${lo} ${round(breach.strongest.ratio)}:1 ` +
        `= ${round(breach.step)}× (least step ${ROLE_STEP}×)`
      out.push({ kind: ROLE_ORDER, selector: breach.strongest.n.selector, detail })
    }
  }
  return out
}

// --- DR-CO-04 salience-tie

/** Salience proxy: size × weight / 400 × WCAG contrast against the text's plane. */
export function salienceOf(text) {
  const ratio = text.backdrop ? contrastRatio(text.color, text.backdrop) : null
  if (!ratio || !Number.isFinite(text.fontWeight)) return null
  return text.fontSize * (text.fontWeight / 400) * ratio
}

const templateOf = (t) => `${t.fontSize}px/${t.fontWeight}/${toHex(t.color)}`

// template → { salience, node }, keeping each template's most salient node.
function topTemplates(members) {
  const byTemplate = new Map()
  for (const n of members) {
    const salience = salienceOf(n.text)
    if (salience === null) continue
    const key = templateOf(n.text)
    if ((byTemplate.get(key)?.salience ?? -1) < salience) byTemplate.set(key, { salience, n })
  }
  const ranked = [...byTemplate].sort((a, b) => b[1].salience - a[1].salience)
  const top = ranked[0]?.[1].salience ?? 0
  return ranked.filter(([, t]) => t.salience >= top * (1 - SALIENCE_TOLERANCE))
}

/** DR-CO-04: two or more distinct text templates tie for the most salient in one instance. */
export function judgeSalienceTie(layout, ctx = {}) {
  const texts = (layout?.nodes ?? []).filter(
    (n) => isText(n) && enabled(n) && !n.text.backdropImage
  )
  return instanceGroups(layout, ctx.story, texts).flatMap(({ selector, members }) => {
    const tied = topTemplates(members)
    if (tied.length < 2) return []
    const listed = tied.map(([key, t]) => `"${words(t.n.text)}" ${key} = ${round(t.salience, 1)}`)
    const detail = `${tied.length} templates tie for most salient (within ${SALIENCE_TOLERANCE * 100}%): ${listed.join('; ')}`
    return [{ kind: SALIENCE_TIE, selector, detail }]
  })
}

// --- DR-CO-06 hue-budget

const DATA_TOKEN = /^--color-(data|dataviz)-/
const isChart = (n) => n.tag === 'svg' && !fitsIn(n, MAX_ICON)

// Every colour a node paints: text, an svg mark, a filled box.
function paintsOf(n) {
  const out = []
  if (n.text?.color) out.push(n.text.color)
  if (n.paint) out.push(n.paint)
  if (n.paints && visible(n.style?.backgroundColor)) out.push(n.style.backgroundColor)
  return out.filter(visible)
}

function huesOf(members, tokens) {
  const hues = []
  for (const n of members) {
    if (isChart(n)) continue
    for (const paint of paintsOf(n)) {
      const hex = toHex(paint)
      if (namesOf(tokens, hex).some((t) => DATA_TOKEN.test(t))) continue
      const lch = toOklch(hex)
      if (lch.C > HUE_C) hues.push({ h: lch.h, hex })
    }
  }
  return hues.sort((a, b) => a.h - b.h)
}

/** Hue clusters: sorted hues split where a gap is over HUE_SPAN, rejoined across 360°. */
export function hueClusters(hues) {
  const clusters = []
  for (const hue of hues) {
    const last = clusters.at(-1)
    if (last && hue.h - last.at(-1).h <= HUE_SPAN) last.push(hue)
    else clusters.push([hue])
  }
  if (clusters.length > 1 && clusters[0][0].h + 360 - clusters.at(-1).at(-1).h <= HUE_SPAN)
    clusters[0].unshift(...clusters.pop())
  return clusters
}

const clusterLabel = (c) =>
  `${Math.round(c[0].h)}° (${[...new Set(c.map((x) => x.hex))].join(', ')})`

/** DR-CO-06: more than MAX_HUES non-neutral hue clusters in one instance, data marks aside. */
export function judgeHueBudget(layout, ctx = {}) {
  const members = (layout?.nodes ?? []).filter(enabled)
  return instanceGroups(layout, ctx.story, members).flatMap(({ selector, members: own }) => {
    const clusters = hueClusters(huesOf(own, ctx.tokens))
    if (clusters.length <= MAX_HUES) return []
    const detail =
      `${clusters.length} hues (limit ${MAX_HUES}; C > ${HUE_C}, ${HUE_SPAN}° clusters): ` +
      clusters.map(clusterLabel).join(', ')
    return [{ kind: HUE_BUDGET, selector, detail }]
  })
}

// --- DR-CO-07 state-carriers

// Every shade of a family (-subtle, -strong, -vivid-*) is that family. A `-rgb` token holds a bare
// channel triple that tokenColours records as #000000, so it names nothing.
const FAMILY_TOKEN = /^--color-(status|result)-([a-z]+)(?!.*-rgb$)/
const STATE_TEXT_TOKEN = /^--color-text-(success|warning|error|info)$/

/** The `status-*` or `result-*` family a colour's token names resolve to, else null. */
export function stateFamilyOf(hex, tokens) {
  for (const name of namesOf(tokens, hex)) {
    const family = FAMILY_TOKEN.exec(name)
    if (family) return `${family[1]}-${family[2]}`
    const text = STATE_TEXT_TOKEN.exec(name)
    if (text) return `status-${text[1]}`
  }
  return null
}

function carrierRole(n) {
  if (n.tag === 'svg' || (fitsIn(n, MAX_MARK) && !n.text)) return 'mark'
  if (n.paints && visible(n.style?.backgroundColor)) return 'badge'
  return 'label'
}

// family → the nodes that paint it, each node once.
function carriersByFamily(members, tokens) {
  const families = new Map()
  for (const n of members) {
    for (const family of new Set(paintsOf(n).map((p) => stateFamilyOf(toHex(p), tokens)))) {
      if (!family) continue
      if (!families.has(family)) families.set(family, [])
      families.get(family).push(n)
    }
  }
  return families
}

/** DR-CO-07: more than MAX_CARRIERS elements in one instance paint one state family. */
export function judgeStateCarriers(layout, ctx = {}) {
  const members = (layout?.nodes ?? []).filter(enabled)
  return instanceGroups(layout, ctx.story, members).flatMap(({ members: own }) =>
    [...carriersByFamily(own, ctx.tokens)]
      .filter(([, nodes]) => nodes.length > MAX_CARRIERS)
      .map(([family, nodes]) => {
        const roles = nodes.map(carrierRole)
        const detail = `${nodes.length} elements carry ${family} (limit ${MAX_CARRIERS}): ${roles.join(' + ')}`
        return { kind: STATE_CARRIERS, selector: nodes[0].selector, detail }
      })
  )
}

/** judge(layout, ctx): findings `{ kind, selector, detail }`. */
export function judge(layout, ctx = {}) {
  return [
    ...judgeRoleOrder(layout, ctx),
    ...judgeSalienceTie(layout, ctx),
    ...judgeHueBudget(layout, ctx),
    ...judgeStateCarriers(layout, ctx),
  ]
}
