// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text } from 'react-native'

// Column widths, in order: SET · PREV (flex) · REPS · LOAD · RPE. Matches SetRow's
// per-cell widths so the header aligns over the rows beneath it.
const COLUMN_WIDTHS: (number | undefined)[] = [36, undefined, 44, 56, 36]

export interface SetTableHeaderProps {
  /** Weight-column label: LBS / KG. Default lbs. */
  unit?: 'lbs' | 'kg'
  /** Overridable so a host card can keep its own testID. Default "table-header". */
  testID?: string
}

/** Column labels; the weight column reflects the given unit (LBS / KG). */
function buildColumnHeaders(unit: 'lbs' | 'kg'): string[] {
  return ['SET', 'PREV', 'REPS', unit.toUpperCase(), 'RPE']
}

/**
 * The expanded-set-table column-header row: SET · PREV · REPS · LOAD · RPE, with
 * the weight column reflecting `unit`. Its per-column widths mirror {@link SetRow}
 * so headers align over the rows. Extracted from {@link ExerciseCard}'s expanded
 * state so the expanded workout drawer can reuse it.
 */
export function SetTableHeader({ unit = 'lbs', testID = 'table-header' }: SetTableHeaderProps) {
  const columnHeaders = buildColumnHeaders(unit)

  return (
    <View
      className="flex-row"
      style={{ paddingVertical: 8, paddingHorizontal: 8, paddingBottom: 4 }}
      testID={testID}
    >
      {columnHeaders.map((header, i) => {
        const width = COLUMN_WIDTHS[i]
        const isFlex = width === undefined

        return (
          <View
            key={header}
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
              {header}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
