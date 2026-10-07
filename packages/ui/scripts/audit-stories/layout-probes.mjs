// Pure judges over collectLayout output (TD-650 P1-P5). Each is linear per container and reads
// only the collected nodes, so a synthetic tree tests it without a browser.

export const STACKED_INSET = 'stacked-inset'
export const EDGE_CLEARANCE = 'edge-clearance'
export const INSET_ASYMMETRY = 'inset-asymmetry'
export const ALIGNMENT_NEAR_MISS = 'alignment-near-miss'
export const GAP_OUTLIER = 'gap-outlier'
export const PROXIMITY_INVERSION = 'proximity-inversion'
export const FONT_SIZE_NEAR_MISS = 'font-size-near-miss'

const MAX_FINDINGS_PER_KIND = 25
const MIN_EXCESS = 4 // --space-stack-sm, the smallest stack step
const EDGE_FLOOR = 4 // --space-inset-xs
const PADDING_TOLERANCE = 1
const ASYMMETRY_LIMIT = 2
const FILL_RATIO = 0.8
const SIDES = ['top', 'right', 'bottom', 'left']
const PAD_PROP = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']
const TABULAR_ROLES = new Set(['cell', 'gridcell', 'columnheader', 'rowheader'])
const DATA_FILL_ROLES = new Set(['progressbar', 'meter', 'slider'])
const REPLACED_TAGS = new Set(['img', 'canvas', 'video', 'svg'])

const px = (n) => `${+n.toFixed(2)}px`
const right = (b) => b[0] + b[2]
const bottom = (b) => b[1] + b[3]
const textInk = ({ left, right: r, first, last }) => [
  left,
  first.inkTop,
  r - left,
  last.inkBottom - first.inkTop,
]

function index(nodes) {
  const byId = new Map()
  const children = new Map()
  for (const n of nodes) {
    byId.set(n.id, n)
    if (!children.has(n.parent)) children.set(n.parent, [])
    children.get(n.parent).push(n)
  }
  return { byId, children }
}

// --- P1 stacked-inset -------------------------------------------------------------------------

// Main axis of a container whose children stack, or null when gaps are not a single run.
function stackAxis({ layout }) {
  if (layout.display === 'flex' || layout.display === 'inline-flex') {
    if (layout.flexWrap !== 'nowrap') return null
    return layout.flexDirection.startsWith('row') ? 'x' : 'y'
  }
  return layout.display === 'block' || layout.display === 'flow-root' ? 'y' : null
}

// The one question every judge asks before it blames padding: did the surface's padding place this
// content? It did not when the content, or a box between it and the surface, is out of flow (an
// accent bar, a tick label), when the surface declares no padding on that axis (nothing positioned
// the content), or when the surface is a data fill whose size is the value (a progress bar).
// `axis` is 'x' or 'y'.
function paddingPlaces(surface, node, axis, byId) {
  if (DATA_FILL_ROLES.has(surface.role)) return false
  const [before, after] = axis === 'x' ? [3, 1] : [0, 2]
  if (surface.pad[before] < PADDING_TOLERANCE && surface.pad[after] < PADDING_TOLERANCE)
    return false
  for (let n = node; n && n !== surface; n = byId.get(n.parent)) if (!inFlow(n)) return false
  return true
}

const inFlow = (n) => n.layout.position !== 'absolute' && n.layout.position !== 'fixed'
const span = (b, axis) => (axis === 'x' ? [b[0], right(b)] : [b[1], bottom(b)])

