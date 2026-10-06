// Pure judges over collectLayout output (TD-650 P1, P2). Each is linear per container and reads
// only the collected nodes, so a synthetic tree tests it without a browser.

export const STACKED_INSET = 'stacked-inset'
export const EDGE_CLEARANCE = 'edge-clearance'
export const INSET_ASYMMETRY = 'inset-asymmetry'

const MAX_FINDINGS_PER_KIND = 25
const MIN_EXCESS = 4 // --space-stack-sm, the smallest stack step
const EDGE_FLOOR = 4 // --space-inset-xs
const PADDING_TOLERANCE = 1
const ASYMMETRY_LIMIT = 2
const FILL_RATIO = 0.8
const SIDES = ['top', 'right', 'bottom', 'left']
const PAD_PROP = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']
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

const inFlow = (n) => n.layout.position !== 'absolute' && n.layout.position !== 'fixed'
const span = (b, axis) => (axis === 'x' ? [b[0], right(b)] : [b[1], bottom(b)])

// Invisible padding on the side of `node` that faces the gap, walking down the chain of boxes that
// reach the node's ink edge. A painted box shows its padding and an interactive box needs it as a
// hit target, so either one ends the walk.
function hiddenPadding(node, facing, axis, children) {
  const side = axis === 'x' ? (facing === 'after' ? 1 : 3) : facing === 'after' ? 2 : 0
  const edge = (b) => span(b, axis)[facing === 'after' ? 1 : 0]
  const found = []
  for (let n = node; n && !n.paints && !n.interactive; ) {
    if (n.pad[side] > 0) found.push({ node: n, prop: PAD_PROP[side], value: n.pad[side] })
    n = (children.get(n.id) ?? []).find((c) => c.ink && Math.abs(edge(c.ink) - edge(n.ink)) < 0.25)
  }
  return found
}

function gapOf(a, b, axis, children) {
  const layoutGap = span(b.box, axis)[0] - span(a.box, axis)[1]
  const inkGap = span(b.ink, axis)[0] - span(a.ink, axis)[1]
  const hidden = [
    ...hiddenPadding(a, 'after', axis, children),
    ...hiddenPadding(b, 'before', axis, children),
  ]
  const biggest = hidden.reduce((m, h) => (!m || h.value > m.value ? h : m), null)
  return {
    a,
    b,
    layoutGap,
    inkGap,
    excess: inkGap - layoutGap,
    hidden: biggest,
    total: sum(hidden),
  }
}
const sum = (hidden) => hidden.reduce((t, h) => t + h.value, 0)

export function judgeStackedInset({ nodes }) {
  const { children } = index(nodes)
  const findings = []
  for (const container of nodes) {
    const axis = stackAxis(container)
    const kids = (children.get(container.id) ?? []).filter((c) => inFlow(c) && c.ink)
    if (!axis || kids.length < 2) continue
    kids.sort((p, q) => span(p.box, axis)[0] - span(q.box, axis)[0])
    const gaps = []
    for (let i = 1; i < kids.length; i++) {
      const gap = gapOf(kids[i - 1], kids[i], axis, children)
      if (gap.layoutGap >= 0) gaps.push(gap)
    }
    // Equal excess on every gap is the stack's rhythm, not a stray inset.
    const floor = gaps.length > 1 ? Math.min(...gaps.map((g) => g.excess)) : 0
    for (const g of gaps) {
      if (g.excess < MIN_EXCESS || g.total < MIN_EXCESS || g.excess - floor < MIN_EXCESS) continue
      findings.push({
        kind: STACKED_INSET,
        selector: g.a.selector,
        detail:
          `ink gap ${px(g.inkGap)} = layout gap ${px(g.layoutGap)} + ${g.hidden.prop} ` +
          `${px(g.hidden.value)} on ${g.hidden.node.selector}, which paints nothing ` +
          `(next sibling ${g.b.selector}; threshold ${MIN_EXCESS}px)`,
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

// (a) ink sits inside the declared padding; (b) a side declared with no padding leaves the ink
// under the floor. A side with declared padding that the ink honours (a pill's 2px) is fine.
function crowdedSides(dist, surface) {
  return SIDES.flatMap((side, i) => {
    const pad = surface.pad[i]
    const d = dist[i]
    const pushedIn = pad - d >= PADDING_TOLERANCE
    const unpadded = pad < PADDING_TOLERANCE && d < EDGE_FLOOR
    return pushedIn || unpadded ? [{ side, d, pad }] : []
  })
}

function contentOf(n) {
  if (n.text) return { ink: textInk(n.text), surfaceFrom: n.paints && n.tag !== 'svg' ? n : null }
  if (REPLACED_TAGS.has(n.tag)) return { ink: n.box, surfaceFrom: null }
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
    const crowded = crowdedSides(clearances(content.ink, surface), surface)
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
// children's ink across, and of their layout boxes down: a glyph's ink always sits unevenly in its
// line box, so vertical ink would flag every card around a line of text.
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
  const { children } = index(nodes)
  const findings = []
  for (const surface of nodes) {
    if (!surface.paints || surface.tag === 'svg') continue
    const kids = (children.get(surface.id) ?? []).filter((c) => c.ink)
    if (!kids.length) continue
    const across = unionInk(kids.map((c) => c.ink))
    const down = unionInk(kids.map((c) => c.box))
    for (const [axis, content] of [
      [0, across],
      [1, down],
    ]) {
      const detail = asymmetryOn(surface, content, axis)
      if (detail) findings.push({ kind: INSET_ASYMMETRY, selector: surface.selector, detail })
    }
  }
  return findings
}

const capPerKind = (findings, limit) => {
  const seen = {}
  return findings.filter((f) => (seen[f.kind] = (seen[f.kind] ?? 0) + 1) <= limit)
}

export function judgeLayout(layout, { limit = MAX_FINDINGS_PER_KIND } = {}) {
  return capPerKind(
    [...judgeStackedInset(layout), ...judgeEdgeClearance(layout), ...judgeInsetAsymmetry(layout)],
    limit
  )
}
