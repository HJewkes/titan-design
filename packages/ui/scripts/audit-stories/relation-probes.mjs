// Spacing-relation probes (TD-937): one warning per DR-LA rule that relates two spacings to each
// other. A threshold a TD-650 probe already measured is imported from layout-probes.mjs, never
// copied, so a retune of that probe moves this one too. The rest are registry values
// (docs/design-rules.md) or a token read in the page.
import {
  ALIGN_TOLERANCE,
  DATA_FILL_ROLES,
  INVERSION_RATIO,
  MAX_BAND,
  MIN_EXCESS,
  PADDING_TOLERANCE,
  TABULAR_ROLES,
  asymmetryOn,
  clearances,
  gapOf,
  inFlow,
  index,
  innerBox,
  innerGap,
  isControlRow,
  isFlexRow,
  isSectionBreak,
  paddingPlaces,
  runGaps,
  spreadsChildren,
  stackRuns,
  surfaceFinder,
} from './layout-probes.mjs'

export const HEADING_DETACHED = 'heading-detached'
export const NESTING_ORDER = 'nesting-order'
export const IN_SURFACE_SECTION_GAP = 'in-surface-section-gap'
export const DEAD_BAND = 'dead-band'
export const COLUMN_EDGE_NEAR_MISS = 'column-edge-near-miss'

/** The warning kinds this module emits. */
export const KINDS = Object.freeze([
  HEADING_DETACHED,
  NESTING_ORDER,
  IN_SURFACE_SECTION_GAP,
  DEAD_BAND,
  COLUMN_EDGE_NEAR_MISS,
])
/** Each kind's design rule id in docs/design-rules.md. */
export const RULES = Object.freeze({
  [HEADING_DETACHED]: 'DR-LA-02',
  [NESTING_ORDER]: 'DR-LA-03',
  [IN_SURFACE_SECTION_GAP]: 'DR-LA-08',
  [DEAD_BAND]: 'DR-LA-09',
  [COLUMN_EDGE_NEAR_MISS]: 'DR-LA-11',
})

export const STACK_LG_VAR = '--space-stack-lg' // registry LA-08: the largest in-surface stack step
export const DEAD_BAND_FACTOR = 2 // registry LA-09: a band over twice the surface's padding
export const DEAD_BAND_FLOOR = 24 // registry LA-09: and over 24px

const px = (n) => `${+n.toFixed(2)}px`
const q = (v) => Math.round(v * 4) / 4 + 0
const bottomOf = (b) => b[1] + b[3]
const inkGap = (a, b, axis = 'y') =>
  axis === 'x' ? b.ink[0] - (a.ink[0] + a.ink[2]) : b.ink[1] - bottomOf(a.ink)
const inkedKids = (n, children) => (children.get(n.id) ?? []).filter((c) => c.ink && inFlow(c))
function unionOf(boxes) {
  const x = Math.min(...boxes.map((b) => b[0]))
  const y = Math.min(...boxes.map((b) => b[1]))
  const r = Math.max(...boxes.map((b) => b[0] + b[2]))
  return [x, y, r - x, Math.max(...boxes.map(bottomOf)) - y]
}
const pairsOf = (run) => run.slice(1).map((b, i) => [run[i], b])

// --- DR-LA-02 heading-detached ------------------------------------------------------------------

// Where `node` sits in a y stack: the walk climbs through header rows (flex rows) and through
// unpainted wrappers that hold only it, and gives up at a grid or at a painted surface it fills.
function placeInStack(node, byId, children) {
  let block = node
  for (let p = byId.get(node.parent); p; block = p, p = byId.get(p.parent)) {
    const { axis, runs } = stackRuns(p, children)
    if (axis === 'x') continue
    const run = axis === 'y' && runs.find((r) => r.includes(block))
    if (!run) return null
    if (runs.flat().length > 1) return { block, parent: p, runs, run }
    if (p.paints) return null
  }
  return null
}

