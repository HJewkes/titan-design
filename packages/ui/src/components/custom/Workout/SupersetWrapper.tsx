// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import React from 'react'
import { View } from 'react-native'
import { Typography } from '../Typography'
import { resolveColor } from '../../../theme/resolve-color'

export interface SupersetWrapperProps {
  label?: string
  /** Rail and label-chip colour. Defaults to the `brand-primary` token. */
  color?: string
  children: React.ReactNode
}

const DEFAULT_LABEL = 'SS'

export function SupersetWrapper({ label = DEFAULT_LABEL, color, children }: SupersetWrapperProps) {
  const rail = color ?? resolveColor('brand-primary')

  return (
    <View
      style={{
        position: 'relative',
        borderLeftWidth: 3,
        borderLeftColor: rail,
        paddingLeft: 8,
        marginHorizontal: 12,
        marginBottom: 8,
        overflow: 'visible',
      }}
      accessibilityRole={'group' as never}
      accessibilityLabel={`Superset: ${label}`}
      testID="superset-wrapper"
    >
      {/* `microLabel` is the 10px uppercase micro-label form and carries its own
          face, weight and tracking. The chip was 9px/700 with a hand-set 0.5px
          tracking; 9px is off the type scale (TOKENS.md §4), so it rounds up. */}
      <Typography
        variant="microLabel"
        color="inverse"
        style={{
          position: 'absolute',
          top: -1,
          left: -3,
          backgroundColor: rail,
          paddingVertical: 2,
          paddingHorizontal: 6,
          borderBottomRightRadius: 4,
          zIndex: 2,
        }}
        testID="superset-label"
      >
        {label}
      </Typography>
      <View style={{ gap: 2 }} testID="superset-children">
        {children}
      </View>
    </View>
  )
}
