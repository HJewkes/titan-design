// Interaction driver and judges (TD-941). runInteraction Tabs through a story's focusables, then
// for each target snapshots rest, hover, focus and press (in that order; a press swallows its
// click so nothing activates). The judges are pure over those snapshots. Thresholds are the INT+DOM
// checks of rows DR-IX-03, DR-IX-05, DR-IX-08 and DR-IX-12 in docs/design-rules.md.
/* global window */
import { compositeOver, parseColour, parseShadow, toHex } from './colour.mjs'
import { interactionPageSource } from './interaction-page.mjs'

export const FOCUS_RING_MISSING = 'focus-ring-missing'
export const FOCUS_RING_CLIPPED = 'focus-ring-clipped'
export const FOCUS_RING_OBSCURED = 'focus-ring-obscured'
export const STATE_NO_CHANGE = 'state-no-change'
export const STATE_SHIFT = 'state-shift'
export const HOVER_ONLY_CONTENT = 'hover-only-content'

/** The warning kinds this module emits. */
export const KINDS = Object.freeze([
  FOCUS_RING_MISSING,
  FOCUS_RING_CLIPPED,
  FOCUS_RING_OBSCURED,
  STATE_NO_CHANGE,
  STATE_SHIFT,
  HOVER_ONLY_CONTENT,
])
/** Each kind's design rule id in docs/design-rules.md. */
export const RULES = Object.freeze({
  [FOCUS_RING_MISSING]: 'DR-IX-03',
  [FOCUS_RING_CLIPPED]: 'DR-IX-03',
  [FOCUS_RING_OBSCURED]: 'DR-IX-03',
  [STATE_NO_CHANGE]: 'DR-IX-05',
  [STATE_SHIFT]: 'DR-IX-12',
  [HOVER_ONLY_CONTENT]: 'DR-IX-08',
})

/** The states compared against rest, in the order the driver visits them. */
export const STATES = Object.freeze(['hover', 'focus', 'press'])
/** DR-IX-12: a box outside the target may move or resize this much between rest and a state. */
export const SHIFT_TOLERANCE = 1
/** DR-IX-03: the ring is at least this wide and changes its pixels by at least this ratio. */
export const MIN_RING_PX = 2
export const MIN_RING_CONTRAST = 3
/** DR-IX-03: a ring may cross a clipping ancestor's padding box by this much (sub-pixel rounding). */
export const CLIP_TOLERANCE = 0.5
/**
 * Driver caps: focusables per story; then nodes tracked, subtree nodes styled, texts read per state
 * and ancestors read for a wrapper-drawn state or ring.
 */
export const MAX_TARGETS = 12
export const PAGE_CAPS = Object.freeze({
  maxNodes: 600,
  maxSubtree: 24,
  maxTexts: 300,
  maxAncestors: 3,
})
/** Extra wait after each state change, past two frames (which let a zero-delay tooltip open). */
export const SETTLE_MS = 0

const finding = (kind, target, detail) => ({ kind, selector: target.selector, detail })
const present = (target) => STATES.filter((s) => target.states?.[s])
const sameLook = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])

/** DR-IX-05: states whose subtree style is identical to rest, as one finding per target. */
export function judgeNoChange(target) {
  const rest = target.states?.rest
  if (!rest) return []
  const same = present(target).filter((s) => sameLook(target.states[s].look, rest.look))
  if (!same.length) return []
  const detail =
    `${same.join(', ')} look${same.length === 1 ? 's' : ''} the same as rest ` +
    '(colour, background, border, shadow, outline, transform, opacity and underline unchanged)'
  return [finding(STATE_NO_CHANGE, target, detail)]
}

const moveOf = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])))
const isEmpty = (box) => !box || box[2] <= 0 || box[3] <= 0

// The node outside the target that moved most between rest and one state. A node that appears or
// disappears (an empty box on one side, as a display: none tooltip has) is not a move.
function largestMove(rest, state) {
  let best = { id: null, by: 0 }
  for (const [id, box] of Object.entries(state.boxes ?? {})) {
    const before = rest.boxes?.[id]
    if (isEmpty(before) || isEmpty(box)) continue
    const by = moveOf(before, box)
    if (by > best.by) best = { id, by }
  }
  return best
}

/** DR-IX-12: the largest move of a box outside the target, over every state, past 1px. */
export function judgeShift(target, names = {}) {
  const rest = target.states?.rest
  if (!rest) return []
  const moves = present(target).map((s) => ({ s, ...largestMove(rest, target.states[s]) }))
  const worst = moves.reduce((a, b) => (b.by > a.by ? b : a), { by: 0 })
  if (worst.by <= SHIFT_TOLERANCE) return []
  const who = names[worst.id] ?? `node ${worst.id}`
  const by = Math.round(worst.by * 10) / 10
  const detail = `${worst.s} moves ${who} by ${by}px (limit ${SHIFT_TOLERANCE}px)`
  return [finding(STATE_SHIFT, target, detail)]
}

