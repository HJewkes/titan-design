// How a container decides which plane it sits on and what it wears there.
//
// One resolution path shared by <Surface> and <Card>, so the two can never
// disagree about depth. Everything is RELATIVE to the enclosing Surface unless
// an absolute `level` names a shell root.
import { useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import {
  FLOATING_ELEVATION_MIN,
  getPressedRecessShadow,
  type ElevationLevel,
} from '../../../theme/elevation'
import { liftStyle, type LiftOptions, type LiftStep } from '../../../theme/lift'
import {
  pressedLevel,
  raisedLevel,
  surfaceBackground,
  type SurfaceLevel,
} from '../../../theme/surface-planes'
import type { ThemeMode } from '../../../theme/tokens/semantic'
import { useSurface, type SurfaceContextValue } from './SurfaceContext'

export interface SurfaceDepthProps {
  /** Absolute plane, for shell roots (shell = background, page = base). No lift. */
  level?: SurfaceLevel
  /** Planes to step UP from the enclosing Surface, with the lift treatment. */
  raise?: 1 | 2 | 3
  /**
   * Numeric depth relative to the enclosing Surface: negative recesses, 0 sits
   * flat on the same plane, 1–3 lift, 4–5 float on the overlay plane.
   */
  elevation?: ElevationLevel
  /** One plane DOWN with an inner-shadow recess. */
  pressed?: boolean
  /** Force the lift treatment on or off regardless of the step taken. */
  lift?: boolean
  /** Tune the lift (rim alpha). Specimens and hero surfaces only. */
  liftOptions?: LiftOptions
  /** Override the inherited theme mode. */
  theme?: ThemeMode
}

export interface ResolvedSurface {
  mode: ThemeMode
  plane: SurfaceLevel
  backgroundColor: string
  /** Recess or lift, to compose after `backgroundColor`. */
  depthStyle: ViewStyle
  /** Planes stepped up (0 when flat, pressed, or an absolute plane). */
  step: number
  lifted: boolean
}

function recessDepth(inherited: SurfaceContextValue, planesDown: number, mode: ThemeMode) {
  let plane = inherited.level
  for (let i = 0; i < planesDown; i++) plane = pressedLevel(plane)
  const backgroundColor = surfaceBackground(plane, mode)
  return { plane, backgroundColor, depthStyle: getPressedRecessShadow(backgroundColor, mode) }
}

/** Pure resolution: the plane, its hex, and the treatment. */
export function resolveSurfaceDepth(
  inherited: SurfaceContextValue,
  props: SurfaceDepthProps
): ResolvedSurface {
  const mode = props.theme ?? inherited.mode
  const elevation = props.elevation ?? 0
  if (props.pressed || elevation < 0) {
    const down = props.pressed ? 1 : -elevation
    return { mode, step: 0, lifted: false, ...recessDepth(inherited, down, mode) }
  }
  const step = props.level != null ? 0 : (props.raise ?? elevation)
  const floating = step >= FLOATING_ELEVATION_MIN
  const plane = props.level ?? (floating ? 'overlay' : raisedLevel(inherited.level, step))
  const lifted = props.lift ?? step > 0
  const liftStep = Math.max(1, Math.min(5, step)) as LiftStep
  const depthStyle = lifted ? liftStyle(liftStep, mode, props.liftOptions) : {}
  return { mode, plane, backgroundColor: surfaceBackground(plane, mode), depthStyle, step, lifted }
}

/** The resolved depth of a container at this point in the tree. */
export function useResolvedSurface(props: SurfaceDepthProps): ResolvedSurface {
  const inherited = useSurface()
  const { level, raise, elevation, pressed, lift, liftOptions, theme } = props
  return useMemo(
    () =>
      resolveSurfaceDepth(inherited, {
        level,
        raise,
        elevation,
        pressed,
        lift,
        liftOptions,
        theme,
      }),
    [inherited, level, raise, elevation, pressed, lift, liftOptions, theme]
  )
}
