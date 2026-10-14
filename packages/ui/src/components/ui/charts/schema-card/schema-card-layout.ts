// SchemaCard geometry as a pure function of the data: table boxes, field row centres and connector
// paths. Nothing is measured at render, so a frame depends only on its props and `t`.
import { space } from '../../../../theme/tokens/semantic'

/** One field of a table. `id` is unique within its table and keys the row across frames. */
export interface SchemaField {
  /** Unique within its table; keys the row across frames. */
  id: string
  /** The field's name, shown in the row. */
  name: string
  /** The field's type, shown after the name. */
  type?: string
  /** `primary` marks the table's key; `foreign` a field that references another. */
  key?: 'primary' | 'foreign'
  /** Seconds at which the row starts to enter. Default: in turn after its table. */
  atS?: number
}

/** A table: a named box of field rows. */
export interface SchemaTable {
  /** Unique within the schema. */
  id: string
  /** The table's name, shown in its header. */
  name: string
  /** The rows, top to bottom. */
  fields: readonly SchemaField[]
  /** Grid cell, left to right then top to bottom. Default: the next column of row 0. */
  column?: number
  /** Grid row; tables in a later row sit below the tallest table of the rows above. */
  row?: number
  /** Seconds at which the table starts to enter. Default: after the previous table's last row. */
  atS?: number
}

/** A field in a table. */
export interface SchemaFieldRef {
  /** The table's `id`. */
  table: string
  /** The field's `id` within that table. */
  field: string
}

/** A reference from one field to another, drawn as a connector between their rows. */
export interface SchemaRelation {
  /** Unique within the schema. */
  id: string
  /** The referencing field: the "many" end of a `many-to-one` relation. */
  from: SchemaFieldRef
  /** The referenced field: the "one" end. */
  to: SchemaFieldRef
  /** Default `many-to-one`. */
  cardinality?: 'many-to-one' | 'one-to-one'
  /** Earliest second the connector may start drawing; it never draws before both rows are in. */
  atS?: number
}

/** The data a SchemaCard draws. */
export interface SchemaData {
  /** The tables, in reveal order. */
  tables: readonly SchemaTable[]
  /** The relations; one naming a missing table or field is dropped. */
  relations?: readonly SchemaRelation[]
}

export interface TableBox {
  table: SchemaTable
  x: number
  y: number
  width: number
  height: number
}

export interface ConnectorGeometry {
  relation: SchemaRelation
  /** The connector from the `from` row to the `to` row. */
  path: string
  /** The cardinality marks at both ends, drawn after the connector. */
  marks: string
}

export interface SchemaLayout {
  width: number
  height: number
  tables: readonly TableBox[]
  connectors: readonly ConnectorGeometry[]
}

export const HEADER_HEIGHT = 32
export const ROW_HEIGHT = 24
/** Space under the last row, so it clears the table's rounded corner. */
export const TABLE_PAD_BOTTOM = space.inset.xs
export const DEFAULT_TABLE_WIDTH = 192
const COLUMN_GAP = space.section.lg
const ROW_GAP = space.gutter.md
/** The straight run at each end of a connector, where its cardinality mark sits. */
const STUB = space.inset.md
/** How far a connector between two tables of one column bows out past their right edge. */
const LOOP_OUT = space.gutter.md
const MARK_HALF = 5

type Side = 1 | -1

export function tableHeight(table: SchemaTable): number {
  return HEADER_HEIGHT + table.fields.length * ROW_HEIGHT + TABLE_PAD_BOTTOM
}

/** The vertical centre of a field's row, relative to its table's top. */
export function rowCentre(index: number): number {
  return HEADER_HEIGHT + index * ROW_HEIGHT + ROW_HEIGHT / 2
}

function cellOf(table: SchemaTable, index: number) {
  return { column: table.column ?? index, row: table.row ?? 0 }
}

