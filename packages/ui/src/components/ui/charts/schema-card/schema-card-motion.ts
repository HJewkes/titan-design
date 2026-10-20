// SchemaCard's reveal as a pure function of time: it never reads a clock or the previous frame, so
// seeking to `t` from cold gives the same frame as playing up to it. Imports only the stateless
// motion modules; a ui/ component takes time as a prop.
import { easeOut, poly } from '../../motion/easing'
import { interpolate } from '../../motion/interpolate'
import { MOTION } from '../../motion/tokens'
import type { SchemaData, SchemaFieldRef, SchemaRelation, SchemaTable } from './schema-card-layout'

/** A field to emphasise from `atS` for `durS` seconds (held to the end when `durS` is omitted). */
export interface SchemaHighlight {
  /** The row to fill. */
  field: SchemaFieldRef
  /** Seconds at which the fill starts to rise. */
  atS: number
  /** Seconds the fill lasts, exit included. Omit to hold it to the end. */
  durS?: number
}

/** How far a table rises and a row slides while entering, in px. */
export const ENTER_TRAVEL_PX = 8
const TABLE_IN_S = MOTION.duration.slow
const ROW_IN_S = MOTION.duration.normal
const DRAW_S = MOTION.video.emphasis
const ENTER_EASE = easeOut(poly(3))

export interface Reveal {
  opacity: number
  /** Offset from the rest position along the entrance, in px. */
  offset: number
}

export interface SchemaFrame {
  table(id: string): Reveal
  row(table: string, field: string): Reveal
  /** 0..1 of the connector drawn. */
  draw(relationId: string): number
  /** Opacity of the connector's cardinality marks. */
  marks(relationId: string): number
  /** 0..1 emphasis of a field row. */
  highlight(table: string, field: string): number
}

export interface SchemaSchedule {
  tableAt: ReadonlyMap<string, number>
  rowAt: ReadonlyMap<string, number>
  drawAt: ReadonlyMap<string, number>
  highlights: readonly SchemaHighlight[]
}

const rowKey = (table: string, field: string) => `${table}\u0000${field}`

function scheduleTable(table: SchemaTable, startS: number, rowAt: Map<string, number>): number {
  const at = table.atS ?? startS
  const each = MOTION.staggerEachS(table.fields.length)
  let end = at + TABLE_IN_S
  table.fields.forEach((field, i) => {
    const rowStart = field.atS ?? at + TABLE_IN_S / 2 + i * each
    rowAt.set(rowKey(table.id, field.id), rowStart)
    end = Math.max(end, rowStart + ROW_IN_S)
  })
  return end
}

/** A connector starts once both of its rows are fully in, and never before its own `atS`. */
function scheduleRelation(relation: SchemaRelation, rowAt: ReadonlyMap<string, number>) {
  const from = rowAt.get(rowKey(relation.from.table, relation.from.field))
  const to = rowAt.get(rowKey(relation.to.table, relation.to.field))
  if (from === undefined || to === undefined) return undefined
  return Math.max(from + ROW_IN_S, to + ROW_IN_S, relation.atS ?? 0)
}

/** When each table, row and connector starts. Tables without `atS` enter in turn. */
export function schemaSchedule(
  data: SchemaData,
  highlights: readonly SchemaHighlight[] = []
): SchemaSchedule {
  const tableAt = new Map<string, number>()
  const rowAt = new Map<string, number>()
  let next = 0
  for (const table of data.tables) {
    tableAt.set(table.id, table.atS ?? next)
    next = scheduleTable(table, next, rowAt)
  }
  const drawAt = new Map<string, number>()
  for (const relation of data.relations ?? []) {
    const at = scheduleRelation(relation, rowAt)
    if (at !== undefined) drawAt.set(relation.id, at)
  }
  return { tableAt, rowAt, drawAt, highlights }
}

/** The second at which the last table, row, connector or highlight has finished entering. */
export function schemaEndS(schedule: SchemaSchedule): number {
  return Math.max(
    0,
    ...[...schedule.tableAt.values()].map((s) => s + TABLE_IN_S),
    ...[...schedule.rowAt.values()].map((s) => s + ROW_IN_S),
    ...[...schedule.drawAt.values()].map((s) => s + DRAW_S + ROW_IN_S),
    ...schedule.highlights.map((h) => h.atS + ROW_IN_S)
  )
}

/** How long a SchemaCard takes to settle: from `t = 0` until every part has fully entered. */
export function schemaCardDurationS(
  data: SchemaData,
  highlights: readonly SchemaHighlight[] = []
): number {
  return schemaEndS(schemaSchedule(data, highlights))
}

function reveal(t: number, at: number | undefined, durS: number): Reveal {
  if (at === undefined) return { opacity: 1, offset: 0 }
  const p = interpolate(t, [at, at + durS], [0, 1], { ease: ENTER_EASE })
  return { opacity: p, offset: (1 - p) * ENTER_TRAVEL_PX }
}

function emphasis(t: number, { atS, durS }: SchemaHighlight): number {
  const enter = interpolate(t, [atS, atS + ROW_IN_S], [0, 1], { ease: MOTION.ease.out })
  if (durS === undefined) return enter
  const outS = ROW_IN_S * MOTION.video.exitScale
  const exit = interpolate(t, [atS + durS - outS, atS + durS], [0, 1], { ease: MOTION.ease.in })
  return enter * (1 - exit)
}

/** The card at `t` seconds. `t = Infinity` is the settled, fully drawn card. */
export function schemaFrame(schedule: SchemaSchedule, t: number): SchemaFrame {
  return {
    table: (id) => reveal(t, schedule.tableAt.get(id), TABLE_IN_S),
    row: (table, field) => reveal(t, schedule.rowAt.get(rowKey(table, field)), ROW_IN_S),
    draw: (id) => {
      const at = schedule.drawAt.get(id)
      return at === undefined
        ? 0
        : interpolate(t, [at, at + DRAW_S], [0, 1], { ease: MOTION.ease.inOut })
    },
    marks: (id) => {
      const at = schedule.drawAt.get(id)
      return at === undefined ? 0 : interpolate(t, [at + DRAW_S, at + DRAW_S + ROW_IN_S], [0, 1])
    },
    highlight: (table, field) =>
      Math.max(
        0,
        ...schedule.highlights
          .filter((h) => h.field.table === table && h.field.field === field)
          .map((h) => emphasis(t, h))
      ),
  }
}