/** DR-IX-05 and DR-IX-12 over one target: state-no-change and state-shift. */
export function judgeStates(target, names = {}) {
  return [...judgeNoChange(target), ...judgeShift(target, names)]
}

const px = (v) => parseFloat(v) || 0

function outlineRing(rest, focus) {
  if (focus.outlineStyle === 'none' || px(focus.outlineWidth) <= 0) return null
  const same = ['outlineStyle', 'outlineWidth', 'outlineColor'].every((p) => rest[p] === focus[p])
  if (same) return null
  const width = px(focus.outlineWidth)
  return {
    via: 'outline',
    width,
    extent: px(focus.outlineOffset) + width,
    colour: focus.outlineColor,
  }
}

// A ring drawn with box-shadow (Tailwind ring: an offset layer under a wider ring layer).
function shadowRing(rest, focus) {
  const before = new Set(parseShadow(rest.boxShadow).map((l) => JSON.stringify(l)))
  const added = parseShadow(focus.boxShadow)
    .filter((l) => !l.inset && l.spread > 0 && !before.has(JSON.stringify(l)))
    .sort((a, b) => b.spread - a.spread)
  if (!added.length) return null
  const [outer, inner] = added
  const width = outer.spread - (inner?.spread ?? 0)
  return { via: 'box-shadow', width, extent: outer.spread, colour: outer.colour }
}

function borderRing(rest, focus) {
  if (rest.borderTopColor === focus.borderTopColor) return null
  return {
    via: 'border',
    width: px(focus.borderTopWidth),
    extent: 0,
    colour: focus.borderTopColor,
    before: rest.borderTopColor,
  }
}

/** The widest focus indicator the focus state adds over rest: outline, box-shadow or border. */
export function ringOf(rest = {}, focus = {}) {
  const rings = [outlineRing, shadowRing, borderRing].map((f) => f(rest, focus)).filter(Boolean)
  return rings.reduce((a, b) => (!a || b.width > a.width ? b : a), null)
}

