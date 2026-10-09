// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { DateTime } from '../../ui/date-time'
import { Link } from '../../ui/link'
import { Pill } from '../../ui/pill'
import { TableCell, TableRow } from '../../ui/table'
import { Typography } from '../../ui/typography'
import { KNOWLEDGE_CLASS_META, NOTE_KIND_LABEL, SOURCE_TYPE_LABEL } from './knowledge-class'
import type { KnowledgeSortRow } from './knowledge-filters'
import { TagPills } from './TagPills'

/** Columns the list may leave out; `title` is the one column that always renders. */
export type KnowledgeColumnKey = 'initiative' | 'record' | 'kind' | 'date' | 'tags'

/**
 * Fixed widths shared by {@link KnowledgeRow} and the list header, so the two
 * cannot drift. `title` is the flexible column and only declares its floor.
 */
export const KNOWLEDGE_COLUMN_WIDTHS = {
  initiative: 120,
  titleMin: 200,
  record: 128,
  kind: 96,
  date: 112,
  tags: 150,
} as const

function recordLabel(row: KnowledgeSortRow): string {
  if (row.record === 'note') return KNOWLEDGE_CLASS_META.note.label
  return KNOWLEDGE_CLASS_META[row.isNested ? 'nested_source' : 'source'].label
}

function kindLabel(row: KnowledgeSortRow): string | undefined {
  if (row.record === 'note') return row.noteKind && NOTE_KIND_LABEL[row.noteKind]
  return row.sourceType && SOURCE_TYPE_LABEL[row.sourceType]
}

export interface KnowledgeRowProps {
  row: KnowledgeSortRow
  isSelected: boolean
  onSelect: (id: string) => void
  /** Columns the list left out; the row skips their cells so header and body stay aligned. */
  hideColumns: KnowledgeColumnKey[]
}

/**
 * KnowledgeRow — one note or source as a dense table row. Text wraps rather than
 * clipping, so a long title is read whole. The title is the row's one link; the initiative is text, so a keyboard user meets one tab stop per row.
 *
 * Composes {@link TableRow}, {@link TableCell}, {@link Link}, {@link Pill},
 * {@link DateTime} and {@link TagPills}. Used by {@link KnowledgeList}.
 */
export function KnowledgeRow({ row, isSelected, onSelect, hideColumns }: KnowledgeRowProps) {
  const show = (column: KnowledgeColumnKey) => !hideColumns.includes(column)
  const kind = kindLabel(row)

  return (
    <TableRow
      testID="knowledge-row"
      isSelected={isSelected}
      aria-current={isSelected ? 'true' : undefined}
    >
      {show('initiative') ? (
        <TableCell width={KNOWLEDGE_COLUMN_WIDTHS.initiative}>
          <Typography variant="mono" className="text-xs text-text-tertiary web:break-words">
            {row.initiative}
          </Typography>
        </TableCell>
      ) : null}

      <TableCell>
        <Link
          onPress={() => onSelect(row.id)}
          color="inherit"
          className="text-xs text-text-primary web:break-words"
        >
          {row.title}
        </Link>
      </TableCell>

      {show('record') ? (
        <TableCell width={KNOWLEDGE_COLUMN_WIDTHS.record}>
          <Pill variant="subtle" color="default" size="xs">
            {recordLabel(row)}
          </Pill>
        </TableCell>
      ) : null}

      {show('kind') ? (
        <TableCell width={KNOWLEDGE_COLUMN_WIDTHS.kind}>
          {kind ? (
            <Pill variant="subtle" color="default" size="xs">
              {kind}
            </Pill>
          ) : (
            <Typography variant="caption" className="text-text-tertiary">
              —
            </Typography>
          )}
        </TableCell>
      ) : null}

      {show('date') ? (
        <TableCell width={KNOWLEDGE_COLUMN_WIDTHS.date} align="right">
          <DateTime
            value={row.date}
            format="medium"
            isUTC
            fallback="—"
            variant="caption"
            color="tertiary"
          />
        </TableCell>
      ) : null}

      {show('tags') ? (
        <TableCell width={KNOWLEDGE_COLUMN_WIDTHS.tags}>
          <TagPills tags={row.tags} />
        </TableCell>
      ) : null}
    </TableRow>
  )
}
