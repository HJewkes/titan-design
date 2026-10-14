import { useMemo, type ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion'
import { cn } from '../../../../utils/cn'
import { EmptyState } from '../../empty-state'
import { Skeleton } from '../../skeleton'
import { Surface } from '../../surface'
import { Typography } from '../../typography'
import { SchemaConnectors } from './SchemaConnectors'
import {
  DEFAULT_TABLE_WIDTH,
  HEADER_HEIGHT,
  ROW_HEIGHT,
  schemaLayout,
  type SchemaData,
  type SchemaField,
  type SchemaRelation,
  type TableBox,
} from './schema-card-layout'
import {
  schemaFrame,
  schemaSchedule,
  type SchemaFrame,
  type SchemaHighlight,
} from './schema-card-motion'

/** Props of {@link SchemaCard}. */
export interface SchemaCardProps extends Omit<ViewProps, 'children'> {
  /** The tables, their fields and the relations between them. */
  data: SchemaData
  /** Seconds into the card's reveal. Omit for the settled, fully drawn card. */
  t?: number
  /** Fields to emphasise, each over its own window. */
  highlights?: readonly SchemaHighlight[]
  /** Width of every table, in px. */
  tableWidth?: number
  /** Names the diagram for assistive technology. */
  accessibilityLabel: string
  /** Shows a placeholder of the card's settled size. */
  isLoading?: boolean
  /** Shown when `data` has no tables. Default: an `EmptyState` reading "No tables". */
  emptyState?: ReactNode
  className?: string
}

const KEY_LABEL = { primary: 'PK', foreign: 'FK' } as const
const KEY_SPOKEN = { primary: 'primary key', foreign: 'foreign key' } as const
const KEY_COLUMN_WIDTH = 20
const NO_HIGHLIGHTS: readonly SchemaHighlight[] = []

function spokenRow(
  table: string,
  field: SchemaField,
  relations: readonly SchemaRelation[]
): string {
  const parts = [field.name, field.type, field.key && KEY_SPOKEN[field.key]]
  for (const r of relations) {
    if (r.from.table === table && r.from.field === field.id) {
      parts.push(`references ${r.to.table}.${r.to.field}`)
    }
  }
  return parts.filter(Boolean).join(', ')
}

interface RowProps {
  table: string
  field: SchemaField
  frame: SchemaFrame
  relations: readonly SchemaRelation[]
}

function FieldRow({ table, field, frame, relations }: RowProps) {
  const { opacity, offset } = frame.row(table, field.id)
  return (
    <View
      style={{ height: ROW_HEIGHT, opacity, transform: [{ translateX: -offset }] }}
      className="flex-row items-center gap-inline-sm px-inset-sm"
      role="listitem"
      accessibilityLabel={spokenRow(table, field, relations)}
      aria-hidden={opacity === 0 || undefined}
      testID={`schema-row-${table}-${field.id}`}
    >
      <View
        style={{ opacity: frame.highlight(table, field.id) }}
        className="absolute inset-0 bg-interactive-selected"
        testID={`schema-highlight-${table}-${field.id}`}
      />
      <View style={{ width: KEY_COLUMN_WIDTH }}>
        {field.key !== undefined && (
          <Typography variant="microLabel" color="tertiary">
            {KEY_LABEL[field.key]}
          </Typography>
        )}
      </View>
      <Typography variant="mono" className="flex-1">
        {field.name}
      </Typography>
      {field.type !== undefined && (
        <Typography variant="mono" color="tertiary">
          {field.type}
        </Typography>
      )}
    </View>
  )
}

function TableView({
  box,
  frame,
  relations,
}: {
  box: TableBox
  frame: SchemaFrame
  relations: readonly SchemaRelation[]
}) {
  const { opacity, offset } = frame.table(box.table.id)
  return (
    <View
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        opacity,
        transform: [{ translateY: offset }],
      }}
      aria-hidden={opacity === 0 || undefined}
      testID={`schema-table-${box.table.id}`}
    >
      <Surface raise={1} className="flex-1 overflow-hidden">
        <View
          style={{ height: HEADER_HEIGHT }}
          className="justify-center border-b border-hairline-subtle px-inset-sm"
        >
          <Typography variant="boldLabel">{box.table.name}</Typography>
        </View>
        <View role="list" aria-label={box.table.name}>
          {box.table.fields.map((field) => (
            <FieldRow
              key={field.id}
              table={box.table.id}
              field={field}
              frame={frame}
              relations={relations}
            />
          ))}
        </View>
      </Surface>
    </View>
  )
}

/**
 * SchemaCard: tables, their fields and the relations between them, laid out from data with no
 * measuring. `t` reveals it: each table rises in, its rows follow in turn, and a relation's
 * connector draws on once both of its rows are in, then shows its cardinality marks. Without `t`,
 * or with reduced motion, it shows the settled card.
 *
 * @example
 * <SchemaCard data={schema} t={1.2} accessibilityLabel="Post and author tables" />
 */
export function SchemaCard({
  data,
  t,
  highlights = NO_HIGHLIGHTS,
  tableWidth = DEFAULT_TABLE_WIDTH,
  accessibilityLabel,
  isLoading = false,
  emptyState,
  className,
  style,
  ...props
}: SchemaCardProps) {
  const isReducedMotion = usePrefersReducedMotion()
  const layout = useMemo(() => schemaLayout(data, tableWidth), [data, tableWidth])
  const schedule = useMemo(() => schemaSchedule(data, highlights), [data, highlights])
  const frame = schemaFrame(schedule, t === undefined || isReducedMotion ? Infinity : t)
  const size = { width: layout.width, height: layout.height }

  if (isLoading)
    return <Skeleton {...size} accessibilityLabel={accessibilityLabel} className={className} />
  if (data.tables.length === 0) {
    return <View className={className}>{emptyState ?? <EmptyState title="No tables" />}</View>
  }
  const relations = data.relations ?? []
  return (
    <View
      role="group"
      aria-label={accessibilityLabel}
      style={[size, style]}
      className={cn('relative', className)}
      testID="schema-card"
      {...props}
    >
      <SchemaConnectors connectors={layout.connectors} frame={frame} {...size} />
      {layout.tables.map((box) => (
        <TableView key={box.table.id} box={box} frame={frame} relations={relations} />
      ))}
    </View>
  )
}