// Invisible padding on the side of `node` that faces the gap, and the free space that padding does
// not explain, both measured on layout boxes: a glyph's ink sits inside its line box by an amount
// that depends on font size and line height, so ink never decides where a box's edge is. The walk
// goes down the child whose box reaches that edge. A painted box shows its padding and an
// interactive box needs it as a hit target, so either one ends the walk.
function hiddenPadding(node, facing, axis, children) {
  const after = facing === 'after'
  const side = axis === 'x' ? (after ? 1 : 3) : after ? 2 : 0
  const edge = (b) => span(b, axis)[after ? 1 : 0]
  const found = []
  let free = 0
  for (let n = node; n && !n.paints && !n.interactive; ) {
    if (n.pad[side] > 0) found.push({ node: n, prop: PAD_PROP[side], value: n.pad[side] })
    const reach = (c) => (after ? edge(c.box) : -edge(c.box))
    const kids = (children.get(n.id) ?? []).filter((c) => c.ink && inFlow(c))
    const next = kids.reduce((m, c) => (!m || reach(c) > reach(m) ? c : m), null)
    if (!next) break
    const content = edge(n.box) + (after ? -1 : 1) * (n.pad[side] + n.border[side])
    free += Math.max(0, after ? content - edge(next.box) : edge(next.box) - content)
    n = next
  }
  return { found, free }
}

function gapOf(a, b, axis, children) {
  const layoutGap = span(b.box, axis)[0] - span(a.box, axis)[1]
  const hiddenA = hiddenPadding(a, 'after', axis, children)
  const hiddenB = hiddenPadding(b, 'before', axis, children)
  const hidden = [...hiddenA.found, ...hiddenB.found]
  const total = hidden.reduce((t, h) => t + h.value, 0)
  return { a, b, layoutGap, hidden, total, free: hiddenA.free + hiddenB.free }
}

export function judgeStackedInset({ nodes }) {
  const { children } = index(nodes)
  const findings = []
  for (const container of nodes) {
    const axis = stackAxis(container)
    const kids = (children.get(container.id) ?? []).filter((c) => inFlow(c) && c.ink)
    if (
      !axis ||
      DATA_FILL_ROLES.has(container.role) ||
      kids.length < 2 ||
      kids.some((k) => TABULAR_ROLES.has(k.role))
    )
      continue
    kids.sort((p, q) => span(p.box, axis)[0] - span(q.box, axis)[0])
    const gaps = []
    for (let i = 1; i < kids.length; i++) {
      const gap = gapOf(kids[i - 1], kids[i], axis, children)
      if (gap.layoutGap >= 0) gaps.push(gap)
    }
    // Equal hidden padding on every gap is the stack's rhythm, not a stray inset.
    const floor = gaps.length > 1 ? Math.min(...gaps.map((g) => g.total)) : 0
    for (const g of gaps) {
      // Padding only explains the gap when the content sits against it: free space beyond the
      // padding (a narrow label in a wide cell) is layout, not a stray inset.
      if (g.total < MIN_EXCESS || g.total - floor < MIN_EXCESS || g.free >= MIN_EXCESS) continue
      findings.push({
        kind: STACKED_INSET,
        selector: g.a.selector,
        detail:
          `visible gap ${px(g.layoutGap + g.total)} = layout gap ${px(g.layoutGap)} + ` +
          `${g.hidden.map((h) => `${h.prop} ${px(h.value)} on ${h.node.selector}`).join(' + ')}, ` +
          `which paint nothing (next sibling ${g.b.selector}; threshold ${MIN_EXCESS}px)`,
      })
    }
  }
  return findings
}

// --- P2 edge-clearance and inset-asymmetry ------------------------------------------------------

// Nearest painted ancestor. An SVG is never a surface: its frame is its painted HTML parent.
function surfaceFinder(byId) {
  const cache = new Map()
  const find = (id) => {
    if (id == null) return null
    if (cache.has(id)) return cache.get(id)
    const n = byId.get(id)
    const found = n.paints && n.tag !== 'svg' ? n : find(n.parent)
    cache.set(id, found)
    return found
  }
  return find
}

const innerBox = (s) => [
  s.box[0] + s.border[3],
  s.box[1] + s.border[0],
  s.box[2] - s.border[1] - s.border[3],
  s.box[3] - s.border[0] - s.border[2],
]

