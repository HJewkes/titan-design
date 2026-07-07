// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import React from 'react'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'

export interface SupersetWrapperProps {
  label?: string
  color?: string
  children: React.ReactNode
}

const DEFAULTS = {
  label: 'SS',
  color: getSemanticColors('dark')['brand-primary'],
  bgBase: '#101010',
} as const

export function SupersetWrapper({
  label = DEFAULTS.label,
  color = DEFAULTS.color,
  children,
}: SupersetWrapperProps) {
  return (
    <View
      style={{
        position: 'relative',
        borderLeftWidth: 3,
        borderLeftColor: color,
        paddingLeft: 8,
        marginHorizontal: 12,
        marginBottom: 8,
        overflow: 'visible',
      }}
      accessibilityRole={'group' as never}
      accessibilityLabel={`Superset: ${label}`}
      testID="superset-wrapper"
    >
      <Text
        style={{
          position: 'absolute',
          top: -1,
          left: -3,
          fontSize: 9,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
          backgroundColor: color,
          color: DEFAULTS.bgBase,
          paddingVertical: 2,
          paddingHorizontal: 6,
          borderBottomRightRadius: 4,
          letterSpacing: 0.5,
          zIndex: 2,
        }}
        testID="superset-label"
      >
        {label}
      </Text>
      <View style={{ gap: 2 }} testID="superset-children">
        {children}
      </View>
    </View>
  )
}
