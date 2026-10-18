// Typography probes (TD-938): pure judges over one frame's collectLayout output, its story and the
// tree's mono family (`ctx.fonts`). Thresholds are the DOM checks of rows DR-TY-01, DR-TY-03,
// DR-TY-06, DR-TY-10, DR-TY-11, DR-TY-12 and DR-CO-05 in docs/design-rules.md.
import { toHex } from './colour.mjs'
import { isMono } from './font-config.mjs'
import { inInstance, instanceRoots, isPageScope, isSpecimen } from './instances.mjs'
import { index, isFlexRow, textByRow, visualLines } from './layout-probes.mjs'

export const CAPS_TRACKING = 'caps-tracking'
export const CAPS_LABEL_LOOKS = 'caps-label-looks'
export const TEXT_FLOOR = 'text-floor'
export const SIZES_PER_COMPONENT = 'sizes-per-component'
export const WEIGHTS_FACES = 'weights-faces'
export const LOWERCASE_TRACKING = 'lowercase-tracking'
export const LINE_STYLE_BUDGET = 'line-style-budget'

/** The warning kinds this module emits. */
export const KINDS = Object.freeze([
  CAPS_TRACKING,
  CAPS_LABEL_LOOKS,
  TEXT_FLOOR,
  SIZES_PER_COMPONENT,
  WEIGHTS_FACES,
  LOWERCASE_TRACKING,
  LINE_STYLE_BUDGET,
])
/** Each kind's design rule id in docs/design-rules.md. */
export const RULES = Object.freeze({
  [CAPS_TRACKING]: 'DR-TY-01',
  [CAPS_LABEL_LOOKS]: 'DR-TY-03',
  [TEXT_FLOOR]: 'DR-TY-06',
  [SIZES_PER_COMPONENT]: 'DR-TY-10',
  [WEIGHTS_FACES]: 'DR-TY-11',
  [LOWERCASE_TRACKING]: 'DR-TY-12',
  [LINE_STYLE_BUDGET]: 'DR-CO-05',
})

/** DR-TY-01: caps tracking as a share of the font size. */
export const CAPS_TRACKING_RANGE = Object.freeze([0.05, 0.12])
/** DR-TY-03: caps text at this size or less is a micro-label. */
export const LABEL_MAX_SIZE = 14
export const LOOKS_PER_PAGE = 2
export const LOOKS_PER_COMPONENT = 1
/** DR-TY-06: the error tier, reported as a warning until audit:stories has a ratchet baseline. */
export const TEXT_FLOOR_PX = 10
/** DR-TY-10. */
export const SIZES_PER_INSTANCE = 4
export const SIZES_PER_PAGE = 6
/** DR-TY-11. */
export const WEIGHTS_PER_INSTANCE = 2
export const MIN_WEIGHT = 400
export const FAMILIES_PER_FRAME = 3
/** DR-TY-12: open tracking on mixed case, from this size up; tight tracking at any size. */
export const LOWERCASE_OPEN_MAX = 0.02
export const LOWERCASE_OPEN_FROM = 12
export const LOWERCASE_TIGHT_MIN = -0.03
/** DR-CO-05: a size step this large reads as hero plus unit. */
export const LINE_HERO_RATIO = 1.5
// font-size-near-miss owns size steps up to this (its FONT_SIZE_NEAR_MISS_MAX, which
// layout-probes.mjs does not export); type-probes.test.mjs pins the hand-off between the two.
export const LINE_NEAR_MISS_MAX = 2
export const LINE_MAX_WEIGHTS = 2
export const LINE_MAX_COLOURS = 2

const pct = (r) => `${+(r * 100).toFixed(1)}%`
const px = (v) => `${+v.toFixed(2)}px`
const quarter = (v) => Math.round(v * 4) / 4 + 0
const distinct = (values) => [...new Set(values)]
const sortedNumbers = (values) => distinct(values).sort((a, b) => a - b)
// Rounded so 0.6px on 12px reads as 5%, not a float hair under it.
const trackingOf = (t) =>
  t.fontSize ? Math.round(((t.letterSpacing ?? 0) / t.fontSize) * 1e4) / 1e4 : 0
const words = (t) => (t.ownText ?? '').slice(0, 20)

/** Caps text: uppercase-transformed, or own text with a run of 3 capitals and no lowercase letter. */
export function isCaps(text) {
  const own = text?.ownText ?? ''
  if (!/\p{L}/u.test(own)) return false
  if (text.textTransform === 'uppercase') return true
  return /\p{Lu}{3,}/u.test(own) && !/\p{Ll}/u.test(own)
}