function clearances(content, surface) {
  const inner = innerBox(surface)
  return [
    content[1] - inner[1],
    inner[0] + inner[2] - right(content),
    inner[1] + inner[3] - bottom(content),
    content[0] - inner[0],
  ]
}

// (a) ink sits inside the declared padding; (b) a side declared with no padding leaves text ink
// under the floor. A side with declared padding that the ink honours (a pill's 2px) is fine, and
// replaced content (an icon centred in a badge) answers to (a) only: its box is not glyph ink.
function crowdedSides(dist, surface, floored) {
  return SIDES.flatMap((side, i) => {
    const pad = surface.pad[i]
    const d = dist[i]
    const pushedIn = pad - d >= PADDING_TOLERANCE
    const unpadded = floored && pad < PADDING_TOLERANCE && d < EDGE_FLOOR
    return pushedIn || unpadded ? [{ side, d, pad }] : []
  })
}

// Characters a clip or ellipsis hides still have rects, so text ink is clamped to its own box.
function clampTo(ink, box) {
  const x = Math.max(ink[0], box[0])
  const y = Math.max(ink[1], box[1])
  const r = Math.max(x, Math.min(right(ink), right(box)))
  const b = Math.max(y, Math.min(bottom(ink), bottom(box)))
  return [x, y, r - x, b - y]
}

function contentOf(n) {
  if (n.text) {
    const surfaceFrom = n.paints && n.tag !== 'svg' ? n : null
    return { ink: clampTo(textInk(n.text), n.box), surfaceFrom, floored: true }
  }
  if (REPLACED_TAGS.has(n.tag)) return { ink: n.box, surfaceFrom: null, floored: false }
  return null
}

export function judgeEdgeClearance({ nodes }) {
  const { byId } = index(nodes)
  const surfaceOf = surfaceFinder(byId)
  const findings = []
  for (const n of nodes) {
    const content = contentOf(n)
    if (!content) continue
    const surface = content.surfaceFrom ?? surfaceOf(n.parent)
    if (!surface) continue
    const crowded = crowdedSides(clearances(content.ink, surface), surface, content.floored).filter(
      (c) => paddingPlaces(surface, n, c.side === 'top' || c.side === 'bottom' ? 'y' : 'x', byId)
    )
    if (!crowded.length) continue
    findings.push({
      kind: EDGE_CLEARANCE,
      selector: n.selector,
      detail: crowded
        .map(
          (c) =>
            `ink ${px(c.d)} from the ${c.side} edge of ${surface.selector} ` +
            `(padding ${px(c.pad)}, floor ${EDGE_FLOOR}px)`
        )
        .join('; '),
    })
  }
  return findings
}

function unionInk(boxes) {
  const x = Math.min(...boxes.map((b) => b[0]))
  const y = Math.min(...boxes.map((b) => b[1]))
  return [x, y, Math.max(...boxes.map(right)) - x, Math.max(...boxes.map(bottom)) - y]
}

// Axis 0 is horizontal (left/right), axis 1 vertical (top/bottom). `content` is the union of the
// children's layout boxes: glyph ink sits unevenly in its box (a ragged right edge, a line box), so
// ink would flag every card around a paragraph.
function asymmetryOn(surface, content, axis) {
  const [before, after] = axis === 0 ? [3, 1] : [0, 2]
  if (surface.pad[before] !== surface.pad[after]) return null
  const inner = innerBox(surface)
  const origin = inner[axis]
  const size = inner[axis + 2]
  const lead = content[axis] - origin
  const trail = origin + size - (content[axis] + content[axis + 2])
  const contentBox = size - surface.pad[before] - surface.pad[after]
  if (content[axis + 2] < FILL_RATIO * contentBox || Math.abs(lead - trail) <= ASYMMETRY_LIMIT)
    return null
  const names = axis === 0 ? ['left', 'right'] : ['top', 'bottom']
  return (
    `content sits ${px(lead)} from the ${names[0]} edge and ${px(trail)} from the ${names[1]} ` +
    `edge of ${surface.selector} (padding ${px(surface.pad[before])} each side; ` +
    `limit ${ASYMMETRY_LIMIT}px)`
  )
}

