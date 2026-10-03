import { View } from 'react-native'
import { cn } from '../../../../utils/cn'
import { hiddenFromAssistiveTech } from './assistive'
import { MarkerLine } from './BarListMarker'

interface BarProps {
  fraction: number
  fill: string
  size: 'sm' | 'md'
  markerFraction: number | null
}

export function Bar({ fraction, fill, size, markerFraction }: BarProps) {
  return (
    <View className="relative flex-1 justify-center" {...hiddenFromAssistiveTech}>
      <View
        className={cn(
          'overflow-hidden rounded-full bg-brand-primary-muted',
          size === 'sm' ? 'h-1.5' : 'h-2'
        )}
        testID="bar-list-track"
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${fraction * 100}%`, backgroundColor: fill }}
          testID="bar-list-fill"
        />
      </View>
      {markerFraction === null ? null : <MarkerLine fraction={markerFraction} />}
    </View>
  )
}
