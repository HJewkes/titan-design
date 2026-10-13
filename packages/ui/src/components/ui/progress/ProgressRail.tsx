import { View, Text } from 'react-native'
import { cn } from '../../../utils/cn'
import { barFill, chipLook, chipTint } from './railTimeline'

interface RailPartProps {
  index: number
  position: number
  totalSteps: number
  sizeClass: string
  fillClass: string
  /** Resolved brand and done hex values for the chip's colour turn. */
  tintColors: readonly [string, string]
}

function RailChip({
  index,
  position,
  sizeClass,
  fillClass,
  tintColors,
  label,
}: RailPartProps & { label?: string }) {
  const { state, ring, core, tint } = chipLook(index, position)
  const colour = tint > 0 ? chipTint(tint, tintColors) : undefined

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Step ${index + 1}${label ? `, ${label}` : ''}: ${state}`}
      className={cn('rounded-full items-center justify-center', sizeClass)}
    >
      {state === 'done' ? (
        <View
          testID={`progress-steps-done-${index}`}
          className={cn('absolute inset-0 rounded-full', fillClass)}
        />
      ) : (
        <>
          {ring < 1 && (
            <View className="absolute inset-0 rounded-full border-2 border-hairline-strong" />
          )}
          {ring > 0 && (
            <View
              testID={`progress-steps-ring-${index}`}
              className="absolute inset-0 rounded-full border-2 border-brand-primary"
              style={{ opacity: ring, ...(colour ? { borderColor: colour } : {}) }}
            />
          )}
          {core > 0 && (
            <View
              testID={`progress-steps-core-${index}`}
              className="rounded-full bg-brand-primary"
              style={{ width: `${core}%`, height: `${core}%`, backgroundColor: colour }}
            />
          )}
        </>
      )}
    </View>
  )
}

/** Half of the connector between `segment` and `segment + 1`; each half draws half the bar. */
function RailHalf({
  segment,
  half,
  position,
  sizeClass,
  fillClass,
}: { segment: number; half: 'start' | 'end' } & Omit<
  RailPartProps,
  'index' | 'totalSteps' | 'tintColors'
>) {
  const bar = barFill(segment, position)
  const fill = Math.min(1, Math.max(0, half === 'start' ? bar * 2 : bar * 2 - 1)) * 100

  return (
    <View
      className={cn(
        'flex-1 overflow-hidden bg-hairline-strong',
        // The halves meet flush at the column edge, so a connector reads as one line.
        half === 'start' ? 'ml-1 rounded-l-full' : 'mr-1 rounded-r-full',
        sizeClass
      )}
    >
      <View
        testID={`progress-steps-segment-${segment}-${half}`}
        className={cn('h-full', fillClass)}
        style={{ width: `${fill}%` }}
      />
    </View>
  )
}

export interface RailStepProps extends RailPartProps {
  connectorClass: string
  label?: string
  isReached: boolean
}

/** One column: the chip between its connector halves, its label centred beneath. */
export function RailStep({ connectorClass, label, isReached, ...part }: RailStepProps) {
  const { index, totalSteps, position, fillClass } = part
  const halfProps = { position, fillClass, sizeClass: connectorClass }

  return (
    <View className="flex-1 items-center gap-stack-md">
      <View className="w-full flex-row items-center">
        {index > 0 ? (
          <RailHalf segment={index - 1} half="end" {...halfProps} />
        ) : (
          <View className="flex-1 mr-1" />
        )}
        <RailChip {...part} label={label} />
        {index < totalSteps - 1 ? (
          <RailHalf segment={index} half="start" {...halfProps} />
        ) : (
          <View className="flex-1 ml-1" />
        )}
      </View>
      {label != null && (
        <Text
          className={cn(
            'px-1 text-xs text-center',
            isReached ? 'text-text-primary font-medium' : 'text-text-secondary'
          )}
        >
          {label}
        </Text>
      )}
    </View>
  )
}