export function judgeInsetAsymmetry({ nodes }) {
  const { byId, children } = index(nodes)
  const findings = []
  for (const surface of nodes) {
    if (!surface.paints || surface.tag === 'svg') continue
    const kids = (children.get(surface.id) ?? []).filter((c) => c.ink)
    for (const axis of [0, 1]) {
      const placed = kids.filter((c) => paddingPlaces(surface, c, axis ? 'y' : 'x', byId))
      if (!placed.length) continue
      const detail = asymmetryOn(surface, unionInk(placed.map((c) => c.box)), axis)
      if (detail) findings.push({ kind: INSET_ASYMMETRY, selector: surface.selector, detail })
    }
  }
  return findings
}

// --- P3 alignment-near-miss -------------------------------------------------------------------

const ALIGN_TOLERANCE = 1 // the Vercel optical-alignment rule
const MAX_BAND = 6
const HEIGHT_LIMIT = 16
const LINE_OVERLAP = 0.5
const q = (v) => Math.round(v * 4) / 4 + 0
const isFlexRow = ({ layout }) =>
  (layout.display === 'flex' || layout.display === 'inline-flex') &&
  layout.flexDirection.startsWith('row')

// The first text a child carries, in document order, when it sits on the child's first line (a
// label beside an icon does; a caption under an avatar does not).
function firstText(node, children) {
  const stack = [node]
  while (stack.length) {
    const n = stack.shift()
    if (n.text) return n.text.first.inkTop < node.ink[1] + node.ink[3] / 2 ? n.text : null
    stack.unshift(...(children.get(n.id) ?? []))
  }
  return null
}

// Flex-wrap puts children on several rows: a child joins the first line whose vertical range its
// box overlaps by half the smaller height, so only neighbours on one row are compared.
function visualLines(kids) {
  const lines = []
  for (const kid of [...kids].sort((a, b) => a.box[1] - b.box[1])) {
    const [top, h] = [kid.box[1], kid.box[3]]
    const line = lines.find((l) => {
      const overlap = Math.min(l.bottom, top + h) - Math.max(l.top, top)
      return overlap >= LINE_OVERLAP * Math.min(h, l.bottom - l.top)
    })
    if (!line) lines.push({ top, bottom: top + h, kids: [kid] })
    else {
      line.kids.push(kid)
      line.top = Math.min(line.top, top)
      line.bottom = Math.max(line.bottom, top + h)
    }
  }
  return lines.map((l) => l.kids.sort((a, b) => a.box[0] - b.box[0]))
}

function alignmentLines(n, text) {
  const [, y, , h] = n.ink
  const lines = { top: y, centre: y + h / 2, bottom: y + h }
  return text ? { baseline: text.first.baseline, ...lines } : lines
}

const deltasOf = (a, b) =>
  Object.keys(a)
    .filter((k) => k in b)
    .map((line) => ({ line, d: q(Math.abs(a[line] - b[line])) }))

const describeDeltas = (deltas) => deltas.map(({ line, d }) => `${line} Δ${d}`).join(', ')

const alignsOnBaseline = (container, kid) =>
  kid.layout.alignSelf.includes('baseline') ||
  (['auto', 'normal'].includes(kid.layout.alignSelf) &&
    container.layout.alignItems.includes('baseline'))

// The baseline a flex row aligns a child by: that of its first in-flow item, descending until text
// is reached. An item with no baseline of its own (an icon, an image, an empty box) lends its
// border-box bottom edge instead, as CSS synthesises it, so a child that opens with an icon is
// aligned by the icon's bottom and not by the label beside it.
function cssBaseline(node, children) {
  for (let n = node; n; ) {
    if (n.text) return n.text.first.baseline
    const first = (children.get(n.id) ?? []).find(inFlow)
    if (!first || REPLACED_TAGS.has(n.tag)) return n.box[1] + n.box[3]
    n = first
  }
  return null
}