function placeTables(tables: readonly SchemaTable[], tableWidth: number): TableBox[] {
  const cells = tables.map(cellOf)
  const rowHeights = new Map<number, number>()
  tables.forEach((table, i) => {
    const row = cells[i]!.row
    rowHeights.set(row, Math.max(rowHeights.get(row) ?? 0, tableHeight(table)))
  })
  const rowTop = (row: number) =>
    [...rowHeights].filter(([r]) => r < row).reduce((sum, [, h]) => sum + h + ROW_GAP, 0)
  return tables.map((table, i) => ({
    table,
    x: cells[i]!.column * (tableWidth + COLUMN_GAP),
    y: rowTop(cells[i]!.row),
    width: tableWidth,
    height: tableHeight(table),
  }))
}

interface Anchor {
  x: number
  y: number
  side: Side
}

function findRow(boxes: readonly TableBox[], ref: SchemaFieldRef) {
  const box = boxes.find((b) => b.table.id === ref.table)
  const index = box?.table.fields.findIndex((f) => f.id === ref.field) ?? -1
  return box && index >= 0 ? { box, y: box.y + rowCentre(index) } : null
}

/** Each end leaves the side facing the other table; tables in one column both use the right. */
function anchors(from: TableBox, to: TableBox, fromY: number, toY: number): [Anchor, Anchor] {
  const edge = (box: TableBox, side: Side) => (side === 1 ? box.x + box.width : box.x)
  if (from.x === to.x)
    return [
      { x: edge(from, 1), y: fromY, side: 1 },
      { x: edge(to, 1), y: toY, side: 1 },
    ]
  const side: Side = to.x > from.x ? 1 : -1
  const back = -side as Side
  return [
    { x: edge(from, side), y: fromY, side },
    { x: edge(to, back), y: toY, side: back },
  ]
}

function connectorPath(a: Anchor, b: Anchor): string {
  const ax = a.x + a.side * STUB
  const bx = b.x + b.side * STUB
  const reach = a.side === b.side ? LOOP_OUT : Math.max(STUB, Math.abs(bx - ax) / 2)
  const c1 = ax + a.side * reach
  const c2 = bx + b.side * reach
  return `M${a.x},${a.y}H${ax}C${c1},${a.y} ${c2},${b.y} ${bx},${b.y}H${b.x}`
}

/** A crow's foot: three prongs meeting at the stub's end, spread across the table edge. */
function manyMark({ x, y, side }: Anchor): string {
  const tip = x + side * STUB
  return `M${tip},${y}L${x},${y - MARK_HALF}M${tip},${y}L${x},${y + MARK_HALF}`
}

/** A bar across the stub, half way along it. */
function oneMark({ x, y, side }: Anchor): string {
  const bar = x + (side * STUB) / 2
  return `M${bar},${y - MARK_HALF}V${y + MARK_HALF}`
}

function connector(boxes: readonly TableBox[], relation: SchemaRelation): ConnectorGeometry | null {
  const from = findRow(boxes, relation.from)
  const to = findRow(boxes, relation.to)
  if (!from || !to) return null
  const [a, b] = anchors(from.box, to.box, from.y, to.y)
  const fromMark = relation.cardinality === 'one-to-one' ? oneMark(a) : manyMark(a)
  return { relation, path: connectorPath(a, b), marks: `${fromMark}${oneMark(b)}` }
}

/** Where every table, row and connector sits. A relation naming a missing table or field is dropped. */
export function schemaLayout(data: SchemaData, tableWidth = DEFAULT_TABLE_WIDTH): SchemaLayout {
  const tables = placeTables(data.tables, tableWidth)
  const connectors = (data.relations ?? [])
    .map((relation) => connector(tables, relation))
    .filter((c): c is ConnectorGeometry => c !== null)
  const loops = connectors.some((c) => {
    const box = tables.find((t) => t.table.id === c.relation.from.table)
    return box && tables.find((t) => t.table.id === c.relation.to.table)?.x === box.x
  })
  const right = Math.max(0, ...tables.map((t) => t.x + t.width))
  return {
    width: right + (loops ? STUB + LOOP_OUT : 0),
    height: Math.max(0, ...tables.map((t) => t.y + t.height)),
    tables,
    connectors,
  }
}

/** The settled card's size in px, so a host can place the card before it renders. */
export function schemaCardSize(
  data: SchemaData,
  tableWidth = DEFAULT_TABLE_WIDTH
): { width: number; height: number } {
  const { width, height } = schemaLayout(data, tableWidth)
  return { width, height }
}
