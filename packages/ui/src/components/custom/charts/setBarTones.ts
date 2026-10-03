import { createContext, useContext } from 'react'
import type { ViewStyle } from 'react-native'
import { barPaper } from '../../../theme/materials'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { alpha } from '../../../utils/colors'
import { useOnSurfaceColor, useSurface, surfaceBackground } from '../../ui/surface/SurfaceContext'

/** Linear-blend two #RRGGBB hexes (`t`=0 → a, 1 → b) — the surface-relative solid to-do tone. */
function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string): [number, number, number] => {
    const s = h.replace('#', '')
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
  }
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const ch = (x: number, y: number): string =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0')
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`
}

/**
 * How every SetBarChart below draws its `empty` cells and its bar paper. Omitted fields keep the
 * shared look, so a chart outside a provider is unchanged.
 */
export interface SetBarTreatment {
  /**
   * `faint` (default): a solid section fainter than a to-do. `outline`: a hollow stub ringed in the
   * on-surface secondary tone, 3:1 or more against the plane in both modes (WCAG 1.4.11), for a
   * strip where a side's missed rep must read at a glance.
   */
  emptyVariant?: 'faint' | 'outline'
  /**
   * `raised` (default): the paper material in both modes. `soft`: on a light plane only, a 1px
   * contact shadow in place of the paper's dark drop shadow, which smudges on white.
   */
  lightPaper?: 'raised' | 'soft'
}

export const SetBarTreatmentContext = createContext<SetBarTreatment>({})

const EMPTY_RING_WIDTH = 2
const SOFT_SHADOW = alpha(primitiveColors.black, 0.12)

/** The paper's grain with a 1px contact shadow in place of its drop shadow. */
function softLightPaper(color: string, flip = false): ViewStyle {
  return {
    ...barPaper(color, flip),
    boxShadow: `0 ${flip ? -1 : 1}px 2px ${SOFT_SHADOW}`,
  } as unknown as ViewStyle
}

/** The surface-relative tones a SetBarChart paints its window cells and bars with. */
export function useSetBarTones() {
  const { emptyVariant = 'faint', lightPaper = 'raised' } = useContext(SetBarTreatmentContext)
  // Planned/to-do reps + the baseline draw in a SURFACE-relative neutral (on-surface tertiary)
  // so they stay legible on every plane instead of a fixed grey.
  const placeholder = useOnSurfaceColor('tertiary')
  const ring = useOnSurfaceColor('secondary')
  const surface = useSurface()
  const surfaceBg = surfaceBackground(surface.level, surface.mode)
  // An `empty` cell (a rep the diverging side didn't log) is fainter than a planned to-do.
  const emptyFill: ViewStyle =
    emptyVariant === 'outline'
      ? { borderWidth: EMPTY_RING_WIDTH, borderColor: ring }
      : { backgroundColor: mixHex(surfaceBg, placeholder, 0.28) }
  return {
    placeholder,
    // The solid to-do: the plane blended toward the neutral, ~constant contrast on every plane.
    solidTodo: mixHex(surfaceBg, placeholder, 0.55),
    emptyFill,
    paper: lightPaper === 'soft' && surface.mode === 'light' ? softLightPaper : barPaper,
  }
}