// Both children are in a flex row with ink; returns the finding's detail, or null.
function nearMiss(container, [a, b], children) {
  const [ta, tb] = [firstText(a, children), firstText(b, children)]
  const deltas = deltasOf(alignmentLines(a, ta), alignmentLines(b, tb))
  if (alignsOnBaseline(container, a) && alignsOnBaseline(container, b)) {
    const d = q(Math.abs(cssBaseline(a, children) - cssBaseline(b, children)))
    return d > ALIGN_TOLERANCE ? `baseline Δ${d} (align-items: baseline)` : null
  }
  const smallest = Math.min(...deltas.map((x) => x.d))
  const sizes = [ta, tb].filter(Boolean).map((t) => t.fontSize)
  const band = Math.min(MAX_BAND, ...sizes.map((s) => s / 2))
  if (smallest <= ALIGN_TOLERANCE || smallest > band) return null
  return `${describeDeltas(deltas)} (band ≤ ${+band.toFixed(2)}px)`
}

function heightMiss([a, b]) {
  if (!a.paints || !b.paints) return null
  const d = q(Math.abs(a.box[3] - b.box[3]))
  return d > ALIGN_TOLERANCE && d <= HEIGHT_LIMIT
    ? `height Δ${d} (both paint; limit ${HEIGHT_LIMIT}px)`
    : null
}

// Neighbouring in-flow children on each visual line of a flex row.
function rowPairs(container, children) {
  if (!isFlexRow(container)) return []
  const kids = (children.get(container.id) ?? []).filter((c) => inFlow(c) && c.ink)
  if (kids.length < 2) return []
  const lines =
    container.layout.flexWrap === 'nowrap'
      ? [[...kids].sort((a, b) => a.box[0] - b.box[0])]
      : visualLines(kids)
  return lines.flatMap((line) => line.slice(1).map((b, i) => [line[i], b]))
}

export function judgeAlignmentNearMiss({ nodes }) {
  const { children } = index(nodes)
  return nodes.flatMap((container) =>
    rowPairs(container, children).flatMap((pair) =>
      [nearMiss(container, pair, children), heightMiss(pair)].filter(Boolean).map((detail) => ({
        kind: ALIGNMENT_NEAR_MISS,
        selector: pair[0].selector,
        detail: `${pair[0].selector} vs ${pair[1].selector}: ${detail}`,
      }))
    )
  )
}

// --- P4 gap-outlier and proximity-inversion --------------------------------------------------------

const OUTLIER_RATIO = 2
const OUTLIER_EXCESS = 8 // --space-stack-md, one stack step
const DIVIDER_MAX = 2
const DECLARED_TOLERANCE = 0.25
const SECTION_PREFIX = '--space-section-'
const isDivider = (n, axis) => n.paints && n.box[axis === 'x' ? 2 : 3] <= DIVIDER_MAX
const inkSpan = (n, axis) => span(n.ink, axis)
const ratio = (g, m) => (m ? `${+(g / m).toFixed(1)}×` : '∞×')

// Inked in-flow children of a stack, cut into runs at each divider, each run in main-axis order.
// Inline children share a line, so a block's gaps are read between its block-level children only.
function stackRuns(container, children) {
  const axis = stackAxis(container)
  if (!axis) return { axis, runs: [] }
  const blockFlow = !container.layout.display.includes('flex')
  const kids = (children.get(container.id) ?? [])
    .filter((c) => inFlow(c) && c.ink && !(blockFlow && c.layout.display === 'inline'))
    .sort((p, q) => inkSpan(p, axis)[0] - inkSpan(q, axis)[0])
  const runs = [[]]
  for (const kid of kids) {
    if (isDivider(kid, axis)) runs.push([])
    else runs[runs.length - 1].push(kid)
  }
  return { axis, runs: runs.filter((r) => r.length) }
}