const texts = (layout) => (layout?.nodes ?? []).filter((n) => n.text && n.text.fontSize)

// --- DR-TY-01 caps-tracking

/** Caps text that is not mono, tracked outside 5–12% of its size. */
export function judgeCapsTracking(layout, ctx = {}) {
  const [lo, hi] = CAPS_TRACKING_RANGE
  const out = []
  for (const n of texts(layout)) {
    if (!isCaps(n.text) || isMono(n.text.family, ctx.fonts)) continue
    const ratio = trackingOf(n.text)
    if (ratio >= lo && ratio <= hi) continue
    const detail =
      `caps "${words(n.text)}" ${px(n.text.fontSize)} tracked ${px(n.text.letterSpacing ?? 0)} ` +
      `= ${pct(ratio)} (range ${pct(lo)}–${pct(hi)})`
    out.push({ kind: CAPS_TRACKING, selector: n.selector, detail })
  }
  return out
}

// --- DR-TY-06 text-floor

/** Text under the 10px floor. `small-text` (under 11px) still reports the same text. */
export function judgeTextFloor(layout) {
  return texts(layout)
    .filter((n) => n.text.fontSize < TEXT_FLOOR_PX)
    .map((n) => ({
      kind: TEXT_FLOOR,
      selector: n.selector,
      detail:
        `${px(n.text.fontSize)} text under the ${TEXT_FLOOR_PX}px floor ` +
        '(error tier; reported as a warning until a ratchet baseline exists)',
    }))
}

// --- DR-TY-12 lowercase-tracking

function lowercaseBreach(t) {
  const ratio = trackingOf(t)
  if (ratio < LOWERCASE_TIGHT_MIN) return `${pct(ratio)} (floor ${pct(LOWERCASE_TIGHT_MIN)})`
  if (ratio > LOWERCASE_OPEN_MAX && t.fontSize >= LOWERCASE_OPEN_FROM)
    return `${pct(ratio)} (limit ${pct(LOWERCASE_OPEN_MAX)} at ${LOWERCASE_OPEN_FROM}px or more)`
  return null
}

/** Mixed-case text tracked open at 12px or more, or tight at any size. */
export function judgeLowercaseTracking(layout) {
  const out = []
  for (const n of texts(layout)) {
    if (n.text.textTransform === 'uppercase' || !/\p{Ll}/u.test(n.text.ownText ?? '')) continue
    const breach = lowercaseBreach(n.text)
    if (!breach) continue
    const detail = `mixed-case ${px(n.text.fontSize)} tracked ${px(n.text.letterSpacing)} = ${breach}`
    out.push({ kind: LOWERCASE_TRACKING, selector: n.selector, detail })
  }
  return out
}

// --- scopes for the budgets (DR-TY-03, DR-TY-10, DR-TY-11)

// Component stories answer per instance; page and shell stories per frame. Specimens skip budgets.
function budgetScopes(layout, story) {
  if (isSpecimen(story)) return { instances: [], page: false }
  if (isPageScope(story)) return { instances: [], page: true }
  return { instances: instanceRoots({ nodes: layout?.nodes ?? [] }, story), page: false }
}

function scopeSelector(byId, rootId, members) {
  return rootId === null ? members[0].selector : byId.get(rootId)?.selector ?? members[0].selector
}

// Each instance's members, keyed by root id, then the frame when page budgets apply.
function scopedGroups(layout, story, members) {
  const { instances, page } = budgetScopes(layout, story)
  const groups = instances.map((rootId) => ({
    scope: rootId === null ? 'component' : 'instance',
    rootId,
    members: members.filter((n) => inInstance(n.id, rootId)),
  }))
  if (page) groups.push({ scope: 'page', rootId: null, members })
  return groups.filter((g) => g.members.length)
}

// --- DR-TY-03 caps-label-looks

const lookOf = (t) =>
  `${px(t.fontSize)}/${t.fontWeight}/${px(quarter(t.letterSpacing ?? 0))}/${t.family}`

// A label's state is its own or its nearest interactive ancestor's (a selected tab's label).
function stateKey(n, byId) {
  let at = n
  while (at && !at.interactive) at = byId.get(at.parent)
  const s = { ...(at ?? n).state, disabled: n.state?.disabled }
  return [s.selected, s.current, s.pressed, s.checked, s.disabled].join('|')
}

/**
 * Distinct looks among caps labels. Labels that differ only in colour count as one look when their
 * states differ, so a selected tab's label is not a second treatment.
 */