// The gap above the heading's block, or above the section it opens. Null when nothing precedes it,
// a divider does, or a painted surface's edge is the boundary.
function gapAbove(place, byId, children) {
  const { block, parent, runs, run } = place
  const i = run.indexOf(block)
  if (i > 0) return inkGap(run[i - 1], block)
  if (runs[0] !== run || parent.paints) return null
  const outer = placeInStack(parent, byId, children)
  return outer ? gapAbove(outer, byId, children) : null
}

// The body's own rhythm: its largest inner gap, or else its gap to its next sibling. A control row
// is coupled to its neighbour on purpose, so its inner gap is not the body's rhythm.
function bodyInner(body, after, children) {
  const inner = isControlRow(body, children) ? null : innerGap(body, children)
  if (inner != null) return inner
  return after ? inkGap(body, after) : null
}

function headingDetail(place, byId, children) {
  const i = place.run.indexOf(place.block)
  const body = place.run[i + 1]
  const below = body ? inkGap(place.block, body) : -1
  if (below < 0) return null
  const inner = bodyInner(body, place.run[i + 2], children)
  const above = gapAbove(place, byId, children)
  const reasons = []
  if (inner != null && below > inner + MIN_EXCESS)
    reasons.push(`body items ${px(inner)} apart (limit +${MIN_EXCESS}px)`)
  if (above != null && above >= 0 && above < INVERSION_RATIO * below)
    reasons.push(`${px(above)} above it (limit ${INVERSION_RATIO}× below)`)
  if (!reasons.length) return null
  return `${place.block.selector} sits ${px(below)} above ${body.selector}: ${reasons.join('; ')}`
}

export function judgeHeadingDetached({ nodes }) {
  const { byId, children } = index(nodes)
  const seen = new Set()
  return nodes.flatMap((h) => {
    const place = h.heading ? placeInStack(h, byId, children) : null
    if (!place || seen.has(place.block.id)) return []
    seen.add(place.block.id)
    const detail = headingDetail(place, byId, children)
    return detail ? [{ kind: HEADING_DETACHED, selector: place.block.selector, detail }] : []
  })
}

// --- DR-LA-03 nesting-order -----------------------------------------------------------------------

// A painted box whose padding frames content. Controls, table cells and data fills size their
// padding for another reason.
const isFrame = (s) =>
  s.paints &&
  s.tag !== 'svg' &&
  !s.interactive &&
  !TABULAR_ROLES.has(s.role) &&
  !DATA_FILL_ROLES.has(s.role)

// The stack a surface frames: the surface, or the first box below it through single-child
// unpainted wrappers, that stacks two or more inked children on the y axis. A pill or badge (one
// label, or a row) frames no stack.
function framedStack(s, children) {
  for (let n = s; n; ) {
    const { axis, runs } = stackRuns(n, children)
    if (axis === 'y' && runs.flat().length >= 2) return { node: n, runs }
    const kids = inkedKids(n, children)
    if (kids.length !== 1 || kids[0].paints) return null
    n = kids[0]
  }
  return null
}

// The surface's padding as its content ink shows it: the smaller clearance on each axis. A run that
// spreads its children takes its gaps from free space, so they are not the inner spacing.
function frameOf(s, byId, children) {
  if (!isFrame(s)) return null
  const stack = framedStack(s, children)
  if (!stack || !paddingPlaces(s, s, 'y', byId)) return null
  const [top, right, bottom, left] = clearances(
    unionOf(inkedKids(s, children).map((k) => k.ink)),
    s
  )
  const gaps = stack.runs
    .filter((run) => !spreadsChildren(stack.node, run, 'y'))
    .flatMap((run) => runGaps(run, 'y').map((x) => x.g))
  return {
    s,
    gIn: gaps.length ? Math.max(...gaps) : 0,
    p: { y: Math.min(top, bottom), x: Math.min(left, right) },
  }
}

function outerBreaches(parent, frames, children) {
  const { axis, runs } = stackRuns(parent, children)
  return runs.flatMap(pairsOf).flatMap(([a, b]) => {
    const [fa, fb] = [frames.get(a.id), frames.get(b.id)]
    if (!fa || !fb) return []
    const g = inkGap(a, b, axis)
    const p = Math.min(fa.p[axis], fb.p[axis])
    if (g < 0 || p <= g + PADDING_TOLERANCE) return []
    return [{ id: a.id, text: `padding ${px(p)} > ${px(g)} to sibling surface ${b.selector}` }]
  })
}

