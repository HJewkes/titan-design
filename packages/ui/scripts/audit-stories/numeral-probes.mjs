// Numeral probes (TD-940): pure judges over one frame's collectLayout output and the tree's mono
// family (`ctx.fonts`). Thresholds are the DOM checks of rows DR-TY-04, DR-TY-14, DR-DD-01,
// DR-DD-02 and DR-DD-04 in docs/design-rules.md. Text is read from `text.figures` (collected only
// for text holding a digit); a node without it is skipped.
import { isMono } from './font-config.mjs'
import { index } from './layout-probes.mjs'

export const TABULAR_FIGURES = 'tabular-figures'
export const NUMERAL_SPACING = 'numeral-spacing'
export const NUMERIC_ALIGN = 'numeric-align'
export const DECIMAL_COUNT = 'decimal-count'
export const UNGROUPED_DIGITS = 'ungrouped-digits'

/** The warning kinds this module emits. */
export const KINDS = Object.freeze([
  TABULAR_FIGURES,
  NUMERAL_SPACING,
  NUMERIC_ALIGN,
  DECIMAL_COUNT,
  UNGROUPED_DIGITS,
])
/** Each kind's design rule id in docs/design-rules.md. */
export const RULES = Object.freeze({
  [TABULAR_FIGURES]: 'DR-TY-04',
  [NUMERAL_SPACING]: 'DR-TY-14',
  [NUMERIC_ALIGN]: 'DR-DD-01',
  [DECIMAL_COUNT]: 'DR-DD-02',
  [UNGROUPED_DIGITS]: 'DR-DD-04',
})

/** DR-TY-04: canvas width of "0000" against "1111" in the computed font. */
export const FIGURE_SPREAD_MAX_PX = 0.5
/** DR-DD-01: right edges of a numeric column, and its header's, agree within this. */
export const ALIGN_TOLERANCE_PX = 1
/** DR-TY-14, verbatim from the registry row. */
export const SPACED_UNIT = /\d\s+(%|×|x\d|s\b|ms\b)/
// The same match widened to the whole number, for the detail.
const SPACED_SHOWN = new RegExp(`[\\d.,]*${SPACED_UNIT.source}`)
/**
 * DR-DD-04: a whole-number run of 5 or more digits. Not a fraction (after `.` or `,`), not part of
 * an id (`#`, `/`, `:`, `-` or a letter joined to it), but a lowercase unit of up to 3 letters may
 * follow (`12500kg`).
 */
