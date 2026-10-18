// Elevation and glyph probes (TD-935b): pure judges over one frame's collectLayout output. Shadow
// layers come from parseShadow; a lift layer matches lift-shadow.ts ambientLayers and a glow layer
// matches elevation-planes.ts glowShadow. Thresholds are the DOM checks of rows DR-CO-14, DR-CO-15
// and DR-RB-04 in docs/design-rules.md.
import { compositeOver, parseColour, parseShadow, toHex, toOklch } from './colour.mjs'
import { inInstance, instanceRoots } from './instances.mjs'

export const NESTED_LIFT = 'nested-lift'
export const GLOW_SCOPE = 'glow-scope'
export const GLYPH_DRIFT = 'glyph-drift'

/** The warning kinds this module emits. */
export const KINDS = Object.freeze([NESTED_LIFT, GLOW_SCOPE, GLYPH_DRIFT])
/** Each kind's design rule id in docs/design-rules.md. */
export const RULES = Object.freeze({
  [NESTED_LIFT]: 'DR-CO-14',
  [GLOW_SCOPE]: 'DR-CO-15',
  [GLYPH_DRIFT]: 'DR-RB-04',
})

/** A shadow colour is neutral (a lift) below this OKLCh chroma, chromatic (a glow) above the next. */
export const NEUTRAL_C = 0.02
export const GLOW_C = 0.06
/** Three lift layers is LIFT_AMBIENT steps 4 and 5, the floating steps (FLOATING_LIFT_MIN = 4). */
export const FLOATING_LAYERS = 3
export const FLOATING_ROLES = Object.freeze(['dialog', 'menu', 'listbox', 'tooltip'])
/** DR-CO-14: thumbs and knobs this size or smaller on a side may cast their own shadow. */
export const MAX_THUMB = 24
/** DR-CO-15: a glow marks an indicator this size or smaller on both sides, one per instance. */
export const MAX_GLOW = 24
/** DR-RB-04: an svg this size or smaller on both sides is an icon; larger is art or a chart. */
export const MAX_ICON = 48
/** DR-RB-04: two copies of one glyph may differ in width or height by this much. */
export const SIZE_TOLERANCE = 1

// A layer with no visible colour casts nothing, so it is neither a lift nor a glow.
const chromaOf = (colour) => (colour && colour.a > 0 ? toOklch(colour).C : NaN)
const isLiftLayer = (l) => !l.inset && l.y > 0 && l.blur > 0 && chromaOf(l.colour) < NEUTRAL_C
const isGlowLayer = (l) =>
  !l.inset && l.x === 0 && l.y === 0 && l.blur > 0 && chromaOf(l.colour) > GLOW_C
const layersOf = (n) => parseShadow(n.style?.boxShadow)
const liftCount = (n) => layersOf(n).filter(isLiftLayer).length
const sizeOf = (n) => [n.box?.[2] ?? 0, n.box?.[3] ?? 0]
const dims = (n) => sizeOf(n).join('×')

const isFloating = (n) =>
  liftCount(n) >= FLOATING_LAYERS ||
  n.layout?.position === 'fixed' ||
  FLOATING_ROLES.includes(n.role)
const isContentLift = (n) => liftCount(n) > 0 && !isFloating(n)

function ancestorsOf(n, byId) {
  const out = []
  for (let a = byId.get(n.parent); a; a = byId.get(a.parent)) out.push(a)
  return out
}

// Lifted, non-floating ancestors out to the nearest floating one, which starts a new stack.
function liftedAncestors(n, byId) {
  const out = []
  for (const a of ancestorsOf(n, byId)) {
    if (isFloating(a)) break
    if (isContentLift(a)) out.push(a)
  }
  return out
}

/** DR-CO-14: a lifted content box (not a thumb, not floating) inside another lifted content box. */
export function judgeNestedLift(layout) {
  const nodes = layout?.nodes ?? []
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const out = []
  for (const n of nodes) {
    if (!isContentLift(n) || Math.min(...sizeOf(n)) <= MAX_THUMB) continue
    const lifted = liftedAncestors(n, byId)
    if (!lifted.length) continue
    const detail =
      `lifted ${dims(n)} box inside lifted ${lifted[0].selector} ` +
      `(lifted depth ${lifted.length + 1}, limit 1)`
    out.push({ kind: NESTED_LIFT, selector: n.selector, detail })
  }
  return out
}

function glowMisuse(n, byId) {
  const [w, h] = sizeOf(n)
  if (w > MAX_GLOW || h > MAX_GLOW) return `glow on a ${w}×${h} box (limit ${MAX_GLOW}px)`
  if (n.text) return 'glow on text (indicators only)'
  if (ancestorsOf(n, byId).some((a) => a.tag === 'svg'))
    return 'glow inside an svg (no chart marks)'
  return null
}