export function judgeNestingOrder({ nodes }) {
  const { byId, children } = index(nodes)
  const frames = new Map()
  for (const n of nodes) {
    const f = frameOf(n, byId, children)
    if (f) frames.set(n.id, f)
  }
  const parts = new Map([...frames.keys()].map((id) => [id, []]))
  for (const f of frames.values())
    if (f.gIn > f.p.y + PADDING_TOLERANCE)
      parts.get(f.s.id).push(`items ${px(f.gIn)} apart > padding ${px(f.p.y)}`)
  for (const parent of nodes)
    for (const b of outerBreaches(parent, frames, children)) parts.get(b.id).push(b.text)
  return [...parts].flatMap(([id, texts]) =>
    texts.length
      ? [
          {
            kind: NESTING_ORDER,
            selector: byId.get(id).selector,
            detail: `${texts.join('; ')} (want inner ≤ padding ≤ outer, ±${PADDING_TOLERANCE}px)`,
          },
        ]
      : []
  )
}

// --- DR-LA-08 in-surface-section-gap ---------------------------------------------------------------

// Visible gaps are read on layout boxes plus the padding that paints nothing (as stacked-inset reads
// them): ink would add each line's leading and turn an ordinary 12px text gap into 20px.
function sectionGaps(container, run, axis, children, declared, limit) {
  return pairsOf(run).flatMap(([a, b]) => {
    const gap = gapOf(a, b, axis, children)
    const visible = gap.layoutGap + gap.total
    if (
      gap.layoutGap < 0 ||
      visible <= limit ||
      isSectionBreak(container, { a, b }, axis, declared)
    )
      return []
    return [{ a, b, visible }]
  })
}

// An svg places its children by coordinates (a chart's tick labels sit where the scale puts them),
// so the space between them is not a spacing step.
function inSvg(n, byId) {
  for (let a = n; a; a = byId.get(a.parent)) if (a.tag === 'svg') return true
  return false
}

export function judgeInSurfaceSectionGap({ nodes }, declared = {}) {
  const limit = declared[STACK_LG_VAR]
  if (!(limit > 0)) return []
  const { byId, children } = index(nodes)
  const surfaceOf = surfaceFinder(byId)
  return nodes.flatMap((container) => {
    const surface = surfaceOf(container.id)
    if (!surface || inSvg(container, byId)) return []
    // stack-lg is a vertical step: a row's column gaps (a table header's cells) answer to inline steps.
    const { axis, runs } = stackRuns(container, children)
    if (axis !== 'y') return []
    return runs
      .filter((run) => !spreadsChildren(container, run, axis))
      .filter((run) => !run.some((n) => TABULAR_ROLES.has(n.role)))
      .flatMap((run) => sectionGaps(container, run, axis, children, declared, limit))
      .map(({ a, b, visible }) => ({
        kind: IN_SURFACE_SECTION_GAP,
        selector: a.selector,
        detail:
          `gap ${px(visible)} between ${a.selector} and ${b.selector} inside ${surface.selector} ` +
          `(limit ${STACK_LG_VAR} ${px(limit)} unless declared as --space-section-*)`,
      }))
  })
}

// --- DR-LA-09 dead-band ---------------------------------------------------------------------------

const PLACING_JUSTIFY = /center|end|space-/
const PLACING_ALIGN = /center|end/

// The author placed the content on the y axis (an empty state centred in its card).
function declaresPlacement(s) {
  const { display, flexDirection, justifyContent, alignItems } = s.layout
  if (!display.includes('flex')) return false
  return flexDirection.startsWith('column')
    ? PLACING_JUSTIFY.test(justifyContent)
    : PLACING_ALIGN.test(alignItems)
}