export const UNGROUPED = /(?<![\w#.,/:])(?<!\w-)\d{5,}(?![\d/:_-]|[A-Z]|[a-z]{4})/
/**
 * A numeric cell: an optional short non-letter prefix (currency, sign), one number with optional
 * grouping and fraction, and an optional unit of up to 4 characters. Group 1 is the fraction.
 */
export const NUMERIC_CELL =
  /^[^\d\s\p{L}]{0,2}\s?[-+−]?\d{1,3}(?:[, \u202f]?\d{3})*(?:\.(\d+))?\s?(?:%|[^\d\s]{1,4})?$/u

const CELL = new Set(['cell', 'gridcell'])
const HEADER = new Set(['columnheader'])
const ROW = new Set(['row'])
const TABLE = new Set(['table', 'grid', 'treegrid'])

const figureTexts = (layout) =>
  (layout?.nodes ?? []).filter((n) => typeof n.text?.figures?.full === 'string')

const ancestorWith = (n, byId, roles) => {
  for (let a = n; a; a = byId.get(a.parent)) if (roles.has(a.role)) return a
  return null
}

const quote = (s) => `"${s.length > 30 ? `${s.slice(0, 29)}…` : s}"`

// --- table columns: each cell's place in its row, its text and its text's edges.

function cellsOf(row, byId, nodes) {
  return nodes.filter(
    (n) =>
      (CELL.has(n.role) || HEADER.has(n.role)) &&
      ancestorWith(byId.get(n.parent), byId, ROW) === row
  )
}

function cellContent(cell, nodes, byId) {
  const inside = nodes.filter((n) => n !== cell && isUnder(n, cell, byId))
  const own = cell.text ? [cell] : []
  const textNodes = [...own, ...inside.filter((n) => n.text)]
  if (!textNodes.length) return null
  const words = textNodes.map((n) => n.text.figures?.full ?? n.text.ownText ?? '')
  const marks = [...textNodes.map((n) => n.text.right), ...svgRights(inside)]
  return {
    text: words.join(' ').replace(/\s+/g, ' ').trim(),
    right: Math.max(...marks.filter(Number.isFinite)),
    textRight: Math.max(...textNodes.map((n) => n.text.right).filter(Number.isFinite)),
  }
}

const svgRights = (nodes) => nodes.filter((n) => n.tag === 'svg').map((n) => n.box[0] + n.box[2])

function isUnder(n, ancestor, byId) {
  for (let a = byId.get(n.parent); a; a = byId.get(a.parent)) if (a === ancestor) return true
  return false
}

// A column is its table (or, with no table role, the frame) and the cell's place in its row.
const columnKey = (row, at, byId) => `${ancestorWith(row, byId, TABLE)?.id ?? ''}:${at}`

function columnOf(cell, byId, nodes) {
  const row = ancestorWith(byId.get(cell.parent), byId, ROW)
  return row ? columnKey(row, cellsOf(row, byId, nodes).indexOf(cell), byId) : `cell ${cell.id}`
}

/** Columns of every table in the frame: `{ key, header, cells }`, cells in row order. */
export function tableColumns(layout) {
  const nodes = layout?.nodes ?? []
  const { byId } = index(nodes)
  const columns = new Map()
  for (const row of nodes.filter((n) => ROW.has(n.role))) {
    cellsOf(row, byId, nodes).forEach((cell, at) => {
      const key = columnKey(row, at, byId)
      if (!columns.has(key)) columns.set(key, { key, header: null, cells: [] })
      const content = cellContent(cell, nodes, byId)
      if (!content) return
      const column = columns.get(key)
      if (HEADER.has(cell.role)) column.header ??= { node: cell, ...content }
      else column.cells.push({ node: cell, ...content })
    })
  }
  return [...columns.values()]
}

const numericCells = (column) =>
  column.cells.map((c) => ({ ...c, match: c.text.match(NUMERIC_CELL) })).filter((c) => c.match)

// --- DR-TY-04 tabular-figures

function isTabular(t, ctx) {
  const f = t.figures
  return (
    String(f.variant ?? '').includes('tabular-nums') ||
    isMono(t.family, ctx.fonts) ||
    (Number.isFinite(f.spread) && f.spread <= FIGURE_SPREAD_MAX_PX)
  )
}

const proportional = (n, where, count) =>
  `${count > 1 ? `${count} numerals` : 'numeral'} ${quote(n.text.figures.full)} in ${where} ` +
  `${count > 1 ? 'use' : 'uses'} proportional figures: "0000" and "1111" differ by ` +
  `${n.text.figures.spread}px (limit ${FIGURE_SPREAD_MAX_PX}px), no tabular-nums`

/**
 * Numerals in a table cell or a live region (aria-live, status, timer, log, marquee) whose figures
 * are proportional: no `tabular-nums`, not mono, and a canvas spread over 0.5px. One finding per
 * table column, and one per live node outside a table.
 */
export function judgeTabularFigures(layout, ctx = {}) {
  const nodes = layout?.nodes ?? []
  const { byId } = index(nodes)
  const bad = figureTexts(layout).filter((n) => !isTabular(n.text, ctx))
  const byColumn = Map.groupBy(bad, (n) => {
    const cell = ancestorWith(n, byId, CELL)
    return cell ? columnOf(cell, byId, nodes) : null
  })
  return [...byColumn].flatMap(([column, members]) =>
    column === null
      ? members
          .filter((n) => n.text.figures.live)
          .map((n) => finding(TABULAR_FIGURES, n, proportional(n, 'a live region', 1)))
      : [
          finding(
            TABULAR_FIGURES,
            members[0],
            proportional(members[0], 'a table column', members.length)
          ),
        ]
  )
}

const finding = (kind, n, detail) => ({ kind, selector: n.selector, detail })

// --- DR-TY-14 numeral-spacing

/** Rendered text with a space between a number and %, ×, x<digit>, s or ms. */
export function judgeNumeralSpacing(layout) {
  return figureTexts(layout).flatMap((n) => {
    const hit = n.text.figures.full.match(SPACED_SHOWN)
    if (!hit) return []
    return [
      finding(
        NUMERAL_SPACING,
        n,
        `${quote(hit[0])} has a space before "${hit[1]}" in ${quote(n.text.figures.full)}`
      ),
    ]
  })
}

// --- DR-DD-01 numeric-align

function alignFinding(column, nums) {
  const rights = nums.map((c) => c.textRight)
  const spread = Math.max(...rights) - Math.min(...rights)
  if (spread > ALIGN_TOLERANCE_PX) {
    const detail = `numeric column right edges spread ${spread}px (limit ${ALIGN_TOLERANCE_PX}px)`
    return finding(NUMERIC_ALIGN, nums[0].node, detail)
  }
  if (!column.header) return null
  const gap = Math.abs(column.header.right - Math.max(...rights))
  if (gap <= ALIGN_TOLERANCE_PX) return null
  const detail = `header right edge is ${gap}px from its right-aligned numeric column (limit ${ALIGN_TOLERANCE_PX}px)`
  return finding(NUMERIC_ALIGN, column.header.node, detail)
}

/**
 * A table column of 2 or more numeric cells whose text right edges spread over 1px, or whose header
 * (its text and icons) ends more than 1px from the cells' common right edge.
 */
export function judgeNumericAlign(layout) {
  return tableColumns(layout)
    .map((column) => [column, numericCells(column)])
    .filter(([, nums]) => nums.length >= 2)
    .map(([column, nums]) => alignFinding(column, nums))
    .filter(Boolean)
}

// --- DR-DD-02 decimal-count

/** A table column of 2 or more numeric cells holding more than one count of decimal places. */
export function judgeDecimalCount(layout) {
  return tableColumns(layout).flatMap((column) => {
    const nums = numericCells(column)
    const counts = [...new Set(nums.map((c) => c.match[1]?.length ?? 0))].sort((a, b) => a - b)
    if (nums.length < 2 || counts.length <= 1) return []
    const detail = `numeric column mixes ${counts.join(', ')} decimal places (limit 1 count)`
    return [finding(DECIMAL_COUNT, nums[0].node, detail)]
  })
}

// --- DR-DD-04 ungrouped-digits

/** Rendered text holding a whole number of 5 or more digits with no grouping, outside ids. */
export function judgeUngroupedDigits(layout) {
  return figureTexts(layout).flatMap((n) => {
    const hit = n.text.figures.full.match(UNGROUPED)
    if (!hit) return []
    return [
      finding(
        UNGROUPED_DIGITS,
        n,
        `${quote(hit[0])} has ${hit[0].length} ungrouped digits (limit 4)`
      ),
    ]
  })
}

/** judge(layout, ctx): findings `{ kind, selector, detail }`. */
export function judge(layout, ctx = {}) {
  return [
    ...judgeTabularFigures(layout, ctx),
    ...judgeNumeralSpacing(layout),
    ...judgeNumericAlign(layout),
    ...judgeDecimalCount(layout),
    ...judgeUngroupedDigits(layout),
  ]
}