/** DR-CO-15: a glow on a large box, on text or in a chart, or a second glow in one instance. */
export function judgeGlowScope(layout, ctx = {}) {
  const nodes = layout?.nodes ?? []
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const glowing = nodes.filter((n) => layersOf(n).some(isGlowLayer))
  const out = []
  const report = (n, detail) => out.push({ kind: GLOW_SCOPE, selector: n.selector, detail })
  for (const n of glowing) {
    const misuse = glowMisuse(n, byId)
    if (misuse) report(n, misuse)
  }
  const reported = new Set(out.map((f) => f.selector))
  for (const root of instanceRoots({ nodes }, ctx.story)) {
    const inside = glowing.filter((n) => inInstance(n.id, root))
    inside.slice(1).forEach((n, i) => {
      if (!reported.has(n.selector))
        report(n, `glow ${i + 2} of ${inside.length} in one instance (limit 1)`)
    })
  }
  return out
}

// The opaque colour behind a node: backgrounds composited from the node outward until one is
// opaque. A background image stops the walk; a walk that never reaches an opaque fill ends on
// the page, which the collector does not see.
function backdropOf(n, byId) {
  const layers = []
  for (let a = n; a; a = byId.get(a.parent)) {
    if (a.style?.hasBackgroundImage) return `image ${a.id}`
    const colour = parseColour(a.style?.backgroundColor)
    if (!colour || colour.a === 0) continue
    if (colour.a >= 1)
      return toHex(layers.reduceRight((base, top) => compositeOver(top, base), colour))
    layers.push(colour)
  }
  return `page ${layers.map(toHex).join(' ')}`.trim()
}

// The state of the control an icon sits in (selected, current, pressed, checked, disabled).
function stateKeyOf(n, byId) {
  const owner = [n, ...ancestorsOf(n, byId)].find((a) => a.interactive) ?? n
  const s = owner.state ?? {}
  return [s.selected, s.current, s.pressed, s.checked, s.disabled].join('|')
}

function glyphRoleOf(n, byId, roles = {}) {
  for (const a of [n, ...ancestorsOf(n, byId)]) if (roles[a.id] !== undefined) return roles[a.id]
  return null
}

const isIcon = (n) =>
  n.tag === 'svg' && n.glyph && sizeOf(n).every((side) => side > 0 && side <= MAX_ICON)

function iconsOf(layout, byId) {
  return (layout?.nodes ?? []).filter(isIcon).map((n) => ({
    n,
    key: [n.glyph, glyphRoleOf(n, byId, layout.audit?.glyphRoles), stateKeyOf(n, byId)].join('#'),
    paint: toHex(n.paint),
    backdrop: backdropOf(n, byId),
  }))
}

function driftBetween(a, b) {
  const [[aw, ah], [bw, bh]] = [sizeOf(a.n), sizeOf(b.n)]
  if (Math.abs(aw - bw) > SIZE_TOLERANCE || Math.abs(ah - bh) > SIZE_TOLERANCE)
    return `size ${dims(b.n)} vs ${dims(a.n)} at ${a.n.selector} (limit ${SIZE_TOLERANCE}px)`
  if (a.backdrop === b.backdrop && a.paint && b.paint && a.paint !== b.paint)
    return `colour ${b.paint} vs ${a.paint} at ${a.n.selector} on ${a.backdrop} (one colour per backdrop)`
  return null
}

// The first copy that differs from an earlier one, as a finding, or null.
function firstDrift(copies) {
  for (let i = 1; i < copies.length; i++)
    for (let j = 0; j < i; j++) {
      const what = driftBetween(copies[j], copies[i])
      if (what)
        return {
          kind: GLYPH_DRIFT,
          selector: copies[i].n.selector,
          detail: `glyph ${copies[i].n.glyph}: ${what}`,
        }
    }
  return null
}

/** DR-RB-04: copies of one icon in one instance that differ in size or, on one backdrop, colour. */
export function judgeGlyphDrift(layout, ctx = {}) {
  const nodes = layout?.nodes ?? []
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const icons = iconsOf(layout, byId)
  const out = []
  for (const root of instanceRoots({ nodes }, ctx.story)) {
    const groups = Map.groupBy(
      icons.filter((i) => inInstance(i.n.id, root)),
      (i) => i.key
    )
    for (const copies of groups.values()) {
      const finding = firstDrift(copies)
      if (finding) out.push(finding)
    }
  }
  return out
}

/** judge(layout, ctx): findings `{ kind, selector, detail }`. */
export function judge(layout, ctx = {}) {
  return [
    ...judgeNestedLift(layout, ctx),
    ...judgeGlowScope(layout, ctx),
    ...judgeGlyphDrift(layout, ctx),
  ]
}