const luminance = ({ r, g, b }) => {
  const lin = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG contrast ratio of two opaque colours. */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// The ring's change ratio: against the rest border for a border ring, else the backdrop.
function ringContrast(ring, backdrop) {
  const base = parseColour(ring.via === 'border' ? ring.before : backdrop)
  const colour = typeof ring.colour === 'string' ? parseColour(ring.colour) : ring.colour
  if (!base || !colour || base.a < 1) return null
  const shown = colour.a < 1 ? compositeOver(colour, base) : colour
  return { ratio: contrastRatio(shown, base), shown: toHex(shown), base: toHex(base) }
}

function missingDetail(ring, backdrop) {
  if (!ring) return 'no focus indicator: outline, box-shadow and border match rest'
  if (ring.width < MIN_RING_PX)
    return `${ring.via} ring ${ring.width}px wide (limit ${MIN_RING_PX}px)`
  const c = ringContrast(ring, backdrop)
  if (c && c.ratio < MIN_RING_CONTRAST)
    return `${ring.via} ring ${c.shown} on ${c.base} at ${c.ratio.toFixed(2)}:1 (limit ${MIN_RING_CONTRAST}:1)`
  return null
}

function clipDetail(ring, drawer) {
  if (!ring || ring.extent <= 0 || !drawer?.box) return null
  const [x, y, w, h] = drawer.box
  const e = ring.extent
  const edges = [x - e, y - e, x + w + e, y + h + e]
  for (const { selector, rect } of drawer.clips ?? []) {
    const [l, t, r, b] = rect
    const by = Math.max(l - edges[0], t - edges[1], edges[2] - r, edges[3] - b)
    if (by > CLIP_TOLERANCE)
      return `${ring.via} ring clipped by ${Math.round(by * 10) / 10}px at ${selector} (limit 0px)`
  }
  return null
}

function obscuredDetail(focus) {
  const sampled = (focus.topmost ?? []).filter((t) => t !== null)
  if (!sampled.length || sampled.some(Boolean)) return null
  return `none of ${sampled.length} sampled points is topmost; covered by ${focus.coveredBy ?? 'unknown'}`
}

// The widest ring over the chain (the target, then its nearest ancestors), with its chain index.
function chainRing(rest, focus) {
  const rings = (focus.ring ?? []).map((style, at) => {
    const ring = ringOf(rest.ring?.[at], style)
    return ring && { ...ring, at }
  })
  return rings.filter(Boolean).reduce((a, b) => (!a || b.width > a.width ? b : a), null)
}

/** DR-IX-03: a focus state with no 2px, 3:1 ring, a clipped ring, or a fully covered target. */
export function judgeFocus(target) {
  const { rest, focus } = target.states ?? {}
  if (!rest || !focus?.focus) return []
  const ring = chainRing(rest, focus)
  const drawer = focus.focus.chain?.[ring?.at ?? 0]
  const checks = [
    [FOCUS_RING_MISSING, missingDetail(ring, drawer?.backdrop)],
    [FOCUS_RING_CLIPPED, ring && ring.width >= MIN_RING_PX ? clipDetail(ring, drawer) : null],
    [FOCUS_RING_OBSCURED, obscuredDetail(focus.focus)],
  ]
  return checks.filter(([, detail]) => detail).map(([kind, d]) => finding(kind, target, d))
}

const revealed = (state, rest) => (state?.texts ?? []).filter((t) => !rest.texts?.includes(t))
const quote = (texts) => texts.map((t) => `"${t}"`).join(', ')

/** DR-IX-08: text that hover reveals and keyboard focus does not. */
export function judgeHoverOnly(target) {
  const { rest, hover, focus } = target.states ?? {}
  if (!rest || !hover || !focus) return []
  const onFocus = new Set(revealed(focus, rest))
  const only = revealed(hover, rest).filter((t) => !onFocus.has(t))
  if (!only.length) return []
  const shown = only.slice(0, 3)
  const more = only.length > shown.length ? ` and ${only.length - shown.length} more` : ''
  const detail = `hover shows ${quote(shown)}${more}; keyboard focus does not`
  return [finding(HOVER_ONLY_CONTENT, target, detail)]
}

/** judge(targets, names): findings `{ kind, selector, detail }` over every driven target. */
export function judge(targets = [], names = {}) {
  return targets.flatMap((t) => [...judgeFocus(t), ...judgeStates(t, names), ...judgeHoverOnly(t)])
}

/** Zero-length transitions and animations, so each state is final one settle after it starts. */
export const FREEZE_CSS =
  '*, *::before, *::after { transition-duration: 0s !important; transition-delay: 0s !important; ' +
  'animation-duration: 0s !important; animation-delay: 0s !important; }'

const ix = (page, method, ...args) =>
  page.evaluate(([m, a]) => window.__auditIx[m](...a), [method, args])

async function tabThrough(page, maxTargets) {
  await ix(page, 'prepare', 0)
  let count = 0
  while (count < maxTargets) {
    await page.keyboard.press('Tab')
    if ((await ix(page, 'tabbed')) < 0) break
    count++
  }
  return count
}

async function rest(page, i) {
  await ix(page, 'prepare', 0)
  const { away } = await ix(page, 'centre', i)
  await page.mouse.move(away.x, away.y)
  await ix(page, 'settle', SETTLE_MS)
  return ix(page, 'snapshot', i, false)
}

async function hover(page, i) {
  const { x, y } = await ix(page, 'centre', i)
  await page.mouse.move(x, y)
  await ix(page, 'settle', SETTLE_MS)
  return ix(page, 'snapshot', i, false)
}

// One keyboard Tab from the previous target, so :focus-visible matches as it would for a user.
async function focus(page, i) {
  const { away } = await ix(page, 'centre', i)
  await page.mouse.move(away.x, away.y)
  await ix(page, 'prepare', i)
  await page.keyboard.press('Tab')
  if (!(await ix(page, 'isFocused', i))) return null
  await ix(page, 'settle', SETTLE_MS)
  return ix(page, 'snapshot', i, true)
}

// Starts unfocused: a press on the keyboard-focused target would keep :focus-visible on.
async function press(page, i) {
  await ix(page, 'prepare', 0)
  const { x, y, away } = await ix(page, 'centre', i)
  await page.mouse.move(x, y)
  await page.mouse.down()
  await ix(page, 'settle', SETTLE_MS)
  const state = await ix(page, 'snapshot', i, false)
  await ix(page, 'blockClick')
  await page.mouse.up()
  await page.mouse.move(away.x, away.y)
  return state
}

async function driveTarget(page, i) {
  const states = { rest: await rest(page, i) }
  states.hover = await hover(page, i)
  states.focus = await focus(page, i)
  states.press = await press(page, i)
  await ix(page, 'prepare', 0)
  return { selector: await ix(page, 'selectorAt', i), states }
}

/**
 * Drives up to `maxTargets` focusables of the open story and judges them. Returns
 * `{ findings, targets, ms }`: the findings, how many targets were driven, and the elapsed ms.
 * It leaves transitions frozen and the page interacted with, so run it after the frame's audit.
 */
export async function runInteraction(page, { maxTargets = MAX_TARGETS } = {}) {
  const started = performance.now()
  await page.addStyleTag({ content: FREEZE_CSS })
  await page.addScriptTag({ content: interactionPageSource })
  await page.evaluate((caps) => window.installInteraction(caps), PAGE_CAPS)
  const names = await ix(page, 'register')
  const count = await tabThrough(page, maxTargets)
  const targets = []
  for (let i = 0; i < count; i++) targets.push(await driveTarget(page, i))
  return {
    findings: judge(targets, names),
    targets: count,
    ms: Math.round(performance.now() - started),
  }
}
