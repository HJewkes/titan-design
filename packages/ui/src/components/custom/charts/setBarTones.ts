import { createContext, useContext } from 'react'
import type { ViewStyle } from 'react-native'
import { barPaper } from '../../../theme/materials'
import { primitiveColors } from '../../../theme/tokens/primitives'
import type { ThemeMode } from '../../../theme/tokens/semantic'
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
   * The fill of an `empty` stub, per mode. Omitted: a solid section fainter than a to-do. A strip
   * where a side's missing rep must read at a glance passes a colour of 3:1 or more against its plane.
   */
  emptyColor?: Readonly<Record<ThemeMode, string>>
  /**
   * `raised` (default): the paper material in both modes. `soft`: on a light plane only, a short
   * low-alpha shadow in place of the paper's dark drop shadow, which smudges on white.
   */
  lightPaper?: 'raised' | 'soft'
}

export const SetBarTreatmentContext = createContext<SetBarTreatment>({})

// Between the paper's 0 6px 16px at .45, which smudged on white, and round 2's 1px contact shadow,
// which the owner found too flat (VW-879). A 5px blur stays inside the phone's 10px bar pitch.
const SOFT_SHADOW_OFFSET = 2
const SOFT_SHADOW_BLUR = 5
const SOFT_SHADOW = alpha(primitiveColors.black, 0.2)

/** The paper's grain with a short soft shadow in place of its drop shadow. */
function softLightPaper(color: string, flip = false): ViewStyle {
  const offset = flip ? -SOFT_SHADOW_OFFSET : SOFT_SHADOW_OFFSET
  return {
    ...barPaper(color, flip),
    boxShadow: `0 ${offset}px ${SOFT_SHADOW_BLUR}px ${SOFT_SHADOW}`,
  } as unknown as ViewStyle
}

/** The surface-relative tones a SetBarChart paints its window cells and bars with. */
export function useSetBarTones() {
  const { emptyColor, lightPaper = 'raised' } = useContext(SetBarTreatmentContext)
  // Planned/to-do reps + the baseline draw in a SURFACE-relative neutral (on-surface tertiary)
  // so they stay legible on every plane instead of a fixed grey.
  const placeholder = useOnSurfaceColor('tertiary')
  const surface = useSurface()
  const surfaceBg = surfaceBackground(surface.level, surface.mode)
  // An `empty` cell (a rep the diverging side didn't log) is fainter than a planned to-do.
  const emptyFill: ViewStyle = {
    backgroundColor: emptyColor?.[surface.mode] ?? mixHex(surfaceBg, placeholder, 0.28),
  }
  return {
    placeholder,
    // The solid to-do: the plane blended toward the neutral, ~constant contrast on every plane.
    solidTodo: mixHex(surfaceBg, placeholder, 0.55),
    emptyFill,
    paper: lightPaper === 'soft' && surface.mode === 'light' ? softLightPaper : barPaper,
  }
}
