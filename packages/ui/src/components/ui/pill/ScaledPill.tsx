import { Text } from 'react-native'
import { Pill, type PillTone } from './Pill'
import { pillScale } from './pillScale'

export interface ScaledPillProps {
  tone: PillTone
  label: string
  /** Label size in px; padding follows at the `lg` rung's ratio. */
  fontPx: number
  testID?: string
}

/** A subtle Pill at a font size with no Tailwind rung, for video frames. Internal to `ui/`. */
export function ScaledPill({ tone, label, fontPx, testID }: ScaledPillProps) {
  const { fontSize, paddingHorizontal, paddingVertical } = pillScale(fontPx)
  return (
    <Pill tone={tone} size="lg" style={{ paddingHorizontal, paddingVertical }} testID={testID}>
      <Text className="font-heading font-semibold text-inherit" style={{ fontSize }}>
        {label}
      </Text>
    </Pill>
  )
}
