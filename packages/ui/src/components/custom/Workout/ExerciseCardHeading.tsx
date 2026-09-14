// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native'
import { primitiveOpacity } from '../../../theme/tokens/primitives'
import type { ThemeMode } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface/SurfaceContext'
import { useHoverState } from '../../ui/tooltip'
import { ExerciseHeading, exerciseHeadingLabel, type ExerciseHeadingProps } from './ExerciseHeading'
import { SetStrip, type SetStripSet } from './SetStrip'
import { exerciseRowStateColor } from './exerciseRowState'
import { cn } from '../../../utils/cn'

/**
 * How much room the row gets, and therefore which shape it takes:
 * - `rail` — the session-rail row: two lines (name, then prescription + tempo).
 * - `compact` — the collapsed card row: one line, card padding.
 * - `upcoming` — `compact`, dimmed, with the previous-best caption.
 */
export type ExerciseRowDensity = 'rail' | 'compact' | 'upcoming'

interface DensitySpec {
  /** The row's own inset, as classes (AW-142). */
  padding: string
  layout: 'stacked' | 'inline'
  dimOpacity: number
  dimByDefault: boolean
  /** The structured prescription renders in one dimmer, regular tone, not the rail's bright/bold. */
  mutedPrescription: boolean
}

// All three densities dim to ONE depth (VW-276). They used to differ — rail/compact 0.55
// against the card's 0.60 — only because they were traced from two different specimens.
// `rail` was 9px vertical, off the 4px grain with no stated reason; `inset-sm`
// puts it on DataRow's 8/12 row rung. 14px horizontal has no semantic rung.
const DENSITY: Record<ExerciseRowDensity, DensitySpec> = {
  rail: {
    padding: 'py-inset-sm px-inset-md',
    layout: 'stacked',
    dimOpacity: primitiveOpacity.dim,
    dimByDefault: false,
    mutedPrescription: false,
  },
  compact: {
    padding: 'py-inset-md px-3.5',
    layout: 'inline',
    dimOpacity: primitiveOpacity.dim,
    dimByDefault: false,
    mutedPrescription: true,
  },
  upcoming: {
    padding: 'py-inset-md px-3.5',
    layout: 'inline',
    dimOpacity: primitiveOpacity.dim,
    dimByDefault: true,
    mutedPrescription: true,
  },
}

export type ExerciseCardHeadingProps = ExerciseHeadingProps & {
  /** Row shape. Default `rail`. */
  density?: ExerciseRowDensity
  /** Per-set performance data driving the strip; an empty list renders no strip. */
  setStates?: SetStripSet[]
  /** Strip height in px. Default 8. */
  stripHeight?: number
  /** The row the user has chosen — a persistent wash, distinct from transient hover. */
  isSelected?: boolean
  /** Root style, for the chrome a card wraps the row in (superset radius). */
  style?: StyleProp<ViewStyle>
  /** Root classes, for the chrome a card wraps the row in (superset gap). */
  className?: string
  /** Root testID. Default "exercise-card"; override when nested inside another card. */
  testID?: string
}

/**
 * Hover and press state for the whole row. RNW ends a wrapper's hover the moment a
 * nested Pressable claims the pointer (see `useHoverState`), so the row listens on
 * both itself and its heading and takes either.
 */
function useRowInteraction() {
  const { hovered: rowHovered, hoverProps } = useHoverState()
  const [headingHovered, setHeadingHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  return {
    hoverProps,
    pressed,
    hovered: rowHovered || headingHovered,
    headingHandlers: {
      onHoverIn: () => setHeadingHovered(true),
      onHoverOut: () => setHeadingHovered(false),
      onPressIn: () => setPressed(true),
      onPressOut: () => setPressed(false),
    },
  }
}

/** Precedence: a press beats a selection, a selection beats a hover. */
function rowWash(
  mode: ThemeMode,
  state: { pressed: boolean; isSelected: boolean; hovered: boolean }
): string | undefined {
  if (state.pressed) return exerciseRowStateColor('pressed', mode)
  if (state.isSelected) return exerciseRowStateColor('selected', mode)
  if (state.hovered) return exerciseRowStateColor('hovered', mode)
  return undefined
}

/** Narrow the prescription union back to the exact member the caller supplied. */
function prescriptionProps(p: ExerciseCardHeadingProps): ExerciseHeadingProps {
  const base = { name: p.name }
  if (p.prescription !== undefined) return { ...base, prescription: p.prescription }
  if (p.sets === undefined) return base
  return { ...base, sets: p.sets, reps: p.reps, load: p.load }
}

/**
 * The exercise row — one component for all three densities the workout surfaces
 * list an exercise in: the standalone session-rail heading (`rail`), the collapsed
 * card row (`compact`) and the not-yet-reached row (`upcoming`). An
 * {@link ExerciseHeading} info block over its per-set {@link SetStrip}.
 *
 * Interaction states are washes from the `interactive-*` tokens (press > selection >
 * hover) plus a `isLive` name tone. All are static: this row renders on a wall display
 * during a set, where titan's "the grain never animates" rule applies.
 *
 * e1RM is intentionally dropped (a planning / live-panel concern). Dimming lives on
 * the outer wrapper so the strip dims with the heading.
 */
export function ExerciseCardHeading(props: ExerciseCardHeadingProps) {
  const {
    density = 'rail',
    setStates = [],
    stripHeight = 8,
    dimmed,
    isSelected = false,
    isLive = false,
    testID = 'exercise-card',
    style,
    className,
  } = props
  const spec = DENSITY[density]
  const { hoverProps, pressed, hovered, headingHandlers } = useRowInteraction()
  const wash = rowWash(useSurfaceMode(), { pressed, isSelected, hovered })
  // The inline densities have no TempoDisplay sibling, so the whole padded row can be
  // the press target — the touch target the collapsed card has always had. `rail` keeps
  // the name row as the button because nesting TempoDisplay inside one is illegal.
  const rowIsButton = spec.layout === 'inline'

  const Root = rowIsButton ? Pressable : View
  const rootPress = rowIsButton
    ? {
        ...headingHandlers,
        onPress: props.onPress,
        accessibilityRole: 'button' as const,
        accessibilityLabel: exerciseHeadingLabel(props),
      }
    : {}

  return (
    <Root
      {...hoverProps}
      {...rootPress}
      className={cn(spec.padding, className)}
      style={[
        { opacity: (dimmed ?? spec.dimByDefault) ? spec.dimOpacity : 1 },
        wash ? { backgroundColor: wash } : null,
        style,
      ]}
      testID={testID}
    >
      <ExerciseHeading
        {...prescriptionProps(props)}
        {...(rowIsButton ? { pressTarget: 'ancestor' as const } : headingHandlers)}
        unit={props.unit}
        tempo={props.tempo}
        indicator={props.indicator}
        previousBest={props.previousBest}
        onPress={rowIsButton ? undefined : props.onPress}
        layout={spec.layout}
        mutedPrescription={spec.mutedPrescription}
        isLive={isLive}
      />

      {setStates.length > 0 && (
        <View className="mt-stack-md" testID="exercise-card-strip">
          <SetStrip sets={setStates} height={stripHeight} />
        </View>
      )}
    </Root>
  )
}
