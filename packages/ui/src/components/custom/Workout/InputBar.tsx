import { View } from 'react-native'
import { resolveColor } from '../../../theme/resolve-color'
import { Button, ButtonText } from '../../ui/button'
import { Input } from '../../ui/input'
import { Typography } from '../../ui/typography'

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

const FIELD_CLASSNAME = 'text-center font-sans font-semibold px-0.5'

function InputBarLabel({ exerciseName, setLabel }: { exerciseName: string; setLabel: string }) {
  return (
    <View style={{ minWidth: 80, flexDirection: 'column' }}>
      <Typography
        variant="boldLabel"
        className="font-heading"
        testID="input-bar-exercise-name"
        numberOfLines={1}
      >
        {exerciseName}
      </Typography>
      <Typography
        variant="microLabel"
        color="tertiary"
        className="normal-case tracking-normal font-normal"
        testID="input-bar-set-info"
      >
        {setLabel}
      </Typography>
    </View>
  )
}

function InputBarFields({
  reps,
  weight,
  unit,
  onRepsChange,
  onWeightChange,
}: Pick<InputBarProps, 'reps' | 'weight' | 'unit' | 'onRepsChange' | 'onWeightChange'>) {
  return (
    <View className="flex-1 flex-row items-center gap-inline-sm">
      <Input
        size="sm"
        value={reps}
        onChangeText={onRepsChange}
        className="w-9"
        inputClassName={FIELD_CLASSNAME}
        accessibilityLabel="Reps"
        testID="input-bar-reps"
        keyboardType="numeric"
      />
      <Typography variant="caption" color="tertiary" className="font-sans">
        {'\u00D7'}
      </Typography>
      <Input
        size="sm"
        value={weight}
        onChangeText={onWeightChange}
        className="w-[52px]"
        inputClassName={FIELD_CLASSNAME}
        accessibilityLabel={`Weight in ${unit}`}
        testID="input-bar-weight"
        keyboardType="numeric"
      />
      <Typography
        variant="caption"
        color="tertiary"
        className="font-sans font-medium"
        testID="input-bar-unit"
      >
        {unit}
      </Typography>
    </View>
  )
}

function RecordButton({ onRecord, canRecord }: Pick<InputBarProps, 'onRecord' | 'canRecord'>) {
  return (
    <Button
      size="lg"
      onPress={onRecord}
      isDisabled={!canRecord}
      accessibilityLabel="Record set"
      testID="input-bar-record"
    >
      <ButtonText>Record</ButtonText>
    </Button>
  )
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
      className="bg-surface-elevated w-full flex-row items-center pt-2.5 px-gutter-sm pb-inset-md gap-2.5"
      style={{
        borderTopWidth: 1,
        borderTopColor: resolveColor('hairline-default'),
      }}
      accessibilityRole="toolbar"
      testID="input-bar"
    >
      <InputBarLabel exerciseName={exerciseName} setLabel={setLabel} />
      <InputBarFields
        reps={reps}
        weight={weight}
        unit={unit}
        onRepsChange={onRepsChange}
        onWeightChange={onWeightChange}
      />
      <RecordButton onRecord={onRecord} canRecord={canRecord} />
    </View>
  )
}