function stretchedByRow(s, byId) {
  const row = byId.get(s.parent)
  return (
    !!row &&
    isFlexRow(row) &&
    ['stretch', 'normal'].includes(row.layout.alignItems) &&
    ['auto', 'stretch', 'normal'].includes(s.layout.alignSelf)
  )
}

// The content the surface's y padding places. A surface with no y padding has no frame spacing to
// measure a band against (a media frame, a chart plane), so it places nothing.
const placedContent = (s, byId, children) =>
  isFrame(s) ? inkedKids(s, children).filter((c) => paddingPlaces(s, c, 'y', byId)) : []

function deadBandDetail(s, byId, children) {
  const placed = placedContent(s, byId, children)
  // inset-asymmetry already reports a lopsided band on a surface its content fills.
  if (
    !placed.length ||
    declaresPlacement(s) ||
    asymmetryOn(s, unionOf(placed.map((c) => c.box)), 1)
  )
    return null
  const ink = unionOf(placed.map((k) => k.ink))
  const inner = innerBox(s)
  const limit = Math.max(DEAD_BAND_FACTOR * Math.max(s.pad[0], s.pad[2]), DEAD_BAND_FLOOR)
  const bands = [
    ['top', ink[1] - inner[1]],
    ['bottom', bottomOf(inner) - bottomOf(ink)],
  ].filter(([, band]) => band > limit)
  if (!bands.length) return null
  const note = stretchedByRow(s, byId) ? ' (height set by a stretching row)' : ''
  return (
    bands.map(([side, band]) => `${px(band)} empty at the ${side}`).join(', ') +
    ` (limit max(${DEAD_BAND_FACTOR} × padding ${px(Math.max(s.pad[0], s.pad[2]))}, ` +
    `${DEAD_BAND_FLOOR}px))${note}`
  )
}

export function judgeDeadBand({ nodes }) {
  const { byId, children } = index(nodes)
  return nodes.flatMap((s) => {
    const detail = deadBandDetail(s, byId, children)
    return detail ? [{ kind: DEAD_BAND, selector: s.selector, detail }] : []
  })
}

// --- DR-LA-11 column-edge-near-miss ---------------------------------------------------------------

// A child the author aligned away from the start edge (centred, pushed to the end, or by an auto
// start margin) is not on the column.
function offStart(n, rtl) {
  const align = n.style?.textAlign ?? 'start'
  const far = rtl ? /left|end/ : /right|end/
  return (
    /center|end/.test(n.layout.alignSelf) ||
    /center/.test(align) ||
    far.test(align) ||
    !!n.marginAuto?.[rtl ? 1 : 3]
  )
}

export function judgeColumnEdgeNearMiss({ nodes }) {
  const { children } = index(nodes)
  return nodes.flatMap((container) => {
    const { axis, runs } = stackRuns(container, children)
    if (axis !== 'y' || /center|end/.test(container.layout.alignItems)) return []
    const rtl = container.style?.direction === 'rtl'
    const start = (n) => (rtl ? n.ink[0] + n.ink[2] : n.ink[0])
    return runs.flatMap(pairsOf).flatMap(([a, b]) => {
      const d = q(Math.abs(start(a) - start(b)))
      if (offStart(a, rtl) || offStart(b, rtl) || d <= ALIGN_TOLERANCE || d > MAX_BAND) return []
      return [
        {
          kind: COLUMN_EDGE_NEAR_MISS,
          selector: a.selector,
          detail: `${a.selector} vs ${b.selector}: ${rtl ? 'right' : 'left'} edge Δ${d} (band ${ALIGN_TOLERANCE}px < Δ ≤ ${MAX_BAND}px)`,
        },
      ]
    })
  })
}

/** judge(layout, ctx): findings `{ kind, selector, detail }`. */
export function judge(layout, ctx = {}) {
  const declared = ctx.declared ?? layout.declared ?? {}
  return [
    ...judgeHeadingDetached(layout),
    ...judgeNestingOrder(layout),
    ...judgeInSurfaceSectionGap(layout, declared),
    ...judgeDeadBand(layout),
    ...judgeColumnEdgeNearMiss(layout),
  ]
}
