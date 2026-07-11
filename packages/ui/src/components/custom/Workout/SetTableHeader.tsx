// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text } from 'react-native'

// One header column: its label and its fixed width (PREV is the lone flex column,
// `undefined`). Order + widths mirror SetRow's cells so headers align over rows.
type Column = { label: string; width: number | undefined }

export interface SetTableHeaderProps {
  /** Weight-column label: LBS / KG. Default lbs. */
  unit?: 'lbs' | 'kg'
  /** Show the PREV (previous-best) column. Default true; false drops it for rail density. */
  showPrevious?: boolean
  /** Overridable so a host card can keep its own testID. Default "table-header". */
  testID?: string
}

// The previous-best column is the lone flex column (`undefined` width). When hidden
// it is dropped entirely (not blanked to a spacer) and the four fixed columns
// distribute across the full strip width via `justifyContent: space-between`.
const PREV_COLUMN: Column = { label: 'PREV', width: undefined }

/** Columns in order, with the weight column reflecting `unit`; PREV dropped when hidden. */
function buildColumns(unit: 'lbs' | 'kg', showPrevious: boolean): Column[] {
  return [
    { label: 'SET', width: 36 },
    ...(showPrevious ? [PREV_COLUMN] : []),
    { label: 'REPS', width: 44 },
    { label: unit.toUpperCase(), width: 56 },
    { label: 'RPE', width: 36 },
  ]
}

/**
 * The expanded-set-table column-header row: SET · PREV · REPS · LOAD · RPE, with
 * the weight column reflecting `unit`. `showPrevious={false}` drops PREV (rail
 * density). Its per-column widths mirror {@link SetRow} so headers align over the
 * rows. Extracted from {@link ExerciseCard}'s expanded state for reuse.
 */
export function SetTableHeader({
  unit = 'lbs',
  showPrevious = true,
  testID = 'table-header',
}: SetTableHeaderProps) {
  const columns = buildColumns(unit, showPrevious)

  return (
    <View
      className="flex-row"
      style={{
        paddingVertical: 8,
        paddingHorizontal: 8,
        paddingBottom: 4,
        ...(showPrevious ? {} : { justifyContent: 'space-between' }),
      }}
      testID={testID}
    >
      {columns.map(({ label, width }) => {
        const isFlex = width === undefined

        return (
          <View
            key={label}
            style={{
              ...(isFlex ? { minWidth: 44 } : { width, flexShrink: 1 }),
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            {...(isFlex ? { className: 'flex-1' } : {})}
          >
            <Text
              className="text-text-tertiary"
              style={{
                fontSize: 10,
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              {label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
