// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import React from 'react'
import { View, Text, Pressable, TextInput } from 'react-native'
import { resolveColor } from '../../../theme/resolve-color'
import { getSemanticColors } from '../../../theme/tokens/semantic'

export interface InputBarProps {
  exerciseName: string
  setNumber: number
  totalSets: number | null
  reps: string
  weight: string
  unit: 'lbs' | 'kg'
  onRepsChange: (value: string) => void
  onWeightChange: (value: string) => void
  onRecord: () => void
  canRecord: boolean
  visible: boolean
}

const BRAND_PRIMARY = getSemanticColors('dark')['brand-primary']
const INPUT_CLASSNAME = 'bg-surface-raised border-border-strong text-text-primary'

const inputStyle = {
  fontSize: 14,
  fontWeight: '600' as const,
  fontFamily: 'Inter, sans-serif',
  borderWidth: 1,
  borderRadius: 6,
  textAlign: 'center' as const,
  paddingVertical: 5,
  paddingHorizontal: 2,
}

export function InputBar({
  exerciseName,
  setNumber,
  totalSets,
  reps,
  weight,
  unit,
  onRepsChange,
  onWeightChange,
  onRecord,
  canRecord,
  visible,
}: InputBarProps) {
  if (!visible) return null

  const setLabel = totalSets != null ? `Set ${setNumber}/${totalSets}` : `Set ${setNumber}`

  return (
    <View
      className="bg-surface-elevated"
      style={{
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: resolveColor('border-default'),
        paddingTop: 10,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
      accessibilityRole="toolbar"
      testID="input-bar"
    >
      <View style={{ minWidth: 80, flexDirection: 'column' }}>
        <Text
          className="text-text-primary"
          style={{
            fontSize: 12,
            fontWeight: '700',
            fontFamily: '"Space Grotesk", sans-serif',
          }}
          testID="input-bar-exercise-name"
          numberOfLines={1}
        >
          {exerciseName}
        </Text>
        <Text
          className="text-text-tertiary"
          style={{
            fontSize: 10,
            fontFamily: 'Inter, sans-serif',
          }}
          testID="input-bar-set-info"
        >
          {setLabel}
        </Text>
      </View>

      <View className="flex-1 flex-row items-center" style={{ gap: 4 }}>
        <TextInput
          value={reps}
          onChangeText={onRepsChange}
          className={INPUT_CLASSNAME}
          style={{ ...inputStyle, width: 36 }}
          accessibilityLabel="Reps"
          testID="input-bar-reps"
          keyboardType="numeric"
        />
        <Text
          className="text-text-tertiary"
          style={{
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {'\u00D7'}
        </Text>
        <TextInput
          value={weight}
          onChangeText={onWeightChange}
          className={INPUT_CLASSNAME}
          style={{ ...inputStyle, width: 52 }}
          accessibilityLabel={`Weight in ${unit}`}
          testID="input-bar-weight"
          keyboardType="numeric"
        />
        <Text
          className="text-text-tertiary"
          style={{
            fontSize: 12,
            fontWeight: '500',
            fontFamily: 'Inter, sans-serif',
          }}
          testID="input-bar-unit"
        >
          {unit}
        </Text>
      </View>

      <Pressable
        onPress={onRecord}
        disabled={!canRecord}
        style={({ pressed }) => ({
          backgroundColor: BRAND_PRIMARY,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 16,
          opacity: !canRecord ? 0.4 : pressed ? 0.8 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel="Record set"
        testID="input-bar-record"
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            fontFamily: 'Inter, sans-serif',
            color: '#FFFFFF',
          }}
        >
          Record
        </Text>
      </Pressable>
    </View>
  )
}
