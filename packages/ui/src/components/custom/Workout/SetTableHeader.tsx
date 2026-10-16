// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { Typography } from '../../ui/typography'
import { cn } from '../../../utils/cn'

// One header column: its label and its fixed width (PREV is the lone flex column,
// `undefined`).
type Column = { label: string; width: number | undefined }

export interface SetTableHeaderProps {
  /** Weight-column label: LBS / KG. Default lbs. */
  unit?: 'lbs' | 'kg'
  /** Show the PREV (previous-best) column. Default true; false drops it for rail density. */
  showPrevious?: boolean
  /** Overridable so a host card can keep its own testID. Default "table-header". */
  testID?: string
}

/** Fixed column widths, read by the header and by {@link SetRow}'s cells so headers align over rows. */
export const SET_TABLE_COLUMN_WIDTH = { set: 36, reps: 44, load: 56, rpe: 36 } as const

// The previous-best column is the lone flex column (`undefined` width). When hidden
// it is dropped entirely (not blanked to a spacer) and the four fixed columns
// distribute across the full strip width via `justifyContent: space-between`.
const PREV_COLUMN: Column = { label: 'PREV', width: undefined }

// `microLabel` is the 10px step of the scale (TOKENS.md §4), in the same Inter face as
// the table's value cells. Only the row's line box is pinned: the raw <Text> this
// replaced carried no lineHeight, and the variant's `leading-normal` would grow the row.
const COLUMN_LABEL = 'leading-[normal]'

/** Columns in order, with the weight column reflecting `unit`; PREV dropped when hidden. */
function buildColumns(unit: 'lbs' | 'kg', showPrevious: boolean): Column[] {
  return [
    { label: 'SET', width: SET_TABLE_COLUMN_WIDTH.set },
    ...(showPrevious ? [PREV_COLUMN] : []),
    { label: 'REPS', width: SET_TABLE_COLUMN_WIDTH.reps },
    { label: unit.toUpperCase(), width: SET_TABLE_COLUMN_WIDTH.load },
    { label: 'RPE', width: SET_TABLE_COLUMN_WIDTH.rpe },
  ]
}

/**
 * The expanded-set-table column-header row: SET · PREV · REPS · LOAD · RPE, with
 * the weight column reflecting `unit`. `showPrevious={false}` drops PREV (rail
 * density). Its widths come from
 * {@link SET_TABLE_COLUMN_WIDTH}, shared with {@link SetRow}. Extracted from {@link ExerciseCard}'s expanded state for reuse.
 */
export function SetTableHeader({
  unit = 'lbs',
  showPrevious = true,
  testID = 'table-header',
}: SetTableHeaderProps) {
  const columns = buildColumns(unit, showPrevious)

  return (
    <View
      className="flex-row p-inset-sm pb-inset-xs"
      style={showPrevious ? undefined : { justifyContent: 'space-between' }}
      testID={testID}
    >
      {columns.map(({ label, width }) => {
        const isFlex = width === undefined

        return (
          <View
            key={label}
            className={cn('items-center justify-center gap-inline-md', isFlex && 'flex-1')}
            style={isFlex ? { minWidth: 44 } : { width, flexShrink: 1 }}
          >
            <Typography variant="microLabel" color="tertiary" className={COLUMN_LABEL}>
              {label}
            </Typography>
          </View>
        )
      })}
    </View>
  )
}