export function labelLooks(labels, byId) {
  const byLook = new Map()
  for (const n of labels) {
    const look = lookOf(n.text)
    if (!byLook.has(look)) byLook.set(look, new Map())
    const byState = byLook.get(look)
    const key = stateKey(n, byId)
    if (!byState.has(key)) byState.set(key, new Set())
    byState.get(key).add(toHex(n.text.color) ?? 'none')
  }
  return [...byLook].flatMap(([look, byState]) => {
    const widest = [...byState.values()].reduce((a, b) => (b.size > a.size ? b : a))
    return [...widest].map((hex) => `${look}/${hex}`)
  })
}

const isLabel = (n) => isCaps(n.text) && n.text.fontSize <= LABEL_MAX_SIZE

function lookFindings(layout, story, byId) {
  const labels = texts(layout).filter(isLabel)
  return scopedGroups(layout, story, labels).flatMap(({ scope, rootId, members }) => {
    const looks = labelLooks(members, byId)
    const limit = scope === 'page' ? LOOKS_PER_PAGE : LOOKS_PER_COMPONENT
    if (looks.length <= limit) return []
    const detail = `${scope} has ${looks.length} caps label looks (limit ${limit}): ${looks.join(', ')}`
    return [{ kind: CAPS_LABEL_LOOKS, selector: scopeSelector(byId, rootId, members), detail }]
  })
}

const ancestorWith = (n, byId, roles) => {
  for (let a = byId.get(n.parent); a; a = byId.get(a.parent)) if (roles.has(a.role)) return a
  return null
}
const ROW = new Set(['row'])
const TABLE = new Set(['table', 'grid', 'treegrid'])
const CELL = new Set(['cell', 'gridcell'])
const HEADER = new Set(['columnheader'])
const inRole = (n, byId, roles) => roles.has(n.role) || ancestorWith(n, byId, roles) !== null

function headerRowFindings(headerTexts, byId) {
  const rows = Map.groupBy(headerTexts, (n) => ancestorWith(n, byId, ROW)?.id ?? n.parent)
  return [...rows.values()].flatMap((row) => {
    const looks = labelLooks(row.filter(isLabel), byId)
    if (looks.length <= 1) return []
    const detail = `header row has ${looks.length} caps label looks (limit 1): ${looks.join(', ')}`
    return [{ kind: CAPS_LABEL_LOOKS, selector: row[0].selector, detail }]
  })
}

function headerSizeFindings(headerTexts, bodyTexts, byId) {
  const tables = Map.groupBy(headerTexts, (n) => ancestorWith(n, byId, TABLE)?.id ?? null)
  return [...tables].flatMap(([tableId, headers]) => {
    const body = bodyTexts.filter((n) => (ancestorWith(n, byId, TABLE)?.id ?? null) === tableId)
    if (!body.length) return []
    const bodyMax = Math.max(...body.map((n) => n.text.fontSize))
    const header = headers.reduce((a, b) => (b.text.fontSize > a.text.fontSize ? b : a))
    if (header.text.fontSize <= bodyMax) return []
    const detail = `column header ${px(header.text.fontSize)} is larger than body cell text ${px(bodyMax)}`
    return [{ kind: CAPS_LABEL_LOOKS, selector: header.selector, detail }]
  })
}

/** More caps label looks than a component (1), a page (2) or a header row (1) allows. */
export function judgeCapsLabelLooks(layout, ctx = {}) {
  const { byId } = index(layout?.nodes ?? [])
  const all = texts(layout)
  const headers = all.filter((n) => inRole(n, byId, HEADER))
  const body = all.filter((n) => !inRole(n, byId, HEADER) && inRole(n, byId, CELL))
  return [
    ...lookFindings(layout, ctx.story, byId),
    ...headerRowFindings(headers, byId),
    ...headerSizeFindings(headers, body, byId),
  ]
}

// --- DR-TY-10 sizes-per-component

/** More text sizes than an instance (4) or, in page scope, a frame (6) allows. */
export function judgeSizesPerComponent(layout, ctx = {}) {
  const { byId } = index(layout?.nodes ?? [])
  return scopedGroups(layout, ctx.story, texts(layout)).flatMap(({ scope, rootId, members }) => {
    const sizes = sortedNumbers(members.map((n) => quarter(n.text.fontSize)))
    const limit = scope === 'page' ? SIZES_PER_PAGE : SIZES_PER_INSTANCE
    if (sizes.length <= limit) return []
    const detail = `${scope} uses ${sizes.length} text sizes (limit ${limit}): ${sizes.join(', ')}px`
    return [{ kind: SIZES_PER_COMPONENT, selector: scopeSelector(byId, rootId, members), detail }]
  })
}

// --- DR-TY-11 weights-faces

