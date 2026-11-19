// Chart label probes (TD-1127): pure judges over one frame's collectLayout output. Chart text is
// every SVG <text> node; its ink rect is the collector's screen-space line ink, so rotated and
// scaled charts are measured where they paint. Thresholds are the DOM checks of row DR-CH-04 in
// docs/design-rules.md. A chart with no text (zero or missing data) has nothing to judge.

export const CHART_LABEL_COLLISION = 'chart-label-collision'
export const CHART_LABEL_CLIP = 'chart-label-clip'

/** The warning kinds this module emits. */
export const KINDS = Object.freeze([CHART_LABEL_COLLISION, CHART_LABEL_CLIP])
/** Each kind's design rule id in docs/design-rules.md. */
export const RULES = Object.freeze({
  [CHART_LABEL_COLLISION]: 'DR-CH-04',
  [CHART_LABEL_CLIP]: 'DR-CH-04',
})

/** Two labels may overlap by this much on either axis before they collide. */
export const OVERLAP_TOLERANCE = 1
/** Ink may stray this far past the svg viewport before it is clipped. */
export const CLIP_TOLERANCE = 0.5

const round = (v) => Math.round(v * 10) / 10

// [x, y, w, h] of a text node's painted ink (the collector's transformed bbox, else line ink), or null when the collector gave it none.
function inkOf(n) {
  if (n.svgInk) return n.svgInk
  const t = n.text
  if (t?.first && t?.last)
    return [t.left, t.first.inkTop, t.right - t.left, t.last.inkBottom - t.first.inkTop]
  return n.ink ?? null
}

function svgOf(n, byId) {
  for (let a = byId.get(n.parent); a; a = byId.get(a.parent)) if (a.tag === 'svg') return a
  return null
}

// Chart labels grouped by the svg that holds them; nodes without ink or box are skipped.
function labelsBySvg(layout) {
  const nodes = layout?.nodes ?? []
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const groups = new Map()
  for (const n of nodes) {
    if (n.tag !== 'text') continue
    const ink = inkOf(n)
    const svg = svgOf(n, byId)
    if (!ink || !svg?.box) continue
    if (!groups.has(svg)) groups.set(svg, [])
    groups.get(svg).push({ n, ink })
  }
  return groups
}

const overlapOf = ([ax, ay, aw, ah], [bx, by, bw, bh]) => [
  Math.min(ax + aw, bx + bw) - Math.max(ax, bx),
  Math.min(ay + ah, by + bh) - Math.max(ay, by),
]

/** DR-CH-04: two text labels in one chart whose ink rects overlap on both axes. */
export function judgeChartLabelCollision(layout) {
  const out = []
  for (const labels of labelsBySvg(layout).values())
    labels.forEach((b, j) => {
      for (const a of labels.slice(0, j)) {
        const [ox, oy] = overlapOf(a.ink, b.ink)
        if (ox <= OVERLAP_TOLERANCE || oy <= OVERLAP_TOLERANCE) continue
        out.push({
          kind: CHART_LABEL_COLLISION,
          selector: b.n.selector,
          detail:
            `label overlaps ${a.n.selector} by ${round(ox)}×${round(oy)}px ` +
            `(limit ${OVERLAP_TOLERANCE}px)`,
        })
        break
      }
    })
  return out
}

function clippedSides([x, y, w, h], [sx, sy, sw, sh]) {
  const sides = [
    ['left', sx - x],
    ['top', sy - y],
    ['right', x + w - (sx + sw)],
    ['bottom', y + h - (sy + sh)],
  ]
  return sides.filter(([, past]) => past > CLIP_TOLERANCE)
}

/** DR-CH-04: a text label whose ink runs past the edge of the svg that holds it. */
export function judgeChartLabelClip(layout) {
  const out = []
  for (const [svg, labels] of labelsBySvg(layout)) {
    if (svg.overflow === 'visible') continue
    for (const { n, ink } of labels) {
      const past = clippedSides(ink, svg.box)
      if (!past.length) continue
      const what = past.map(([side, px]) => `${side} ${round(px)}px`).join(', ')
      out.push({
        kind: CHART_LABEL_CLIP,
        selector: n.selector,
        detail: `label ink past ${svg.selector} edge: ${what} (limit ${CLIP_TOLERANCE}px)`,
      })
    }
  }
  return out
}

/** judge(layout, ctx): findings `{ kind, selector, detail }`. */
export function judge(layout) {
  return [...judgeChartLabelCollision(layout), ...judgeChartLabelClip(layout)]
}