// Ink gaps between consecutive children of a run; an overlap is a deliberate layering, not a gap.
const runGaps = (run, axis) =>
  run.slice(1).flatMap((b, i) => {
    const a = run[i]
    const g = inkSpan(b, axis)[0] - inkSpan(a, axis)[1]
    return g >= 0 ? [{ a, b, g }] : []
  })

const cssPx = (v) => parseFloat(v) || 0

// What the author declared between two siblings: facing margins plus the flex gap. Block margins
// between siblings collapse to the larger one, so that reading counts too.
function declaredSpacing(container, { a, b }, axis) {
  const [after, before] = axis === 'x' ? [1, 3] : [2, 0]
  const [ma, mb] = [a.margin[after], b.margin[before]]
  const flexed = container.layout.display.includes('flex')
  const gap = flexed
    ? cssPx(axis === 'x' ? container.layout.columnGap : container.layout.rowGap)
    : 0
  return flexed ? [ma + mb + gap] : [ma + mb, Math.max(ma, mb)]
}

const isSectionBreak = (container, gap, axis, declared) => {
  const sections = Object.entries(declared)
    .filter(([name]) => name.startsWith(SECTION_PREFIX))
    .map(([, value]) => value)
  return declaredSpacing(container, gap, axis).some((d) =>
    sections.some((s) => Math.abs(d - s) <= DECLARED_TOLERANCE)
  )
}

const SPREAD_JUSTIFY = new Set(['space-between', 'space-around', 'space-evenly'])
// A row that spreads its children (justify-content, auto margins) sets its gaps from the free
// space, so they say nothing about the author's spacing.
function spreadsChildren(container, run, axis) {
  const [before, after] = axis === 'x' ? [3, 1] : [0, 2]
  return (
    SPREAD_JUSTIFY.has(container.layout.justifyContent) ||
    run.some((n) => n.marginAuto?.[before] || n.marginAuto?.[after])
  )
}

export function judgeGapOutlier({ nodes, declared = {} }) {
  const { children } = index(nodes)
  const findings = []
  for (const container of nodes) {
    const { axis, runs } = stackRuns(container, children)
    for (const run of runs.filter((r) => r.length >= 3 && !spreadsChildren(container, r, axis))) {
      const gaps = runGaps(run, axis)
      if (gaps.length < 2) continue
      const m = Math.min(...gaps.map((x) => x.g))
      for (const gap of gaps) {
        if (gap.g < OUTLIER_RATIO * m || gap.g - m < OUTLIER_EXCESS) continue
        if (isSectionBreak(container, gap, axis, declared)) continue
        findings.push({
          kind: GAP_OUTLIER,
          selector: gap.a.selector,
          detail:
            `gap ${px(gap.g)} between ${gap.a.selector} and ${gap.b.selector} is ` +
            `${ratio(gap.g, m)} the ${px(m)} gaps beside it`,
        })
      }
    }
  }
  return findings
}

// A child that is itself a stack of two or more inked children: its largest internal gap, or null.
function innerGap(group, children) {
  const { axis, runs } = stackRuns(group, children)
  const members = runs.flat()
  if (members.length < 2) return null
  const gaps = runs.flatMap((run) => runGaps(run, axis).map((x) => x.g))
  return gaps.length ? Math.max(...gaps) : null
}

// inner must be this many times outer: a group whose items sit about as far apart as it sits from
// its neighbour is ambiguous, not inverted. S6 inversions the owner raised read 3.5 to 4.25 times;
// the near-ties (14px against 12px) are the ones this drops.
const INVERSION_RATIO = 1.5

