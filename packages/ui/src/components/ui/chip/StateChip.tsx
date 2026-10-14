import { View, Text, type ViewProps } from 'react-native'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { cn } from '../../../utils/cn'
import { Pill } from '../pill'
import { pillScale } from '../pill/pillScale'
import { useSurfaceMode } from '../surface'
import { STATE_LABEL, STATE_TONE, type ChipState } from './chipState'
import { stateChipLabelColor, stateChipLook, type StateChipLook } from './stateChipTimeline'

/** App sizes, one per Pill rung. */
export type StateChipSize = 'sm' | 'md' | 'lg'

/** Props for {@link StateChip}. */
export interface StateChipProps extends Omit<ViewProps, 'children'> {
  /** What the chip names, e.g. `ci:green@h`. */
  text: string
  /** The state the chip is in, or moving to. The accessible name follows it at once. */
  state: ChipState
  /** The state the chip is leaving. Omit, or pass `state`, for a chip at rest. */
  from?: ChipState
  /** How far the move from `from` has run, 0..1. Default 1. */
  progress?: number
  /** App size, one Pill rung. Ignored when `fontPx` is set. */
  size?: StateChipSize
  /** Video size in px, for frames with no Tailwind rung (`40 × frameHeight / 1080`). */
  fontPx?: number
  /** Additional className on the capsule. */
  className?: string
}

const labelSize: Record<StateChipSize, string> = {
  sm: 'text-2xs',
  md: 'text-xs',
  lg: 'text-sm',
}

const faceClass: Record<ChipState, string> = {
  met: 'bg-status-success-subtle',
  unmet: 'bg-hairline-subtle',
}

const labelToken = {
  met: 'on-status-success-subtle',
  unmet: 'text-primary',
} as const satisfies Record<ChipState, string>

type Palette = ReturnType<typeof getSemanticColors>

function labelColors(colors: Palette, from: ChipState, to: ChipState) {
  return [
    colors[labelToken[from]],
    colors['on-status-warning-subtle'],
    colors[labelToken[to]],
  ] as const
}

const layerClass = 'absolute inset-y-0 left-0'

function TransitionLayers({
  from,
  state,
  look,
}: {
  from: ChipState
  state: ChipState
  look: StateChipLook
}) {
  return (
    <>
      <View
        className={cn(layerClass, 'right-0', faceClass[from])}
        style={{ opacity: 1 - look.tint }}
        testID="state-chip-from"
      />
      <View
        className={cn(layerClass, 'bg-status-warning-subtle')}
        style={{ width: `${look.fill * 100}%`, opacity: 1 - look.tint }}
        testID="state-chip-fill"
      />
      <View
        className={cn(layerClass, 'right-0', faceClass[state])}
        style={{ opacity: look.tint }}
        testID="state-chip-to"
      />
    </>
  )
}

/**
 * StateChip — a `Pill` preset that shows whether a requirement is met. At rest it is the
 * state's tone face; unmet also wears a dashed border, so colour is never the only signal.
 * Given `from` and `progress` it draws the move between states as a pure function of
 * `progress`: entering met fills to warning left to right, then turns to success; leaving
 * met cross-fades back with no fill. Reduced motion shows the end state.
 *
 * @example
 * <StateChip text="ci:green@h" state="unmet" />
 * <StateChip text="ci:green@h" state="met" from="unmet" progress={t} fontPx={40} />
 */
export function StateChip({
  text,
  state,
  from,
  progress = 1,
  size = 'md',
  fontPx,
  className,
  style,
  ...props
}: StateChipProps) {
  const reducedMotion = usePrefersReducedMotion()
  const colors = getSemanticColors(useSurfaceMode())
  const look = stateChipLook(state, from, reducedMotion ? 1 : progress)
  const movingFrom = look.settled ? undefined : from
  const video = fontPx === undefined ? undefined : pillScale(fontPx)
  return (
    <Pill
      tone={STATE_TONE[state]}
      size={video ? 'lg' : size}
      accessibilityRole="text"
      accessibilityLabel={`${text}: ${STATE_LABEL[state]}`}
      className={cn(
        movingFrom && 'bg-transparent overflow-hidden',
        look.border === 'dashed' && 'border-dashed border-hairline-strong',
        className
      )}
      style={[
        video && {
          paddingHorizontal: video.paddingHorizontal,
          paddingVertical: video.paddingVertical,
        },
        style,
      ]}
      testID="state-chip"
      {...props}
    >
      {movingFrom ? <TransitionLayers from={movingFrom} state={state} look={look} /> : null}
      <Text
        className={cn(
          'relative font-heading font-semibold text-inherit',
          !video && labelSize[size]
        )}
        style={{
          fontSize: video?.fontSize,
          color: movingFrom
            ? stateChipLabelColor(look, labelColors(colors, movingFrom, state))
            : undefined,
        }}
        testID="state-chip-label"
      >
        {text}
      </Text>
    </Pill>
  )
}
