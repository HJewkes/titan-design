import { View } from 'react-native'

import { ChevronLeftIcon, ChevronRightIcon } from '../../icons'
import { Button, ButtonIcon } from '../button'
import { Surface } from '../surface'

const ICON_PX = 20

export interface ShelfNudgesProps {
  label: string
  atStart: boolean
  atEnd: boolean
  onNudge: (direction: 1 | -1) => void
}

/** The arrows sit over the row's ends, vertically centred, and let drags pass between them. */
export function ShelfNudges({ label, atStart, atEnd, onNudge }: ShelfNudgesProps) {
  return (
    <View
      style={{ pointerEvents: 'box-none' }}
      className="absolute inset-0 flex-row items-center justify-between"
    >
      {atStart ? (
        <View />
      ) : (
        <ShelfNudge direction={-1} label={`Back in ${label}`} onPress={onNudge} />
      )}
      {atEnd ? null : <ShelfNudge direction={1} label={`More from ${label}`} onPress={onNudge} />}
    </View>
  )
}

interface ShelfNudgeProps {
  direction: 1 | -1
  label: string
  onPress: (direction: 1 | -1) => void
}

function ShelfNudge({ direction, label, onPress }: ShelfNudgeProps) {
  const isNext = direction > 0
  return (
    <Surface raise={1} className="rounded-full">
      <Button
        variant="ghost"
        color="secondary"
        isIconButton
        onPress={() => onPress(direction)}
        accessibilityLabel={label}
        className="h-11 w-11 rounded-full"
        testID={isNext ? 'shelf-nudge-next' : 'shelf-nudge-previous'}
      >
        <ButtonIcon as={isNext ? ChevronRightIcon : ChevronLeftIcon} size={ICON_PX} />
      </Button>
    </Surface>
  )
}
