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

function Track({
  fraction,
  fill,
  size,
  grows,
}: Omit<BarProps, 'markerFraction'> & { grows: boolean }) {
  return (
    <View
      className={cn(
        grows && 'flex-1',
        'overflow-hidden rounded-full bg-brand-primary-muted',
        size === 'sm' ? 'h-1.5' : 'h-2'
      )}
      testID="bar-list-track"
      {...hiddenFromAssistiveTech}
    >
      <View
        className="h-full rounded-full"
        style={{ width: `${fraction * 100}%`, backgroundColor: fill }}
        testID="bar-list-fill"
      />
    </View>
  )
}

/** Without a marker the bar is the bare track; the wrapper that positions the line exists only with one. */
export function Bar({ markerFraction, ...track }: BarProps) {
  if (markerFraction === null) return <Track {...track} grows />
  return (
    <View className="relative flex-1 justify-center" {...hiddenFromAssistiveTech}>
      <Track {...track} grows={false} />
      <MarkerLine fraction={markerFraction} />
    </View>
  )
}
