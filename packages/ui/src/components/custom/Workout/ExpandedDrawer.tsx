// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text } from 'react-native'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { SetTableHeader } from './SetTableHeader'
import { SetRow, type SetRowProps } from './SetRow'

const t = getSemanticColors('dark')

// Sunk inset surface — the drawer opens below its exercise heading on the rail's
// charcoal-800 list plane (placeholder value; refine with the responsive ticket).
const SURFACE = primitiveColors.charcoal[800] // #131313

export interface ExpandedDrawerProps {
  /** Exercise name shown in the drawer header row. */
  name: string
  /** Weight-column unit, forwarded to the TableHeader. Default lbs. */
  unit?: 'lbs' | 'kg'
  /** The set rows listed under the header. */
  sets: SetRowProps[]
}

/**
 * 🚧 WIP — the expanded-workout drawer container: a {@link SetTableHeader} above a list
 * of {@link SetRow}s, opened when a rail exercise expands. A rough placeholder shell
 * (surface + spacing are provisional) pending the responsive-unification ticket; the
 * header and rows are the real components so the composition is exercised for real.
 */
export function ExpandedDrawer({ name, unit = 'lbs', sets }: ExpandedDrawerProps) {
  return (
    <View style={{ backgroundColor: SURFACE, paddingBottom: 6 }} testID="expanded-drawer">
      <Text
        className="text-text-primary"
        style={{
          fontSize: 14,
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: '700',
          color: t['text-primary'],
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 4,
        }}
        testID="expanded-drawer-name"
      >
        {name}
      </Text>

      <SetTableHeader unit={unit} />

      <View testID="expanded-drawer-sets">
        {sets.map((setProps, i) => (
          <SetRow key={i} {...setProps} />
        ))}
      </View>
    </View>
  )
}