function weightFindings(layout, story, byId) {
  return scopedGroups(layout, story, texts(layout)).flatMap(({ scope, rootId, members }) => {
    if (scope === 'page') return []
    const weights = sortedNumbers(members.map((n) => n.text.fontWeight).filter(Number.isFinite))
    if (weights.length <= WEIGHTS_PER_INSTANCE) return []
    const detail = `${scope} uses ${weights.length} weights (limit ${WEIGHTS_PER_INSTANCE}): ${weights.join(', ')}`
    return [{ kind: WEIGHTS_FACES, selector: scopeSelector(byId, rootId, members), detail }]
  })
}

function familyFindings(layout, story) {
  if (isSpecimen(story)) return []
  const all = texts(layout).filter((n) => n.text.family)
  const families = distinct(all.map((n) => n.text.family))
  if (families.length <= FAMILIES_PER_FRAME) return []
  const detail = `frame uses ${families.length} font families (limit ${FAMILIES_PER_FRAME}): ${families.join(', ')}`
  return [{ kind: WEIGHTS_FACES, selector: all[0].selector, detail }]
}

/** Three or more weights in an instance, any weight under 400, more than 3 families in a frame. */
export function judgeWeightsFaces(layout, ctx = {}) {
  const { byId } = index(layout?.nodes ?? [])
  const light = texts(layout)
    .filter((n) => n.text.fontWeight < MIN_WEIGHT)
    .map((n) => ({
      kind: WEIGHTS_FACES,
      selector: n.selector,
      detail: `weight ${n.text.fontWeight} is under ${MIN_WEIGHT}`,
    }))
  return [...weightFindings(layout, ctx.story, byId), ...light, ...familyFindings(layout, ctx.story)]
}

// --- DR-CO-05 line-style-budget

function paintedAncestor(n, byId) {
  let at = n
  while (at && !at.paints) at = byId.get(at.parent)
  return at?.id ?? null
}

function rowOf(n, byId) {
  let row = byId.get(n.parent)
  while (row && !isFlexRow(row)) row = byId.get(row.parent)
  return row
}

function sizeBreach(line) {
  const sizes = sortedNumbers(line.map((n) => n.text.fontSize))
  if (sizes.length < 2) return null
  const [min, max] = [sizes[0], sizes.at(-1)]
  if (max / min >= LINE_HERO_RATIO || max - min <= LINE_NEAR_MISS_MAX) return null
  return `${sizes.length} sizes ${sizes.join(', ')}px (max/min ${+(max / min).toFixed(2)} < ${LINE_HERO_RATIO}, Δ${quarter(max - min)} > ${LINE_NEAR_MISS_MAX}px)`
}

function lineBreaches(line) {
  const weights = sortedNumbers(line.map((n) => n.text.fontWeight).filter(Number.isFinite))
  const colours = distinct(line.map((n) => toHex(n.text.color)).filter(Boolean))
  return [
    sizeBreach(line),
    weights.length > LINE_MAX_WEIGHTS
      ? `${weights.length} weights ${weights.join(', ')} (limit ${LINE_MAX_WEIGHTS})`
      : null,
    colours.length > LINE_MAX_COLOURS
      ? `${colours.length} colours ${colours.join(', ')} (limit ${LINE_MAX_COLOURS})`
      : null,
  ].filter(Boolean)
}

/**
 * One visual line mixing sizes under the hero ratio (beyond the near-miss band), more than 2 weights
 * or more than 2 colours. Text on its own painted object (a chip, a badge) is not part of the line.
 */
export function judgeLineStyleBudget(layout) {
  const nodes = layout?.nodes ?? []
  const { byId } = index(nodes)
  return textByRow(nodes, byId).flatMap((row) => {
    const surface = paintedAncestor(rowOf(row[0], byId), byId)
    const own = row.filter((n) => paintedAncestor(n, byId) === surface)
    return visualLines(own).flatMap((line) => {
      const breaches = lineBreaches(line)
      if (!breaches.length) return []
      const detail = `one line has ${breaches.join('; ')}`
      return [{ kind: LINE_STYLE_BUDGET, selector: line[0].selector, detail }]
    })
  })
}

/** judge(layout, ctx): findings `{ kind, selector, detail }`. */
export function judge(layout, ctx = {}) {
  return [
    ...judgeCapsTracking(layout, ctx),
    ...judgeCapsLabelLooks(layout, ctx),
    ...judgeTextFloor(layout),
    ...judgeSizesPerComponent(layout, ctx),
    ...judgeWeightsFaces(layout, ctx),
    ...judgeLowercaseTracking(layout),
    ...judgeLineStyleBudget(layout),
  ]
}