// A row of controls (arrows, a pager) is coupled to what it controls on purpose. It is read only
// when it sits no closer to its neighbour than its own items sit to each other.
function isControlRow(group, children) {
  const kids = runsOf(group, children).flat()
  const controls = kids.filter((k) => k.interactive || hasInteractive(k, children))
  return controls.length >= 2 && controls.length * 2 >= kids.length
}

const runsOf = (group, children) => stackRuns(group, children).runs

function hasInteractive(node, children) {
  return (children.get(node.id) ?? []).some((c) => c.interactive || hasInteractive(c, children))
}

function isInverted(group, inner, outer, children) {
  if (group.paints) return false
  if (isControlRow(group, children)) return outer >= inner
  return inner >= INVERSION_RATIO * outer
}

export function judgeProximityInversion({ nodes }) {
  const { children } = index(nodes)
  const findings = []
  for (const parent of nodes) {
    const { axis, runs } = stackRuns(parent, children)
    for (const run of runs.filter((r) => r.length >= 2)) {
      const gaps = runGaps(run, axis)
      run.forEach((group, i) => {
        const inner = innerGap(group, children)
        const beside = [gaps[i - 1], gaps[i]].filter(Boolean)
        if (!inner || !beside.length) return
        const outer = beside.reduce((lo, x) => (x.g < lo.g ? x : lo))
        if (!isInverted(group, inner, outer.g, children)) return
        const neighbour = outer.a === group ? outer.b : outer.a
        findings.push({
          kind: PROXIMITY_INVERSION,
          selector: group.selector,
          detail:
            `${group.selector}: items ${px(inner)} apart inside, ` +
            `${px(outer.g)} from ${neighbour.selector} outside`,
        })
      })
    }
  }
  return findings
}

// --- P5 font-size-near-miss ------------------------------------------------------------------------

const FONT_SIZE_NEAR_MISS_MAX = 2 // a larger step reads as deliberate contrast (a hero and its unit)

// Text elements grouped by their nearest flex-row ancestor; text outside any flex row is skipped.
function textByRow(nodes, byId) {
  const rows = new Map()
  for (const n of nodes) {
    if (!n.text) continue
    let row = byId.get(n.parent)
    while (row && !isFlexRow(row)) row = byId.get(row.parent)
    if (!row) continue
    if (!rows.has(row.id)) rows.set(row.id, [])
    rows.get(row.id).push(n)
  }
  return [...rows.values()]
}

export function judgeFontSizeNearMiss({ nodes }) {
  const { byId } = index(nodes)
  const pairs = textByRow(nodes, byId).flatMap((texts) =>
    visualLines(texts).flatMap((line) => line.slice(1).map((b, i) => [line[i], b]))
  )
  return pairs.flatMap(([a, b]) => {
    const d = q(Math.abs(a.text.fontSize - b.text.fontSize))
    if (d === 0 || d > FONT_SIZE_NEAR_MISS_MAX) return []
    return [
      {
        kind: FONT_SIZE_NEAR_MISS,
        selector: a.selector,
        detail:
          `${a.selector} ${px(a.text.fontSize)} vs ${b.selector} ${px(b.text.fontSize)} ` +
          `on one line: Δ${d} (limit ${FONT_SIZE_NEAR_MISS_MAX}px)`,
      },
    ]
  })
}

const capPerKind = (findings, limit) => {
  const seen = {}
  return findings.filter((f) => (seen[f.kind] = (seen[f.kind] ?? 0) + 1) <= limit)
}

export function judgeLayout(layout, { limit = MAX_FINDINGS_PER_KIND } = {}) {
  return capPerKind(
    [
      ...judgeStackedInset(layout),
      ...judgeEdgeClearance(layout),
      ...judgeInsetAsymmetry(layout),
      ...judgeAlignmentNearMiss(layout),
      ...judgeGapOutlier(layout),
      ...judgeProximityInversion(layout),
      ...judgeFontSizeNearMiss(layout),
    ],
    limit
  )
}
